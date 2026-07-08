from ..repositories.filesystem import parse_iso
from ..schemas.common import ContentStatus
from ..schemas.glossary import GlossaryVariantBody, PublishGlossaryVariantResponse, parse_locale
from .glossary_entries import variant_has_publishable_body
from .glossary_public import GlossaryPublicService


class GlossaryPublishService:
    def __init__(self, repository):
        self._repository = repository
        self._public_service = GlossaryPublicService(repository)

    def publish_variant(self, content_id: str, locale: str) -> PublishGlossaryVariantResponse:
        parsed_locale = parse_locale(locale)
        variant = self._repository.get_glossary_variant(content_id, parsed_locale)
        if not variant:
            raise KeyError(content_id)

        body = GlossaryVariantBody.model_validate(variant["draftBody"])
        if not body.term.strip():
            raise ValueError("Glossary term cannot be empty.")
        if not variant_has_publishable_body(body):
            raise ValueError("Glossary definition cannot be empty.")

        self._validate_relationships(content_id, body, parsed_locale)

        published = self._repository.publish_glossary_variant(content_id, parsed_locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        snapshot_key = self._repository.write_glossary_snapshot(parsed_locale, document)
        return PublishGlossaryVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus.PUBLISHED,
            publishedAt=parse_iso(published["publishedAt"]),
            snapshotKey=snapshot_key,
        )

    def unpublish_variant(self, content_id: str, locale: str) -> None:
        parsed_locale = parse_locale(locale)
        self._repository.unpublish_glossary_variant(content_id, parsed_locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        if document["entries"]:
            self._repository.write_glossary_snapshot(parsed_locale, document)
        else:
            self._repository.delete_admin_glossary_snapshot(parsed_locale)

    def rebuild_published_snapshot(self, locale: str) -> str | None:
        parsed_locale = parse_locale(locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        if not document["entries"]:
            self._repository.delete_admin_glossary_snapshot(parsed_locale)
            return None
        return self._repository.write_glossary_snapshot(parsed_locale, document)

    def _validate_relationships(self, content_id: str, body: GlossaryVariantBody, locale: str) -> None:
        for related_id in body.relatedTermIds:
            if related_id == content_id:
                raise ValueError("An entry cannot reference itself as a related term.")
            self._require_published_glossary_entry(related_id, locale, "related term")

        for synonym_id in body.synonymTermIds:
            if synonym_id == content_id:
                raise ValueError("An entry cannot reference itself as a synonym.")
            self._require_published_glossary_entry(synonym_id, locale, "synonym")

        for reference in body.seeAlso:
            if reference.targetType == "glossary_entry":
                self._require_published_glossary_entry(reference.targetContentId, locale, "see also glossary entry")
            elif reference.targetType == "manual_chapter":
                self._require_published_manual_chapter(reference.targetContentId, locale)
            elif reference.targetType == "kb_entry":
                raise ValueError("Knowledge Base see-also references are not available yet.")

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
