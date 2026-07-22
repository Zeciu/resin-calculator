from pydantic import ValidationError

from .cross_reference_validator import CrossReferenceValidator
from ..repositories.filesystem import parse_iso
from ..schemas.common import ContentStatus
from ..schemas.editorial import EditorialVisibility
from ..schemas.knowledge_base import (
    BulkPublishKnowledgeBaseDraftsResponse,
    BulkPublishKnowledgeBaseItemResult,
    KnowledgeBaseVariantBody,
    PublishKnowledgeBaseVariantResponse,
    parse_admin_locale,
)
from .editorial_status import compute_editorial_visibility
from .knowledge_base_entries import variant_has_publishable_body
from .knowledge_base_public import KnowledgeBasePublicService
from .snapshot_publish import rebuild_locale_snapshot


class KnowledgeBasePublishService:
    def __init__(self, repository):
        self._repository = repository
        self._public_service = KnowledgeBasePublicService(repository)
        self._references = CrossReferenceValidator(repository)

    def publish_variant(self, content_id: str, locale: str) -> PublishKnowledgeBaseVariantResponse:
        parsed_locale = parse_admin_locale(locale)
        published = self._publish_variant_core(content_id, parsed_locale)
        snapshot_key = self.rebuild_published_snapshot(parsed_locale) or ""
        return PublishKnowledgeBaseVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus.PUBLISHED,
            publishedAt=parse_iso(published["publishedAt"]),
            snapshotKey=snapshot_key,
        )

    def publish_all_drafts(self, locale: str) -> BulkPublishKnowledgeBaseDraftsResponse:
        parsed_locale = parse_admin_locale(locale)
        published_items: list[BulkPublishKnowledgeBaseItemResult] = []
        failed_items: list[BulkPublishKnowledgeBaseItemResult] = []
        skipped_items: list[BulkPublishKnowledgeBaseItemResult] = []

        for content_id in self._repository.list_kb_entry_ids():
            variant = self._repository.get_kb_variant(content_id, parsed_locale)
            title = ""
            if variant:
                title = str((variant.get("draftBody") or {}).get("title") or "").strip()

            if not variant:
                skipped_items.append(
                    BulkPublishKnowledgeBaseItemResult(
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
                    BulkPublishKnowledgeBaseItemResult(
                        contentId=content_id,
                        term=title,
                        reason="Already published; no draft changes.",
                    )
                )
                continue
            if visibility == EditorialVisibility.EMPTY:
                skipped_items.append(
                    BulkPublishKnowledgeBaseItemResult(
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
                    reason = "Invalid knowledge base draft body."
                if isinstance(exc, KeyError):
                    reason = "Knowledge Base entry not found."
                failed_items.append(
                    BulkPublishKnowledgeBaseItemResult(
                        contentId=content_id,
                        term=title,
                        reason=reason,
                    )
                )
                continue

            published_items.append(
                BulkPublishKnowledgeBaseItemResult(
                    contentId=content_id,
                    term=title,
                    reason=None,
                )
            )

        snapshot_key = ""
        if published_items:
            snapshot_key = self.rebuild_published_snapshot(parsed_locale) or ""

        return BulkPublishKnowledgeBaseDraftsResponse(
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
        self._repository.unpublish_kb_variant(content_id, parsed_locale)
        self.rebuild_published_snapshot(parsed_locale)

    def rebuild_published_snapshot(self, locale: str) -> str | None:
        parsed_locale = parse_admin_locale(locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        return rebuild_locale_snapshot(
            document,
            write_snapshot=lambda payload: self._repository.write_kb_snapshot(parsed_locale, payload),
        )

    def _publish_variant_core(self, content_id: str, locale: str) -> dict:
        variant = self._repository.get_kb_variant(content_id, locale)
        if not variant:
            raise KeyError(content_id)

        meta = self._repository.get_kb_entry_meta(content_id)
        if not meta:
            raise KeyError(content_id)

        try:
            body = KnowledgeBaseVariantBody.model_validate(variant["draftBody"])
        except ValidationError as exc:
            raise ValueError("Invalid knowledge base draft body.") from exc

        if not body.title.strip():
            raise ValueError("Knowledge Base title cannot be empty.")
        if not body.problemSummary.strip():
            raise ValueError("Problem summary cannot be empty.")
        if not variant_has_publishable_body(body):
            raise ValueError("Solution cannot be empty.")

        self._validate_relationships(content_id, body, locale)
        return self._repository.publish_kb_variant(content_id, locale)

    def _validate_relationships(self, content_id: str, body: KnowledgeBaseVariantBody, locale: str) -> None:
        for related_id in body.relatedKbEntryIds:
            if related_id == content_id:
                raise ValueError("An article cannot reference itself as a related Knowledge Base article.")
            self._references.require_published_kb_entry(related_id, locale, "related Knowledge Base article")

        for related_id in body.relatedGlossaryEntryIds:
            self._references.require_published_glossary_entry(related_id, locale, "related glossary entry")

        for related_id in body.relatedManualChapterIds:
            self._references.require_published_manual_chapter(related_id, locale)
