"""Provider-neutral translation Protocol."""

from __future__ import annotations

from typing import Literal, Protocol

from content.translation.types import TranslationResult


class TranslationProvider(Protocol):
    def translate(
        self,
        text: str,
        *,
        source_locale: str,
        target_locale: str,
        context: str | None = None,
        content_format: Literal["plain", "html"] = "html",
        # Reserved for future DeepL glossary integration. Task 7.1.3 does not
        # configure, create, validate, synchronize, or manage glossaries.
        glossary_id: str | None = None,
    ) -> TranslationResult:
        ...
