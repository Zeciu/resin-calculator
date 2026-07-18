"""Task 7.1.3 — DeepL translation provider boundary tests (mocked HTTP only)."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

from content.translation.config import DeepLConfig, DEFAULT_TIMEOUT_SECONDS, load_deepl_config
from content.translation.deepl import (
    DEFAULT_RETRY_DELAY_SECONDS,
    MAX_REQUEST_BODY_BYTES,
    DeepLTranslationProvider,
)
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
from content.translation.locales import TARGET_LOCALE_TO_DEEPL


AUTH_KEY = "test-deepl-auth-key-secret-value"
BASE_URL = "https://api-free.deepl.com"


def _config(**overrides: Any) -> DeepLConfig:
    values = {
        "auth_key": AUTH_KEY,
        "api_base_url": BASE_URL,
        "timeout_seconds": DEFAULT_TIMEOUT_SECONDS,
        "enabled_flag": None,
    }
    values.update(overrides)
    return DeepLConfig(**values)


def _success_body(
    text: str = "Hello",
    *,
    detected: str | None = "RO",
    billed: int | None = 12,
) -> dict[str, Any]:
    item: dict[str, Any] = {"text": text}
    if detected is not None:
        item["detected_source_language"] = detected
    if billed is not None:
        item["billed_characters"] = billed
    return {"translations": [item]}


class RecordingTransport(httpx.BaseTransport):
    def __init__(self, handler) -> None:
        self.handler = handler
        self.requests: list[httpx.Request] = []

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        return self.handler(request)


def _provider_with_handler(handler, *, config: DeepLConfig | None = None, sleep=None):
    transport = RecordingTransport(handler)
    client = httpx.Client(transport=transport, timeout=httpx.Timeout(30.0))
    provider = DeepLTranslationProvider(
        config or _config(),
        client=client,
        sleep=sleep or (lambda _seconds: None),
    )
    return provider, transport


def _json_body(request: httpx.Request) -> dict[str, Any]:
    return json.loads(request.content.decode("utf-8"))


# ---------------------------------------------------------------------------
# Successful behaviour
# ---------------------------------------------------------------------------


class TestSuccessfulTranslation:
    def test_successful_plain_text_translation(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_success_body("Mold"))

        provider, transport = _provider_with_handler(handler)
        result = provider.translate(
            "Formă",
            source_locale="ro",
            target_locale="en",
            content_format="plain",
        )
        assert result.text == "Mold"
        assert result.provider == "deepl"
        assert result.source_locale == "ro"
        assert result.target_locale == "en"
        body = _json_body(transport.requests[0])
        assert "tag_handling" not in body
        assert body["show_billed_characters"] is True
        assert body["source_lang"] == "RO"
        assert body["target_lang"] == "EN-US"

    def test_successful_html_translation_sends_tag_handling(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_success_body("<strong>Mold</strong>"))

        provider, transport = _provider_with_handler(handler)
        result = provider.translate(
            "<strong>Formă</strong>",
            source_locale="ro",
            target_locale="en",
            content_format="html",
        )
        assert result.text == "<strong>Mold</strong>"
        assert _json_body(transport.requests[0])["tag_handling"] == "html"

    def test_source_locale_maps_to_ro(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_success_body("x"))

        provider, transport = _provider_with_handler(handler)
        provider.translate("text", source_locale="  RO  ", target_locale="en")
        assert _json_body(transport.requests[0])["source_lang"] == "RO"

    @pytest.mark.parametrize("app_locale,deepl_code", sorted(TARGET_LOCALE_TO_DEEPL.items()))
    def test_every_approved_target_maps_correctly(self, app_locale: str, deepl_code: str):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_success_body("ok"))

        provider, transport = _provider_with_handler(handler)
        provider.translate("text", source_locale="ro", target_locale=app_locale)
        assert _json_body(transport.requests[0])["target_lang"] == deepl_code

    def test_detected_source_language_and_billed_characters_returned(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json=_success_body("Hello", detected="RO", billed=42),
            )

        provider, _ = _provider_with_handler(handler)
        result = provider.translate("text", source_locale="ro", target_locale="en")
        assert result.detected_source_language == "RO"
        assert result.billed_characters == 42

    def test_context_forwarded_and_whitespace_context_omitted(self):
        seen: list[dict[str, Any]] = []

        def handler(request: httpx.Request) -> httpx.Response:
            seen.append(_json_body(request))
            return httpx.Response(200, json=_success_body("x"))

        provider, _ = _provider_with_handler(handler)
        provider.translate(
            "text",
            source_locale="ro",
            target_locale="en",
            context="epoxy mold context",
        )
        provider.translate(
            "text",
            source_locale="ro",
            target_locale="en",
            context="   ",
        )
        assert seen[0]["context"] == "epoxy mold context"
        assert "context" not in seen[1]

    def test_glossary_id_forwarded_when_supplied(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_success_body("x"))

        provider, transport = _provider_with_handler(handler)
        provider.translate(
            "text",
            source_locale="ro",
            target_locale="en",
            glossary_id="glossary-123",
        )
        assert _json_body(transport.requests[0])["glossary_id"] == "glossary-123"


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


class TestConfiguration:
    def test_missing_configuration_raises(self):
        provider = DeepLTranslationProvider(
            _config(auth_key="", api_base_url=""),
            client=httpx.Client(transport=RecordingTransport(lambda r: httpx.Response(200))),
            sleep=lambda _s: None,
        )
        with pytest.raises(TranslationConfigurationError):
            provider.translate("text", source_locale="ro", target_locale="en")

    def test_enabled_0_force_disables_despite_key_and_url(self):
        cfg = load_deepl_config(
            {
                "DEEPL_AUTH_KEY": AUTH_KEY,
                "DEEPL_API_BASE_URL": BASE_URL,
                "DEEPL_ENABLED": "0",
            }
        )
        assert cfg.is_available is False
        provider = DeepLTranslationProvider(cfg, sleep=lambda _s: None)
        with pytest.raises(TranslationConfigurationError):
            provider.translate("text", source_locale="ro", target_locale="en")

    def test_enabled_1_with_missing_key_unavailable(self):
        cfg = load_deepl_config(
            {
                "DEEPL_AUTH_KEY": "",
                "DEEPL_API_BASE_URL": BASE_URL,
                "DEEPL_ENABLED": "1",
            }
        )
        assert cfg.is_available is False

    def test_enabled_1_with_missing_base_url_unavailable(self):
        cfg = load_deepl_config(
            {
                "DEEPL_AUTH_KEY": AUTH_KEY,
                "DEEPL_API_BASE_URL": "",
                "DEEPL_ENABLED": "1",
            }
        )
        assert cfg.is_available is False

    def test_absent_enabled_with_key_and_url_allows_configuration(self):
        cfg = load_deepl_config(
            {
                "DEEPL_AUTH_KEY": AUTH_KEY,
                "DEEPL_API_BASE_URL": BASE_URL,
            }
        )
        assert cfg.is_available is True

    def test_malformed_base_url_rejected_safely(self):
        cfg = load_deepl_config(
            {
                "DEEPL_AUTH_KEY": AUTH_KEY,
                "DEEPL_API_BASE_URL": "not-a-url",
            }
        )
        assert cfg.is_available is False
        provider = DeepLTranslationProvider(cfg, sleep=lambda _s: None)
        with pytest.raises(TranslationConfigurationError, match="malformed"):
            provider.translate("text", source_locale="ro", target_locale="en")

    def test_application_startup_not_coupled_to_deepl_configuration(
        self, tmp_path, monkeypatch
    ):
        monkeypatch.delenv("DEEPL_AUTH_KEY", raising=False)
        monkeypatch.delenv("DEEPL_API_BASE_URL", raising=False)
        monkeypatch.delenv("DEEPL_ENABLED", raising=False)
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        monkeypatch.setenv("AUTH_MODE", "mock")
        from app import app

        client = TestClient(app)
        assert client.get("/health").status_code == 200


# ---------------------------------------------------------------------------
# Locale and input validation
# ---------------------------------------------------------------------------


class TestLocaleAndInputValidation:
    def test_unsupported_target_rejected_before_http(self):
        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        with pytest.raises(TranslationUnsupportedLocaleError):
            provider.translate("text", source_locale="ro", target_locale="nl")
        assert transport.requests == []

    def test_source_other_than_ro_rejected(self):
        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        with pytest.raises(TranslationUnsupportedLocaleError):
            provider.translate("text", source_locale="en", target_locale="fr")
        assert transport.requests == []

    def test_cz_rejected(self):
        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        with pytest.raises(TranslationUnsupportedLocaleError):
            provider.translate("text", source_locale="ro", target_locale="cz")
        assert transport.requests == []

    @pytest.mark.parametrize("locale", ["EN-US", "PT-BR", "en-us", "pt-br", "DE-DE", "RO-RO"])
    def test_provider_codes_rejected_as_app_locale_inputs(self, locale: str):
        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        with pytest.raises(TranslationUnsupportedLocaleError):
            provider.translate("text", source_locale="ro", target_locale=locale)
        assert transport.requests == []

    def test_same_source_and_target_rejected(self):
        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        with pytest.raises(TranslationInvalidRequestError):
            provider.translate("text", source_locale="ro", target_locale="ro")
        assert transport.requests == []

    def test_empty_and_whitespace_text_rejected(self):
        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        with pytest.raises(TranslationInvalidRequestError):
            provider.translate("", source_locale="ro", target_locale="en")
        with pytest.raises(TranslationInvalidRequestError):
            provider.translate("   \n\t", source_locale="ro", target_locale="en")
        assert transport.requests == []

    def test_invalid_content_format_rejected(self):
        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        with pytest.raises(TranslationInvalidRequestError):
            provider.translate(
                "text",
                source_locale="ro",
                target_locale="en",
                content_format="markdown",  # type: ignore[arg-type]
            )
        assert transport.requests == []


# ---------------------------------------------------------------------------
# Request-size guard
# ---------------------------------------------------------------------------


class TestRequestSizeGuard:
    def test_oversized_serialized_payload_rejected_before_http(self):
        # Build text that alone pushes the serialized JSON over the limit.
        huge = "ă" * (MAX_REQUEST_BODY_BYTES)
        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        with pytest.raises(TranslationRequestTooLargeError):
            provider.translate(huge, source_locale="ro", target_locale="en")
        assert transport.requests == []

    def test_context_and_glossary_contribute_to_request_size(self):
        # Near-limit body where context/glossary tip it over.
        base_text = "x" * (MAX_REQUEST_BODY_BYTES - 400)
        with_context = {
            "text": [base_text],
            "source_lang": "RO",
            "target_lang": "EN-US",
            "show_billed_characters": True,
            "tag_handling": "html",
            "context": "c" * 500,
            "glossary_id": "g" * 100,
        }
        without = {
            "text": [base_text],
            "source_lang": "RO",
            "target_lang": "EN-US",
            "show_billed_characters": True,
            "tag_handling": "html",
        }
        assert len(json.dumps(without, ensure_ascii=False).encode("utf-8")) <= MAX_REQUEST_BODY_BYTES
        assert len(json.dumps(with_context, ensure_ascii=False).encode("utf-8")) > MAX_REQUEST_BODY_BYTES

        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        # Without extras — allowed
        provider.translate(base_text, source_locale="ro", target_locale="en")
        assert len(transport.requests) == 1

        with pytest.raises(TranslationRequestTooLargeError):
            provider.translate(
                base_text,
                source_locale="ro",
                target_locale="en",
                context="c" * 500,
                glossary_id="g" * 100,
            )
        assert len(transport.requests) == 1

    def test_json_escaping_contributes_to_request_size(self):
        # Quotes expand under JSON escaping.
        text = '"' * ((MAX_REQUEST_BODY_BYTES // 2) + 100)
        serialized = json.dumps(
            {
                "text": [text],
                "source_lang": "RO",
                "target_lang": "EN-US",
                "show_billed_characters": True,
                "tag_handling": "html",
            },
            ensure_ascii=False,
        ).encode("utf-8")
        assert len(serialized) > MAX_REQUEST_BODY_BYTES
        assert len(text.encode("utf-8")) < len(serialized)

        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        with pytest.raises(TranslationRequestTooLargeError):
            provider.translate(text, source_locale="ro", target_locale="en")
        assert transport.requests == []

    def test_utf8_multibyte_romanian_counted(self):
        char = "ș"  # 2-byte UTF-8
        count = (MAX_REQUEST_BODY_BYTES // 2) + 50
        text = char * count
        assert len(text) < MAX_REQUEST_BODY_BYTES
        assert len(text.encode("utf-8")) > MAX_REQUEST_BODY_BYTES // 2

        provider, transport = _provider_with_handler(
            lambda r: httpx.Response(200, json=_success_body("x"))
        )
        # Enough multibyte chars to exceed after JSON wrapping.
        big = char * (MAX_REQUEST_BODY_BYTES)
        with pytest.raises(TranslationRequestTooLargeError):
            provider.translate(big, source_locale="ro", target_locale="en")
        assert transport.requests == []

    def test_payload_below_limit_allowed(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=_success_body("ok"))

        provider, transport = _provider_with_handler(handler)
        provider.translate("Formă de epoxy", source_locale="ro", target_locale="en")
        assert len(transport.requests) == 1


# ---------------------------------------------------------------------------
# HTTP error mapping
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "status,exc_type",
    [
        (400, TranslationInvalidRequestError),
        (403, TranslationAuthError),
        (413, TranslationRequestTooLargeError),
        (429, TranslationRateLimitedError),
        (456, TranslationQuotaExceededError),
        (529, TranslationRateLimitedError),
        (500, TranslationTemporaryProviderError),
        (502, TranslationTemporaryProviderError),
        (503, TranslationTemporaryProviderError),
        (504, TranslationTemporaryProviderError),
    ],
)
def test_http_error_mapping(status: int, exc_type: type[Exception]):
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(status, json={"message": "err"})

    provider, _ = _provider_with_handler(handler)
    with pytest.raises(exc_type):
        provider.translate("text", source_locale="ro", target_locale="en")
    # Non-retryable statuses: 1 attempt; retryable: 2
    if status in {429, 529, 500, 502, 503, 504}:
        assert calls["n"] == 2
    else:
        assert calls["n"] == 1


def test_connection_failure_retries_once():
    attempts = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        attempts["n"] += 1
        raise httpx.ConnectError("boom", request=request)

    provider, transport = _provider_with_handler(handler)
    with pytest.raises(TranslationTemporaryProviderError):
        provider.translate("text", source_locale="ro", target_locale="en")
    assert attempts["n"] == 2


def test_connect_timeout_retries_once():
    attempts = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        attempts["n"] += 1
        raise httpx.ConnectTimeout("connect", request=request)

    provider, _ = _provider_with_handler(handler)
    with pytest.raises(TranslationTimeoutError):
        provider.translate("text", source_locale="ro", target_locale="en")
    assert attempts["n"] == 2


@pytest.mark.parametrize(
    "exc_factory,expected",
    [
        (lambda req: httpx.ReadTimeout("read", request=req), TranslationTimeoutError),
        (lambda req: httpx.WriteTimeout("write", request=req), TranslationTimeoutError),
        (lambda req: httpx.PoolTimeout("pool", request=req), TranslationTimeoutError),
    ],
)
def test_ambiguous_timeouts_do_not_retry(exc_factory, expected):
    attempts = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        attempts["n"] += 1
        raise exc_factory(request)

    provider, _ = _provider_with_handler(handler)
    with pytest.raises(expected):
        provider.translate("text", source_locale="ro", target_locale="en")
    assert attempts["n"] == 1


# ---------------------------------------------------------------------------
# Retry behaviour
# ---------------------------------------------------------------------------


class TestRetryBehaviour:
    def test_retryable_status_then_success(self):
        attempts = {"n": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            attempts["n"] += 1
            if attempts["n"] == 1:
                return httpx.Response(503, json={"message": "busy"})
            return httpx.Response(200, json=_success_body("ok"))

        provider, _ = _provider_with_handler(handler)
        result = provider.translate("text", source_locale="ro", target_locale="en")
        assert result.text == "ok"
        assert attempts["n"] == 2

    def test_retry_after_respected_within_cap(self):
        sleeps: list[float] = []
        attempts = {"n": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            attempts["n"] += 1
            if attempts["n"] == 1:
                return httpx.Response(429, headers={"Retry-After": "9"}, json={})
            return httpx.Response(200, json=_success_body("ok"))

        provider, _ = _provider_with_handler(handler, sleep=sleeps.append)
        provider.translate("text", source_locale="ro", target_locale="en")
        assert sleeps == [5.0]

    def test_retry_after_small_value_used(self):
        sleeps: list[float] = []
        attempts = {"n": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            attempts["n"] += 1
            if attempts["n"] == 1:
                return httpx.Response(529, headers={"Retry-After": "1.5"}, json={})
            return httpx.Response(200, json=_success_body("ok"))

        provider, _ = _provider_with_handler(handler, sleep=sleeps.append)
        provider.translate("text", source_locale="ro", target_locale="en")
        assert sleeps == [1.5]

    def test_default_delay_when_retry_after_missing(self):
        sleeps: list[float] = []
        attempts = {"n": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            attempts["n"] += 1
            if attempts["n"] == 1:
                return httpx.Response(500, json={})
            return httpx.Response(200, json=_success_body("ok"))

        provider, _ = _provider_with_handler(handler, sleep=sleeps.append)
        provider.translate("text", source_locale="ro", target_locale="en")
        assert sleeps == [DEFAULT_RETRY_DELAY_SECONDS]

    def test_malformed_200_does_not_retry(self):
        attempts = {"n": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            attempts["n"] += 1
            return httpx.Response(200, json={"translations": []})

        provider, _ = _provider_with_handler(handler)
        with pytest.raises(TranslationMalformedResponseError):
            provider.translate("text", source_locale="ro", target_locale="en")
        assert attempts["n"] == 1

    def test_never_exceeds_two_attempts(self):
        attempts = {"n": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            attempts["n"] += 1
            return httpx.Response(500, json={})

        provider, _ = _provider_with_handler(handler)
        with pytest.raises(TranslationTemporaryProviderError):
            provider.translate("text", source_locale="ro", target_locale="en")
        assert attempts["n"] == 2


# ---------------------------------------------------------------------------
# Malformed successful responses
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "body",
    [
        b"not-json",
        {"no": "translations"},
        {"translations": "bad"},
        {"translations": []},
        {"translations": ["bad"]},
        {"translations": [{}]},
        {"translations": [{"text": 1}]},
        {"translations": [{"text": "ok", "detected_source_language": 1}]},
        {"translations": [{"text": "ok", "billed_characters": True}]},
        {"translations": [{"text": "ok", "billed_characters": "12"}]},
        {"translations": [{"text": ""}]},
    ],
)
def test_malformed_success_responses(body: Any):
    def handler(request: httpx.Request) -> httpx.Response:
        if isinstance(body, bytes):
            return httpx.Response(200, content=body, headers={"Content-Type": "application/json"})
        return httpx.Response(200, json=body)

    provider, _ = _provider_with_handler(handler)
    with pytest.raises(TranslationMalformedResponseError):
        provider.translate("text", source_locale="ro", target_locale="en")


# ---------------------------------------------------------------------------
# Security and logging
# ---------------------------------------------------------------------------


class TestSecurityAndLogging:
    def test_key_absent_from_exception_messages(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(403, json={"message": "nope"})

        provider, _ = _provider_with_handler(handler)
        with pytest.raises(TranslationAuthError) as exc_info:
            provider.translate("secret source text", source_locale="ro", target_locale="en")
        message = str(exc_info.value)
        assert AUTH_KEY not in message
        assert "secret source text" not in message
        assert "DeepL-Auth-Key" not in message

    def test_logs_omit_secrets_and_bodies(self, caplog):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                json=_success_body("TRANSLATED_SECRET_TEXT", billed=9),
                headers={"X-Request-Id": "req-1"},
            )

        provider, _ = _provider_with_handler(handler)
        with caplog.at_level(logging.INFO, logger="content.translation.deepl"):
            provider.translate(
                "SOURCE_SECRET_TEXT",
                source_locale="ro",
                target_locale="en",
            )
        joined = "\n".join(record.getMessage() for record in caplog.records)
        assert AUTH_KEY not in joined
        assert "DeepL-Auth-Key" not in joined
        assert "SOURCE_SECRET_TEXT" not in joined
        assert "TRANSLATED_SECRET_TEXT" not in joined
        assert "attempt=1" in joined
        assert "billed_characters=9" in joined

    def test_timeout_logs_do_not_claim_known_billing(self, caplog):
        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ReadTimeout("read", request=request)

        provider, _ = _provider_with_handler(handler)
        with caplog.at_level(logging.INFO, logger="content.translation.deepl"):
            with pytest.raises(TranslationTimeoutError):
                provider.translate("text", source_locale="ro", target_locale="en")
        joined = "\n".join(record.getMessage() for record in caplog.records)
        assert "billed_characters=unknown" in joined
        assert "attempt=1" in joined

    def test_each_retry_attempt_logged(self, caplog):
        attempts = {"n": 0}

        def handler(request: httpx.Request) -> httpx.Response:
            attempts["n"] += 1
            return httpx.Response(500, json={})

        provider, _ = _provider_with_handler(handler)
        with caplog.at_level(logging.INFO, logger="content.translation.deepl"):
            with pytest.raises(TranslationTemporaryProviderError):
                provider.translate("text", source_locale="ro", target_locale="en")
        messages = [record.getMessage() for record in caplog.records]
        assert any("attempt=1" in m for m in messages)
        assert any("attempt=2" in m for m in messages)
