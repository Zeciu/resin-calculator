from ..repositories.filesystem import DEFAULT_LOCALE, DEFAULT_SECTION_ID, parse_iso
from ..schemas.common import ContentStatus
from ..schemas.manual import (
    ManualChapterListItem,
    ManualChapterMeta,
    ManualVariantBody,
    ManualVariantResponse,
    ManualVariantSummary,
    parse_locale,
)


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


def chapter_identity_title(repository, content_id: str) -> str:
    for variant_locale in ("en", "ro"):
        variant = repository.get_manual_variant(content_id, variant_locale)
        if not variant:
            continue
        title = variant.get("draftBody", {}).get("title", "").strip()
        if title:
            return title
    return ""


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
        parse_locale(locale)
        items: list[ManualChapterListItem] = []
        for content_id in self._repository.list_manual_chapter_ids():
            meta = self._repository.get_manual_chapter_meta(content_id)
            if not meta:
                continue
            variants: dict[str, ManualVariantSummary] = {}
            for variant_locale in ("en", "ro"):
                variant = self._repository.get_manual_variant(content_id, variant_locale)
                if not variant:
                    continue
                variants[variant_locale] = ManualVariantSummary(
                    status=ContentStatus(variant["status"]),
                    updatedAt=parse_iso(variant.get("updatedAt")),
                    publishedAt=parse_iso(variant.get("publishedAt")),
                )
            items.append(
                ManualChapterListItem(
                    contentId=content_id,
                    title=chapter_identity_title(self._repository, content_id),
                    sortOrder=meta["sortOrder"],
                    variants=variants,
                )
            )
        return items

    def create_chapter(self, title: str) -> ManualChapterMeta:
        meta = self._repository.create_manual_chapter(title)
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

    def get_variant(self, content_id: str, locale: str) -> ManualVariantResponse:
        parsed_locale = parse_locale(locale)
        if not self._repository.get_manual_chapter_meta(content_id):
            raise KeyError(content_id)
        variant = self._repository.get_manual_variant(content_id, parsed_locale)
        if not variant:
            return ManualVariantResponse(
                contentId=content_id,
                locale=parsed_locale,
                status=ContentStatus.DRAFT,
                body=ManualVariantBody.model_validate(empty_variant_body()),
                exists=False,
                updatedAt=None,
                publishedAt=None,
            )
        return ManualVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus(variant["status"]),
            body=ManualVariantBody.model_validate(variant["draftBody"]),
            exists=True,
            updatedAt=parse_iso(variant.get("updatedAt")),
            publishedAt=parse_iso(variant.get("publishedAt")),
        )

    def save_variant(self, content_id: str, locale: str, body: ManualVariantBody) -> ManualVariantResponse:
        parsed_locale = parse_locale(locale)
        if not body.title.strip():
            raise ValueError("Chapter title cannot be empty.")
        saved = self._repository.save_manual_variant(content_id, parsed_locale, body.model_dump())
        return ManualVariantResponse(
            contentId=content_id,
            locale=parsed_locale,
            status=ContentStatus(saved["status"]),
            body=ManualVariantBody.model_validate(saved["draftBody"]),
            exists=True,
            updatedAt=parse_iso(saved.get("updatedAt")),
            publishedAt=parse_iso(saved.get("publishedAt")),
        )

    def reorder_chapters(self, chapter_ids: list[str]) -> None:
        self._repository.reorder_manual_chapters(chapter_ids)
