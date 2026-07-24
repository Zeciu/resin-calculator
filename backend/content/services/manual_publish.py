from pydantic import ValidationError

from ..repositories.filesystem import parse_iso
from ..schemas.common import ContentStatus
from ..schemas.editorial import EditorialVisibility
from ..schemas.manual import (
    BulkPublishManualDraftsResponse,
    BulkPublishManualItemResult,
    ManualVariantBody,
    PublishManualVariantResponse,
    parse_admin_locale,
)
from .editorial_status import compute_editorial_visibility
from .manual_chapters import variant_has_non_empty_body


class ManualPublishService:
    def __init__(self, repository):
        self._repository = repository

    def publish_variant(self, content_id: str, locale: str) -> PublishManualVariantResponse:
        parsed_locale = parse_admin_locale(locale)
        published = self._publish_variant_core(content_id, parsed_locale)
        snapshot_key = self.rebuild_published_snapshot(parsed_locale) or ""
        return PublishManualVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus.PUBLISHED,
            publishedAt=parse_iso(published["publishedAt"]),
            snapshotKey=snapshot_key,
        )

    def publish_all_drafts(self, locale: str) -> BulkPublishManualDraftsResponse:
        parsed_locale = parse_admin_locale(locale)
        published_items: list[BulkPublishManualItemResult] = []
        failed_items: list[BulkPublishManualItemResult] = []
        skipped_items: list[BulkPublishManualItemResult] = []

        # Classify publish candidates from one store snapshot; per-item publish still writes.
        records = self._repository.read_editorial_records()
        for content_id in self._repository.list_manual_chapter_ids_from_store(records):
            variant = self._repository.get_manual_variant_from_store(
                records, content_id, parsed_locale
            )
            title = ""
            if variant:
                title = str((variant.get("draftBody") or {}).get("title") or "").strip()

            if not variant:
                skipped_items.append(
                    BulkPublishManualItemResult(
                        contentId=content_id,
                        term=title,
                        reason=f"No {parsed_locale} variant.",
                    )
                )
                continue

            visibility = compute_editorial_visibility(
                exists=True,
                status=ContentStatus(variant["status"]),
                updated_at=parse_iso(variant.get("updatedAt")),
                published_at=parse_iso(variant.get("publishedAt")),
            )
            if visibility == EditorialVisibility.LIVE:
                skipped_items.append(
                    BulkPublishManualItemResult(
                        contentId=content_id,
                        term=title,
                        reason="Already published; no draft changes.",
                    )
                )
                continue
            if visibility == EditorialVisibility.EMPTY:
                skipped_items.append(
                    BulkPublishManualItemResult(
                        contentId=content_id,
                        term=title,
                        reason="Empty variant.",
                    )
                )
                continue

            try:
                self._publish_variant_core(content_id, parsed_locale)
            except (ValueError, ValidationError, KeyError) as exc:
                reason = str(exc)
                if isinstance(exc, ValidationError):
                    reason = "Invalid manual draft body."
                if isinstance(exc, KeyError):
                    reason = "Chapter not found."
                failed_items.append(
                    BulkPublishManualItemResult(
                        contentId=content_id,
                        term=title,
                        reason=reason,
                    )
                )
                continue

            published_items.append(
                BulkPublishManualItemResult(
                    contentId=content_id,
                    term=title,
                    reason=None,
                )
            )

        snapshot_key = ""
        if published_items:
            snapshot_key = self.rebuild_published_snapshot(parsed_locale) or ""

        return BulkPublishManualDraftsResponse(
            locale=parsed_locale,
            publishedCount=len(published_items),
            failedCount=len(failed_items),
            skippedCount=len(skipped_items),
            published=published_items,
            failed=failed_items,
            skipped=skipped_items,
            snapshotKey=snapshot_key,
        )

    def unpublish_variant(self, content_id: str, locale: str) -> None:
        parsed_locale = parse_admin_locale(locale)
        self._repository.unpublish_manual_variant(content_id, parsed_locale)
        self.rebuild_published_snapshot(parsed_locale)

    def rebuild_published_snapshot(self, locale: str) -> str | None:
        parsed_locale = parse_admin_locale(locale)
        document = self._assemble_document(parsed_locale)
        return self._repository.write_manual_snapshot(parsed_locale, document)

    def _publish_variant_core(self, content_id: str, locale: str) -> dict:
        variant = self._repository.get_manual_variant(content_id, locale)
        if not variant:
            raise KeyError(content_id)

        try:
            body = ManualVariantBody.model_validate(variant["draftBody"])
        except ValidationError as exc:
            raise ValueError("Invalid manual draft body.") from exc

        if not body.title.strip():
            raise ValueError("Chapter title cannot be empty.")
        if not variant_has_non_empty_body(body):
            raise ValueError("Chapter body cannot be empty.")

        return self._repository.publish_manual_variant(content_id, locale)

    def _assemble_document(self, locale: str) -> dict:
        # One store read per snapshot rebuild; derive published chapters in memory.
        records = self._repository.read_editorial_records()
        chapters = []
        for content_id in self._repository.list_manual_chapter_ids_from_store(records):
            variant = self._repository.get_manual_variant_from_store(records, content_id, locale)
            if not variant or variant["status"] != "published":
                continue
            meta = self._repository.get_manual_chapter_meta_from_store(records, content_id)
            if not meta:
                continue
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
