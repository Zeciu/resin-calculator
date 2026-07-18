"""Locale registries: public delivery vs Admin editorial preparation."""

from __future__ import annotations

from enum import Enum
from typing import Literal

# Public API / published delivery — unchanged product surface.
LocaleCode = Literal["en", "ro"]
PUBLIC_LOCALES = frozenset({"en", "ro"})
VALID_LOCALES = PUBLIC_LOCALES  # alias kept for existing public call sites

# Admin may author and generate into prepared locales without public activation.
AdminLocaleCode = Literal["ro", "en", "fr", "de", "es", "pt", "pl", "cs", "it"]
ADMIN_EDITORIAL_LOCALES = frozenset(
    {"ro", "en", "fr", "de", "es", "pt", "pl", "cs", "it"}
)
ADMIN_EDITORIAL_LOCALE_ORDER: tuple[str, ...] = (
    "ro",
    "en",
    "fr",
    "de",
    "es",
    "pt",
    "pl",
    "cs",
    "it",
)


class ContentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


def parse_public_locale(locale: str) -> LocaleCode:
    normalized = locale.strip().lower()
    if normalized not in PUBLIC_LOCALES:
        raise ValueError(f"Unsupported locale: {locale}")
    return normalized  # type: ignore[return-value]


def parse_admin_locale(locale: str) -> AdminLocaleCode:
    normalized = locale.strip().lower()
    if normalized not in ADMIN_EDITORIAL_LOCALES:
        raise ValueError(f"Unsupported admin locale: {locale}")
    return normalized  # type: ignore[return-value]


# Backward-compatible name used by public services.
parse_locale = parse_public_locale
