from pydantic import ValidationError

from .cross_reference_validator import CrossReferenceValidator
from ..repositories.filesystem import parse_iso
from ..schemas.common import ContentStatus
from ..schemas.editorial import EditorialVisibility
from ..schemas.glossary import (
    BulkPublishGlossaryDraftsResponse,
    BulkPublishGlossaryItemResult,
    GlossaryVariantBody,
    PublishGlossaryVariantResponse,
    parse_admin_locale,
)
from .editorial_status import compute_editorial_visibility
from .glossary_entries import variant_has_publishable_body
from .glossary_public import GlossaryPublicService
from .snapshot_publish import rebuild_locale_snapshot


class GlossaryPublishService:
    def __init__(self, repository):
        self._repository = repository
        self._public_service = GlossaryPublicService(repository)
        self._references = CrossReferenceValidator(repository)

    def publish_variant(self, content_id: str, locale: str) -> PublishGlossaryVariantResponse:
        parsed_locale = parse_admin_locale(locale)
        published = self._publish_variant_core(content_id, parsed_locale)
        snapshot_key = self.rebuild_published_snapshot(parsed_locale) or ""
        return PublishGlossaryVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus.PUBLISHED,
            publishedAt=parse_iso(published["publishedAt"]),
            snapshotKey=snapshot_key,
        )

    def publish_all_drafts(self, locale: str) -> BulkPublishGlossaryDraftsResponse:
        parsed_locale = parse_admin_locale(locale)
        published_items: list[BulkPublishGlossaryItemResult] = []
        failed_items: list[BulkPublishGlossaryItemResult] = []
        skipped_items: list[BulkPublishGlossaryItemResult] = []

        for content_id in self._repository.list_glossary_entry_ids():
            variant = self._repository.get_glossary_variant(content_id, parsed_locale)
            term = ""
            if variant:
                term = str((variant.get("draftBody") or {}).get("term") or "").strip()

            if not variant:
                skipped_items.append(
                    BulkPublishGlossaryItemResult(
                        contentId=content_id,
                        term=term,
                        reason=f"No {parsed_locale} variant.",
                    )
                )
                continue

            try:
                visibility = compute_editorial_visibility(
                    exists=True,
                    status=ContentStatus(variant["status"]),
                    updated_at=parse_iso(variant.get("updatedAt")),
                    published_at=parse_iso(variant.get("publishedAt")),
                )
                if visibility == EditorialVisibility.LIVE:
                    skipped_items.append(
                        BulkPublishGlossaryItemResult(
                            contentId=content_id,
                            term=term,
                            reason="Already published; no draft changes.",
                        )
                    )
                    continue
                if visibility == EditorialVisibility.EMPTY:
                    skipped_items.append(
                        BulkPublishGlossaryItemResult(
                            contentId=content_id,
                            term=term,
                            reason="Empty variant.",
                        )
                    )
                    continue

                self._publish_variant_core(content_id, parsed_locale)
            except (ValueError, ValidationError, KeyError, RuntimeError) as exc:
                reason = str(exc) or exc.__class__.__name__
                if isinstance(exc, ValidationError):
                    reason = "Invalid glossary draft body."
                if isinstance(exc, KeyError):
                    reason = "Glossary entry not found."
                failed_items.append(
                    BulkPublishGlossaryItemResult(
                        contentId=content_id,
                        term=term,
                        reason=reason,
                    )
                )
                continue

            published_items.append(
                BulkPublishGlossaryItemResult(
                    contentId=content_id,
                    term=term,
                    reason=None,
                )
            )

        snapshot_key = ""
        if published_items:
            try:
                snapshot_key = self.rebuild_published_snapshot(parsed_locale) or ""
            except (ValueError, ValidationError, KeyError, RuntimeError, OSError) as exc:
                # Drafts are already persisted as published; do not turn the batch into a 500.
                failed_items.append(
                    BulkPublishGlossaryItemResult(
                        contentId="",
                        term="",
                        reason=f"Snapshot rebuild failed after publishing drafts: {exc}",
                    )
                )

        return BulkPublishGlossaryDraftsResponse(
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
        self._repository.unpublish_glossary_variant(content_id, parsed_locale)
        self.rebuild_published_snapshot(parsed_locale)

    def rebuild_published_snapshot(self, locale: str) -> str | None:
        parsed_locale = parse_admin_locale(locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        return rebuild_locale_snapshot(
            document,
            write_snapshot=lambda payload: self._repository.write_glossary_snapshot(parsed_locale, payload),
        )

    def _publish_variant_core(self, content_id: str, locale: str) -> dict:
        variant = self._repository.get_glossary_variant(content_id, locale)
        if not variant:
            raise KeyError(content_id)

        try:
            body = GlossaryVariantBody.model_validate(variant["draftBody"])
        except ValidationError as exc:
            raise ValueError("Invalid glossary draft body.") from exc

        if not body.term.strip():
            raise ValueError("Glossary term cannot be empty.")
        if not variant_has_publishable_body(body):
            raise ValueError("Glossary definition cannot be empty.")

        self._validate_relationships(content_id, body, locale)
        return self._repository.publish_glossary_variant(content_id, locale)

    def _validate_relationships(self, content_id: str, body: GlossaryVariantBody, locale: str) -> None:
        for related_id in body.relatedTermIds:
            if related_id == content_id:
                raise ValueError("An entry cannot reference itself as a related term.")
            self._references.require_glossary_entry_locale_content(related_id, locale, "related term")

        for synonym_id in body.synonymTermIds:
            if synonym_id == content_id:
                raise ValueError("An entry cannot reference itself as a synonym.")
            self._references.require_glossary_entry_locale_content(synonym_id, locale, "synonym")

        for reference in body.seeAlso:
            if reference.targetType == "glossary_entry":
                self._references.require_glossary_entry_locale_content(
                    reference.targetContentId,
                    locale,
                    "see also glossary entry",
                )
            elif reference.targetType == "manual_chapter":
                self._references.require_published_manual_chapter(reference.targetContentId, locale)
            elif reference.targetType == "kb_entry":
                raise ValueError("Knowledge Base see-also references are not available yet.")
