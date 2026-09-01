from dataclasses import dataclass

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
from .editorial_identity import entry_identity_title_from_store
from .editorial_status import compute_editorial_visibility
from .knowledge_base_entries import variant_has_publishable_body
from .knowledge_base_public import KnowledgeBasePublicService
from .snapshot_publish import rebuild_locale_snapshot


@dataclass
class _PendingDraft:
    content_id: str
    title: str
    body: KnowledgeBaseVariantBody


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

        records = self._repository.read_editorial_records()
        already_published_ids: set[str] = set()
        pending: list[_PendingDraft] = []

        for content_id in self._repository.list_kb_entry_ids_from_store(records):
            variant = self._repository.get_kb_variant_from_store(
                records, content_id, parsed_locale
            )
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
                already_published_ids.add(content_id)
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
                body = self._parse_publishable_body(variant)
                self._validate_non_kb_relationships(content_id, body, parsed_locale, records)
            except (ValueError, ValidationError, KeyError) as exc:
                failed_items.append(
                    BulkPublishKnowledgeBaseItemResult(
                        contentId=content_id,
                        term=title,
                        reason=self._failure_reason(exc),
                    )
                )
                continue

            pending.append(_PendingDraft(content_id=content_id, title=title, body=body))

        candidate_ids = {item.content_id for item in pending}
        pending_by_id = {item.content_id: item for item in pending}

        while True:
            unresolved: list[tuple[str, str]] = []
            for item in pending_by_id.values():
                related_id = self._first_unresolved_kb_reference(
                    item,
                    parsed_locale,
                    records,
                    candidate_ids | already_published_ids,
                )
                if related_id is not None:
                    unresolved.append((item.content_id, related_id))
            if not unresolved:
                break
            for content_id, related_id in unresolved:
                item = pending_by_id.pop(content_id, None)
                if item is None:
                    continue
                candidate_ids.discard(content_id)
                failed_items.append(
                    BulkPublishKnowledgeBaseItemResult(
                        contentId=content_id,
                        term=item.title,
                        reason=self._unresolved_kb_reason(
                            records, parsed_locale, related_id, candidate_ids | already_published_ids
                        ),
                    )
                )

        publish_ids = [item.content_id for item in pending if item.content_id in candidate_ids]
        if publish_ids:
            self._repository.publish_kb_variants_batch(publish_ids, parsed_locale)
            snapshot_key = self.rebuild_published_snapshot(parsed_locale) or ""
            for item in pending:
                if item.content_id in candidate_ids:
                    published_items.append(
                        BulkPublishKnowledgeBaseItemResult(
                            contentId=item.content_id,
                            term=item.title,
                            reason=None,
                        )
                    )
        else:
            snapshot_key = ""

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

        body = self._parse_publishable_body(variant)
        self._validate_relationships(content_id, body, locale)
        return self._repository.publish_kb_variant(content_id, locale)

    def _parse_publishable_body(self, variant: dict) -> KnowledgeBaseVariantBody:
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
        return body

    def _validate_relationships(
        self,
        content_id: str,
        body: KnowledgeBaseVariantBody,
        locale: str,
        records=None,
        allowed_kb_ids: set[str] | frozenset[str] | None = None,
    ) -> None:
        self._validate_non_kb_relationships(content_id, body, locale, records)
        for related_id in body.relatedKbEntryIds:
            if related_id == content_id:
                raise ValueError("An article cannot reference itself as a related Knowledge Base article.")
            self._references.require_published_kb_entry(
                related_id,
                locale,
                "related Knowledge Base article",
                records=records,
                allowed_ids=allowed_kb_ids,
            )

    def _validate_non_kb_relationships(
        self,
        content_id: str,
        body: KnowledgeBaseVariantBody,
        locale: str,
        records=None,
    ) -> None:
        for related_id in body.relatedKbEntryIds:
            if related_id == content_id:
                raise ValueError("An article cannot reference itself as a related Knowledge Base article.")

        for related_id in body.relatedGlossaryEntryIds:
            self._references.require_published_glossary_entry(
                related_id, locale, "related glossary entry", records=records
            )

        for related_id in body.relatedManualChapterIds:
            self._references.require_published_manual_chapter(related_id, locale, records=records)

    def _first_unresolved_kb_reference(
        self,
        item: _PendingDraft,
        locale: str,
        records,
        resolvable_ids: set[str],
    ) -> str | None:
        for related_id in item.body.relatedKbEntryIds:
            if related_id == item.content_id:
                return related_id
            try:
                self._references.require_published_kb_entry(
                    related_id,
                    locale,
                    "related Knowledge Base article",
                    records=records,
                    allowed_ids=resolvable_ids,
                )
            except ValueError:
                return related_id
        return None

    def _unresolved_kb_reason(
        self, records, locale: str, related_id: str, resolvable_ids: set[str]
    ) -> str:
        meta = self._repository.get_kb_entry_meta_from_store(records, related_id)
        display = entry_identity_title_from_store(self._repository, records, related_id) or related_id
        if not meta:
            return (
                f"Related Knowledge Base article does not exist: {display}."
            )
        variant = self._repository.get_kb_variant_from_store(records, related_id, locale)
        if related_id in resolvable_ids:
            return f"Published related Knowledge Base article required: {display}"
        if not variant:
            return (
                f"Related Knowledge Base article '{display}' has no {locale} variant "
                "and is not included in this Publish All batch."
            )
        return (
            f"Related Knowledge Base article '{display}' is not published in {locale} "
            "and is not included in this Publish All batch."
        )

    @staticmethod
    def _failure_reason(exc: Exception) -> str:
        if isinstance(exc, ValidationError):
            return "Invalid knowledge base draft body."
        if isinstance(exc, KeyError):
            return "Knowledge Base entry not found."
        return str(exc)
