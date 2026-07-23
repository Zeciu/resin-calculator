"""Task B2 — COMMERCIAL_DATA_DIR path resolution for entitlements and preferences."""

from __future__ import annotations

from pathlib import Path

import pytest

from content.repositories.entitlements import FilesystemEntitlementsRepository
from content.repositories.filesystem import (
    COMMERCIAL_DATA_DIR_ENV,
    FilesystemContentRepository,
    commercial_data_root,
    default_content_root,
)
from content.repositories.preferences import FilesystemPreferencesRepository
from content.repositories.public_languages import PublicLanguagesRepository
from content.schemas.preferences import UserPreferences


class TestCommercialDataRootHelper:
    def test_unset_falls_back_to_content_data_dir(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
        editorial = tmp_path / "editorial-root"
        editorial.mkdir()
        monkeypatch.delenv(COMMERCIAL_DATA_DIR_ENV, raising=False)
        monkeypatch.setenv("CONTENT_DATA_DIR", str(editorial))
        assert commercial_data_root() == editorial
        assert commercial_data_root() == default_content_root()

    def test_blank_falls_back_to_content_data_dir(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
        editorial = tmp_path / "editorial-root"
        editorial.mkdir()
        monkeypatch.setenv(COMMERCIAL_DATA_DIR_ENV, "   ")
        monkeypatch.setenv("CONTENT_DATA_DIR", str(editorial))
        assert commercial_data_root() == editorial

    def test_unset_without_content_dir_uses_backend_data(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.delenv(COMMERCIAL_DATA_DIR_ENV, raising=False)
        monkeypatch.delenv("CONTENT_DATA_DIR", raising=False)
        assert commercial_data_root() == default_content_root()
        assert commercial_data_root().name == "data"

    def test_explicit_commercial_root(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
        editorial = tmp_path / "editorial-root"
        commercial = tmp_path / "commercial-root"
        editorial.mkdir()
        commercial.mkdir()
        monkeypatch.setenv("CONTENT_DATA_DIR", str(editorial))
        monkeypatch.setenv(COMMERCIAL_DATA_DIR_ENV, str(commercial))
        assert commercial_data_root() == commercial
        assert default_content_root() == editorial


class TestSeparatedCommercialRepositories:
    def test_entitlements_and_preferences_use_commercial_root(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        editorial = tmp_path / "editorial-root"
        commercial = tmp_path / "commercial-root"
        editorial.mkdir()
        commercial.mkdir()
        monkeypatch.setenv("CONTENT_DATA_DIR", str(editorial))
        monkeypatch.setenv(COMMERCIAL_DATA_DIR_ENV, str(commercial))
        monkeypatch.delenv("EDITORIAL_CONTENT_MODE", raising=False)
        monkeypatch.delenv("REQUIRE_CONTENT_DATA_DIR", raising=False)

        entitlements = FilesystemEntitlementsRepository()
        preferences = FilesystemPreferencesRepository()
        editorial_repo = FilesystemContentRepository()
        languages = PublicLanguagesRepository()

        entitlements.save_access_tier("user-a", "subscriber")
        preferences.save_preferences(
            "user-a",
            UserPreferences(interfaceLanguage="ro", lengthUnit="mm", volumeUnit="L"),
        )
        languages.write({"defaultPublicLocale": "en", "activePublicLocales": ["en", "ro"]})

        assert (commercial / "entitlements" / "user-a.json").is_file()
        assert (commercial / "preferences" / "user-a.json").is_file()
        assert not (editorial / "entitlements").exists()
        assert not (editorial / "preferences").exists()

        assert entitlements.get_access_tier("user-a") == "subscriber"
        stored_prefs = preferences.get_preferences("user-a")
        assert stored_prefs is not None
        assert stored_prefs.interfaceLanguage == "ro"

        assert editorial_repo._root == editorial
        assert (editorial / "editorial" / "content-store.json").is_file()
        assert languages.path == editorial / "config" / "public-languages.json"
        assert languages.path.is_file()

    def test_shared_root_when_commercial_unset(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        monkeypatch.delenv(COMMERCIAL_DATA_DIR_ENV, raising=False)
        monkeypatch.delenv("EDITORIAL_CONTENT_MODE", raising=False)

        entitlements = FilesystemEntitlementsRepository()
        preferences = FilesystemPreferencesRepository()
        editorial_repo = FilesystemContentRepository()

        entitlements.save_access_tier("user-b", "free")
        preferences.save_preferences(
            "user-b",
            UserPreferences(interfaceLanguage="en", lengthUnit="in", volumeUnit="ml"),
        )

        assert (tmp_path / "entitlements" / "user-b.json").is_file()
        assert (tmp_path / "preferences" / "user-b.json").is_file()
        assert editorial_repo._root == tmp_path
        assert (tmp_path / "editorial" / "content-store.json").is_file()
