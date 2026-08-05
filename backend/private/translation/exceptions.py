"""Provider-neutral translation exceptions."""

from __future__ import annotations


class TranslationError(Exception):
    """Base class for translation provider failures."""


class TranslationConfigurationError(TranslationError):
    """Translation provider is missing, disabled, or misconfigured."""


class TranslationUnsupportedLocaleError(TranslationError):
    """Source or target application locale is not supported."""


class TranslationInvalidRequestError(TranslationError):
    """Caller input or provider-rejected request is invalid."""


class TranslationAuthError(TranslationError):
    """Provider authentication or authorization failed."""


class TranslationQuotaExceededError(TranslationError):
    """Provider character quota or plan limit exceeded."""

    def __init__(
        self,
        message: str = "DeepL quota exceeded.",
        *,
        http_status: int | None = 456,
    ) -> None:
        super().__init__(message)
        self.http_status = http_status


class TranslationRateLimitedError(TranslationError):
    """Provider rate limit or capacity throttle."""

    def __init__(
        self,
        message: str = "DeepL rate limit exceeded.",
        *,
        http_status: int | None = None,
    ) -> None:
        super().__init__(message)
        self.http_status = http_status


class TranslationTimeoutError(TranslationError):
    """
    Request timed out without a confirmed response.

    The adapter cannot determine whether an ambiguously timed-out request was
    processed or billed by DeepL. Such requests are not automatically retried.
    """


class TranslationTemporaryProviderError(TranslationError):
    """Transient provider or network failure."""


class TranslationMalformedResponseError(TranslationError):
    """Provider returned an HTTP 200 body that cannot be interpreted safely."""


class TranslationRequestTooLargeError(TranslationError):
    """Serialized translate request exceeds the supported size limit."""
