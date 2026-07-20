"""Editorial translation generation — thin adapter over TranslationUpdateService."""

from __future__ import annotations

from typing import Any, Literal

from content.services.translation_update import (
    MissingRomanianSourceError,
    NothingToTranslateError,
    OverwriteConfirmationRequired,
    TranslationClassification,
    TranslationUpdateAction,
    TranslationUpdateError,
    TranslationUpdateService,
    TranslationUpdateState,
)
from content.translation.exceptions import TranslationError
from content.translation.provider import TranslationProvider

GenerateModule = Literal["manual", "glossary", "knowledge_base"]

# Backward-compatible alias used by routers and older imports.
TranslationGenerationError = TranslationUpdateError


class TranslationGenerationService:
    """
    Admin Generate Translation entry point.

    Delegates to TranslationUpdateService so single-item generate performs
    skip / media-sync / full generate according to dual revision classification.
    """

    def __init__(
        self,
        repository,
        *,
        provider: TranslationProvider | None = None,
    ) -> None:
        self._update = TranslationUpdateService(repository, provider=provider)

    def generate(
        self,
        *,
        module: GenerateModule,
        content_id: str,
        target_locale: str,
        confirm_overwrite: bool = False,
    ) -> dict[str, Any]:
        saved, classification = self._update.update(
            module=module,
            content_id=content_id,
            target_locale=target_locale,
            confirm_overwrite=confirm_overwrite,
        )
        # Attach ephemeral classification for response builders (not persisted).
        saved = dict(saved)
        saved["_translationUpdateState"] = classification.state.value
        saved["_translationUpdateAction"] = classification.action.value
        return saved


def map_provider_error_to_http(exc: TranslationError) -> tuple[int, str]:
    """Map provider-neutral errors to (status_code, safe_detail)."""
    from content.translation.exceptions import (
        TranslationAuthError,
        TranslationConfigurationError,
        TranslationInvalidRequestError,
        TranslationMalformedResponseError,
        TranslationQuotaExceededError,
        TranslationRateLimitedError,
        TranslationRequestTooLargeError,
        TranslationTemporaryProviderError,
        TranslationTimeoutError,
        TranslationUnsupportedLocaleError,
    )

    if isinstance(exc, TranslationConfigurationError):
        return 503, "Translation provider is not configured."
    if isinstance(
        exc,
        (
            TranslationTemporaryProviderError,
            TranslationTimeoutError,
            TranslationRateLimitedError,
            TranslationAuthError,
            TranslationQuotaExceededError,
            TranslationMalformedResponseError,
        ),
    ):
        return 502, "Translation provider failed. Try again later."
    if isinstance(
        exc,
        (
            TranslationUnsupportedLocaleError,
            TranslationInvalidRequestError,
            TranslationRequestTooLargeError,
        ),
    ):
        return 400, str(exc) if str(exc) else "Invalid translation request."
    return 502, "Translation provider failed. Try again later."


__all__ = [
    "GenerateModule",
    "MissingRomanianSourceError",
    "NothingToTranslateError",
    "OverwriteConfirmationRequired",
    "TranslationClassification",
    "TranslationGenerationError",
    "TranslationGenerationService",
    "TranslationUpdateAction",
    "TranslationUpdateState",
    "map_provider_error_to_http",
]
