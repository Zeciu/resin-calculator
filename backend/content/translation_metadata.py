"""Editorial translation metadata helpers (revisions + generation stamps)."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from content.translation.editorial_text import EditorialModule, extract_translatable_items


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


def extract_translatable_text_sequence(
    module: EditorialModule,
    draft_body: dict[str, Any] | None,
) -> tuple[str, ...]:
    """Ordered textual values from extract_translatable_items (definition of 'text')."""
    if not isinstance(draft_body, dict):
        return ()
    return tuple(item.text for item in extract_translatable_items(module, draft_body))


def translatable_text_sequences_equal(
    module: EditorialModule,
    left_body: dict[str, Any] | None,
    right_body: dict[str, Any] | None,
) -> bool:
    return extract_translatable_text_sequence(module, left_body) == extract_translatable_text_sequence(
        module, right_body
    )


def next_source_revisions(
    existing: dict[str, Any] | None,
    new_body: dict[str, Any],
    *,
    module: EditorialModule,
) -> tuple[int, int]:
    """
    Compute (sourceRevision, sourceTextRevision) for a Romanian save.

    - Identical draftBody → both counters unchanged (legacy missing text rev initialized).
    - Body changed, extract texts unchanged → sourceRevision +1, sourceTextRevision unchanged.
    - Extract texts changed → both +1.

    Legacy RO without sourceTextRevision: treat prior text epoch as equal to sourceRevision
    for increment math; persist an explicit sourceTextRevision on this save.
    """
    if existing is None:
        return 1, 1

    previous_revision = existing.get("sourceRevision")
    if previous_revision is None:
        # First metadata write on a legacy variant.
        previous_body = existing.get("draftBody")
        if draft_bodies_equal(previous_body, new_body):
            return 1, 1
        text_changed = not translatable_text_sequences_equal(
            module, previous_body if isinstance(previous_body, dict) else None, new_body
        )
        return (2, 2 if text_changed else 1)

    prev_rev = int(previous_revision)
    raw_text = existing.get("sourceTextRevision")
    # Virtual baseline when absent: align with full revision (no historical certainty).
    prev_text = int(raw_text) if raw_text is not None else prev_rev

    previous_body = existing.get("draftBody")
    if draft_bodies_equal(previous_body, new_body):
        # Initialize missing sourceTextRevision without pretending a new edit occurred.
        return prev_rev, prev_text

    text_changed = not translatable_text_sequences_equal(
        module, previous_body if isinstance(previous_body, dict) else None, new_body
    )
    next_rev = prev_rev + 1
    next_text = prev_text + 1 if text_changed else prev_text
    return next_rev, next_text


def next_source_revision(existing: dict[str, Any] | None, new_body: dict[str, Any]) -> int:
    """
    Backward-compatible helper: full-body revision only.

    Prefer next_source_revisions(..., module=...) for Romanian saves.
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
        return {"sourceRevision": 1, "sourceTextRevision": 1}
    return {
        "generatedFromSourceRevision": None,
        "generatedFromSourceTextRevision": None,
        "translationProvider": None,
        "generatedAt": None,
    }


def apply_translation_metadata_on_save(
    *,
    locale: str,
    new_body: dict[str, Any],
    existing: dict[str, Any] | None,
    module: EditorialModule,
) -> dict[str, Any]:
    """
    Metadata merged into a variant record on save.

    Romanian: revise sourceRevision / sourceTextRevision from draftBody changes.
    Targets: preserve generation fields across manual edits.
    """
    if locale == CANONICAL_SOURCE_LOCALE:
        source_revision, source_text_revision = next_source_revisions(
            existing, new_body, module=module
        )
        return {
            "sourceRevision": source_revision,
            "sourceTextRevision": source_text_revision,
        }

    if existing is None:
        return {
            "generatedFromSourceRevision": None,
            "generatedFromSourceTextRevision": None,
            "translationProvider": None,
            "generatedAt": None,
        }

    return {
        "generatedFromSourceRevision": existing.get("generatedFromSourceRevision"),
        "generatedFromSourceTextRevision": existing.get("generatedFromSourceTextRevision"),
        "translationProvider": existing.get("translationProvider"),
        "generatedAt": existing.get("generatedAt"),
    }


def translation_metadata_on_generation(
    *,
    source_revision: int,
    source_text_revision: int,
    provider: str = "deepl",
    generated_at: datetime,
) -> dict[str, Any]:
    """Metadata stamped on a target variant after a successful full Generate run."""
    aware = generated_at if generated_at.tzinfo else generated_at.replace(tzinfo=timezone.utc)
    return {
        "generatedFromSourceRevision": int(source_revision),
        "generatedFromSourceTextRevision": int(source_text_revision),
        "translationProvider": provider,
        "generatedAt": aware.astimezone(timezone.utc).isoformat(),
    }


def translation_metadata_on_media_sync(
    *,
    source_revision: int,
    existing_target: dict[str, Any],
) -> dict[str, Any]:
    """
    Metadata after media-only sync.

    Advances generatedFromSourceRevision; preserves text generation stamp, provider, and generatedAt
    (sync is not a new AI generation).
    """
    return {
        "generatedFromSourceRevision": int(source_revision),
        "generatedFromSourceTextRevision": existing_target.get("generatedFromSourceTextRevision"),
        "translationProvider": existing_target.get("translationProvider"),
        "generatedAt": existing_target.get("generatedAt"),
    }


def read_source_revision(ro_variant: dict[str, Any] | None) -> int | None:
    if not ro_variant:
        return None
    value = ro_variant.get("sourceRevision")
    if value is None:
        return None
    return int(value)


def read_source_text_revision(ro_variant: dict[str, Any] | None) -> int | None:
    if not ro_variant:
        return None
    value = ro_variant.get("sourceTextRevision")
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


def read_generated_from_source_text_revision(target_variant: dict[str, Any] | None) -> int | None:
    if not target_variant:
        return None
    value = target_variant.get("generatedFromSourceTextRevision")
    if value is None:
        return None
    return int(value)


def effective_source_text_revision(ro_variant: dict[str, Any] | None) -> int | None:
    """
    Effective RO text revision for classification.

    Legacy RO without sourceTextRevision: unknown → None (never media-only current).
    """
    return read_source_text_revision(ro_variant)


def derive_translation_freshness(
    *,
    target_variant: dict[str, Any] | None,
    ro_source_revision: int | None,
) -> TranslationFreshness:
    """
    Coarse Missing / Current / Outdated / Manual-Untracked (Task 7.1.2 compatibility).

    Prefer TranslationUpdateService.classify for media-only vs text-outdated.
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
            "sourceTextRevision": None,
            "generatedFromSourceRevision": None,
            "generatedFromSourceTextRevision": None,
            "translationProvider": None,
            "generatedAt": None,
            "translationUpdateState": None,
            "translationUpdateAction": None,
        }
    return {
        "sourceRevision": variant.get("sourceRevision"),
        "sourceTextRevision": variant.get("sourceTextRevision"),
        "generatedFromSourceRevision": variant.get("generatedFromSourceRevision"),
        "generatedFromSourceTextRevision": variant.get("generatedFromSourceTextRevision"),
        "translationProvider": variant.get("translationProvider"),
        "generatedAt": variant.get("generatedAt"),
        "translationUpdateState": variant.get("_translationUpdateState"),
        "translationUpdateAction": variant.get("_translationUpdateAction"),
    }
