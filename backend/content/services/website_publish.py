from ..repositories.filesystem import parse_iso
from ..schemas.common import ContentStatus
from ..schemas.website import PublishWebsiteVariantResponse, parse_admin_locale
from .snapshot_publish import rebuild_locale_snapshot
from .website_pages import variant_has_publishable_body
from .website_public import WebsitePublicService


class WebsitePublishService:
    def __init__(self, repository):
        self._repository = repository
        self._public_service = WebsitePublicService(repository)

    def publish_variant(self, page_key: str, locale: str) -> PublishWebsiteVariantResponse:
        parsed_locale = parse_admin_locale(locale)
        variant = self._repository.get_website_variant(page_key, parsed_locale)
        if not variant:
            raise KeyError(page_key)

        body = variant["draftBody"]
        if not isinstance(body, dict) or not variant_has_publishable_body(body):
            raise ValueError("Website page public title cannot be empty.")

        published = self._repository.publish_website_variant(page_key, parsed_locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        snapshot_key = rebuild_locale_snapshot(
            document,
            write_snapshot=lambda payload: self._repository.write_website_snapshot(parsed_locale, payload),
        )
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
        document = self._public_service.build_admin_snapshot(parsed_locale)
        rebuild_locale_snapshot(
            document,
            write_snapshot=lambda payload: self._repository.write_website_snapshot(parsed_locale, payload),
        )

    def rebuild_published_snapshot(self, locale: str) -> str | None:
        parsed_locale = parse_admin_locale(locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        return rebuild_locale_snapshot(
            document,
            write_snapshot=lambda payload: self._repository.write_website_snapshot(parsed_locale, payload),
        )
