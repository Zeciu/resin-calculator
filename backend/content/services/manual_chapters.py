from ..repositories.filesystem import DEFAULT_LOCALE, DEFAULT_SECTION_ID, EDITORIAL_LOCALES, parse_iso
from ..schemas.common import ContentStatus
from ..schemas.editorial import EditorialVisibility
from ..schemas.manual import (
    ManualChapterListItem,
    ManualChapterMeta,
    ManualVariantBody,
    ManualVariantResponse,
    ManualVariantSummary,
    parse_locale,
)
from .editorial_identity import chapter_identity_title
from .editorial_status import compute_editorial_visibility


def empty_variant_body(title: str = "") -> dict:
    return {
        "title": title,
        "sections": [
            {
                "id": DEFAULT_SECTION_ID,
                "title": "",
                "blocks": [],
            }
        ],
    }


def variant_has_non_empty_body(body: ManualVariantBody) -> bool:
    def inner_block_has_content(block) -> bool:
        if block.type == "paragraph" and block.text.strip():
            return True
        if block.type == "heading" and block.text.strip():
            return True
        return False

    for section in body.sections:
        for block in section.blocks:
            if block.type == "paragraph" and block.text.strip():
                return True
            if block.type == "heading" and block.text.strip():
                return True
            if block.type == "image" and block.src.strip() and block.alt.strip():
                return True
            if block.type == "video" and block.title.strip() and block.embedUrl.strip():
                return True
            if block.type == "callout" and any(inner_block_has_content(inner) for inner in block.blocks):
                return True
    return False


class ManualChapterService:
    def __init__(self, repository):
        self._repository = repository

    def list_chapters(self, locale: str = DEFAULT_LOCALE) -> list[ManualChapterListItem]:
        parsed_locale = parse_locale(locale)
        items: list[ManualChapterListItem] = []
        for content_id in self._repository.list_manual_chapter_ids():
            meta = self._repository.get_manual_chapter_meta(content_id)
            if not meta:
                continue
            variants: dict[str, ManualVariantSummary] = {}
            active_variant: dict | None = None
            for variant_locale in EDITORIAL_LOCALES:
                variant = self._repository.get_manual_variant(content_id, variant_locale)
                if not variant:
                    continue
                variants[variant_locale] = ManualVariantSummary(
                    status=ContentStatus(variant["status"]),
                    updatedAt=parse_iso(variant.get("updatedAt")),
                    publishedAt=parse_iso(variant.get("publishedAt")),
                )
                if variant_locale == parsed_locale:
                    active_variant = variant
            # Only list chapters that have a saved variant in the active locale.
            if active_variant is None:
                continue
            active_title = active_variant.get("draftBody", {}).get("title", "").strip()
            items.append(
                ManualChapterListItem(
                    contentId=content_id,
                    title=active_title or chapter_identity_title(self._repository, content_id),
                    sortOrder=meta["sortOrder"],
                    variants=variants,
                )
            )
        return items

    def create_chapter(self, title: str, locale: str = DEFAULT_LOCALE) -> ManualChapterMeta:
        parsed_locale = parse_locale(locale)
        meta = self._repository.create_manual_chapter(title, locale=parsed_locale)
        return ManualChapterMeta(
            contentId=meta["contentId"],
            sortOrder=meta["sortOrder"],
            createdAt=parse_iso(meta["createdAt"]),
            updatedAt=parse_iso(meta["updatedAt"]),
        )

    def get_chapter_meta(self, content_id: str) -> ManualChapterMeta:
        meta = self._repository.get_manual_chapter_meta(content_id)
        if not meta:
            raise KeyError(content_id)
        return ManualChapterMeta(
            contentId=meta["contentId"],
            sortOrder=meta["sortOrder"],
            createdAt=parse_iso(meta["createdAt"]),
            updatedAt=parse_iso(meta["updatedAt"]),
        )

    def delete_chapter(self, content_id: str) -> None:
        self._repository.delete_manual_chapter(content_id)

    def _variant_response(self, content_id: str, locale: str, variant: dict | None) -> ManualVariantResponse:
        parsed_locale = parse_locale(locale)
        if not variant:
            return ManualVariantResponse(
                contentId=content_id,
                locale=parsed_locale,
                status=ContentStatus.DRAFT,
                editorialVisibility=EditorialVisibility.EMPTY,
                body=ManualVariantBody.model_validate(empty_variant_body()),
                exists=False,
                updatedAt=None,
                publishedAt=None,
            )
        status = ContentStatus(variant["status"])
        updated_at = parse_iso(variant.get("updatedAt"))
        published_at = parse_iso(variant.get("publishedAt"))
        return ManualVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=status,
            editorialVisibility=compute_editorial_visibility(
                exists=True,
                status=status,
                updated_at=updated_at,
                published_at=published_at,
            ),
            body=ManualVariantBody.model_validate(variant["draftBody"]),
            exists=True,
            updatedAt=updated_at,
            publishedAt=published_at,
        )

    def get_variant(self, content_id: str, locale: str) -> ManualVariantResponse:
        parsed_locale = parse_locale(locale)
        if not self._repository.get_manual_chapter_meta(content_id):
            raise KeyError(content_id)
        variant = self._repository.get_manual_variant(content_id, parsed_locale)
        return self._variant_response(content_id, parsed_locale, variant)

    def save_variant(self, content_id: str, locale: str, body: ManualVariantBody) -> ManualVariantResponse:
        parsed_locale = parse_locale(locale)
        if not body.title.strip():
            raise ValueError("Chapter title cannot be empty.")
        saved = self._repository.save_manual_variant(content_id, parsed_locale, body.model_dump())
        return self._variant_response(content_id, parsed_locale, saved)

    def reorder_chapters(self, chapter_ids: list[str]) -> None:
        self._repository.reorder_manual_chapters(chapter_ids)
