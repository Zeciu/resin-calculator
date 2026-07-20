from .cross_reference_validator import CrossReferenceValidator
from ..repositories.filesystem import parse_iso
from ..schemas.common import ContentStatus
from ..schemas.glossary import GlossaryVariantBody, PublishGlossaryVariantResponse, parse_admin_locale
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
        snapshot_key = rebuild_locale_snapshot(
            document,
            write_snapshot=lambda payload: self._repository.write_glossary_snapshot(parsed_locale, payload),
        )
        return PublishGlossaryVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus.PUBLISHED,
            publishedAt=parse_iso(published["publishedAt"]),
            snapshotKey=snapshot_key or "",
        )

    def unpublish_variant(self, content_id: str, locale: str) -> None:
        parsed_locale = parse_admin_locale(locale)
        self._repository.unpublish_glossary_variant(content_id, parsed_locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        rebuild_locale_snapshot(
            document,
            write_snapshot=lambda payload: self._repository.write_glossary_snapshot(parsed_locale, payload),
        )

    def rebuild_published_snapshot(self, locale: str) -> str | None:
        parsed_locale = parse_admin_locale(locale)
        document = self._public_service.build_admin_snapshot(parsed_locale)
        return rebuild_locale_snapshot(
            document,
            write_snapshot=lambda payload: self._repository.write_glossary_snapshot(parsed_locale, payload),
        )

    def _validate_relationships(self, content_id: str, body: GlossaryVariantBody, locale: str) -> None:
        for related_id in body.relatedTermIds:
            if related_id == content_id:
                raise ValueError("An entry cannot reference itself as a related term.")
            self._references.require_published_glossary_entry(related_id, locale, "related term")

        for synonym_id in body.synonymTermIds:
            if synonym_id == content_id:
                raise ValueError("An entry cannot reference itself as a synonym.")
            self._references.require_published_glossary_entry(synonym_id, locale, "synonym")

        for reference in body.seeAlso:
            if reference.targetType == "glossary_entry":
                self._references.require_published_glossary_entry(
                    reference.targetContentId,
                    locale,
                    "see also glossary entry",
                )
            elif reference.targetType == "manual_chapter":
                self._references.require_published_manual_chapter(reference.targetContentId, locale)
            elif reference.targetType == "kb_entry":
                raise ValueError("Knowledge Base see-also references are not available yet.")
