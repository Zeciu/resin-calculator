"""Admin locale production preparation: Preview-gated adapter over the packager."""

from __future__ import annotations

from pathlib import Path

from private.schemas.common import PUBLIC_LANGUAGE_LABELS, parse_admin_locale
from private.schemas.locale_readiness import (
    PrepareProductionResponse,
    locale_readiness_to_row,
)
from private.services.locale_readiness import (
    LocaleReadinessRoots,
    default_locale_readiness_roots,
    evaluate_locale_readiness,
)
from private.tools.package_published_content import (
    PRODUCTION_PREPARE_MODULES,
    default_private_content_root,
    default_public_content_root,
    run_packaging,
)


class PreviewNotReadyError(ValueError):
    """Locale is not structurally complete enough to prepare production."""


class ProductionPrepareError(ValueError):
    """Packaging refused or failed. Destinations must remain unchanged."""


def _without_roots(message: str, *roots: Path) -> str:
    cleaned = message
    for root in roots:
        if not root:
            continue
        resolved = str(root.resolve())
        cleaned = cleaned.replace(resolved, "")
        cleaned = cleaned.replace(str(root), "")
    return " ".join(cleaned.split())


def prepare_locale_production(
    locale: str,
    *,
    roots: LocaleReadinessRoots | None = None,
    private_root: Path | None = None,
    public_root: Path | None = None,
) -> PrepareProductionResponse:
    """Copy Manual/Glossary/KB private snapshots into public for one locale.

    Does not translate, publish drafts, package Website, or activate the locale.
    ID removal is refused. Writes use the packager's all-or-nothing apply.
    """
    parsed = parse_admin_locale(locale)
    resolved_roots = roots or default_locale_readiness_roots()
    private = Path(private_root) if private_root is not None else default_private_content_root()
    public = Path(public_root) if public_root is not None else default_public_content_root()

    before = evaluate_locale_readiness(parsed, roots=resolved_roots)
    if not before.preview_ready:
        raise PreviewNotReadyError(
            f"{PUBLIC_LANGUAGE_LABELS.get(parsed, parsed)} is not Preview Ready. "
            "Production preparation is unavailable until Preview requirements are complete."
        )

    report = run_packaging(
        modules=PRODUCTION_PREPARE_MODULES,
        locale=parsed,
        apply=True,
        allow_id_removal=False,
        private_root=private,
        public_root=public,
    )
    if not report.ok or not report.applied:
        detail = _without_roots("; ".join(report.errors) or "Production preparation failed.", private, public)
        raise ProductionPrepareError(detail)

    after = evaluate_locale_readiness(parsed, roots=resolved_roots)
    warning = None
    if not after.production_ready:
        warning = (
            "Published Manual, Glossary, and Knowledge Base artifacts were prepared, "
            "but Production Ready is still NO. Remaining blockers are listed in Locale Readiness."
        )
    return PrepareProductionResponse(
        locale=parsed,
        label=PUBLIC_LANGUAGE_LABELS.get(parsed, parsed),
        prepared=True,
        modules=list(PRODUCTION_PREPARE_MODULES),
        preview_ready=after.preview_ready,
        production_ready=after.production_ready,
        warning=warning,
        readiness=locale_readiness_to_row(after),
    )
