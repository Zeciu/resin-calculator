import re

from ..repositories.filesystem import FilesystemContentRepository
from ..schemas.glossary import (
    PublicGlossaryEntry,
    PublicGlossaryRelationship,
    PublicGlossaryResponse,
    PublicSeeAlsoReference,
    parse_locale,
)

GLOSSARY_DOCUMENT_TITLE = "Glossary"
GLOSSARY_DOCUMENT_LEDE = (
    "A technical dictionary of woodworking, epoxy resin, and HFZWood terminology for quick "
    "reference while you work."
)


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


def definition_blocks_to_paragraphs(blocks: list[dict]) -> list[str]:
    paragraphs: list[str] = []
    for block in blocks or []:
        if block.get("type") == "paragraph":
            text = _strip_html(block.get("text", ""))
            if text:
                paragraphs.append(text)
        elif block.get("type") == "heading":
            text = _strip_html(block.get("text", ""))
            if text:
                paragraphs.append(text)
        elif block.get("type") == "callout":
            for inner in block.get("blocks", []):
                text = _strip_html(inner.get("text", ""))
                if text:
                    paragraphs.append(text)
    return paragraphs


def see_also_href(target_type: str, target_id: str) -> str:
    if target_type == "glossary_entry":
        return f"/glossary#glossary-entry-{target_id}"
    if target_type == "manual_chapter":
        return f"/manual#{target_id}"
    if target_type == "kb_entry":
        return f"/knowledge-base#{target_id}"
    return "/"


class GlossaryPublicService:
    def __init__(self, repository: FilesystemContentRepository):
        self._repository = repository

    def _resolve_term_label(self, content_id: str, locale: str) -> str:
        variant = self._repository.get_glossary_variant(content_id, locale)
        if variant and variant["status"] == "published":
            return variant["draftBody"].get("term", "").strip()
        for fallback_locale in ("en", "ro"):
            if fallback_locale == locale:
                continue
            fallback = self._repository.get_glossary_variant(content_id, fallback_locale)
            if fallback and fallback["status"] == "published":
                return fallback["draftBody"].get("term", "").strip()
        return ""

    def _resolve_manual_label(self, content_id: str, locale: str) -> str:
        variant = self._repository.get_manual_variant(content_id, locale)
        if variant and variant["status"] == "published":
            return variant["draftBody"].get("title", "").strip()
        for fallback_locale in ("en", "ro"):
            if fallback_locale == locale:
                continue
            fallback = self._repository.get_manual_variant(content_id, fallback_locale)
            if fallback and fallback["status"] == "published":
                return fallback["draftBody"].get("title", "").strip()
        return content_id

    def _build_public_entry(self, content_id: str, variant: dict, locale: str) -> PublicGlossaryEntry:
        body = variant["draftBody"]
        related_terms = []
        for related_id in body.get("relatedTermIds", []):
            label = self._resolve_term_label(related_id, locale)
            if label:
                related_terms.append(PublicGlossaryRelationship(id=related_id, term=label))

        synonyms = []
        for synonym_id in body.get("synonymTermIds", []):
            label = self._resolve_term_label(synonym_id, locale)
            if label:
                synonyms.append(PublicGlossaryRelationship(id=synonym_id, term=label))

        see_also = []
        for reference in body.get("seeAlso", []):
            target_type = reference.get("targetType")
            target_id = reference.get("targetContentId", "")
            label = reference.get("label", "").strip()
            if target_type == "glossary_entry":
                label = label or self._resolve_term_label(target_id, locale)
            elif target_type == "manual_chapter":
                label = label or self._resolve_manual_label(target_id, locale)
            if not label:
                continue
            see_also.append(
                PublicSeeAlsoReference(
                    targetType=target_type,
                    targetId=target_id,
                    label=label,
                    href=see_also_href(target_type, target_id),
                )
            )

        return PublicGlossaryEntry(
            id=content_id,
            term=body.get("term", "").strip(),
            definition=definition_blocks_to_paragraphs(body.get("definitionBlocks", [])),
            media=body.get("media", []),
            relatedTerms=related_terms,
            synonyms=synonyms,
            seeAlso=see_also,
        )

    def build_admin_snapshot(self, locale: str) -> dict:
        entries: list[dict] = []
        for content_id in self._repository.list_glossary_entry_ids():
            variant = self._repository.get_glossary_variant(content_id, locale)
            if not variant or variant["status"] != "published":
                continue
            public_entry = self._build_public_entry(content_id, variant, locale)
            entries.append(public_entry.model_dump())

        entries.sort(key=lambda item: item["term"].casefold())
        return {"locale": locale, "entries": entries}

    def entries_from_admin_snapshot(self, snapshot: dict | None) -> list[dict]:
        if not snapshot:
            return []
        entries = snapshot.get("entries", [])
        return sorted(entries, key=lambda item: item.get("term", "").casefold())

    def entries_from_legacy_document(self, document: dict | None) -> list[dict]:
        if not document:
            return []
        entries = document.get("entries", [])
        return sorted(entries, key=lambda item: item.get("term", "").casefold())

    def _resolve_locale_entries(self, locale: str) -> list[dict]:
        admin_entries = self.entries_from_admin_snapshot(self._repository.read_glossary_snapshot(locale))
        if admin_entries:
            return admin_entries
        return self.entries_from_legacy_document(self._repository.read_legacy_glossary_document(locale))

    def _locale_has_content(self, locale: str) -> bool:
        return bool(self._resolve_locale_entries(locale))

    def get_published_glossary(self, locale: str) -> PublicGlossaryResponse:
        requested_locale = parse_locale(locale)
        english_available = self._locale_has_content("en")
        entries = self._resolve_locale_entries(requested_locale)
        return PublicGlossaryResponse(
            locale=requested_locale,
            requestedLocale=requested_locale,
            available=bool(entries),
            englishAvailable=english_available,
            documentTitle=GLOSSARY_DOCUMENT_TITLE,
            lede=GLOSSARY_DOCUMENT_LEDE,
            entries=[PublicGlossaryEntry.model_validate(entry) for entry in entries],
        )
