import re

from ..repositories.filesystem import DEFAULT_LOCALE, EDITORIAL_LOCALES, parse_iso
from ..schemas.common import ContentStatus
from ..schemas.editorial import EditorialVisibility
from ..schemas.glossary import (
    GlossaryEntryListItem,
    GlossaryEntryMeta,
    GlossaryReferenceOption,
    GlossaryVariantBody,
    GlossaryVariantResponse,
    GlossaryVariantSummary,
    parse_admin_locale,
)
from .editorial_identity import entry_identity_term
from .editorial_status import compute_editorial_visibility
from .reference_search import ReferenceSearchService
from ..translation_metadata import translation_metadata_for_api


def empty_variant_body(term: str = "") -> dict:
    return {
        "term": term,
        "definitionBlocks": [],
        "media": [],
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


def variant_has_publishable_body(body: GlossaryVariantBody) -> bool:
    if not body.term.strip():
        return False
    for block in body.definitionBlocks:
        if block.type == "paragraph" and block.text.strip():
            return True
        if block.type == "heading" and block.text.strip():
            return True
        if block.type == "callout" and block.blocks:
            return True
    for item in body.media:
        if item.type == "image" and item.src.strip() and item.alt.strip():
            return True
        if item.type == "video" and item.title.strip() and item.embedUrl.strip():
            return True
    return False


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


class GlossaryEntryService:
    def __init__(self, repository):
        self._repository = repository

    def list_entries(self, locale: str = DEFAULT_LOCALE) -> list[GlossaryEntryListItem]:
        parse_admin_locale(locale)
        items: list[GlossaryEntryListItem] = []
        for content_id in self._repository.list_glossary_entry_ids():
            meta = self._repository.get_glossary_entry_meta(content_id)
            if not meta:
                continue
            variants: dict[str, GlossaryVariantSummary] = {}
            for variant_locale in EDITORIAL_LOCALES:
                variant = self._repository.get_glossary_variant(content_id, variant_locale)
                if not variant:
                    continue
                variants[variant_locale] = GlossaryVariantSummary(
                    status=ContentStatus(variant["status"]),
                    updatedAt=parse_iso(variant.get("updatedAt")),
                    publishedAt=parse_iso(variant.get("publishedAt")),
                )
            items.append(
                GlossaryEntryListItem(
                    contentId=content_id,
                    term=entry_identity_term(self._repository, content_id),
                    sortOrder=meta["sortOrder"],
                    variants=variants,
                )
            )
        return items

    def create_entry(self, term: str) -> GlossaryEntryMeta:
        meta = self._repository.create_glossary_entry(term)
        return GlossaryEntryMeta(
            contentId=meta["contentId"],
            sortOrder=meta["sortOrder"],
            createdAt=parse_iso(meta["createdAt"]),
            updatedAt=parse_iso(meta["updatedAt"]),
        )

    def get_entry_meta(self, content_id: str) -> GlossaryEntryMeta:
        meta = self._repository.get_glossary_entry_meta(content_id)
        if not meta:
            raise KeyError(content_id)
        return GlossaryEntryMeta(
            contentId=meta["contentId"],
            sortOrder=meta["sortOrder"],
            createdAt=parse_iso(meta["createdAt"]),
            updatedAt=parse_iso(meta["updatedAt"]),
        )

    def delete_entry(self, content_id: str) -> None:
        self._repository.delete_glossary_entry(content_id)
        from .glossary_publish import GlossaryPublishService

        publish_service = GlossaryPublishService(self._repository)
        for locale in EDITORIAL_LOCALES:
            publish_service.rebuild_published_snapshot(locale)

    def delete_variant(self, content_id: str, locale: str) -> None:
        parsed_locale = parse_admin_locale(locale)
        self._repository.delete_glossary_entry_variant(content_id, parsed_locale)
        from .glossary_publish import GlossaryPublishService

        GlossaryPublishService(self._repository).rebuild_published_snapshot(parsed_locale)

    def _variant_response(self, content_id: str, locale: str, variant: dict | None) -> GlossaryVariantResponse:
        parsed_locale = parse_admin_locale(locale)
        translation_fields = translation_metadata_for_api(variant)
        if not variant:
            return GlossaryVariantResponse(
                contentId=content_id,
                locale=parsed_locale,
                status=ContentStatus.DRAFT,
                editorialVisibility=EditorialVisibility.EMPTY,
                body=GlossaryVariantBody.model_validate(empty_variant_body()),
                exists=False,
                updatedAt=None,
                publishedAt=None,
                **translation_fields,
            )
        status = ContentStatus(variant["status"])
        updated_at = parse_iso(variant.get("updatedAt"))
        published_at = parse_iso(variant.get("publishedAt"))
        return GlossaryVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=status,
            editorialVisibility=compute_editorial_visibility(
                exists=True,
                status=status,
                updated_at=updated_at,
                published_at=published_at,
            ),
            body=GlossaryVariantBody.model_validate(variant["draftBody"]),
            exists=True,
            updatedAt=updated_at,
            publishedAt=published_at,
            **translation_fields,
        )

    def get_variant(self, content_id: str, locale: str) -> GlossaryVariantResponse:
        parsed_locale = parse_admin_locale(locale)
        if not self._repository.get_glossary_entry_meta(content_id):
            raise KeyError(content_id)
        variant = self._repository.get_glossary_variant(content_id, parsed_locale)
        return self._variant_response(content_id, parsed_locale, variant)

    def save_variant(self, content_id: str, locale: str, body: GlossaryVariantBody) -> GlossaryVariantResponse:
        parsed_locale = parse_admin_locale(locale)
        if not body.term.strip():
            raise ValueError("Glossary term cannot be empty.")
        saved = self._repository.save_glossary_variant(content_id, parsed_locale, body.model_dump())
        return self._variant_response(content_id, parsed_locale, saved)

    def generate_translation(
        self,
        content_id: str,
        locale: str,
        *,
        confirm_overwrite: bool = False,
        provider=None,
    ) -> GlossaryVariantResponse:
        from .translation_generation import TranslationGenerationService

        service = TranslationGenerationService(self._repository, provider=provider)
        saved = service.generate(
            module="glossary",
            content_id=content_id,
            target_locale=locale,
            confirm_overwrite=confirm_overwrite,
        )
        return self._variant_response(content_id, locale, saved)

    def search_references(self, query: str = "", locale: str = DEFAULT_LOCALE) -> list[GlossaryReferenceOption]:
        options = ReferenceSearchService(self._repository).search_references(query, locale)
        filtered = [
            option
            for option in options
            if option.contentType in {"glossary_entry", "manual_chapter"}
        ]
        return [
            GlossaryReferenceOption(
                contentId=option.contentId,
                contentType=option.contentType,
                label=option.label,
                detail=option.detail,
            )
            for option in filtered
        ]
