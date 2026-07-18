"""Environment-only DeepL translation provider configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import urlparse

from content.translation.exceptions import TranslationConfigurationError

DEFAULT_TIMEOUT_SECONDS = 30.0


def validate_api_base_url(raw: str) -> str:
    """Return a normalized base URL or raise TranslationConfigurationError."""
    candidate = raw.strip().rstrip("/")
    if not candidate:
        raise TranslationConfigurationError("DEEPL_API_BASE_URL is missing.")
    parsed = urlparse(candidate)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise TranslationConfigurationError("DEEPL_API_BASE_URL is malformed.")
    if parsed.username or parsed.password or "@" in parsed.netloc:
        raise TranslationConfigurationError("DEEPL_API_BASE_URL is malformed.")
    return candidate


def _parse_timeout(raw: str | None) -> float:
    if raw is None or not str(raw).strip():
        return DEFAULT_TIMEOUT_SECONDS
    try:
        value = float(str(raw).strip())
    except ValueError as exc:
        raise TranslationConfigurationError("DEEPL_TIMEOUT_SECONDS is invalid.") from exc
    if value <= 0:
        raise TranslationConfigurationError("DEEPL_TIMEOUT_SECONDS must be positive.")
    return value


@dataclass(frozen=True, slots=True)
class DeepLConfig:
    auth_key: str
    api_base_url: str
    timeout_seconds: float
    enabled_flag: str | None

    @property
    def is_force_disabled(self) -> bool:
        return self.enabled_flag is not None and self.enabled_flag.strip() == "0"

    @property
    def is_available(self) -> bool:
        if self.is_force_disabled:
            return False
        if not self.auth_key or not self.api_base_url:
            return False
        try:
            validate_api_base_url(self.api_base_url)
        except TranslationConfigurationError:
            return False
        return True

    def require_available(self) -> None:
        if self.is_force_disabled or not self.auth_key or not self.api_base_url:
            raise TranslationConfigurationError("DeepL translation is not configured.")
        validate_api_base_url(self.api_base_url)

    def normalized_base_url(self) -> str:
        return validate_api_base_url(self.api_base_url)


def load_deepl_config(environ: dict[str, str] | None = None) -> DeepLConfig:
    env = os.environ if environ is None else environ
    return DeepLConfig(
        auth_key=(env.get("DEEPL_AUTH_KEY") or "").strip(),
        api_base_url=(env.get("DEEPL_API_BASE_URL") or "").strip(),
        timeout_seconds=_parse_timeout(env.get("DEEPL_TIMEOUT_SECONDS")),
        enabled_flag=env.get("DEEPL_ENABLED"),
    )
