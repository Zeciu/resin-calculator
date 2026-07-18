"""Application locale ↔ DeepL language code mapping (provider-internal)."""

from __future__ import annotations

from content.translation.exceptions import TranslationUnsupportedLocaleError

CANONICAL_SOURCE_LOCALE = "ro"
DEEPL_SOURCE_LANG = "RO"

# Application locale → DeepL target_lang. Do not expand the app language registry here.
TARGET_LOCALE_TO_DEEPL: dict[str, str] = {
    "en": "EN-US",
    "fr": "FR",
    "de": "DE",
    "es": "ES",
    "pt": "PT-BR",
    "pl": "PL",
    "cs": "CS",
    "it": "IT",
}

APPROVED_TARGET_LOCALES = frozenset(TARGET_LOCALE_TO_DEEPL)


def normalize_app_locale(locale: str) -> str:
    return locale.strip().lower()


def map_source_locale(source_locale: str) -> str:
    normalized = normalize_app_locale(source_locale)
    if normalized != CANONICAL_SOURCE_LOCALE:
        raise TranslationUnsupportedLocaleError(
            f"Unsupported source locale '{normalized}'. Only 'ro' is allowed."
        )
    return DEEPL_SOURCE_LANG


def map_target_locale(target_locale: str) -> str:
    normalized = normalize_app_locale(target_locale)
    mapped = TARGET_LOCALE_TO_DEEPL.get(normalized)
    if mapped is None:
        raise TranslationUnsupportedLocaleError(f"Unsupported target locale '{normalized}'.")
    return mapped
