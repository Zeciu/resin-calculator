"""Curated, locale-independent content selection for free accounts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


PREVIEW_COUNT = 5


def load_free_preview_config(path: Path) -> dict[str, tuple[str, ...]]:
    """Load the release-owned canonical IDs that define the free preview."""
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Invalid free preview configuration: {path}") from exc

    if not isinstance(payload, dict):
        raise RuntimeError("Free preview configuration must be an object.")

    return {
        "knowledgeBaseEntryIds": _entry_ids(payload, "knowledgeBaseEntryIds"),
        "glossaryEntryIds": _entry_ids(payload, "glossaryEntryIds"),
    }


def filter_free_preview_entries(
    entries: list[Any], allowed_ids: tuple[str, ...], access_tier: str
) -> list[Any]:
    """Return the configured ordered subset for free, or all entries otherwise."""
    if access_tier != "free":
        return entries

    entries_by_id = {entry_id: entry for entry in entries if (entry_id := _entry_id(entry))}
    return [entries_by_id[entry_id] for entry_id in allowed_ids if entry_id in entries_by_id]


def _entry_ids(payload: dict[str, Any], key: str) -> tuple[str, ...]:
    value = payload.get(key)
    if (
        not isinstance(value, list)
        or len(value) != PREVIEW_COUNT
        or any(not isinstance(entry_id, str) or not entry_id.strip() for entry_id in value)
        or len(set(value)) != PREVIEW_COUNT
    ):
        raise RuntimeError(
            f"Free preview configuration '{key}' must contain {PREVIEW_COUNT} unique IDs."
        )
    return tuple(value)


def _entry_id(entry: Any) -> str | None:
    value = entry.get("id") if isinstance(entry, dict) else getattr(entry, "id", None)
    return value if isinstance(value, str) else None
