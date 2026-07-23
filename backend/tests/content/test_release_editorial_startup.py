"""Task B1 — EDITORIAL_CONTENT_MODE=release startup validation."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

from content.editorial_content_mode import EDITORIAL_CONTENT_MODE_ENV
from content.repositories.filesystem import (
    FilesystemContentRepository,
    atomic_write_json,
    required_release_artifacts,
    validate_release_editorial_root,
)


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def build_valid_release_corpus(root: Path) -> None:
    _write_json(root / "editorial" / "content-store.json", {"records": {}})
    _write_json(root / "published" / "manual" / "en" / "document.json", {"locale": "en", "chapters": []})
    _write_json(root / "published" / "glossary" / "en" / "entries.json", {"locale": "en", "entries": []})
    _write_json(
        root / "published" / "knowledge-base" / "en" / "entries.json",
        {"locale": "en", "entries": []},
    )
    _write_json(root / "published" / "website" / "en" / "pages.json", {"locale": "en", "pages": []})
    _write_json(
        root / "config" / "public-languages.json",
        {"defaultPublicLocale": "en", "activePublicLocales": ["en"]},
    )


def import_app_release(monkeypatch: pytest.MonkeyPatch, content_data_dir: str) -> None:
    monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "release")
    monkeypatch.setenv("CONTENT_DATA_DIR", content_data_dir)
    monkeypatch.delenv("REQUIRE_CONTENT_DATA_DIR", raising=False)
    monkeypatch.setenv("AUTH_MODE", "mock")
    monkeypatch.delenv("COGNITO_USER_POOL_ID", raising=False)
    monkeypatch.delenv("COGNITO_REGION", raising=False)

    app_path = Path(__file__).resolve().parents[2] / "app.py"
    spec = importlib.util.spec_from_file_location("release_startup_probe", app_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)


class TestValidateReleaseEditorialRoot:
    def test_succeeds_with_valid_corpus(self, tmp_path: Path):
        build_valid_release_corpus(tmp_path)
        validate_release_editorial_root(tmp_path)
        assert set(required_release_artifacts(tmp_path)) == {
            tmp_path / "editorial" / "content-store.json",
            tmp_path / "published" / "manual" / "en" / "document.json",
            tmp_path / "published" / "glossary" / "en" / "entries.json",
            tmp_path / "published" / "knowledge-base" / "en" / "entries.json",
            tmp_path / "published" / "website" / "en" / "pages.json",
            tmp_path / "config" / "public-languages.json",
        }

    def test_missing_root_fails(self, tmp_path: Path):
        missing = tmp_path / "absent"
        with pytest.raises(RuntimeError, match="does not exist"):
            validate_release_editorial_root(missing)

    def test_missing_artifact_fails(self, tmp_path: Path):
        build_valid_release_corpus(tmp_path)
        (tmp_path / "config" / "public-languages.json").unlink()
        with pytest.raises(RuntimeError, match="missing required artifact: config/public-languages.json"):
            validate_release_editorial_root(tmp_path)

    def test_malformed_json_fails(self, tmp_path: Path):
        build_valid_release_corpus(tmp_path)
        store = tmp_path / "editorial" / "content-store.json"
        store.write_text("{not-json", encoding="utf-8")
        with pytest.raises(RuntimeError, match="invalid JSON: editorial/content-store.json"):
            validate_release_editorial_root(tmp_path)

    def test_content_store_without_records_object_fails(self, tmp_path: Path):
        build_valid_release_corpus(tmp_path)
        _write_json(tmp_path / "editorial" / "content-store.json", {"records": []})
        with pytest.raises(RuntimeError, match="records object"):
            validate_release_editorial_root(tmp_path)


class TestReleaseRepositoryStartup:
    def test_repository_opens_valid_corpus_without_writes(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        build_valid_release_corpus(tmp_path)
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "release")

        writes: list[Path] = []

        def forbid_write(path, payload, sleep=None):
            writes.append(path)
            raise AssertionError(f"unexpected write to {path}")

        monkeypatch.setattr(
            "content.repositories.filesystem.atomic_write_json",
            forbid_write,
        )

        repository = FilesystemContentRepository(tmp_path)
        assert repository._root == tmp_path
        assert repository._store_path == tmp_path / "editorial" / "content-store.json"
        assert writes == []
        assert repository._read_store() == {}

    def test_repository_does_not_create_missing_store(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "release")
        with pytest.raises(RuntimeError, match="missing required artifact"):
            FilesystemContentRepository(tmp_path)
        assert not (tmp_path / "editorial").exists()

    def test_app_startup_succeeds_with_valid_corpus(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        build_valid_release_corpus(tmp_path)
        import_app_release(monkeypatch, str(tmp_path))

    def test_app_startup_fails_when_artifact_missing(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        build_valid_release_corpus(tmp_path)
        (tmp_path / "published" / "glossary" / "en" / "entries.json").unlink()
        with pytest.raises(RuntimeError, match="missing required artifact"):
            import_app_release(monkeypatch, str(tmp_path))


class TestWritableModeUnchanged:
    def test_writable_still_creates_store_when_missing(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.delenv(EDITORIAL_CONTENT_MODE_ENV, raising=False)
        monkeypatch.delenv("REQUIRE_CONTENT_DATA_DIR", raising=False)
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))

        repository = FilesystemContentRepository()
        assert (tmp_path / "editorial" / "content-store.json").is_file()
        assert (tmp_path / "published").is_dir()
        # Website pages are ensured in writable mode.
        assert "website" in json.dumps(repository._read_store())

    def test_writable_allows_atomic_write_after_init(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.delenv(EDITORIAL_CONTENT_MODE_ENV, raising=False)
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        repository = FilesystemContentRepository()
        target = tmp_path / "published" / "glossary" / "ro" / "entries.json"
        atomic_write_json(target, {"locale": "ro", "entries": []})
        assert target.is_file()
