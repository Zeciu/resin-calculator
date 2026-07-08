from ..repositories.filesystem import DEFAULT_LOCALE, parse_iso
from ..schemas.common import ContentStatus
from ..schemas.knowledge_base import (
    KnowledgeBaseEntryListItem,
    KnowledgeBaseEntryMeta,
    KnowledgeBaseReferenceOption,
    KnowledgeBaseVariantBody,
    KnowledgeBaseVariantResponse,
    KnowledgeBaseVariantSummary,
    parse_locale,
)


def empty_variant_body(title: str = "") -> dict:
    return {
        "title": title,
        "problemSummary": "",
        "symptoms": [],
        "possibleCauses": [],
        "solution": [],
        "prevention": [],
        "tips": [],
        "warnings": [],
        "searchKeywords": [],
        "estimatedRepairTime": None,
        "requiredTools": [],
        "requiredMaterials": [],
        "bodyBlocks": [],
        "media": [],
        "relatedKbEntryIds": [],
        "relatedGlossaryEntryIds": [],
        "relatedManualChapterIds": [],
    }


def entry_identity_title(repository, content_id: str) -> str:
    for variant_locale in ("en", "ro"):
        variant = repository.get_kb_variant(content_id, variant_locale)
        if not variant:
            continue
        title = variant.get("draftBody", {}).get("title", "").strip()
        if title:
            return title
    return ""


def variant_has_publishable_body(body: KnowledgeBaseVariantBody) -> bool:
    if not body.title.strip():
        return False
    if not body.problemSummary.strip():
        return False
    if not any(item.strip() for item in body.solution):
        return False
    return True


def _clean_string_list(values: list[str]) -> list[str]:
    return [value.strip() for value in values if value and value.strip()]


class KnowledgeBaseEntryService:
    def __init__(self, repository):
        self._repository = repository

    def list_entries(self, locale: str = DEFAULT_LOCALE) -> list[KnowledgeBaseEntryListItem]:
        parse_locale(locale)
        items: list[KnowledgeBaseEntryListItem] = []
        for content_id in self._repository.list_kb_entry_ids():
            meta = self._repository.get_kb_entry_meta(content_id)
            if not meta:
                continue
            variants: dict[str, KnowledgeBaseVariantSummary] = {}
            for variant_locale in ("en", "ro"):
                variant = self._repository.get_kb_variant(content_id, variant_locale)
                if not variant:
                    continue
                variants[variant_locale] = KnowledgeBaseVariantSummary(
                    status=ContentStatus(variant["status"]),
                    updatedAt=parse_iso(variant.get("updatedAt")),
                    publishedAt=parse_iso(variant.get("publishedAt")),
                )
            items.append(
                KnowledgeBaseEntryListItem(
                    contentId=content_id,
                    title=entry_identity_title(self._repository, content_id),
                    category=meta["category"],
                    difficulty=meta["difficulty"],
                    sortOrder=meta["sortOrder"],
                    variants=variants,
                )
            )
        return items

    def create_entry(self, title: str, category: str, difficulty: str) -> KnowledgeBaseEntryMeta:
        meta = self._repository.create_kb_entry(title, category, difficulty)
        return KnowledgeBaseEntryMeta(
            contentId=meta["contentId"],
            category=meta["category"],
            difficulty=meta["difficulty"],
            sortOrder=meta["sortOrder"],
            createdAt=parse_iso(meta["createdAt"]),
            updatedAt=parse_iso(meta["updatedAt"]),
        )

    def get_entry_meta(self, content_id: str) -> KnowledgeBaseEntryMeta:
        meta = self._repository.get_kb_entry_meta(content_id)
        if not meta:
            raise KeyError(content_id)
        return KnowledgeBaseEntryMeta(
            contentId=meta["contentId"],
            category=meta["category"],
            difficulty=meta["difficulty"],
            sortOrder=meta["sortOrder"],
            createdAt=parse_iso(meta["createdAt"]),
            updatedAt=parse_iso(meta["updatedAt"]),
        )

    def delete_entry(self, content_id: str) -> None:
        self._repository.delete_kb_entry(content_id)
        from .knowledge_base_publish import KnowledgeBasePublishService

        publish_service = KnowledgeBasePublishService(self._repository)
        for locale in ("en", "ro"):
            publish_service.rebuild_published_snapshot(locale)

    def get_variant(self, content_id: str, locale: str) -> KnowledgeBaseVariantResponse:
        parsed_locale = parse_locale(locale)
        meta = self._repository.get_kb_entry_meta(content_id)
        if not meta:
            raise KeyError(content_id)
        variant = self._repository.get_kb_variant(content_id, parsed_locale)
        if not variant:
            return KnowledgeBaseVariantResponse(
                contentId=content_id,
                locale=parsed_locale,
                category=meta["category"],
                difficulty=meta["difficulty"],
                status=ContentStatus.DRAFT,
                body=KnowledgeBaseVariantBody.model_validate(empty_variant_body()),
                exists=False,
                updatedAt=None,
                publishedAt=None,
            )
        return KnowledgeBaseVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            category=meta["category"],
            difficulty=meta["difficulty"],
            status=ContentStatus(variant["status"]),
            body=KnowledgeBaseVariantBody.model_validate(variant["draftBody"]),
            exists=True,
            updatedAt=parse_iso(variant.get("updatedAt")),
            publishedAt=parse_iso(variant.get("publishedAt")),
        )

    def save_variant(
        self,
        content_id: str,
        locale: str,
        category: str,
        difficulty: str,
        body: KnowledgeBaseVariantBody,
    ) -> KnowledgeBaseVariantResponse:
        parsed_locale = parse_locale(locale)
        if not body.title.strip():
            raise ValueError("Knowledge Base title cannot be empty.")
        payload = body.model_dump()
        payload["symptoms"] = _clean_string_list(payload.get("symptoms", []))
        payload["possibleCauses"] = _clean_string_list(payload.get("possibleCauses", []))
        payload["solution"] = _clean_string_list(payload.get("solution", []))
        payload["prevention"] = _clean_string_list(payload.get("prevention", []))
        payload["tips"] = _clean_string_list(payload.get("tips", []))
        payload["warnings"] = _clean_string_list(payload.get("warnings", []))
        payload["searchKeywords"] = _clean_string_list(payload.get("searchKeywords", []))
        payload["requiredTools"] = _clean_string_list(payload.get("requiredTools", []))
        payload["requiredMaterials"] = _clean_string_list(payload.get("requiredMaterials", []))
        payload["bodyBlocks"] = []
        saved = self._repository.save_kb_variant(
            content_id,
            parsed_locale,
            payload,
            category,
            difficulty,
        )
        meta = self._repository.get_kb_entry_meta(content_id)
        return KnowledgeBaseVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            category=meta["category"],
            difficulty=meta["difficulty"],
            status=ContentStatus(saved["status"]),
            body=KnowledgeBaseVariantBody.model_validate(saved["draftBody"]),
            exists=True,
            updatedAt=parse_iso(saved.get("updatedAt")),
            publishedAt=parse_iso(saved.get("publishedAt")),
        )

    def search_references(self, query: str = "", locale: str = DEFAULT_LOCALE) -> list[KnowledgeBaseReferenceOption]:
        parse_locale(locale)
        normalized = query.strip().lower()
        options: list[KnowledgeBaseReferenceOption] = []

        for content_id in self._repository.list_kb_entry_ids():
            title = entry_identity_title(self._repository, content_id)
            if normalized and normalized not in title.lower() and normalized not in content_id.lower():
                continue
            options.append(
                KnowledgeBaseReferenceOption(
                    contentId=content_id,
                    contentType="kb_entry",
                    label=title or content_id,
                    detail="Knowledge Base article",
                )
            )

        for content_id in self._repository.list_glossary_entry_ids():
            from .glossary_entries import entry_identity_term

            term = entry_identity_term(self._repository, content_id)
            if normalized and normalized not in term.lower() and normalized not in content_id.lower():
                continue
            options.append(
                KnowledgeBaseReferenceOption(
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
                KnowledgeBaseReferenceOption(
                    contentId=content_id,
                    contentType="manual_chapter",
                    label=title or content_id,
                    detail="Manual chapter",
                )
            )

        return sorted(options, key=lambda item: item.label.lower())
