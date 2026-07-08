from ..repositories.filesystem import FilesystemContentRepository
from ..schemas.knowledge_base import (
    PublicKnowledgeBaseEntry,
    PublicKnowledgeBaseRelationship,
    PublicKnowledgeBaseResponse,
    parse_locale,
)

KB_DOCUMENT_TITLE = "Knowledge Base"
KB_DOCUMENT_LEDE = (
    "Practical troubleshooting for woodworking, epoxy resin, and HFZWood workflow problems. "
    "Find a symptom, review the likely causes, and follow the recommended solution."
)


def _clean_string_list(values: list[str]) -> list[str]:
    return [value.strip() for value in values or [] if value and str(value).strip()]


class KnowledgeBasePublicService:
    def __init__(self, repository: FilesystemContentRepository):
        self._repository = repository

    def _resolve_kb_label(self, content_id: str, locale: str) -> str:
        variant = self._repository.get_kb_variant(content_id, locale)
        if variant and variant["status"] == "published":
            return variant["draftBody"].get("title", "").strip()
        for fallback_locale in ("en", "ro"):
            if fallback_locale == locale:
                continue
            fallback = self._repository.get_kb_variant(content_id, fallback_locale)
            if fallback and fallback["status"] == "published":
                return fallback["draftBody"].get("title", "").strip()
        return ""

    def _resolve_glossary_label(self, content_id: str, locale: str) -> str:
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

    def _build_public_entry(self, content_id: str, variant: dict, locale: str) -> PublicKnowledgeBaseEntry:
        body = variant["draftBody"]
        related_kb = []
        for related_id in body.get("relatedKbEntryIds", []):
            label = self._resolve_kb_label(related_id, locale)
            if label:
                related_kb.append(PublicKnowledgeBaseRelationship(id=related_id, label=label))

        related_glossary = []
        for related_id in body.get("relatedGlossaryEntryIds", []):
            label = self._resolve_glossary_label(related_id, locale)
            if label:
                related_glossary.append(PublicKnowledgeBaseRelationship(id=related_id, label=label))

        related_manual = []
        for related_id in body.get("relatedManualChapterIds", []):
            label = self._resolve_manual_label(related_id, locale)
            if label:
                related_manual.append(PublicKnowledgeBaseRelationship(id=related_id, label=label))

        repair_time = body.get("estimatedRepairTime")
        if isinstance(repair_time, str):
            repair_time = repair_time.strip() or None

        return PublicKnowledgeBaseEntry(
            id=content_id,
            title=body.get("title", "").strip(),
            problemSummary=body.get("problemSummary", "").strip(),
            symptoms=_clean_string_list(body.get("symptoms", [])),
            possibleCauses=_clean_string_list(body.get("possibleCauses", [])),
            solution=_clean_string_list(body.get("solution", [])),
            prevention=_clean_string_list(body.get("prevention", [])),
            tips=_clean_string_list(body.get("tips", [])),
            warnings=_clean_string_list(body.get("warnings", [])),
            searchKeywords=_clean_string_list(body.get("searchKeywords", [])),
            estimatedRepairTime=repair_time,
            requiredTools=_clean_string_list(body.get("requiredTools", [])),
            requiredMaterials=_clean_string_list(body.get("requiredMaterials", [])),
            media=body.get("media", []),
            relatedKbArticles=related_kb,
            relatedGlossaryTerms=related_glossary,
            relatedManualChapters=related_manual,
        )

    def build_admin_snapshot(self, locale: str) -> dict:
        entries: list[dict] = []
        for content_id in self._repository.list_kb_entry_ids():
            variant = self._repository.get_kb_variant(content_id, locale)
            if not variant or variant["status"] != "published":
                continue
            public_entry = self._build_public_entry(content_id, variant, locale)
            entries.append(public_entry.model_dump())

        return {"locale": locale, "entries": entries}

    def entries_from_admin_snapshot(self, snapshot: dict | None) -> list[dict]:
        if not snapshot:
            return []
        return list(snapshot.get("entries", []))

    def entries_from_legacy_document(self, document: dict | None) -> list[dict]:
        if not document:
            return []
        return list(document.get("entries", []))

    def _resolve_locale_entries(self, locale: str) -> list[dict]:
        admin_entries = self.entries_from_admin_snapshot(self._repository.read_kb_snapshot(locale))
        if admin_entries:
            return admin_entries
        return self.entries_from_legacy_document(self._repository.read_legacy_kb_document(locale))

    def _locale_has_content(self, locale: str) -> bool:
        return bool(self._resolve_locale_entries(locale))

    def get_published_knowledge_base(self, locale: str) -> PublicKnowledgeBaseResponse:
        requested_locale = parse_locale(locale)
        english_available = self._locale_has_content("en")
        entries = self._resolve_locale_entries(requested_locale)
        return PublicKnowledgeBaseResponse(
            locale=requested_locale,
            requestedLocale=requested_locale,
            available=bool(entries),
            englishAvailable=english_available,
            documentTitle=KB_DOCUMENT_TITLE,
            lede=KB_DOCUMENT_LEDE,
            entries=[PublicKnowledgeBaseEntry.model_validate(entry) for entry in entries],
        )
