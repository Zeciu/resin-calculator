"""Read-only locale readiness for preview and production.

This module evaluates structural completeness and lightweight Website integrity
signals. It does not activate languages, publish content, or write files.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

from private.repositories.filesystem import (
    CONTENT_TYPE_GLOSSARY_ENTRY,
    CONTENT_TYPE_KB_ENTRY,
    CONTENT_TYPE_MANUAL_CHAPTER,
    CONTENT_TYPE_WEBSITE_PAGE,
    _resolve_variant_key,
    make_glossary_meta_key,
    make_glossary_variant_key,
    make_kb_meta_key,
    make_kb_variant_key,
    make_manual_meta_key,
    make_manual_variant_key,
    make_website_meta_key,
    make_website_variant_key,
    parse_iso,
)
from private.schemas.common import ADMIN_EDITORIAL_LOCALE_ORDER, ContentStatus
from private.services.translation_update import (
    TranslationUpdateState,
    classify_translation_update,
)
from private.translation.editorial_text import extract_translatable_items
from private.translation_metadata import CANONICAL_SOURCE_LOCALE
from private.website_pages import WEBSITE_PAGE_KEYS, website_page_definition

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
class WebsiteIntegrityIssue:
    severity: str
    code: str
    page_key: str
    plane: str
    path: str
    message: str


@dataclass(frozen=True, slots=True)
class WebsiteIntegrityDiagnostics:
    issues: tuple[WebsiteIntegrityIssue, ...] = ()

    def has_errors(self, plane: str) -> bool:
        return any(
            issue.severity == "error" and issue.plane == plane
            for issue in self.issues
        )


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
    website_integrity: WebsiteIntegrityDiagnostics = field(
        default_factory=WebsiteIntegrityDiagnostics
    )


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
    website_integrity = evaluate_website_integrity(
        normalized,
        roots=resolved_roots,
        records=records,
        required_pages=resolved_catalogs.website_pages,
    )

    preview_ready = _all_complete(
        ui,
        website_preview,
        manual_preview,
        glossary_preview,
        knowledge_base_preview,
    ) and not website_integrity.has_errors("preview")
    production_ready = preview_ready and _all_complete(
        website_production,
        manual_production,
        glossary_production,
        knowledge_base_production,
    ) and not website_integrity.has_errors("production")

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
        website_integrity=website_integrity,
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


def evaluate_website_integrity(
    locale: str,
    *,
    roots: LocaleReadinessRoots,
    records: dict[str, Any],
    required_pages: tuple[str, ...],
) -> WebsiteIntegrityDiagnostics:
    """Inspect published Website snapshots without treating pending drafts as published."""
    normalized = _normalize_locale(locale)
    issues: list[WebsiteIntegrityIssue] = []
    snapshots: dict[str, dict[str, Any] | None] = {
        "preview": _read_json_object(
            _website_snapshot_path(roots.private_content_root, normalized)
        ),
        "production": _read_json_object(
            _website_snapshot_path(roots.public_content_root, normalized)
        ),
    }

    for plane, snapshot in snapshots.items():
        pages = snapshot.get("pages") if isinstance(snapshot, dict) else None
        if not isinstance(pages, dict):
            continue
        canonical_snapshot = _read_json_object(
            _website_snapshot_path(
                roots.private_content_root
                if plane == "preview"
                else roots.public_content_root,
                CANONICAL_SOURCE_LOCALE,
            )
        )
        canonical_pages = (
            canonical_snapshot.get("pages")
            if isinstance(canonical_snapshot, dict)
            else None
        )
        for page_key in required_pages:
            page = pages.get(page_key)
            if not isinstance(page, dict):
                continue
            body = page.get("body")
            structural_errors = _website_structure_errors(page_key, page, body)
            for path, message in structural_errors:
                issues.append(
                    WebsiteIntegrityIssue(
                        severity="error",
                        code="invalid_snapshot_structure",
                        page_key=page_key,
                        plane=plane,
                        path=path,
                        message=message,
                    )
                )

            if (
                normalized != CANONICAL_SOURCE_LOCALE
                and isinstance(canonical_pages, dict)
                and isinstance(canonical_pages.get(page_key), dict)
                and isinstance(body, dict)
            ):
                canonical_body = canonical_pages[page_key].get("body")
                if isinstance(canonical_body, dict):
                    target_signature = _website_structure_signature(body)
                    canonical_signature = _website_structure_signature(canonical_body)
                    if (
                        target_signature is not None
                        and canonical_signature is not None
                        and target_signature != canonical_signature
                    ):
                        issues.append(
                            WebsiteIntegrityIssue(
                                severity="error",
                                code="canonical_structure_mismatch",
                                page_key=page_key,
                                plane=plane,
                                path="body",
                                message=(
                                    "Published structure differs from the canonical "
                                    "published page structure."
                                ),
                            )
                        )

            _, variant = _resolve_variant_key(
                records,
                page_key,
                normalized,
                CONTENT_TYPE_WEBSITE_PAGE,
                make_website_variant_key,
                make_website_meta_key,
            )
            if variant is None:
                continue
            if variant.get("status") != ContentStatus.PUBLISHED.value:
                issues.append(
                    WebsiteIntegrityIssue(
                        severity="error",
                        code="snapshot_contains_unpublished_page",
                        page_key=page_key,
                        plane=plane,
                        path="body",
                        message="Snapshot contains a page that is not published in Content Store.",
                    )
                )
                continue
            if _has_unpublished_changes(variant):
                issues.append(
                    WebsiteIntegrityIssue(
                        severity="info",
                        code="unpublished_draft",
                        page_key=page_key,
                        plane=plane,
                        path="body",
                        message=(
                            "A newer draft exists; snapshot parity is intentionally not "
                            "required until the draft is published."
                        ),
                    )
                )
            elif isinstance(body, dict) and body != variant.get("draftBody"):
                issues.append(
                    WebsiteIntegrityIssue(
                        severity="error",
                        code="snapshot_editorial_mismatch",
                        page_key=page_key,
                        plane=plane,
                        path="body",
                        message=(
                            "Published snapshot differs from the current published "
                            "editorial content."
                        ),
                    )
                )

    issues.extend(
        _website_translation_metadata_issues(
            normalized, records=records, required_pages=required_pages
        )
    )
    issues.extend(
        _website_content_warning_issues(
            normalized,
            snapshots=snapshots,
            roots=roots,
            required_pages=required_pages,
        )
    )
    return WebsiteIntegrityDiagnostics(issues=tuple(issues))


def _website_translation_metadata_issues(
    locale: str,
    *,
    records: dict[str, Any],
    required_pages: tuple[str, ...],
) -> list[WebsiteIntegrityIssue]:
    if locale == CANONICAL_SOURCE_LOCALE:
        return []
    issues: list[WebsiteIntegrityIssue] = []
    for page_key in required_pages:
        _, source = _resolve_variant_key(
            records,
            page_key,
            CANONICAL_SOURCE_LOCALE,
            CONTENT_TYPE_WEBSITE_PAGE,
            make_website_variant_key,
            make_website_meta_key,
        )
        _, target = _resolve_variant_key(
            records,
            page_key,
            locale,
            CONTENT_TYPE_WEBSITE_PAGE,
            make_website_variant_key,
            make_website_meta_key,
        )
        if (
            source is None
            or target is None
            or source.get("status") != ContentStatus.PUBLISHED.value
            or target.get("status") != ContentStatus.PUBLISHED.value
            or _has_unpublished_changes(source)
            or _has_unpublished_changes(target)
        ):
            continue
        classification = classify_translation_update(
            ro_variant=source, target_variant=target
        )
        if classification.state is TranslationUpdateState.TEXT_OUTDATED:
            issues.append(
                WebsiteIntegrityIssue(
                    severity="warning",
                    code="text_outdated",
                    page_key=page_key,
                    plane="editorial",
                    path="",
                    message=(
                        "Published translation was generated from an older canonical "
                        "text revision."
                    ),
                )
            )
        elif classification.state is TranslationUpdateState.MEDIA_ONLY_OUTDATED:
            issues.append(
                WebsiteIntegrityIssue(
                    severity="info",
                    code="media_only_outdated",
                    page_key=page_key,
                    plane="editorial",
                    path="",
                    message=(
                        "Text revision is current; only non-text source structure or "
                        "media metadata is newer."
                    ),
                )
            )
        if target.get("manuallyEditedAt"):
            issues.append(
                WebsiteIntegrityIssue(
                    severity="info",
                    code="manually_edited",
                    page_key=page_key,
                    plane="editorial",
                    path="",
                    message=(
                        "Translation was manually edited after machine generation; "
                        "generation metadata does not imply revalidation."
                    ),
                )
            )
    return issues


def _website_content_warning_issues(
    locale: str,
    *,
    snapshots: dict[str, dict[str, Any] | None],
    roots: LocaleReadinessRoots,
    required_pages: tuple[str, ...],
) -> list[WebsiteIntegrityIssue]:
    selected_plane = "production"
    selected = snapshots.get(selected_plane)
    if not isinstance(selected, dict):
        selected_plane = "preview"
        selected = snapshots.get(selected_plane)
    pages = selected.get("pages") if isinstance(selected, dict) else None
    if not isinstance(pages, dict):
        return []

    english_pages: dict[str, Any] = {}
    if locale != "en":
        english_snapshot = _read_json_object(
            _website_snapshot_path(
                roots.public_content_root
                if selected_plane == "production"
                else roots.private_content_root,
                "en",
            )
        )
        raw_english_pages = (
            english_snapshot.get("pages")
            if isinstance(english_snapshot, dict)
            else None
        )
        if isinstance(raw_english_pages, dict):
            english_pages = raw_english_pages

    issues: list[WebsiteIntegrityIssue] = []
    entity_pattern = re.compile(r"&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]+);", re.I)
    for page_key in required_pages:
        page = pages.get(page_key)
        body = page.get("body") if isinstance(page, dict) else None
        if not isinstance(body, dict):
            continue
        try:
            target_items = extract_translatable_items("website", body)
        except ValueError:
            continue
        for item in target_items:
            path = "/".join(str(part) for part in item.path)
            if item.content_format == "plain" and entity_pattern.search(item.text):
                issues.append(
                    WebsiteIntegrityIssue(
                        severity="warning",
                        code="plain_text_html_entity",
                        page_key=page_key,
                        plane=selected_plane,
                        path=path,
                        message="Plain-text field contains a visible HTML entity.",
                    )
                )

        english_page = english_pages.get(page_key)
        english_body = (
            english_page.get("body") if isinstance(english_page, dict) else None
        )
        if not isinstance(english_body, dict):
            continue
        try:
            english_by_path = {
                tuple(item.path): item.text
                for item in extract_translatable_items("website", english_body)
            }
        except ValueError:
            continue
        for item in target_items:
            if _is_substantial_shared_english(
                item.text, english_by_path.get(tuple(item.path))
            ):
                issues.append(
                    WebsiteIntegrityIssue(
                        severity="warning",
                        code="suspicious_english_text",
                        page_key=page_key,
                        plane=selected_plane,
                        path="/".join(str(part) for part in item.path),
                        message=(
                            "Substantial editorial text is identical to the English "
                            "published value."
                        ),
                    )
                )
    return issues


def _is_substantial_shared_english(value: str, english_value: str | None) -> bool:
    if not isinstance(english_value, str) or value.strip() != english_value.strip():
        return False
    normalized = value.strip()
    if len(normalized) < 28:
        return False
    if normalized.lower() in {"hfzwood", "knowledge base"}:
        return False
    if normalized.startswith(("http://", "https://", "/")):
        return False
    return len(re.findall(r"[A-Za-z]{2,}", normalized)) >= 4


def _has_unpublished_changes(variant: dict[str, Any]) -> bool:
    updated_at = parse_iso(variant.get("updatedAt"))
    published_at = parse_iso(variant.get("publishedAt"))
    return bool(updated_at and published_at and updated_at > published_at)


def _website_structure_errors(
    page_key: str, page: dict[str, Any], body: Any
) -> list[tuple[str, str]]:
    errors: list[tuple[str, str]] = []
    expected_kind = website_page_definition(page_key)["pageKind"]
    if page.get("pageKey") != page_key:
        errors.append(("pageKey", "Snapshot pageKey does not match its catalog key."))
    if page.get("pageKind") != expected_kind:
        errors.append(("pageKind", "Snapshot pageKind does not match page metadata."))
    if not isinstance(body, dict):
        errors.append(("body", "Snapshot page body is missing or invalid."))
        return errors
    if body.get("pageKind") != expected_kind:
        errors.append(("body/pageKind", "Body pageKind does not match page metadata."))
    if not isinstance(body.get("publicTitle"), str) or not body["publicTitle"].strip():
        errors.append(("body/publicTitle", "Published page title is empty."))
    if _website_structure_signature(body) is None:
        errors.append(("body", "Published page has an invalid structural shape."))
    return errors


def _website_structure_signature(body: dict[str, Any]) -> tuple[Any, ...] | None:
    kind = body.get("pageKind")
    if kind == "pricing":
        offers = body.get("offers")
        if not isinstance(offers, list) or any(
            not isinstance(offer, dict)
            or not isinstance(offer.get("id"), str)
            or not offer["id"].strip()
            for offer in offers
        ):
            return None
        return (kind, tuple(offer["id"] for offer in offers))
    if kind in {"about", "privacy", "terms"}:
        sections = body.get("sections")
        if not isinstance(sections, list):
            return None
        signature: list[tuple[str, tuple[str, ...]]] = []
        for section in sections:
            if (
                not isinstance(section, dict)
                or not isinstance(section.get("id"), str)
                or not section["id"].strip()
                or not isinstance(section.get("blocks"), list)
            ):
                return None
            block_types: list[str] = []
            for block in section["blocks"]:
                if (
                    not isinstance(block, dict)
                    or block.get("type") not in {"heading", "paragraph"}
                ):
                    return None
                block_types.append(block["type"])
            signature.append((section["id"], tuple(block_types)))
        return (kind, tuple(signature))
    if kind in {"home", "contact"}:
        return (kind,)
    return None


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
