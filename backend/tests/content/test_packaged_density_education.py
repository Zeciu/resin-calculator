"""Accepted volume/mass educational content is packaged and not auto-unlocked."""

from __future__ import annotations

import json
from pathlib import Path

from public.product.capabilities.free_preview import load_free_preview_config
from public.product.capabilities.public_preview import load_public_preview_config

BACKEND_ROOT = Path(__file__).resolve().parents[2]
PUBLIC_CORPUS = BACKEND_ROOT / "public" / "content"
MANUAL_RO = PUBLIC_CORPUS / "published" / "manual" / "ro" / "document.json"
KB_RO = PUBLIC_CORPUS / "published" / "knowledge-base" / "ro" / "entries.json"
PUBLIC_PREVIEW_CONFIG = PUBLIC_CORPUS / "config" / "public-preview.json"
FREE_PREVIEW_CONFIG = PUBLIC_CORPUS / "config" / "free-preview.json"

NEW_KB_ID = "de-ce-cantitatea-de-r-in-n-litri-nu-este-egal-cu-greutatea-n-kilograme"
MIX_RATIO_KB_ID = "de-ce-este-important-s-respect-raportul-de-amestec-al-r-inii"
VOLUME_MASS_CHAPTER_ID = "calculul-necesarului-de-r-in"
VOLUME_MASS_MARKER = "Conversia volumului în masă"


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def test_packaged_romanian_manual_includes_volume_to_mass_explanation() -> None:
    document = _load_json(MANUAL_RO)
    chapter = next(
        item for item in document["chapters"] if item["contentId"] == VOLUME_MASS_CHAPTER_ID
    )
    texts = [
        str(block.get("text") or "")
        for section in chapter.get("sections") or []
        for block in section.get("blocks") or []
    ]
    assert any(VOLUME_MASS_MARKER in text for text in texts)


def test_packaged_romanian_kb_includes_accepted_density_articles() -> None:
    entries = {entry["id"]: entry for entry in _load_json(KB_RO)["entries"]}
    new_article = entries[NEW_KB_ID]
    mix_article = entries[MIX_RATIO_KB_ID]
    assert new_article["title"] == (
        "De ce cantitatea de rășină în litri nu este egală cu greutatea în kilograme?"
    )
    assert mix_article["title"] == "De ce este important să respect raportul de amestec al rășinii?"
    assert "solution" in new_article
    assert "solution" in mix_article


def test_new_density_article_is_not_in_anonymous_or_free_preview() -> None:
    public_preview = load_public_preview_config(PUBLIC_PREVIEW_CONFIG)
    free_preview = load_free_preview_config(FREE_PREVIEW_CONFIG)
    assert NEW_KB_ID not in public_preview["knowledgeBaseEntryIds"]
    assert NEW_KB_ID not in free_preview["knowledgeBaseEntryIds"]
    assert len(public_preview["manualChapterIds"]) == 1
    assert len(public_preview["knowledgeBaseEntryIds"]) == 3
    assert len(public_preview["glossaryEntryIds"]) == 3
    assert len(free_preview["knowledgeBaseEntryIds"]) == 5
    assert len(free_preview["glossaryEntryIds"]) == 5
