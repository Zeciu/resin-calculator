"""Write-durability guarantees of the editorial filesystem repository.

A failed os.replace must leave the previous JSON intact and must not leave
temp files behind.
"""

import json
from pathlib import Path

import pytest

from private.repositories import filesystem as filesystem_module
from private.repositories.filesystem import FilesystemContentRepository


def test_interrupted_store_write_does_not_corrupt_existing_json(tmp_path: Path) -> None:
    repository = FilesystemContentRepository(tmp_path)
    repository.create_manual_chapter("Existing Chapter", content_id="existing-chapter")
    original_payload = json.loads(repository._store_path.read_text(encoding="utf-8"))

    real_replace = filesystem_module.os.replace

    def fail_replace(source, target):
        if Path(target) == repository._store_path:
            raise OSError("replace failed")
        return real_replace(source, target)

    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr(filesystem_module.os, "replace", fail_replace)
        with pytest.raises(OSError, match="replace failed"):
            repository.create_manual_chapter("New Chapter", content_id="new-chapter")

    assert json.loads(repository._store_path.read_text(encoding="utf-8")) == original_payload
    assert list(repository._store_path.parent.glob(".content-store.json.tmp-*")) == []


def test_snapshot_write_failure_propagates_without_overwriting_existing_snapshot(tmp_path: Path) -> None:
    repository = FilesystemContentRepository(tmp_path)
    snapshot_path = tmp_path / "published" / "manual" / "en" / "document.json"
    repository.write_manual_snapshot("en", {"locale": "en", "chapters": [{"contentId": "existing"}]})
    original_payload = json.loads(snapshot_path.read_text(encoding="utf-8"))

    real_replace = filesystem_module.os.replace

    def fail_replace(source, target):
        if Path(target) == snapshot_path:
            raise OSError("snapshot replace failed")
        return real_replace(source, target)

    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr(filesystem_module.os, "replace", fail_replace)
        with pytest.raises(OSError, match="snapshot replace failed"):
            repository.write_manual_snapshot("en", {"locale": "en", "chapters": [{"contentId": "new"}]})

    assert json.loads(snapshot_path.read_text(encoding="utf-8")) == original_payload
    assert list(snapshot_path.parent.glob(".document.json.tmp-*")) == []
