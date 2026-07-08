import re

from ..repositories.filesystem import DEFAULT_LOCALE, parse_iso
from ..schemas.common import ContentStatus
from ..schemas.glossary import (
    GlossaryEntryListItem,
    GlossaryEntryMeta,
    GlossaryReferenceOption,
    GlossaryVariantBody,
    GlossaryVariantResponse,
    GlossaryVariantSummary,
    parse_locale,
)


def empty_variant_body(term: str = "") -> dict:
    return {
        "term": term,
        "definitionBlocks": [],
        "media": [],
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


def entry_identity_term(repository, content_id: str) -> str:
    for variant_locale in ("en", "ro"):
        variant = repository.get_glossary_variant(content_id, variant_locale)
        if not variant:
            continue
        term = variant.get("draftBody", {}).get("term", "").strip()
        if term:
            return term
    return ""


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
        parse_locale(locale)
        items: list[GlossaryEntryListItem] = []
        for content_id in self._repository.list_glossary_entry_ids():
            meta = self._repository.get_glossary_entry_meta(content_id)
            if not meta:
                continue
            variants: dict[str, GlossaryVariantSummary] = {}
            for variant_locale in ("en", "ro"):
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
        for locale in ("en", "ro"):
            publish_service.rebuild_published_snapshot(locale)

    def get_variant(self, content_id: str, locale: str) -> GlossaryVariantResponse:
        parsed_locale = parse_locale(locale)
        if not self._repository.get_glossary_entry_meta(content_id):
            raise KeyError(content_id)
        variant = self._repository.get_glossary_variant(content_id, parsed_locale)
        if not variant:
            return GlossaryVariantResponse(
                contentId=content_id,
                locale=parsed_locale,
                status=ContentStatus.DRAFT,
                body=GlossaryVariantBody.model_validate(empty_variant_body()),
                exists=False,
                updatedAt=None,
                publishedAt=None,
            )
        return GlossaryVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus(variant["status"]),
            body=GlossaryVariantBody.model_validate(variant["draftBody"]),
            exists=True,
            updatedAt=parse_iso(variant.get("updatedAt")),
            publishedAt=parse_iso(variant.get("publishedAt")),
        )

    def save_variant(self, content_id: str, locale: str, body: GlossaryVariantBody) -> GlossaryVariantResponse:
        parsed_locale = parse_locale(locale)
        if not body.term.strip():
            raise ValueError("Glossary term cannot be empty.")
        saved = self._repository.save_glossary_variant(content_id, parsed_locale, body.model_dump())
        return GlossaryVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus(saved["status"]),
            body=GlossaryVariantBody.model_validate(saved["draftBody"]),
            exists=True,
            updatedAt=parse_iso(saved.get("updatedAt")),
            publishedAt=parse_iso(saved.get("publishedAt")),
        )

    def search_references(self, query: str = "", locale: str = DEFAULT_LOCALE) -> list[GlossaryReferenceOption]:
        parse_locale(locale)
        normalized = query.strip().lower()
        options: list[GlossaryReferenceOption] = []

        for content_id in self._repository.list_glossary_entry_ids():
            term = entry_identity_term(self._repository, content_id)
            if normalized and normalized not in term.lower() and normalized not in content_id.lower():
                continue
            options.append(
                GlossaryReferenceOption(
                    contentId=content_id,
                    contentType="glossary_entry",
                    label=term or content_id,
                    detail="Glossary entry",
                )
            )

        for content_id in self._repository.list_manual_chapter_ids():
            from .manual_chapters import chapter_identity_title

            title = chapter_identity_title(self._repository, content_id)
            if normalized and normalized not in title.lower() and normalized not in content_id.lower():
                continue
            options.append(
                GlossaryReferenceOption(
                    contentId=content_id,
                    contentType="manual_chapter",
                    label=title or content_id,
                    detail="Manual chapter",
                )
            )

        return sorted(options, key=lambda item: item.label.lower())
