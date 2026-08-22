"""Anonymous-safe Public Knowledge Preview over the packaged public corpus.

Existing authenticated `/api/content/*` routes are unchanged. This router never
sends locked educational bodies, search keywords, or unselected media.
"""

from __future__ import annotations

import copy

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from public.content_api import (
    CORPUS_ROOT,
    GLOSSARY_LEDE,
    GLOSSARY_TITLE,
    KB_LEDE,
    KB_TITLE,
    MANUAL_LEDE,
    MANUAL_TITLE,
    _document,
    _image_response,
    _require_locale,
)
from public.product.capabilities.public_preview import (
    collect_image_filenames,
    is_safe_image_filename,
    load_public_preview_config,
    rewrite_media_tree,
)

router = APIRouter(prefix="/public-preview", tags=["public-knowledge-preview"])

PUBLIC_PREVIEW_CONFIG = CORPUS_ROOT / "config" / "public-preview.json"

_LOCKED_KB_KEYS = (
    "problemSummary",
    "symptoms",
    "possibleCauses",
    "solution",
    "prevention",
    "tips",
    "warnings",
    "searchKeywords",
    "estimatedRepairTime",
    "requiredTools",
    "requiredMaterials",
    "media",
    "relatedKbArticles",
    "relatedGlossaryTerms",
    "relatedManualChapters",
    "bodyBlocks",
)
_LOCKED_GLOSSARY_KEYS = (
    "definition",
    "definitionBlocks",
    "media",
    "relatedTerms",
    "synonyms",
    "seeAlso",
    "searchKeywords",
    "aliases",
)


def _preview_config() -> dict[str, tuple[str, ...]]:
    return load_public_preview_config(PUBLIC_PREVIEW_CONFIG)


def _english_available(kind: str, filename: str, key: str) -> bool:
    english = _document(kind, "en", filename)
    if not isinstance(english, dict):
        return False
    items = english.get(key) or []
    return bool(items)


def _manual_blocks(chapter: dict) -> list:
    chapter_sections = chapter.get("sections") or []
    main = next(
        (item for item in chapter_sections if item.get("id") == "main"),
        chapter_sections[0] if chapter_sections else {},
    )
    return list(main.get("blocks") or [])


def _preview_manual(locale: str) -> dict:
    config = _preview_config()
    unlocked_ids = set(config["manualChapterIds"])
    document = _document("manual", locale, "document.json")
    chapters = list((document or {}).get("chapters") or [])
    preview_chapters = []
    for chapter in chapters:
        chapter_id = chapter.get("contentId") or ""
        title = chapter.get("title") or ""
        if chapter_id in unlocked_ids:
            preview_chapters.append(
                {
                    "id": chapter_id,
                    "title": title,
                    "locked": False,
                    "blocks": rewrite_media_tree(copy.deepcopy(_manual_blocks(chapter))),
                }
            )
        else:
            preview_chapters.append({"id": chapter_id, "title": title, "locked": True})
    return {
        "locale": locale,
        "requestedLocale": locale,
        "available": bool(preview_chapters),
        "englishAvailable": _english_available("manual", "document.json", "chapters"),
        "documentTitle": MANUAL_TITLE,
        "lede": MANUAL_LEDE,
        "chapters": preview_chapters,
    }


def _preview_entries(
    *,
    kind: str,
    locale: str,
    filename: str,
    title: str,
    lede: str,
    unlocked_ids: set[str],
    item_title_field: str,
    locked_keys: tuple[str, ...],
) -> dict:
    document = _document(kind, locale, filename)
    entries = list((document or {}).get("entries") or [])
    preview_entries = []
    for entry in entries:
        entry_id = entry.get("id") or ""
        item_title = entry.get(item_title_field) or ""
        if entry_id in unlocked_ids:
            payload = rewrite_media_tree(copy.deepcopy(entry))
            payload["locked"] = False
            preview_entries.append(payload)
        else:
            locked = {"id": entry_id, item_title_field: item_title, "locked": True}
            for key in locked_keys:
                locked.pop(key, None)
            preview_entries.append(locked)
    return {
        "locale": locale,
        "requestedLocale": locale,
        "available": bool(preview_entries),
        "englishAvailable": _english_available(kind, filename, "entries"),
        "documentTitle": title,
        "lede": lede,
        "entries": preview_entries,
    }


def _selected_payloads_for_module(module: str) -> list[dict]:
    config = _preview_config()
    if module == "manual":
        selected = set(config["manualChapterIds"])
        snapshot_name = "document.json"
        items_key = "chapters"
        id_field = "contentId"
    elif module == "knowledge-base":
        selected = set(config["knowledgeBaseEntryIds"])
        snapshot_name = "entries.json"
        items_key = "entries"
        id_field = "id"
    else:
        selected = set(config["glossaryEntryIds"])
        snapshot_name = "entries.json"
        items_key = "entries"
        id_field = "id"

    payloads: list[dict] = []
    published = CORPUS_ROOT / "published" / module
    if not published.is_dir():
        return payloads
    for locale_dir in published.iterdir():
        if not locale_dir.is_dir() or locale_dir.name in {".", ".."}:
            continue
        snapshot = locale_dir / snapshot_name
        if not snapshot.is_file():
            continue
        document = _document(module, locale_dir.name, snapshot_name)
        for item in list((document or {}).get(items_key) or []):
            if isinstance(item, dict) and item.get(id_field) in selected:
                payloads.append(item)
    return payloads


def _allowed_preview_images(module: str) -> set[str]:
    allowed: set[str] = set()
    for payload in _selected_payloads_for_module(module):
        allowed.update(collect_image_filenames(payload).get(module, set()))
    return allowed


@router.get("/manual")
def public_preview_manual(locale: str = "en") -> dict:
    return _preview_manual(_require_locale(locale))


@router.get("/knowledge-base")
def public_preview_knowledge_base(locale: str = "en") -> dict:
    config = _preview_config()
    return _preview_entries(
        kind="knowledge-base",
        locale=_require_locale(locale),
        filename="entries.json",
        title=KB_TITLE,
        lede=KB_LEDE,
        unlocked_ids=set(config["knowledgeBaseEntryIds"]),
        item_title_field="title",
        locked_keys=_LOCKED_KB_KEYS,
    )


@router.get("/glossary")
def public_preview_glossary(locale: str = "en") -> dict:
    config = _preview_config()
    return _preview_entries(
        kind="glossary",
        locale=_require_locale(locale),
        filename="entries.json",
        title=GLOSSARY_TITLE,
        lede=GLOSSARY_LEDE,
        unlocked_ids=set(config["glossaryEntryIds"]),
        item_title_field="term",
        locked_keys=_LOCKED_GLOSSARY_KEYS,
    )


@router.get("/{module}/images/{filename}")
def public_preview_image(module: str, filename: str) -> FileResponse:
    if module not in {"manual", "knowledge-base", "glossary"}:
        raise HTTPException(status_code=404, detail="Image not found.")
    if not is_safe_image_filename(filename):
        raise HTTPException(status_code=404, detail="Image not found.")
    if filename not in _allowed_preview_images(module):
        raise HTTPException(status_code=404, detail="Image not found.")
    return _image_response(module, filename)
