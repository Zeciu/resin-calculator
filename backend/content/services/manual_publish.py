from ..repositories.filesystem import parse_iso
from ..schemas.common import ContentStatus
from ..schemas.manual import ManualVariantBody, PublishManualVariantResponse, parse_locale
from .manual_chapters import variant_has_non_empty_body


class ManualPublishService:
    def __init__(self, repository):
        self._repository = repository

    def publish_variant(self, content_id: str, locale: str) -> PublishManualVariantResponse:
        parsed_locale = parse_locale(locale)
        variant = self._repository.get_manual_variant(content_id, parsed_locale)
        if not variant:
            raise KeyError(content_id)

        body = ManualVariantBody.model_validate(variant["draftBody"])
        if not body.title.strip():
            raise ValueError("Chapter title cannot be empty.")
        if not variant_has_non_empty_body(body):
            raise ValueError("Chapter body cannot be empty.")

        published = self._repository.publish_manual_variant(content_id, parsed_locale)
        document = self._assemble_document(parsed_locale)
        snapshot_key = self._repository.write_manual_snapshot(parsed_locale, document)
        return PublishManualVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus.PUBLISHED,
            publishedAt=parse_iso(published["publishedAt"]),
            snapshotKey=snapshot_key,
        )

    def unpublish_variant(self, content_id: str, locale: str) -> None:
        parsed_locale = parse_locale(locale)
        self._repository.unpublish_manual_variant(content_id, parsed_locale)
        document = self._assemble_document(parsed_locale)
        self._repository.write_manual_snapshot(parsed_locale, document)

    def rebuild_published_snapshot(self, locale: str) -> str | None:
        parsed_locale = parse_locale(locale)
        document = self._assemble_document(parsed_locale)
        if not document["chapters"]:
            self._repository.delete_admin_manual_snapshot(parsed_locale)
            return None
        return self._repository.write_manual_snapshot(parsed_locale, document)

    def _assemble_document(self, locale: str) -> dict:
        chapters = []
        for content_id in self._repository.list_manual_chapter_ids():
            variant = self._repository.get_manual_variant(content_id, locale)
            if not variant or variant["status"] != "published":
                continue
            meta = self._repository.get_manual_chapter_meta(content_id)
            chapters.append(
                {
                    "contentId": content_id,
                    "sortOrder": meta["sortOrder"],
                    "title": variant["draftBody"]["title"],
                    "sections": variant["draftBody"]["sections"],
                }
            )
        return {
            "locale": locale,
            "chapters": chapters,
        }
