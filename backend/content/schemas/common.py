"""Locale registries: public delivery vs Admin editorial preparation."""

from __future__ import annotations

from enum import Enum
from typing import Literal

# Configured application languages (editorial + public activation candidates).
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

# Public delivery: any configured locale may be requested; activation is separate.
LocaleCode = AdminLocaleCode
CONFIGURED_PUBLIC_LOCALES = ADMIN_EDITORIAL_LOCALES
DEFAULT_PUBLIC_LOCALE = "en"
PUBLIC_LOCALES = CONFIGURED_PUBLIC_LOCALES  # configured set; activation gates delivery
VALID_LOCALES = PUBLIC_LOCALES

PUBLIC_LANGUAGE_LABELS: dict[str, str] = {
    "ro": "Romanian",
    "en": "English",
    "fr": "French",
    "de": "German",
    "es": "Spanish",
    "pt": "Portuguese",
    "pl": "Polish",
    "cs": "Czech",
    "it": "Italian",
}


class ContentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


def parse_public_locale(locale: str) -> LocaleCode:
    normalized = locale.strip().lower()
    if normalized not in CONFIGURED_PUBLIC_LOCALES:
        raise ValueError(f"Unsupported locale: {locale}")
    return normalized  # type: ignore[return-value]


def parse_admin_locale(locale: str) -> AdminLocaleCode:
    normalized = locale.strip().lower()
    if normalized not in ADMIN_EDITORIAL_LOCALES:
        raise ValueError(f"Unsupported admin locale: {locale}")
    return normalized  # type: ignore[return-value]


# Backward-compatible name used by public services.
parse_locale = parse_public_locale
