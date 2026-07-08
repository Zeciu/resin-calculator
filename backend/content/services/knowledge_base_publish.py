from ..repositories.filesystem import parse_iso
from ..schemas.common import ContentStatus
from ..schemas.knowledge_base import (
    KnowledgeBaseVariantBody,
    PublishKnowledgeBaseVariantResponse,
    parse_locale,
)
from .knowledge_base_entries import variant_has_publishable_body
from .knowledge_base_public import KnowledgeBasePublicService


class KnowledgeBasePublishService:
    def __init__(self, repository):
        self._repository = repository
        self._public_service = KnowledgeBasePublicService(repository)

    def publish_variant(self, content_id: str, locale: str) -> PublishKnowledgeBaseVariantResponse:
        parsed_locale = parse_locale(locale)
        variant = self._repository.get_kb_variant(content_id, parsed_locale)
        if not variant:
            raise KeyError(content_id)

        meta = self._repository.get_kb_entry_meta(content_id)
        if not meta:
            raise KeyError(content_id)

        body = KnowledgeBaseVariantBody.model_validate(variant["draftBody"])
        if not body.title.strip():
            raise ValueError("Knowledge Base title cannot be empty.")
        if not body.problemSummary.strip():
            raise ValueError("Problem summary cannot be empty.")
        if not variant_has_publishable_body(body):
            raise ValueError("Solution cannot be empty.")

        self._validate_relationships(content_id, body, parsed_locale)

        published = self._repository.publish_kb_variant(content_id, parsed_locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        snapshot_key = self._repository.write_kb_snapshot(parsed_locale, document)
        return PublishKnowledgeBaseVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus.PUBLISHED,
            publishedAt=parse_iso(published["publishedAt"]),
            snapshotKey=snapshot_key,
        )

    def unpublish_variant(self, content_id: str, locale: str) -> None:
        parsed_locale = parse_locale(locale)
        self._repository.unpublish_kb_variant(content_id, parsed_locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        if document["entries"]:
            self._repository.write_kb_snapshot(parsed_locale, document)
        else:
            self._repository.delete_admin_kb_snapshot(parsed_locale)

    def rebuild_published_snapshot(self, locale: str) -> str | None:
        parsed_locale = parse_locale(locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        if not document["entries"]:
            self._repository.delete_admin_kb_snapshot(parsed_locale)
            return None
        return self._repository.write_kb_snapshot(parsed_locale, document)

    def _validate_relationships(self, content_id: str, body: KnowledgeBaseVariantBody, locale: str) -> None:
        for related_id in body.relatedKbEntryIds:
            if related_id == content_id:
                raise ValueError("An article cannot reference itself as a related Knowledge Base article.")
            self._require_published_kb_entry(related_id, locale, "related Knowledge Base article")

        for related_id in body.relatedGlossaryEntryIds:
            self._require_published_glossary_entry(related_id, locale, "related glossary entry")

        for related_id in body.relatedManualChapterIds:
            self._require_published_manual_chapter(related_id, locale)

    def _require_published_kb_entry(self, target_id: str, locale: str, label: str) -> None:
        if not self._repository.get_kb_entry_meta(target_id):
            raise ValueError(f"Unknown {label}: {target_id}")
        variant = self._repository.get_kb_variant(target_id, locale)
        if not variant or variant["status"] != "published":
            raise ValueError(f"Published {label} required: {target_id}")

    def _require_published_glossary_entry(self, target_id: str, locale: str, label: str) -> None:
        if not self._repository.get_glossary_entry_meta(target_id):
            raise ValueError(f"Unknown {label}: {target_id}")
        variant = self._repository.get_glossary_variant(target_id, locale)
        if not variant or variant["status"] != "published":
            raise ValueError(f"Published {label} required: {target_id}")

    def _require_published_manual_chapter(self, target_id: str, locale: str) -> None:
        if not self._repository.get_manual_chapter_meta(target_id):
            raise ValueError(f"Unknown manual chapter: {target_id}")
        variant = self._repository.get_manual_variant(target_id, locale)
        if not variant or variant["status"] != "published":
            raise ValueError(f"Published manual chapter required: {target_id}")
