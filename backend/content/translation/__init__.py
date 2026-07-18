"""Editorial translation provider boundary (DeepL adapter; no Generate orchestration)."""

from content.translation.config import DeepLConfig, load_deepl_config
from content.translation.deepl import DeepLTranslationProvider
from content.translation.exceptions import (
    TranslationAuthError,
    TranslationConfigurationError,
    TranslationError,
    TranslationInvalidRequestError,
    TranslationMalformedResponseError,
    TranslationQuotaExceededError,
    TranslationRateLimitedError,
    TranslationRequestTooLargeError,
    TranslationTemporaryProviderError,
    TranslationTimeoutError,
    TranslationUnsupportedLocaleError,
)
from content.translation.provider import TranslationProvider
from content.translation.types import TranslationResult

__all__ = [
    "DeepLConfig",
    "DeepLTranslationProvider",
    "TranslationAuthError",
    "TranslationConfigurationError",
    "TranslationError",
    "TranslationInvalidRequestError",
    "TranslationMalformedResponseError",
    "TranslationProvider",
    "TranslationQuotaExceededError",
    "TranslationRateLimitedError",
    "TranslationRequestTooLargeError",
    "TranslationResult",
    "TranslationTemporaryProviderError",
    "TranslationTimeoutError",
    "TranslationUnsupportedLocaleError",
    "load_deepl_config",
]
