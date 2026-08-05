import tempfile
from pathlib import Path

import pytest

from content.repositories.filesystem import (
    FilesystemContentRepository,
    default_content_root,
    validate_strict_content_root,
)


def assert_no_probe_files(root: Path) -> None:
    assert list(root.glob(".hfzwood-write-check-*")) == []


def test_strict_root_requires_explicit_content_data_dir(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.delenv("CONTENT_DATA_DIR", raising=False)

    with pytest.raises(RuntimeError, match="CONTENT_DATA_DIR must be set"):
        validate_strict_content_root(default_content_root())


def test_strict_root_rejects_missing_directory(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    missing_path = tmp_path / "missing"
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(missing_path))

    with pytest.raises(RuntimeError, match="does not exist"):
        validate_strict_content_root(default_content_root())


def test_strict_root_rejects_non_directory_path(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    not_a_directory = tmp_path / "content-root.txt"
    not_a_directory.write_text("not a directory", encoding="utf-8")
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(not_a_directory))

    with pytest.raises(RuntimeError, match="is not a directory"):
        validate_strict_content_root(default_content_root())


def test_strict_root_rejects_unwritable_directory(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))

    def fail_named_temporary_file(*args, **kwargs):
        raise OSError("permission denied")

    monkeypatch.setattr(tempfile, "NamedTemporaryFile", fail_named_temporary_file)

    with pytest.raises(RuntimeError, match="is not writable"):
        validate_strict_content_root(default_content_root())


def test_strict_root_allows_existing_writable_directory(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))

    validate_strict_content_root(default_content_root())

    assert_no_probe_files(tmp_path)
    assert not (tmp_path / "editorial").exists()
    assert not (tmp_path / "published").exists()
    assert not (tmp_path / "editorial" / "content-store.json").exists()


def test_repository_initialization_still_creates_expected_structure(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))

    repository = FilesystemContentRepository()

    assert repository._root == tmp_path
    assert (tmp_path / "editorial" / "content-store.json").is_file()
    assert (tmp_path / "published").is_dir()


def test_non_strict_mode_preserves_existing_local_fallback_behavior(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("REQUIRE_CONTENT_DATA_DIR", raising=False)
    monkeypatch.delenv("CONTENT_DATA_DIR", raising=False)

    repository = FilesystemContentRepository()

    assert repository._root == default_content_root()
