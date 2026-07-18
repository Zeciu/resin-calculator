"""Editorial translation metadata helpers (foundation only; no Generate/DeepL)."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any


# Must match content.repositories.filesystem.CANONICAL_EDITORIAL_LOCALE.
CANONICAL_SOURCE_LOCALE = "ro"


class TranslationFreshness(str, Enum):
    MISSING = "missing"
    CURRENT = "current"
    OUTDATED = "outdated"
    MANUAL_UNTRACKED = "manual_untracked"


def draft_bodies_equal(left: Any, right: Any) -> bool:
    """Structural equality for draftBody payloads (no hashing)."""
    return left == right


def next_source_revision(existing: dict[str, Any] | None, new_body: dict[str, Any]) -> int:
    """
    Compute Romanian sourceRevision for a save.

    - New variant or no prior revision → 1
    - Established revision + identical body → unchanged
    - Established revision + changed body → increment
    """
    if existing is None:
        return 1

    previous_revision = existing.get("sourceRevision")
    if previous_revision is None:
        return 1

    previous_body = existing.get("draftBody")
    if draft_bodies_equal(previous_body, new_body):
        return int(previous_revision)
    return int(previous_revision) + 1


def initial_translation_metadata_on_create(locale: str) -> dict[str, Any]:
    """Metadata written when a locale variant is first created."""
    if locale == CANONICAL_SOURCE_LOCALE:
        return {"sourceRevision": 1}
    return {
        "generatedFromSourceRevision": None,
        "translationProvider": None,
        "generatedAt": None,
    }


def apply_translation_metadata_on_save(
    *,
    locale: str,
    new_body: dict[str, Any],
    existing: dict[str, Any] | None,
) -> dict[str, Any]:
    """
    Metadata merged into a variant record on save.

    Romanian: revise sourceRevision when draftBody changes.
    Targets: preserve generation fields across manual edits.
    """
    if locale == CANONICAL_SOURCE_LOCALE:
        return {"sourceRevision": next_source_revision(existing, new_body)}

    if existing is None:
        return {
            "generatedFromSourceRevision": None,
            "translationProvider": None,
            "generatedAt": None,
        }

    return {
        "generatedFromSourceRevision": existing.get("generatedFromSourceRevision"),
        "translationProvider": existing.get("translationProvider"),
        "generatedAt": existing.get("generatedAt"),
    }


def read_source_revision(ro_variant: dict[str, Any] | None) -> int | None:
    if not ro_variant:
        return None
    value = ro_variant.get("sourceRevision")
    if value is None:
        return None
    return int(value)


def read_generated_from_source_revision(target_variant: dict[str, Any] | None) -> int | None:
    if not target_variant:
        return None
    value = target_variant.get("generatedFromSourceRevision")
    if value is None:
        return None
    return int(value)


def derive_translation_freshness(
    *,
    target_variant: dict[str, Any] | None,
    ro_source_revision: int | None,
) -> TranslationFreshness:
    """
    Derive Missing / Current / Outdated / Manual-Untracked for a non-RO target.

    Manual/Untracked: target exists but generatedFromSourceRevision is null/absent.
    """
    if target_variant is None:
        return TranslationFreshness.MISSING

    generated_from = read_generated_from_source_revision(target_variant)
    if generated_from is None:
        return TranslationFreshness.MANUAL_UNTRACKED

    if ro_source_revision is not None and generated_from == ro_source_revision:
        return TranslationFreshness.CURRENT

    if ro_source_revision is not None and generated_from < ro_source_revision:
        return TranslationFreshness.OUTDATED

    # Target claims a generation revision but RO revision is missing or lower.
    return TranslationFreshness.OUTDATED


def was_edited_after_generation(
    *,
    updated_at: datetime | None,
    generated_at: datetime | None,
) -> bool:
    """True when updatedAt is strictly after generatedAt."""
    if updated_at is None or generated_at is None:
        return False
    return updated_at > generated_at


def translation_metadata_for_api(variant: dict[str, Any] | None) -> dict[str, Any]:
    """Normalize variant metadata for Admin API responses (absent → null)."""
    if not variant:
        return {
            "sourceRevision": None,
            "generatedFromSourceRevision": None,
            "translationProvider": None,
            "generatedAt": None,
        }
    return {
        "sourceRevision": variant.get("sourceRevision"),
        "generatedFromSourceRevision": variant.get("generatedFromSourceRevision"),
        "translationProvider": variant.get("translationProvider"),
        "generatedAt": variant.get("generatedAt"),
    }
