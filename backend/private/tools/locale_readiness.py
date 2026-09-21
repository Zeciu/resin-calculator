"""Read-only CLI for structural locale readiness.

Presentation layer over ``private.services.locale_readiness``. Does not publish,
package, activate locales, or write content.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Sequence, TextIO

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from private.schemas.common import ADMIN_EDITORIAL_LOCALE_ORDER, ADMIN_EDITORIAL_LOCALES
from private.services.locale_readiness import (
    LayerReadiness,
    LocaleReadiness,
    LocaleReadinessError,
    LocaleReadinessRoots,
    StoreDiagnostics,
    StoreVariantDiagnostic,
    evaluate_configured_locales,
    evaluate_locale_readiness,
)

HUMAN_MISSING_LIST_LIMIT = 12

_LAYER_LABELS: tuple[tuple[str, str], ...] = (
    ("ui", "UI"),
    ("website_preview", "Website preview"),
    ("website_production", "Website production"),
    ("manual_preview", "Manual preview"),
    ("manual_production", "Manual production"),
    ("glossary_preview", "Glossary preview"),
    ("glossary_production", "Glossary production"),
    ("knowledge_base_preview", "Knowledge Base preview"),
    ("knowledge_base_production", "Knowledge Base production"),
)

_PREVIEW_LAYER_ATTRS = (
    "ui",
    "website_preview",
    "manual_preview",
    "glossary_preview",
    "knowledge_base_preview",
)
_PRODUCTION_LAYER_ATTRS = (
    "website_production",
    "manual_production",
    "glossary_production",
    "knowledge_base_production",
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Report structural locale readiness for preview and production. "
            "Read-only: does not publish, package, or activate languages."
        )
    )
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument(
        "--locale",
        metavar="LOCALE",
        help="Configured locale to evaluate (for example: de, ro, en).",
    )
    selection.add_argument(
        "--all",
        action="store_true",
        help="Evaluate every configured editorial locale.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Write machine-readable JSON instead of human-readable text.",
    )
    return parser


def format_layer_counts(layer: LayerReadiness) -> str:
    return f"{layer.status.value.upper()} {layer.present_count}/{layer.required_count}"


def format_missing_for_human(missing: tuple[str, ...]) -> str | None:
    """Return IDs/keys when the set is small; otherwise a count-only summary.

    Full missing lists always remain in JSON. Small sets such as a single
    glossary id must stay visible in human output.
    """
    if not missing:
        return None
    if len(missing) <= HUMAN_MISSING_LIST_LIMIT:
        return ", ".join(missing)
    return f"{len(missing)} items"


def _layer_human_line(layer: LayerReadiness) -> str:
    line = format_layer_counts(layer)
    missing_text = format_missing_for_human(layer.missing)
    extra_text = format_missing_for_human(layer.extra)
    if missing_text:
        line = f"{line}  missing: {missing_text}"
    if extra_text:
        line = f"{line}  extra: {extra_text}"
    return line


def _ready_label(value: bool) -> str:
    return "YES" if value else "NO"


def _blocker_lines(result: LocaleReadiness, attrs: tuple[str, ...]) -> list[str]:
    labels = dict(_LAYER_LABELS)
    lines: list[str] = []
    for attr in attrs:
        layer: LayerReadiness = getattr(result, attr)
        if layer.status.value == "complete":
            continue
        label = labels[attr]
        missing_text = format_missing_for_human(layer.missing)
        detail = format_layer_counts(layer)
        if missing_text:
            detail = f"{detail}; missing {missing_text}"
        lines.append(f"  - {label}: {detail}")
    return lines


def _store_variant_lines(name: str, diagnostic: StoreVariantDiagnostic) -> list[str]:
    lines = [
        f"{name}:",
        (
            f"  published {diagnostic.published_count} / "
            f"draft {diagnostic.draft_count} / "
            f"no variant {diagnostic.no_variant_count}"
        ),
    ]
    draft_text = format_missing_for_human(diagnostic.draft_ids)
    if draft_text:
        lines.append(f"  draft: {draft_text}")
    missing_text = format_missing_for_human(diagnostic.no_variant_ids)
    if missing_text:
        lines.append(f"  no variant: {missing_text}")
    return lines


def format_store_diagnostics(store: StoreDiagnostics) -> str:
    blocks = [
        "Store diagnostics",
        *_store_variant_lines("Manual", store.manual),
        "",
        *_store_variant_lines("Glossary", store.glossary),
        "",
        *_store_variant_lines("Knowledge Base", store.knowledge_base),
    ]
    return "\n".join(blocks)


def format_locale_human(result: LocaleReadiness) -> str:
    lines = [
        f"Locale readiness: {result.locale}",
        "",
        "UI",
        f"  {_layer_human_line(result.ui)}",
        "",
        "Website",
        f"  Preview:    {_layer_human_line(result.website_preview)}",
        f"  Production: {_layer_human_line(result.website_production)}",
        "",
        "Manual",
        f"  Preview:    {_layer_human_line(result.manual_preview)}",
        f"  Production: {_layer_human_line(result.manual_production)}",
        "",
        "Glossary",
        f"  Preview:    {_layer_human_line(result.glossary_preview)}",
        f"  Production: {_layer_human_line(result.glossary_production)}",
        "",
        "Knowledge Base",
        f"  Preview:    {_layer_human_line(result.knowledge_base_preview)}",
        f"  Production: {_layer_human_line(result.knowledge_base_production)}",
        "",
        f"Preview Ready:    {_ready_label(result.preview_ready)}",
        f"Production Ready: {_ready_label(result.production_ready)}",
    ]
    if not result.preview_ready:
        preview_blockers = _blocker_lines(result, _PREVIEW_LAYER_ATTRS)
        if preview_blockers:
            lines.extend(["", "Preview blockers:", *preview_blockers])
    if not result.production_ready:
        production_blockers = _blocker_lines(result, _PRODUCTION_LAYER_ATTRS)
        if production_blockers:
            lines.extend(["", "Production blockers:", *production_blockers])
        elif result.preview_ready is False:
            lines.extend(
                [
                    "",
                    "Production blockers:",
                    "  - Production Ready is false because Preview Ready is false.",
                ]
            )
    lines.extend(["", format_store_diagnostics(result.store)])
    return "\n".join(lines) + "\n"


def format_all_human(results: tuple[LocaleReadiness, ...]) -> str:
    lines = [
        "Configured locale readiness",
        "",
    ]
    for result in results:
        lines.append(
            "  ".join(
                [
                    f"{result.locale}",
                    f"preview={_ready_label(result.preview_ready)}",
                    f"production={_ready_label(result.production_ready)}",
                    f"UI={format_layer_counts(result.ui)}",
                    (
                        f"website={format_layer_counts(result.website_preview)}"
                        f"; {format_layer_counts(result.website_production)}"
                    ),
                    (
                        f"manual={format_layer_counts(result.manual_preview)}"
                        f"; {format_layer_counts(result.manual_production)}"
                    ),
                    (
                        f"glossary={format_layer_counts(result.glossary_preview)}"
                        f"; {format_layer_counts(result.glossary_production)}"
                    ),
                    (
                        f"kb={format_layer_counts(result.knowledge_base_preview)}"
                        f"; {format_layer_counts(result.knowledge_base_production)}"
                    ),
                ]
            )
        )
    blocked = [result for result in results if not result.production_ready]
    if blocked:
        lines.extend(["", "Blockers"])
        for result in blocked:
            lines.append(f"{result.locale}")
            if not result.preview_ready:
                preview_blockers = _blocker_lines(result, _PREVIEW_LAYER_ATTRS)
                if preview_blockers:
                    lines.append("  Preview:")
                    lines.extend(preview_blockers)
            production_blockers = _blocker_lines(result, _PRODUCTION_LAYER_ATTRS)
            if production_blockers:
                lines.append("  Production:")
                lines.extend(production_blockers)
            elif not result.preview_ready:
                lines.append("  Production:")
                lines.append("    - Production Ready is false because Preview Ready is false.")
    return "\n".join(lines) + "\n"


def layer_to_json(layer: LayerReadiness) -> dict[str, Any]:
    return {
        "status": layer.status.value,
        "required_count": layer.required_count,
        "present_count": layer.present_count,
        "missing": list(layer.missing),
        "extra": list(layer.extra),
    }


def store_variant_to_json(diagnostic: StoreVariantDiagnostic) -> dict[str, Any]:
    return {
        "canonical_count": diagnostic.canonical_count,
        "published_count": diagnostic.published_count,
        "draft_count": diagnostic.draft_count,
        "no_variant_count": diagnostic.no_variant_count,
        "published_ids": list(diagnostic.published_ids),
        "draft_ids": list(diagnostic.draft_ids),
        "no_variant_ids": list(diagnostic.no_variant_ids),
    }


def locale_to_json(result: LocaleReadiness) -> dict[str, Any]:
    preview_blockers = _blocker_payload(result, _PREVIEW_LAYER_ATTRS)
    production_blockers = _blocker_payload(result, _PRODUCTION_LAYER_ATTRS)
    return {
        "locale": result.locale,
        "ui": layer_to_json(result.ui),
        "website_preview": layer_to_json(result.website_preview),
        "website_production": layer_to_json(result.website_production),
        "manual_preview": layer_to_json(result.manual_preview),
        "manual_production": layer_to_json(result.manual_production),
        "glossary_preview": layer_to_json(result.glossary_preview),
        "glossary_production": layer_to_json(result.glossary_production),
        "knowledge_base_preview": layer_to_json(result.knowledge_base_preview),
        "knowledge_base_production": layer_to_json(result.knowledge_base_production),
        "preview_ready": result.preview_ready,
        "production_ready": result.production_ready,
        "store": {
            "manual": store_variant_to_json(result.store.manual),
            "glossary": store_variant_to_json(result.store.glossary),
            "knowledge_base": store_variant_to_json(result.store.knowledge_base),
        },
        "preview_blockers": preview_blockers,
        "production_blockers": production_blockers,
    }


def _blocker_payload(result: LocaleReadiness, attrs: tuple[str, ...]) -> list[dict[str, Any]]:
    labels = dict(_LAYER_LABELS)
    blockers: list[dict[str, Any]] = []
    for attr in attrs:
        layer: LayerReadiness = getattr(result, attr)
        if layer.status.value == "complete":
            continue
        blockers.append(
            {
                "layer": attr,
                "label": labels[attr],
                **layer_to_json(layer),
            }
        )
    return blockers


def configured_locales_to_json(results: tuple[LocaleReadiness, ...]) -> dict[str, Any]:
    return {"locales": [locale_to_json(result) for result in results]}


def main(
    argv: Sequence[str] | None = None,
    *,
    roots: LocaleReadinessRoots | None = None,
    stdout: TextIO | None = None,
    stderr: TextIO | None = None,
) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    out = stdout if stdout is not None else sys.stdout
    err = stderr if stderr is not None else sys.stderr

    try:
        if args.all:
            results = evaluate_configured_locales(roots=roots)
            if args.json:
                out.write(json.dumps(configured_locales_to_json(results), indent=2, ensure_ascii=False))
                out.write("\n")
            else:
                out.write(format_all_human(results))
            return 0

        locale = str(args.locale or "").strip().lower()
        if locale not in ADMIN_EDITORIAL_LOCALES:
            configured = ", ".join(ADMIN_EDITORIAL_LOCALE_ORDER)
            err.write(
                f"Unsupported locale: {args.locale!r}. Configured locales: {configured}.\n"
            )
            return 2

        result = evaluate_locale_readiness(locale, roots=roots)
        if args.json:
            out.write(json.dumps(locale_to_json(result), indent=2, ensure_ascii=False))
            out.write("\n")
        else:
            out.write(format_locale_human(result))
        return 0
    except LocaleReadinessError as exc:
        err.write(f"{exc}\n")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
