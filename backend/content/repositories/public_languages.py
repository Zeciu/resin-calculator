"""Durable public language activation configuration."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from content.repositories.filesystem import atomic_write_json, default_content_root
from content.schemas.common import (
    ADMIN_EDITORIAL_LOCALE_ORDER,
    ADMIN_EDITORIAL_LOCALES,
    DEFAULT_PUBLIC_LOCALE,
)

CONFIG_RELATIVE_PATH = "config/public-languages.json"


def default_public_languages_config() -> dict[str, Any]:
    return {
        "defaultPublicLocale": DEFAULT_PUBLIC_LOCALE,
        "activePublicLocales": [DEFAULT_PUBLIC_LOCALE],
    }


def normalize_public_languages_config(payload: dict[str, Any] | None) -> dict[str, Any]:
    config = default_public_languages_config()
    if not isinstance(payload, dict):
        return config

    default_locale = str(payload.get("defaultPublicLocale") or "").strip().lower()
    if default_locale in ADMIN_EDITORIAL_LOCALES:
        config["defaultPublicLocale"] = default_locale

    active: list[str] = []
    raw_active = payload.get("activePublicLocales")
    if isinstance(raw_active, list):
        for item in raw_active:
            locale = str(item or "").strip().lower()
            if locale in ADMIN_EDITORIAL_LOCALES and locale not in active:
                active.append(locale)

    default = config["defaultPublicLocale"]
    if default not in active:
        active.insert(0, default)

    # Default first, then remaining locales in Admin editorial order.
    ordered: list[str] = [default]
    for locale in ADMIN_EDITORIAL_LOCALE_ORDER:
        if locale in active and locale not in ordered:
            ordered.append(locale)
    for locale in active:
        if locale not in ordered:
            ordered.append(locale)
    config["activePublicLocales"] = ordered
    return config


class PublicLanguagesRepository:
    def __init__(self, data_dir=None) -> None:
        root = data_dir if data_dir is not None else default_content_root()
        self._root = root
        self._path = root / CONFIG_RELATIVE_PATH

    @property
    def path(self):
        return self._path

    def read(self) -> dict[str, Any]:
        if not self._path.is_file():
            return default_public_languages_config()
        try:
            import json

            payload = json.loads(self._path.read_text(encoding="utf-8"))
        except (OSError, ValueError, TypeError):
            return default_public_languages_config()
        return normalize_public_languages_config(payload)

    def write(self, config: dict[str, Any]) -> dict[str, Any]:
        normalized = normalize_public_languages_config(config)
        atomic_write_json(self._path, normalized)
        return deepcopy(normalized)
