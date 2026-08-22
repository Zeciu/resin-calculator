"""Curated, locale-independent content selection for anonymous Public Knowledge Preview.

This is distinct from free-preview.json, which gates authenticated Free accounts.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


MANUAL_PREVIEW_COUNT = 1
KNOWLEDGE_BASE_PREVIEW_COUNT = 3
GLOSSARY_PREVIEW_COUNT = 3

_IMAGE_SRC_RE = re.compile(
    r"^/api/content/(manual|knowledge-base|glossary)/images/"
    r"([a-f0-9-]{36}\.(?:jpg|png|gif|webp))$"
)
_IMAGE_FILENAME_RE = re.compile(r"^[a-f0-9-]{36}\.(jpg|png|gif|webp)$")


def load_public_preview_config(path: Path) -> dict[str, tuple[str, ...]]:
    """Load the release-owned IDs that define anonymous Public Knowledge Preview."""
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Invalid public preview configuration: {path}") from exc

    if not isinstance(payload, dict):
        raise RuntimeError("Public preview configuration must be an object.")

    return {
        "manualChapterIds": _entry_ids(payload, "manualChapterIds", MANUAL_PREVIEW_COUNT),
        "knowledgeBaseEntryIds": _entry_ids(
            payload, "knowledgeBaseEntryIds", KNOWLEDGE_BASE_PREVIEW_COUNT
        ),
        "glossaryEntryIds": _entry_ids(payload, "glossaryEntryIds", GLOSSARY_PREVIEW_COUNT),
    }


def rewrite_preview_image_src(src: str) -> str:
    match = _IMAGE_SRC_RE.fullmatch(src.strip())
    if match is None:
        return src
    module, filename = match.group(1), match.group(2)
    return f"/api/public-preview/{module}/images/{filename}"


def collect_image_filenames(value: Any) -> dict[str, set[str]]:
    found: dict[str, set[str]] = {
        "manual": set(),
        "knowledge-base": set(),
        "glossary": set(),
    }
    _collect_image_filenames(value, found)
    return found


def is_safe_image_filename(filename: str) -> bool:
    return filename == Path(filename).name and bool(_IMAGE_FILENAME_RE.fullmatch(filename))


def rewrite_media_tree(value: Any) -> Any:
    if isinstance(value, dict):
        rewritten = {key: rewrite_media_tree(nested) for key, nested in value.items()}
        src = rewritten.get("src")
        if rewritten.get("type") == "image" and isinstance(src, str):
            rewritten["src"] = rewrite_preview_image_src(src)
        return rewritten
    if isinstance(value, list):
        return [rewrite_media_tree(item) for item in value]
    return value


def _collect_image_filenames(value: Any, found: dict[str, set[str]]) -> None:
    if isinstance(value, dict):
        src = value.get("src")
        if value.get("type") == "image" and isinstance(src, str):
            match = _IMAGE_SRC_RE.fullmatch(src.strip())
            if match is not None:
                found[match.group(1)].add(match.group(2))
        for nested in value.values():
            _collect_image_filenames(nested, found)
    elif isinstance(value, list):
        for nested in value:
            _collect_image_filenames(nested, found)


def _entry_ids(payload: dict[str, Any], key: str, expected: int) -> tuple[str, ...]:
    value = payload.get(key)
    if (
        not isinstance(value, list)
        or len(value) != expected
        or any(not isinstance(entry_id, str) or not entry_id.strip() for entry_id in value)
        or len(set(value)) != expected
    ):
        raise RuntimeError(
            f"Public preview configuration '{key}' must contain {expected} unique IDs."
        )
    return tuple(value)
