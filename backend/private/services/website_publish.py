from pathlib import Path

from ..repositories.filesystem import atomic_write_json
from ..repositories.filesystem import parse_iso
from ..schemas.common import ContentStatus
from ..schemas.website import PublishWebsiteVariantResponse, parse_admin_locale
from .snapshot_publish import rebuild_locale_snapshot
from .website_pages import variant_has_publishable_body
from .website_public import WebsitePublicService


def _default_public_content_root(repository) -> Path:
    """Return the production corpus paired with an editorial repository.

    A normal local authoring checkout writes the Website release snapshot to
    ``backend/public/content`` so it is committed and included by Docker. Test
    and custom repositories get an isolated sibling under their own temporary
    root, preventing editorial tests from modifying the tracked corpus.
    """
    editorial_root = repository.content_root.resolve()
    checkout_editorial_root = Path(__file__).resolve().parents[1] / "content"
    if editorial_root == checkout_editorial_root.resolve():
        return Path(__file__).resolve().parents[2] / "public" / "content"
    return editorial_root / ".public-content"


class WebsitePublishService:
    def __init__(self, repository, public_content_root: Path | None = None):
        self._repository = repository
        self._public_service = WebsitePublicService(repository)
        self._public_content_root = (
            Path(public_content_root)
            if public_content_root is not None
            else _default_public_content_root(repository)
        )

    def publish_variant(self, page_key: str, locale: str) -> PublishWebsiteVariantResponse:
        parsed_locale = parse_admin_locale(locale)
        variant = self._repository.get_website_variant(page_key, parsed_locale)
        if not variant:
            raise KeyError(page_key)

        body = variant["draftBody"]
        if not isinstance(body, dict) or not variant_has_publishable_body(body):
            raise ValueError("Website page public title cannot be empty.")

        published = self._repository.publish_website_variant(page_key, parsed_locale)
        snapshot_key = self.rebuild_published_snapshot(parsed_locale)
        return PublishWebsiteVariantResponse(
            pageKey=page_key,
            locale=parsed_locale,
            status=ContentStatus.PUBLISHED,
            publishedAt=parse_iso(published["publishedAt"]),
            snapshotKey=snapshot_key or "",
        )

    def unpublish_variant(self, page_key: str, locale: str) -> None:
        parsed_locale = parse_admin_locale(locale)
        if not self._repository.get_website_variant(page_key, parsed_locale):
            raise KeyError(page_key)
        self._repository.unpublish_website_variant(page_key, parsed_locale)
        self.rebuild_published_snapshot(parsed_locale)

    def rebuild_published_snapshot(self, locale: str) -> str | None:
        parsed_locale = parse_admin_locale(locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        snapshot_key = rebuild_locale_snapshot(
            document,
            write_snapshot=lambda payload: self._repository.write_website_snapshot(parsed_locale, payload),
        )
        self._write_public_snapshot(parsed_locale, document)
        return snapshot_key

    def _write_public_snapshot(self, locale: str, document: dict) -> None:
        """Make the selected published Website locale available to Docker builds.

        This is intentionally part of the Admin Website Publish lifecycle. The
        public corpus remains a Git-reviewed release artifact, but authors do
        not need a second packaging command after approving a Website change.
        """
        atomic_write_json(
            self._public_content_root / "published" / "website" / locale / "pages.json",
            document,
        )
