from ..repositories.filesystem import DEFAULT_LOCALE, parse_iso
from ..schemas.common import ContentStatus
from ..schemas.editorial import EditorialVisibility
from ..schemas.knowledge_base import (
    KnowledgeBaseEntryListItem,
    KnowledgeBaseEntryMeta,
    KnowledgeBaseReferenceOption,
    KnowledgeBaseVariantBody,
    KnowledgeBaseVariantResponse,
    KnowledgeBaseVariantSummary,
    parse_locale,
)
from .editorial_identity import entry_identity_title
from .editorial_status import compute_editorial_visibility
from .reference_search import ReferenceSearchService


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

    def _variant_response(
        self,
        content_id: str,
        locale: str,
        variant: dict | None,
        meta: dict,
    ) -> KnowledgeBaseVariantResponse:
        parsed_locale = parse_locale(locale)
        if not variant:
            return KnowledgeBaseVariantResponse(
                contentId=content_id,
                locale=parsed_locale,
                category=meta["category"],
                difficulty=meta["difficulty"],
                status=ContentStatus.DRAFT,
                editorialVisibility=EditorialVisibility.EMPTY,
                body=KnowledgeBaseVariantBody.model_validate(empty_variant_body()),
                exists=False,
                updatedAt=None,
                publishedAt=None,
            )
        status = ContentStatus(variant["status"])
        updated_at = parse_iso(variant.get("updatedAt"))
        published_at = parse_iso(variant.get("publishedAt"))
        return KnowledgeBaseVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            category=meta["category"],
            difficulty=meta["difficulty"],
            status=status,
            editorialVisibility=compute_editorial_visibility(
                exists=True,
                status=status,
                updated_at=updated_at,
                published_at=published_at,
            ),
            body=KnowledgeBaseVariantBody.model_validate(variant["draftBody"]),
            exists=True,
            updatedAt=updated_at,
            publishedAt=published_at,
        )

    def get_variant(self, content_id: str, locale: str) -> KnowledgeBaseVariantResponse:
        parsed_locale = parse_locale(locale)
        meta = self._repository.get_kb_entry_meta(content_id)
        if not meta:
            raise KeyError(content_id)
        variant = self._repository.get_kb_variant(content_id, parsed_locale)
        return self._variant_response(content_id, parsed_locale, variant, meta)

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
        return self._variant_response(content_id, parsed_locale, saved, meta)

    def search_references(self, query: str = "", locale: str = DEFAULT_LOCALE) -> list[KnowledgeBaseReferenceOption]:
        options = ReferenceSearchService(self._repository).search_references(query, locale)
        return [
            KnowledgeBaseReferenceOption(
                contentId=option.contentId,
                contentType=option.contentType,
                label=option.label,
                detail=option.detail,
            )
            for option in options
        ]
