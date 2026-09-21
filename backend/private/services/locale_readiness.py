"""Read-only structural locale readiness for preview and production.

This module evaluates whether a configured locale is structurally complete
enough to serve. It does not judge translation quality, activate languages,
publish content, or write files.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any

from private.repositories.filesystem import (
    CONTENT_TYPE_GLOSSARY_ENTRY,
    CONTENT_TYPE_KB_ENTRY,
    CONTENT_TYPE_MANUAL_CHAPTER,
    _resolve_variant_key,
    make_glossary_meta_key,
    make_glossary_variant_key,
    make_kb_meta_key,
    make_kb_variant_key,
    make_manual_meta_key,
    make_manual_variant_key,
)
from private.schemas.common import ADMIN_EDITORIAL_LOCALE_ORDER, ContentStatus
from private.website_pages import WEBSITE_PAGE_KEYS

_SERVICE_FILE = Path(__file__).resolve()
_PRIVATE_PACKAGE_ROOT = _SERVICE_FILE.parents[1]
_BACKEND_ROOT = _SERVICE_FILE.parents[2]
_REPO_ROOT = _SERVICE_FILE.parents[3]

_UI_CANONICAL_LOCALE = "en"
_MANUAL_SNAPSHOT_RELATIVE = ("published", "manual")
_GLOSSARY_SNAPSHOT_RELATIVE = ("published", "glossary")
_KB_SNAPSHOT_RELATIVE = ("published", "knowledge-base")
_WEBSITE_SNAPSHOT_RELATIVE = ("published", "website")


class LayerStatus(str, Enum):
    COMPLETE = "complete"
    INCOMPLETE = "incomplete"
    MISSING = "missing"


class LocaleReadinessError(ValueError):
    """Raised when a required canonical catalog cannot be loaded."""


@dataclass(frozen=True, slots=True)
class LocaleReadinessRoots:
    """Filesystem roots the validator reads. Never written by this module."""

    i18n_dir: Path
    private_content_root: Path
    public_content_root: Path


@dataclass(frozen=True, slots=True)
class CanonicalCatalogs:
    ui_keys: tuple[str, ...]
    website_pages: tuple[str, ...]
    manual_ids: tuple[str, ...]
    glossary_ids: tuple[str, ...]
    knowledge_base_ids: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class LayerReadiness:
    status: LayerStatus
    required_count: int
    present_count: int
    missing: tuple[str, ...]
    extra: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class StoreVariantDiagnostic:
    canonical_count: int
    published_count: int
    draft_count: int
    no_variant_count: int
    published_ids: tuple[str, ...]
    draft_ids: tuple[str, ...]
    no_variant_ids: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class StoreDiagnostics:
    manual: StoreVariantDiagnostic
    glossary: StoreVariantDiagnostic
    knowledge_base: StoreVariantDiagnostic


@dataclass(frozen=True, slots=True)
class LocaleReadiness:
    locale: str
    ui: LayerReadiness
    website_preview: LayerReadiness
    website_production: LayerReadiness
    manual_preview: LayerReadiness
    manual_production: LayerReadiness
    glossary_preview: LayerReadiness
    glossary_production: LayerReadiness
    knowledge_base_preview: LayerReadiness
    knowledge_base_production: LayerReadiness
    preview_ready: bool
    production_ready: bool
    store: StoreDiagnostics


def default_locale_readiness_roots() -> LocaleReadinessRoots:
    """Checkout defaults: private editorial corpus, public package, frontend i18n."""
    return LocaleReadinessRoots(
        i18n_dir=_REPO_ROOT / "frontend" / "public" / "src" / "i18n",
        private_content_root=_PRIVATE_PACKAGE_ROOT / "content",
        public_content_root=_BACKEND_ROOT / "public" / "content",
    )


def load_canonical_catalogs(roots: LocaleReadinessRoots | None = None) -> CanonicalCatalogs:
    resolved = roots or default_locale_readiness_roots()
    ui_keys = _load_ui_catalog_keys(resolved.i18n_dir)
    records = _load_editorial_records(resolved.private_content_root)
    return CanonicalCatalogs(
        ui_keys=ui_keys,
        website_pages=tuple(sorted(WEBSITE_PAGE_KEYS)),
        manual_ids=_meta_content_ids(records, CONTENT_TYPE_MANUAL_CHAPTER),
        glossary_ids=_meta_content_ids(records, CONTENT_TYPE_GLOSSARY_ENTRY),
        knowledge_base_ids=_meta_content_ids(records, CONTENT_TYPE_KB_ENTRY),
    )


def evaluate_locale_readiness(
    locale: str,
    *,
    roots: LocaleReadinessRoots | None = None,
    catalogs: CanonicalCatalogs | None = None,
) -> LocaleReadiness:
    """Evaluate one locale against the structural catalogs. Read-only."""
    resolved_roots = roots or default_locale_readiness_roots()
    resolved_catalogs = catalogs or load_canonical_catalogs(resolved_roots)
    normalized = _normalize_locale(locale)
    records = _load_editorial_records(resolved_roots.private_content_root)

    ui = evaluate_ui_layer(normalized, resolved_roots.i18n_dir, resolved_catalogs.ui_keys)
    website_preview = evaluate_website_snapshot_layer(
        _website_snapshot_path(resolved_roots.private_content_root, normalized),
        resolved_catalogs.website_pages,
    )
    website_production = evaluate_website_snapshot_layer(
        _website_snapshot_path(resolved_roots.public_content_root, normalized),
        resolved_catalogs.website_pages,
    )
    manual_preview = evaluate_id_snapshot_layer(
        _manual_snapshot_path(resolved_roots.private_content_root, normalized),
        resolved_catalogs.manual_ids,
        items_key="chapters",
        id_field="contentId",
    )
    manual_production = evaluate_id_snapshot_layer(
        _manual_snapshot_path(resolved_roots.public_content_root, normalized),
        resolved_catalogs.manual_ids,
        items_key="chapters",
        id_field="contentId",
    )
    glossary_preview = evaluate_id_snapshot_layer(
        _glossary_snapshot_path(resolved_roots.private_content_root, normalized),
        resolved_catalogs.glossary_ids,
        items_key="entries",
        id_field="id",
    )
    glossary_production = evaluate_id_snapshot_layer(
        _glossary_snapshot_path(resolved_roots.public_content_root, normalized),
        resolved_catalogs.glossary_ids,
        items_key="entries",
        id_field="id",
    )
    knowledge_base_preview = evaluate_id_snapshot_layer(
        _kb_snapshot_path(resolved_roots.private_content_root, normalized),
        resolved_catalogs.knowledge_base_ids,
        items_key="entries",
        id_field="id",
    )
    knowledge_base_production = evaluate_id_snapshot_layer(
        _kb_snapshot_path(resolved_roots.public_content_root, normalized),
        resolved_catalogs.knowledge_base_ids,
        items_key="entries",
        id_field="id",
    )

    preview_ready = _all_complete(
        ui,
        website_preview,
        manual_preview,
        glossary_preview,
        knowledge_base_preview,
    )
    production_ready = preview_ready and _all_complete(
        website_production,
        manual_production,
        glossary_production,
        knowledge_base_production,
    )

    return LocaleReadiness(
        locale=normalized,
        ui=ui,
        website_preview=website_preview,
        website_production=website_production,
        manual_preview=manual_preview,
        manual_production=manual_production,
        glossary_preview=glossary_preview,
        glossary_production=glossary_production,
        knowledge_base_preview=knowledge_base_preview,
        knowledge_base_production=knowledge_base_production,
        preview_ready=preview_ready,
        production_ready=production_ready,
        store=StoreDiagnostics(
            manual=_store_variant_diagnostic(
                records,
                resolved_catalogs.manual_ids,
                CONTENT_TYPE_MANUAL_CHAPTER,
                make_manual_meta_key,
                make_manual_variant_key,
                normalized,
            ),
            glossary=_store_variant_diagnostic(
                records,
                resolved_catalogs.glossary_ids,
                CONTENT_TYPE_GLOSSARY_ENTRY,
                make_glossary_meta_key,
                make_glossary_variant_key,
                normalized,
            ),
            knowledge_base=_store_variant_diagnostic(
                records,
                resolved_catalogs.knowledge_base_ids,
                CONTENT_TYPE_KB_ENTRY,
                make_kb_meta_key,
                make_kb_variant_key,
                normalized,
            ),
        ),
    )


def evaluate_configured_locales(
    *,
    roots: LocaleReadinessRoots | None = None,
    catalogs: CanonicalCatalogs | None = None,
) -> tuple[LocaleReadiness, ...]:
    """Evaluate every Admin-configured editorial locale. Read-only."""
    resolved_roots = roots or default_locale_readiness_roots()
    resolved_catalogs = catalogs or load_canonical_catalogs(resolved_roots)
    return tuple(
        evaluate_locale_readiness(locale, roots=resolved_roots, catalogs=resolved_catalogs)
        for locale in ADMIN_EDITORIAL_LOCALE_ORDER
    )


def evaluate_ui_layer(locale: str, i18n_dir: Path, required_keys: tuple[str, ...]) -> LayerReadiness:
    path = i18n_dir / f"{_normalize_locale(locale)}.json"
    if not path.is_file():
        return _missing_layer(required_keys)
    payload = _read_json_object(path)
    if payload is None:
        return _incomplete_from_present(required_keys, present=(), extra=())
    present: list[str] = []
    extra: list[str] = []
    required = set(required_keys)
    for key, value in payload.items():
        if not isinstance(key, str):
            continue
        if key not in required:
            extra.append(key)
            continue
        if _ui_value_is_present(value):
            present.append(key)
    return _layer_from_sets(required_keys, present=present, extra=extra)


def evaluate_website_snapshot_layer(path: Path, required_pages: tuple[str, ...]) -> LayerReadiness:
    if not path.is_file():
        return _missing_layer(required_pages)
    payload = _read_json_object(path)
    pages = payload.get("pages") if isinstance(payload, dict) else None
    if not isinstance(pages, dict):
        return _incomplete_from_present(required_pages, present=(), extra=())
    present = [key for key in pages if isinstance(key, str)]
    return _layer_from_sets(required_pages, present=present, extra=_extras(required_pages, present))


def evaluate_id_snapshot_layer(
    path: Path,
    required_ids: tuple[str, ...],
    *,
    items_key: str,
    id_field: str,
) -> LayerReadiness:
    if not path.is_file():
        return _missing_layer(required_ids)
    payload = _read_json_object(path)
    items = payload.get(items_key) if isinstance(payload, dict) else None
    if not isinstance(items, list):
        return _incomplete_from_present(required_ids, present=(), extra=())
    present: list[str] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        value = item.get(id_field)
        if isinstance(value, str) and value.strip():
            present.append(value)
    return _layer_from_sets(required_ids, present=present, extra=_extras(required_ids, present))


def _normalize_locale(locale: str) -> str:
    return locale.strip().lower()


def _all_complete(*layers: LayerReadiness) -> bool:
    return all(layer.status is LayerStatus.COMPLETE for layer in layers)


def _ui_value_is_present(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _sorted_unique(values: list[str] | tuple[str, ...] | set[str]) -> tuple[str, ...]:
    return tuple(sorted(set(values)))


def _extras(required: tuple[str, ...], present: list[str]) -> list[str]:
    required_set = set(required)
    return [item for item in present if item not in required_set]


def _layer_from_sets(
    required: tuple[str, ...],
    *,
    present: list[str],
    extra: list[str],
) -> LayerReadiness:
    required_set = set(required)
    present_required = _sorted_unique([item for item in present if item in required_set])
    missing = _sorted_unique([item for item in required if item not in set(present_required)])
    extra_ids = _sorted_unique(extra)
    if missing:
        status = LayerStatus.INCOMPLETE
    else:
        status = LayerStatus.COMPLETE
    return LayerReadiness(
        status=status,
        required_count=len(required_set),
        present_count=len(present_required),
        missing=missing,
        extra=extra_ids,
    )


def _missing_layer(required: tuple[str, ...]) -> LayerReadiness:
    required_ids = _sorted_unique(required)
    return LayerReadiness(
        status=LayerStatus.MISSING,
        required_count=len(required_ids),
        present_count=0,
        missing=required_ids,
        extra=(),
    )


def _incomplete_from_present(
    required: tuple[str, ...],
    *,
    present: tuple[str, ...],
    extra: tuple[str, ...],
) -> LayerReadiness:
    return _layer_from_sets(required, present=list(present), extra=list(extra))


def _load_ui_catalog_keys(i18n_dir: Path) -> tuple[str, ...]:
    path = i18n_dir / f"{_UI_CANONICAL_LOCALE}.json"
    if not path.is_file():
        raise LocaleReadinessError(f"Canonical UI catalog is missing: {path}")
    payload = _read_json_object(path)
    if payload is None:
        raise LocaleReadinessError(f"Canonical UI catalog is not a JSON object: {path}")
    keys = [key for key in payload if isinstance(key, str)]
    return tuple(keys)


def _load_editorial_records(private_content_root: Path) -> dict[str, Any]:
    store_path = private_content_root / "editorial" / "content-store.json"
    if not store_path.is_file():
        return {}
    payload = _read_json_object(store_path)
    if payload is None:
        return {}
    records = payload.get("records")
    return records if isinstance(records, dict) else {}


def _meta_content_ids(records: dict[str, Any], content_type: str) -> tuple[str, ...]:
    ids: list[str] = []
    for record in records.values():
        if not isinstance(record, dict):
            continue
        if record.get("sk") != "META":
            continue
        if record.get("contentType") != content_type:
            continue
        content_id = record.get("contentId")
        if isinstance(content_id, str) and content_id.strip():
            ids.append(content_id)
    return _sorted_unique(ids)


def _store_variant_diagnostic(
    records: dict[str, Any],
    canonical_ids: tuple[str, ...],
    content_type: str,
    make_typed_meta_key,
    make_typed_variant_key,
    locale: str,
) -> StoreVariantDiagnostic:
    published: list[str] = []
    draft: list[str] = []
    missing: list[str] = []
    for content_id in canonical_ids:
        _, variant = _resolve_variant_key(
            records,
            content_id,
            locale,
            content_type,
            make_typed_variant_key,
            make_typed_meta_key,
        )
        if variant is None:
            missing.append(content_id)
            continue
        status = str(variant.get("status") or "").strip().lower()
        if status == ContentStatus.PUBLISHED.value:
            published.append(content_id)
        else:
            draft.append(content_id)
    return StoreVariantDiagnostic(
        canonical_count=len(canonical_ids),
        published_count=len(published),
        draft_count=len(draft),
        no_variant_count=len(missing),
        published_ids=_sorted_unique(published),
        draft_ids=_sorted_unique(draft),
        no_variant_ids=_sorted_unique(missing),
    )


def _read_json_object(path: Path) -> dict[str, Any] | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _manual_snapshot_path(content_root: Path, locale: str) -> Path:
    return content_root.joinpath(*_MANUAL_SNAPSHOT_RELATIVE, locale, "document.json")


def _glossary_snapshot_path(content_root: Path, locale: str) -> Path:
    return content_root.joinpath(*_GLOSSARY_SNAPSHOT_RELATIVE, locale, "entries.json")


def _kb_snapshot_path(content_root: Path, locale: str) -> Path:
    return content_root.joinpath(*_KB_SNAPSHOT_RELATIVE, locale, "entries.json")


def _website_snapshot_path(content_root: Path, locale: str) -> Path:
    return content_root.joinpath(*_WEBSITE_SNAPSHOT_RELATIVE, locale, "pages.json")
