"""Generate missing UI catalog translations via the existing DeepL provider.

Canonical key structure comes from en.json. DeepL source text comes from
ro.json. Existing non-empty target values are never overwritten.
"""

from __future__ import annotations

import json
import os
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from private.schemas.common import parse_admin_locale
from private.translation.deepl import DeepLTranslationProvider
from private.translation.exceptions import TranslationError
from private.translation.locales import CANONICAL_SOURCE_LOCALE
from private.translation.provider import TranslationProvider

_SERVICE_FILE = Path(__file__).resolve()
_REPO_ROOT = _SERVICE_FILE.parents[3]
_UI_CANONICAL_LOCALE = "en"
_UI_SOURCE_LOCALE = CANONICAL_SOURCE_LOCALE
_FORBIDDEN_TARGETS = frozenset({_UI_CANONICAL_LOCALE, _UI_SOURCE_LOCALE})
_BATCH_SIZE = 40

# Patterns actually present in the UI catalogs, plus URLs (required even if
# current catalogs have none). Longest alternatives first.
_TOKEN_PATTERN = re.compile(
    r"https?://[^\s]+"
    r"|HFZWood"
    r"|\.hfzproject"
    r"|\{[A-Za-z]+\}"
    r"|kg/L"
    r"|cm²"
    r"|A:B"
)
_SENTINEL_PREFIX = "__HFZUI_"
_SENTINEL_SUFFIX = "__"


class UiCatalogTranslationError(ValueError):
    """Safe, user-facing UI catalog translation failure."""


@dataclass(frozen=True, slots=True)
class UiFailedItem:
    key: str
    reason: str


@dataclass(frozen=True, slots=True)
class UiMissingPreview:
    locale: str
    required_count: int
    present_count: int
    missing_count: int
    missing_keys: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class UiMissingGenerateResult:
    locale: str
    required_count: int
    present_count_before: int
    present_count_after: int
    generated_count: int
    preserved_count: int
    failed: tuple[UiFailedItem, ...]
    provider_called: bool


def default_ui_i18n_dir() -> Path:
    return _REPO_ROOT / "frontend" / "public" / "src" / "i18n"


def ui_value_is_present(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def missing_ui_keys(required_keys: tuple[str, ...], target: dict[str, Any]) -> tuple[str, ...]:
    return tuple(key for key in required_keys if not ui_value_is_present(target.get(key)))


def protect_ui_tokens(text: str) -> tuple[str, tuple[str, ...]]:
    tokens: list[str] = []

    def _replace(match: re.Match[str]) -> str:
        tokens.append(match.group(0))
        return f"{_SENTINEL_PREFIX}{len(tokens) - 1}{_SENTINEL_SUFFIX}"

    return _TOKEN_PATTERN.sub(_replace, text), tuple(tokens)


def restore_ui_tokens(text: str, tokens: tuple[str, ...]) -> str | None:
    restored = text
    for index, token in enumerate(tokens):
        sentinel = f"{_SENTINEL_PREFIX}{index}{_SENTINEL_SUFFIX}"
        if sentinel not in restored:
            return None
        restored = restored.replace(sentinel, token, 1)
    if _SENTINEL_PREFIX in restored:
        return None
    return restored


class UiCatalogTranslationService:
    def __init__(
        self,
        i18n_dir: Path | None = None,
        provider: TranslationProvider | None = None,
    ) -> None:
        self._i18n_dir = Path(i18n_dir) if i18n_dir is not None else default_ui_i18n_dir()
        self._provider = provider

    def preview(self, locale: str) -> UiMissingPreview:
        target_locale = self._require_target_locale(locale)
        required_keys, _english, _romanian, target = self._load_catalogs(target_locale)
        missing = missing_ui_keys(required_keys, target)
        present_count = len(required_keys) - len(missing)
        return UiMissingPreview(
            locale=target_locale,
            required_count=len(required_keys),
            present_count=present_count,
            missing_count=len(missing),
            missing_keys=missing,
        )

    def generate_missing(self, locale: str) -> UiMissingGenerateResult:
        target_locale = self._require_target_locale(locale)
        required_keys, _english, romanian, target = self._load_catalogs(target_locale)
        missing = missing_ui_keys(required_keys, target)
        preserved_count = len(required_keys) - len(missing)
        if not missing:
            return UiMissingGenerateResult(
                locale=target_locale,
                required_count=len(required_keys),
                present_count_before=preserved_count,
                present_count_after=preserved_count,
                generated_count=0,
                preserved_count=preserved_count,
                failed=(),
                provider_called=False,
            )

        translations: dict[str, str] = {}
        failed: list[UiFailedItem] = []
        pending: list[tuple[str, str, tuple[str, ...]]] = []
        for key in missing:
            source = romanian.get(key)
            if not ui_value_is_present(source):
                failed.append(
                    UiFailedItem(key=key, reason="Romanian UI source is missing.")
                )
                continue
            protected, tokens = protect_ui_tokens(source)
            pending.append((key, protected, tokens))

        provider_called = False
        if pending:
            provider = self._get_provider()
            for start in range(0, len(pending), _BATCH_SIZE):
                batch = pending[start : start + _BATCH_SIZE]
                texts = [item[1] for item in batch]
                try:
                    provider_called = True
                    results = provider.translate_many(
                        texts,
                        source_locale=_UI_SOURCE_LOCALE,
                        target_locale=target_locale,
                        content_format="plain",
                    )
                except TranslationError:
                    if not translations:
                        raise
                    for key, _protected, _tokens in batch:
                        failed.append(
                            UiFailedItem(
                                key=key,
                                reason="Translation provider failed. Try again later.",
                            )
                        )
                    continue
                if len(results) != len(batch):
                    for key, _protected, _tokens in batch:
                        failed.append(
                            UiFailedItem(
                                key=key,
                                reason="Translation provider returned an unexpected result.",
                            )
                        )
                    continue
                for (key, _protected, tokens), result in zip(batch, results):
                    translated = result.text if result is not None else ""
                    if not isinstance(translated, str) or not translated.strip():
                        failed.append(
                            UiFailedItem(key=key, reason="Translation provider returned an empty value.")
                        )
                        continue
                    restored = restore_ui_tokens(translated, tokens)
                    if restored is None:
                        failed.append(
                            UiFailedItem(
                                key=key,
                                reason="Protected tokens could not be restored safely.",
                            )
                        )
                        continue
                    translations[key] = restored

        if translations:
            written = self._merge_catalog(required_keys, target, translations)
            self._write_catalog(target_locale, written)
            target = written

        missing_after = missing_ui_keys(required_keys, target)
        return UiMissingGenerateResult(
            locale=target_locale,
            required_count=len(required_keys),
            present_count_before=preserved_count,
            present_count_after=len(required_keys) - len(missing_after),
            generated_count=len(translations),
            preserved_count=preserved_count,
            failed=tuple(failed),
            provider_called=provider_called,
        )

    def _get_provider(self) -> TranslationProvider:
        if self._provider is not None:
            return self._provider
        return DeepLTranslationProvider()

    def _require_target_locale(self, locale: str) -> str:
        try:
            parsed = parse_admin_locale(locale)
        except ValueError as exc:
            raise UiCatalogTranslationError(str(exc)) from exc
        if parsed in _FORBIDDEN_TARGETS:
            raise UiCatalogTranslationError(
                f"Cannot generate UI translations for '{parsed}'."
            )
        return parsed

    def _load_catalogs(
        self, target_locale: str
    ) -> tuple[tuple[str, ...], dict[str, Any], dict[str, Any], dict[str, Any]]:
        english = self._read_catalog(_UI_CANONICAL_LOCALE)
        if english is None:
            raise UiCatalogTranslationError("Canonical English UI catalog is missing.")
        required_keys = tuple(key for key in english if isinstance(key, str))
        if not required_keys:
            raise UiCatalogTranslationError("Canonical English UI catalog has no keys.")
        romanian = self._read_catalog(_UI_SOURCE_LOCALE)
        if romanian is None:
            raise UiCatalogTranslationError("Romanian UI catalog is missing.")
        target = self._read_catalog(target_locale) or {}
        return required_keys, english, romanian, target

    def _read_catalog(self, locale: str) -> dict[str, Any] | None:
        path = self._i18n_dir / f"{locale}.json"
        if not path.is_file():
            return None
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError):
            return None
        return payload if isinstance(payload, dict) else None

    def _merge_catalog(
        self,
        required_keys: tuple[str, ...],
        original: dict[str, Any],
        translations: dict[str, str],
    ) -> dict[str, Any]:
        merged = dict(original)
        for key, value in translations.items():
            merged[key] = value
        ordered: dict[str, Any] = {}
        for key in required_keys:
            if key in merged:
                ordered[key] = merged[key]
        for key, value in original.items():
            if key not in ordered:
                ordered[key] = value
        return ordered

    def _write_catalog(self, locale: str, catalog: dict[str, Any]) -> None:
        path = self._i18n_dir / f"{locale}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        serialized = json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
        fd, tmp_name = tempfile.mkstemp(
            prefix=f".{path.name}.tmp-",
            dir=str(path.parent),
            text=False,
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
                handle.write(serialized)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(tmp_name, path)
        except Exception:
            try:
                os.unlink(tmp_name)
            except OSError:
                pass
            raise


__all__ = [
    "UiCatalogTranslationError",
    "UiCatalogTranslationService",
    "UiFailedItem",
    "UiMissingGenerateResult",
    "UiMissingPreview",
    "default_ui_i18n_dir",
    "missing_ui_keys",
    "protect_ui_tokens",
    "restore_ui_tokens",
    "ui_value_is_present",
]
