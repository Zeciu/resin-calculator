"""Public language activation: visibility config independent of translations/publish."""

from __future__ import annotations

from typing import Any

from content.repositories.filesystem import FilesystemContentRepository
from content.repositories.public_languages import PublicLanguagesRepository
from content.schemas.common import (
    ADMIN_EDITORIAL_LOCALE_ORDER,
    DEFAULT_PUBLIC_LOCALE,
    PUBLIC_LANGUAGE_LABELS,
    parse_admin_locale,
    parse_public_locale,
)
from content.schemas.public_languages import (
    AdminPublicLanguagesResponse,
    PublicLanguageRow,
    PublicLanguagesConfigResponse,
)

STATUS_NOT_GENERATED = "Not generated"
STATUS_PARTIAL = "Partial"
STATUS_AVAILABLE = "Available"
PUBLISHED_NOT = "Not published"
PUBLISHED_PARTIAL = "Partial"
PUBLISHED_AVAILABLE = "Available"


def _module_has_any_variant(
    content_ids: list[str],
    get_variant,
    locale: str,
) -> bool:
    for content_id in content_ids:
        if get_variant(content_id, locale) is not None:
            return True
    return False


def translation_status_for_locale(
    repository: FilesystemContentRepository,
    locale: str,
) -> str:
    """Informational only: presence of any draft/variant per editorial module."""
    modules_present = 0
    if _module_has_any_variant(
        repository.list_manual_chapter_ids(),
        repository.get_manual_variant,
        locale,
    ):
        modules_present += 1
    if _module_has_any_variant(
        repository.list_glossary_entry_ids(),
        repository.get_glossary_variant,
        locale,
    ):
        modules_present += 1
    if _module_has_any_variant(
        repository.list_kb_entry_ids(),
        repository.get_kb_variant,
        locale,
    ):
        modules_present += 1

    if modules_present == 0:
        return STATUS_NOT_GENERATED
    if modules_present < 3:
        return STATUS_PARTIAL
    return STATUS_AVAILABLE


def published_content_status_for_locale(
    repository: FilesystemContentRepository,
    locale: str,
) -> str:
    """Informational only: published snapshot file existence per module (3 modules)."""
    published_count = sum(
        [
            repository.read_manual_snapshot(locale) is not None,
            repository.read_glossary_snapshot(locale) is not None,
            repository.read_kb_snapshot(locale) is not None,
        ]
    )
    if published_count == 0:
        return PUBLISHED_NOT
    if published_count < 3:
        return PUBLISHED_PARTIAL
    return PUBLISHED_AVAILABLE


class PublicLanguagesService:
    def __init__(
        self,
        languages_repository: PublicLanguagesRepository | None = None,
        content_repository: FilesystemContentRepository | None = None,
    ) -> None:
        self._languages = languages_repository or PublicLanguagesRepository()
        self._content = content_repository or FilesystemContentRepository()

    def get_config(self) -> PublicLanguagesConfigResponse:
        config = self._languages.read()
        return PublicLanguagesConfigResponse(
            defaultPublicLocale=config["defaultPublicLocale"],
            activePublicLocales=list(config["activePublicLocales"]),
        )

    def active_public_locales(self) -> set[str]:
        return set(self.get_config().activePublicLocales)

    def require_active_public_locale(self, locale: str) -> str:
        """Parse configured locale and require it to be publicly active."""
        normalized = parse_public_locale(locale)
        if normalized not in self.active_public_locales():
            raise ValueError(f"Public language is not active: {locale}")
        return normalized

    def get_admin_overview(self) -> AdminPublicLanguagesResponse:
        config = self._languages.read()
        default_locale = config["defaultPublicLocale"]
        active = set(config["activePublicLocales"])
        rows: list[PublicLanguageRow] = []
        for locale in ADMIN_EDITORIAL_LOCALE_ORDER:
            is_active = locale in active
            is_default = locale == default_locale
            rows.append(
                PublicLanguageRow(
                    locale=locale,
                    label=PUBLIC_LANGUAGE_LABELS.get(locale, locale),
                    translationStatus=translation_status_for_locale(self._content, locale),  # type: ignore[arg-type]
                    publishedContentStatus=published_content_status_for_locale(
                        self._content, locale
                    ),  # type: ignore[arg-type]
                    publicVisibility="Active" if is_active else "Inactive",
                    isDefault=is_default,
                    canDeactivate=is_active and not is_default,
                )
            )
        return AdminPublicLanguagesResponse(
            defaultPublicLocale=default_locale,
            activePublicLocales=list(config["activePublicLocales"]),
            languages=rows,
        )

    def activate(self, locale: str) -> AdminPublicLanguagesResponse:
        normalized = parse_admin_locale(locale)
        config = self._languages.read()
        active = list(config["activePublicLocales"])
        if normalized not in active:
            active.append(normalized)
            self._languages.write(
                {
                    "defaultPublicLocale": config["defaultPublicLocale"],
                    "activePublicLocales": active,
                }
            )
        return self.get_admin_overview()

    def deactivate(self, locale: str) -> AdminPublicLanguagesResponse:
        normalized = parse_admin_locale(locale)
        config = self._languages.read()
        default_locale = config["defaultPublicLocale"]
        if normalized == default_locale:
            raise ValueError(
                f"Cannot deactivate the default public language ({default_locale})."
            )
        active = [item for item in config["activePublicLocales"] if item != normalized]
        self._languages.write(
            {
                "defaultPublicLocale": default_locale,
                "activePublicLocales": active,
            }
        )
        return self.get_admin_overview()
