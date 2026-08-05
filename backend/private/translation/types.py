"""Immutable provider-neutral translation result."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TranslationResult:
    text: str
    provider: str
    source_locale: str
    target_locale: str
    detected_source_language: str | None = None
    billed_characters: int | None = None
