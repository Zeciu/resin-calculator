"""Public language activation: visibility config independent of translations/publish."""

from __future__ import annotations

from typing import Any

from private.repositories.filesystem import FilesystemContentRepository
from private.repositories.public_languages import (
    PublicLanguagesRepository,
    default_production_languages_root,
)
from private.schemas.common import (
    ADMIN_EDITORIAL_LOCALE_ORDER,
    DEFAULT_PUBLIC_LOCALE,
    PUBLIC_LANGUAGE_LABELS,
    parse_admin_locale,
    parse_public_locale,
)
from private.schemas.public_languages import (
    AdminPublicLanguagesResponse,
    PublicLanguageRow,
    PublicLanguagesConfigResponse,
)
from private.services.locale_readiness import evaluate_locale_readiness


class ProductionNotReadyError(ValueError):
    """Activation refused because Phase 1 Production Ready is NO."""

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
    records: dict[str, Any] | None = None,
) -> str:
    """Informational only: presence of any draft/variant per editorial module."""
    store = records if records is not None else repository.read_editorial_records()
    modules_present = 0
    if _module_has_any_variant(
        repository.list_manual_chapter_ids_from_store(store),
        lambda content_id, loc: repository.get_manual_variant_from_store(
            store, content_id, loc
        ),
        locale,
    ):
        modules_present += 1
    if _module_has_any_variant(
        repository.list_glossary_entry_ids_from_store(store),
        lambda content_id, loc: repository.get_glossary_variant_from_store(
            store, content_id, loc
        ),
        locale,
    ):
        modules_present += 1
    if _module_has_any_variant(
        repository.list_kb_entry_ids_from_store(store),
        lambda content_id, loc: repository.get_kb_variant_from_store(
            store, content_id, loc
        ),
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
        production_repository: PublicLanguagesRepository | None = None,
    ) -> None:
        self._editorial = languages_repository or PublicLanguagesRepository()
        # Explicit editorial-only construction (tests) must not fall through to
        # the real checkout public registry. Routers pass both repositories.
        if production_repository is not None:
            self._production = production_repository
        elif languages_repository is not None:
            self._production = languages_repository
        else:
            self._production = PublicLanguagesRepository(default_production_languages_root())
        self._content = content_repository or FilesystemContentRepository()

    def get_config(self) -> PublicLanguagesConfigResponse:
        config = self._production.read()
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
        config = self._production.read()
        default_locale = config["defaultPublicLocale"]
        active = set(config["activePublicLocales"])
        records = self._content.read_editorial_records()
        rows: list[PublicLanguageRow] = []
        for locale in ADMIN_EDITORIAL_LOCALE_ORDER:
            is_active = locale in active
            is_default = locale == default_locale
            rows.append(
                PublicLanguageRow(
                    locale=locale,
                    label=PUBLIC_LANGUAGE_LABELS.get(locale, locale),
                    translationStatus=translation_status_for_locale(
                        self._content, locale, records=records
                    ),
                    publishedContentStatus=published_content_status_for_locale(
                        self._content, locale
                    ),
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
        config = self._production.read()
        active = list(config["activePublicLocales"])
        if normalized in active:
            # Already production-active: idempotent no-op. Readiness is not
            # re-checked here so an already-active locale cannot fail Activate.
            # Inactive → active still requires Production Ready below.
            return self.get_admin_overview()

        readiness = evaluate_locale_readiness(normalized)
        if not readiness.production_ready:
            label = PUBLIC_LANGUAGE_LABELS.get(normalized, normalized)
            raise ProductionNotReadyError(
                f"{label} is not Production Ready. "
                "Activation is unavailable until production requirements are complete. "
                "See Locale Readiness, then Prepare for Production if Preview is ready."
            )

        active.append(normalized)
        self._production.write(
            {
                "defaultPublicLocale": config["defaultPublicLocale"],
                "activePublicLocales": active,
            }
        )
        self._sync_editorial_active(normalized)
        return self.get_admin_overview()

    def deactivate(self, locale: str) -> AdminPublicLanguagesResponse:
        normalized = parse_admin_locale(locale)
        config = self._production.read()
        default_locale = config["defaultPublicLocale"]
        if normalized == default_locale:
            raise ValueError(
                f"Cannot deactivate the default public language ({default_locale})."
            )
        active = [item for item in config["activePublicLocales"] if item != normalized]
        self._production.write(
            {
                "defaultPublicLocale": default_locale,
                "activePublicLocales": active,
            }
        )
        return self.get_admin_overview()

    def _sync_editorial_active(self, locale: str) -> None:
        """Add locale to the private editorial registry without removing others."""
        if self._editorial is self._production:
            return
        if self._editorial.path.resolve() == self._production.path.resolve():
            return
        editorial = self._editorial.read()
        active = list(editorial["activePublicLocales"])
        if locale in active:
            return
        active.append(locale)
        self._editorial.write(
            {
                "defaultPublicLocale": editorial["defaultPublicLocale"],
                "activePublicLocales": active,
            }
        )
