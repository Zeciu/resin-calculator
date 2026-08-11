"""Entitlement-aware reader for the immutable public release corpus."""

from __future__ import annotations

import json
import mimetypes
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from public.auth.dependencies import get_current_user
from public.product.capabilities.knowledge_base import limit_knowledge_base_entries
from public.product.capabilities.resolver import CapabilityResolver
from public.content_routers import get_capability_resolver

router = APIRouter(prefix="/content", tags=["public-content"])

CORPUS_ROOT = Path(__file__).resolve().parent / "content"
MANUAL_TITLE = "Manual & Tutorials"
MANUAL_LEDE = "A continuous guide to the HFZWood resin estimation workflow, with embedded demonstrations where visual explanation helps."
GLOSSARY_TITLE = "Glossary"
GLOSSARY_LEDE = "A technical dictionary of woodworking, epoxy resin, and HFZWood terminology for quick reference while you work."
KB_TITLE = "Knowledge Base"
KB_LEDE = "Practical troubleshooting for woodworking, epoxy resin, and HFZWood workflow problems."


def _read_json(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=500, detail="Published content is unavailable.") from exc
    if not isinstance(value, dict):
        raise HTTPException(status_code=500, detail="Published content is invalid.")
    return value


def _languages() -> dict:
    return _read_json(CORPUS_ROOT / "config" / "public-languages.json")


def _require_locale(locale: str) -> str:
    config = _languages()
    active = config.get("activePublicLocales") or []
    if not isinstance(locale, str) or locale not in active:
        raise HTTPException(status_code=400, detail="Public language is not active.")
    return locale


def _document(kind: str, locale: str, filename: str) -> dict | None:
    path = CORPUS_ROOT / "published" / kind / locale / filename
    return _read_json(path) if path.is_file() else None


def _manual_response(locale: str) -> dict:
    document = _document("manual", locale, "document.json")
    english = _document("manual", "en", "document.json")
    chapters = (document or {}).get("chapters") or []
    sections = []
    for chapter in chapters:
        chapter_sections = chapter.get("sections") or []
        main = next((item for item in chapter_sections if item.get("id") == "main"), chapter_sections[0] if chapter_sections else {})
        sections.append({"id": chapter.get("contentId", ""), "title": chapter.get("title", ""), "blocks": main.get("blocks", [])})
    return {"locale": locale, "requestedLocale": locale, "available": bool(sections), "englishAvailable": bool((english or {}).get("chapters")), "documentTitle": MANUAL_TITLE, "lede": MANUAL_LEDE, "sections": sections}


def _list_response(kind: str, locale: str, filename: str, title: str, lede: str, key: str) -> dict:
    document = _document(kind, locale, filename)
    english = _document(kind, "en", filename)
    entries = list((document or {}).get(key) or [])
    return {"locale": locale, "requestedLocale": locale, "available": bool(entries), "englishAvailable": bool((english or {}).get(key)), "documentTitle": title, "lede": lede, "entries": entries}


def _require_user_capabilities(user: dict, resolver: CapabilityResolver):
    return resolver.resolve(user["id"])


@router.get("/public-languages")
def public_languages() -> dict:
    return _languages()


@router.get("/manual")
def manual(locale: str = "en", user: dict = Depends(get_current_user), resolver: CapabilityResolver = Depends(get_capability_resolver)) -> dict:
    _require_user_capabilities(user, resolver)
    return _manual_response(_require_locale(locale))


@router.get("/glossary")
def glossary(locale: str = "en", user: dict = Depends(get_current_user), resolver: CapabilityResolver = Depends(get_capability_resolver)) -> dict:
    _require_user_capabilities(user, resolver)
    return _list_response("glossary", _require_locale(locale), "entries.json", GLOSSARY_TITLE, GLOSSARY_LEDE, "entries")


@router.get("/knowledge-base")
def knowledge_base(locale: str = "en", user: dict = Depends(get_current_user), resolver: CapabilityResolver = Depends(get_capability_resolver)) -> dict:
    capabilities = _require_user_capabilities(user, resolver)
    response = _list_response("knowledge-base", _require_locale(locale), "entries.json", KB_TITLE, KB_LEDE, "entries")
    response["entries"] = limit_knowledge_base_entries(
        response["entries"], capabilities.capabilities["knowledgeBase.maxArticles"]
    )
    return response


@router.get("/website/{page_key}")
def website(page_key: str, locale: str = "en") -> dict:
    document = _document("website", _require_locale(locale), "pages.json")
    english = _document("website", "en", "pages.json")
    page = ((document or {}).get("pages") or {}).get(page_key)
    if page is None and page_key not in {"about", "contact", "pricing", "privacy", "terms", "home"}:
        raise HTTPException(status_code=404, detail="Website page not found.")
    return {"locale": locale, "requestedLocale": locale, "available": page is not None, "englishAvailable": page_key in ((english or {}).get("pages") or {}), "page": page}


def _image_response(module: str, filename: str) -> FileResponse:
    if Path(filename).name != filename:
        raise HTTPException(status_code=404, detail="Image not found.")
    path = CORPUS_ROOT / module / "images" / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(path, media_type=mimetypes.guess_type(path.name)[0])


@router.get("/website/images/{filename}")
def website_image(filename: str) -> FileResponse:
    return _image_response("website", filename)


@router.get("/{module}/images/{filename}")
def image(module: str, filename: str, user: dict = Depends(get_current_user), resolver: CapabilityResolver = Depends(get_capability_resolver)) -> FileResponse:
    _require_user_capabilities(user, resolver)
    if module not in {"manual", "glossary", "knowledge-base"}:
        raise HTTPException(status_code=404, detail="Image not found.")
    return _image_response(module, filename)
