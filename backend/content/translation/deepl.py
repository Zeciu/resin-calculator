"""DeepL HTTP translation adapter (httpx; no official SDK)."""

from __future__ import annotations

import json
import logging
import time
from collections.abc import Callable
from typing import Any, Literal

import httpx

from content.translation.config import DeepLConfig, load_deepl_config
from content.translation.exceptions import (
    TranslationAuthError,
    TranslationInvalidRequestError,
    TranslationMalformedResponseError,
    TranslationQuotaExceededError,
    TranslationRateLimitedError,
    TranslationRequestTooLargeError,
    TranslationTemporaryProviderError,
    TranslationTimeoutError,
    TranslationUnsupportedLocaleError,
)
from content.translation.locales import map_source_locale, map_target_locale, normalize_app_locale
from content.translation.types import TranslationResult

logger = logging.getLogger(__name__)

PROVIDER_NAME = "deepl"
MAX_REQUEST_BODY_BYTES = 128 * 1024
MAX_ATTEMPTS = 2
MAX_RETRY_AFTER_SECONDS = 5.0
DEFAULT_RETRY_DELAY_SECONDS = 0.5
SUPPORTED_CONTENT_FORMATS = frozenset({"plain", "html"})

# The adapter cannot determine whether an ambiguously timed-out request was
# processed or billed by DeepL. Such requests are not automatically retried.


class DeepLTranslationProvider:
    """Synchronous DeepL /v2/translate adapter implementing TranslationProvider."""

    def __init__(
        self,
        config: DeepLConfig | None = None,
        *,
        client: httpx.Client | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self._config = config if config is not None else load_deepl_config()
        self._client = client
        self._owns_client = client is None
        self._sleep = sleep

    def close(self) -> None:
        if self._owns_client and self._client is not None:
            self._client.close()
            self._client = None

    def __enter__(self) -> DeepLTranslationProvider:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def translate(
        self,
        text: str,
        *,
        source_locale: str,
        target_locale: str,
        context: str | None = None,
        content_format: Literal["plain", "html"] = "html",
        # Reserved for future DeepL glossary integration. Task 7.1.3 does not
        # configure, create, validate, synchronize, or manage glossaries.
        glossary_id: str | None = None,
    ) -> TranslationResult:
        self._config.require_available()
        self._validate_inputs(
            text,
            source_locale=source_locale,
            target_locale=target_locale,
            content_format=content_format,
        )

        app_source = normalize_app_locale(source_locale)
        app_target = normalize_app_locale(target_locale)
        deepl_source = map_source_locale(app_source)
        deepl_target = map_target_locale(app_target)

        effective_context = context.strip() if isinstance(context, str) and context.strip() else None
        effective_glossary = (
            glossary_id.strip() if isinstance(glossary_id, str) and glossary_id.strip() else None
        )

        payload: dict[str, Any] = {
            "text": [text],
            "source_lang": deepl_source,
            "target_lang": deepl_target,
            "show_billed_characters": True,
        }
        if effective_context is not None:
            payload["context"] = effective_context
        if content_format == "html":
            payload["tag_handling"] = "html"
        if effective_glossary is not None:
            payload["glossary_id"] = effective_glossary

        body_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        if len(body_bytes) > MAX_REQUEST_BODY_BYTES:
            raise TranslationRequestTooLargeError(
                "Translation request exceeds the 128 KiB DeepL request-size limit."
            )

        url = f"{self._config.normalized_base_url()}/v2/translate"
        headers = {
            "Authorization": f"DeepL-Auth-Key {self._config.auth_key}",
            "Content-Type": "application/json",
        }

        response = self._request_with_retries(
            url=url,
            headers=headers,
            body_bytes=body_bytes,
            source_locale=app_source,
            target_locale=app_target,
        )
        return self._parse_success_response(
            response,
            source_locale=app_source,
            target_locale=app_target,
        )

    def _validate_inputs(
        self,
        text: str,
        *,
        source_locale: str,
        target_locale: str,
        content_format: str,
    ) -> None:
        if not isinstance(text, str) or not text.strip():
            raise TranslationInvalidRequestError("Translation text must be a non-empty string.")
        if content_format not in SUPPORTED_CONTENT_FORMATS:
            raise TranslationInvalidRequestError("Unsupported content_format.")

        app_source = normalize_app_locale(source_locale)
        app_target = normalize_app_locale(target_locale)
        if app_source == app_target:
            raise TranslationInvalidRequestError("source_locale and target_locale must differ.")

        # Fail closed via locale mappers (also rejects cz, en-us, pt-br, etc.).
        map_source_locale(app_source)
        map_target_locale(app_target)

    def _get_client(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(
                timeout=httpx.Timeout(self._config.timeout_seconds),
            )
        return self._client

    def _request_with_retries(
        self,
        *,
        url: str,
        headers: dict[str, str],
        body_bytes: bytes,
        source_locale: str,
        target_locale: str,
    ) -> httpx.Response:
        last_error: Exception | None = None
        for attempt in range(1, MAX_ATTEMPTS + 1):
            started = time.perf_counter()
            try:
                response = self._get_client().post(url, headers=headers, content=body_bytes)
            except httpx.ConnectTimeout as exc:
                latency_ms = (time.perf_counter() - started) * 1000
                self._log_attempt(
                    attempt=attempt,
                    source_locale=source_locale,
                    target_locale=target_locale,
                    status=None,
                    result_category="connect_timeout",
                    latency_ms=latency_ms,
                    billed_characters=None,
                )
                last_error = TranslationTimeoutError("DeepL connect timeout.")
                if attempt < MAX_ATTEMPTS:
                    self._sleep(DEFAULT_RETRY_DELAY_SECONDS)
                    continue
                raise last_error from exc
            except httpx.ConnectError as exc:
                latency_ms = (time.perf_counter() - started) * 1000
                self._log_attempt(
                    attempt=attempt,
                    source_locale=source_locale,
                    target_locale=target_locale,
                    status=None,
                    result_category="connection_failure",
                    latency_ms=latency_ms,
                    billed_characters=None,
                )
                last_error = TranslationTemporaryProviderError("DeepL connection failure.")
                if attempt < MAX_ATTEMPTS:
                    self._sleep(DEFAULT_RETRY_DELAY_SECONDS)
                    continue
                raise last_error from exc
            except httpx.ReadTimeout as exc:
                latency_ms = (time.perf_counter() - started) * 1000
                self._log_attempt(
                    attempt=attempt,
                    source_locale=source_locale,
                    target_locale=target_locale,
                    status=None,
                    result_category="read_timeout",
                    latency_ms=latency_ms,
                    billed_characters=None,
                )
                # Ambiguous: request may already have reached DeepL and been billed.
                raise TranslationTimeoutError("DeepL read timeout.") from exc
            except httpx.WriteTimeout as exc:
                latency_ms = (time.perf_counter() - started) * 1000
                self._log_attempt(
                    attempt=attempt,
                    source_locale=source_locale,
                    target_locale=target_locale,
                    status=None,
                    result_category="write_timeout",
                    latency_ms=latency_ms,
                    billed_characters=None,
                )
                raise TranslationTimeoutError("DeepL write timeout.") from exc
            except httpx.PoolTimeout as exc:
                latency_ms = (time.perf_counter() - started) * 1000
                self._log_attempt(
                    attempt=attempt,
                    source_locale=source_locale,
                    target_locale=target_locale,
                    status=None,
                    result_category="pool_timeout",
                    latency_ms=latency_ms,
                    billed_characters=None,
                )
                raise TranslationTimeoutError("DeepL pool timeout.") from exc
            except httpx.TimeoutException as exc:
                latency_ms = (time.perf_counter() - started) * 1000
                self._log_attempt(
                    attempt=attempt,
                    source_locale=source_locale,
                    target_locale=target_locale,
                    status=None,
                    result_category="timeout",
                    latency_ms=latency_ms,
                    billed_characters=None,
                )
                raise TranslationTimeoutError("DeepL request timeout.") from exc

            latency_ms = (time.perf_counter() - started) * 1000
            status = response.status_code
            if status == 200:
                self._log_attempt(
                    attempt=attempt,
                    source_locale=source_locale,
                    target_locale=target_locale,
                    status=status,
                    result_category="http_ok",
                    latency_ms=latency_ms,
                    billed_characters=None,
                    request_id=response.headers.get("x-request-id")
                    or response.headers.get("X-Request-Id"),
                )
                return response

            category = self._status_category(status)
            self._log_attempt(
                attempt=attempt,
                source_locale=source_locale,
                target_locale=target_locale,
                status=status,
                result_category=category,
                latency_ms=latency_ms,
                billed_characters=None,
                request_id=response.headers.get("x-request-id")
                or response.headers.get("X-Request-Id"),
            )

            if self._is_retryable_status(status) and attempt < MAX_ATTEMPTS:
                self._sleep(self._retry_delay(response))
                continue

            raise self._map_http_error(status) from None

        # Unreachable: loop always returns or raises.
        raise TranslationTemporaryProviderError("DeepL request failed.") from last_error

    def _retry_delay(self, response: httpx.Response) -> float:
        retry_after = response.headers.get("Retry-After")
        if retry_after is not None and retry_after.strip():
            try:
                seconds = float(retry_after.strip())
                if seconds < 0:
                    return DEFAULT_RETRY_DELAY_SECONDS
                return min(seconds, MAX_RETRY_AFTER_SECONDS)
            except ValueError:
                return DEFAULT_RETRY_DELAY_SECONDS
        return DEFAULT_RETRY_DELAY_SECONDS

    @staticmethod
    def _is_retryable_status(status: int) -> bool:
        return status in {429, 500, 502, 503, 504, 529}

    @staticmethod
    def _status_category(status: int) -> str:
        return f"http_{status}"

    @staticmethod
    def _map_http_error(status: int) -> Exception:
        if status == 400:
            return TranslationInvalidRequestError("DeepL rejected the translation request.")
        if status == 403:
            return TranslationAuthError("DeepL authentication failed.")
        if status == 413:
            return TranslationRequestTooLargeError("DeepL rejected the request as too large.")
        if status in {429, 529}:
            return TranslationRateLimitedError("DeepL rate limit exceeded.")
        if status == 456:
            return TranslationQuotaExceededError("DeepL quota exceeded.")
        if status in {500, 502, 503, 504}:
            return TranslationTemporaryProviderError("DeepL temporary provider failure.")
        return TranslationTemporaryProviderError(f"DeepL request failed with HTTP {status}.")

    def _parse_success_response(
        self,
        response: httpx.Response,
        *,
        source_locale: str,
        target_locale: str,
    ) -> TranslationResult:
        try:
            data = response.json()
        except (ValueError, json.JSONDecodeError) as exc:
            raise TranslationMalformedResponseError("DeepL returned invalid JSON.") from exc

        if not isinstance(data, dict):
            raise TranslationMalformedResponseError("DeepL response has an incompatible shape.")

        translations = data.get("translations")
        if not isinstance(translations, list):
            raise TranslationMalformedResponseError("DeepL response missing translations list.")
        if not translations:
            raise TranslationMalformedResponseError("DeepL response contained no translations.")

        first = translations[0]
        if not isinstance(first, dict):
            raise TranslationMalformedResponseError("DeepL translation entry has an incompatible shape.")

        translated = first.get("text")
        if not isinstance(translated, str):
            raise TranslationMalformedResponseError("DeepL translation text is missing or invalid.")
        if not translated:
            raise TranslationMalformedResponseError("DeepL returned an empty translation.")

        detected = first.get("detected_source_language")
        if detected is not None and not isinstance(detected, str):
            raise TranslationMalformedResponseError("DeepL detected_source_language is invalid.")

        billed = first.get("billed_characters")
        if billed is not None:
            if isinstance(billed, bool) or not isinstance(billed, int):
                raise TranslationMalformedResponseError("DeepL billed_characters is invalid.")

        result = TranslationResult(
            text=translated,
            provider=PROVIDER_NAME,
            source_locale=source_locale,
            target_locale=target_locale,
            detected_source_language=detected,
            billed_characters=billed,
        )
        logger.info(
            "deepl translate result provider=%s source_locale=%s target_locale=%s "
            "result_category=success billed_characters=%s",
            PROVIDER_NAME,
            source_locale,
            target_locale,
            billed if billed is not None else "unknown",
        )
        return result

    def _log_attempt(
        self,
        *,
        attempt: int,
        source_locale: str,
        target_locale: str,
        status: int | None,
        result_category: str,
        latency_ms: float,
        billed_characters: int | None,
        request_id: str | None = None,
    ) -> None:
        logger.info(
            "deepl translate attempt provider=%s attempt=%s source_locale=%s target_locale=%s "
            "status=%s result_category=%s latency_ms=%.1f billed_characters=%s request_id=%s",
            PROVIDER_NAME,
            attempt,
            source_locale,
            target_locale,
            status if status is not None else "none",
            result_category,
            latency_ms,
            billed_characters if billed_characters is not None else "unknown",
            request_id or "none",
        )


__all__ = [
    "DeepLTranslationProvider",
    "PROVIDER_NAME",
    "MAX_REQUEST_BODY_BYTES",
]
