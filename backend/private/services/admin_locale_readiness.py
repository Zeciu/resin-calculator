"""Admin locale readiness overview: read-only adapter over Phase 1."""

from __future__ import annotations

from private.schemas.locale_readiness import (
    AdminLocaleReadinessResponse,
    readiness_results_to_response,
)
from private.services.locale_readiness import evaluate_configured_locales


def get_admin_locale_readiness() -> AdminLocaleReadinessResponse:
    """Return Phase 1 readiness for every configured locale. Does not write."""
    return readiness_results_to_response(evaluate_configured_locales())
