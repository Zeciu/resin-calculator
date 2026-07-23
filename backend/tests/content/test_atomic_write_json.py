"""Focused tests for transient Windows file-access retries (read + atomic replace)."""

from __future__ import annotations

import errno
import json
from pathlib import Path

import pytest

from content.repositories import filesystem as filesystem_module
from content.repositories.filesystem import (
    TRANSIENT_FILE_ACCESS_MAX_ATTEMPTS,
    TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS,
    FilesystemContentRepository,
    _retry_transient_file_access,
    atomic_write_json,
)
from content.services.glossary_publish import GlossaryPublishService
from content.services.reference_search import ReferenceSearchService


def _access_denied(winerror: int = 5) -> PermissionError:
    exc = PermissionError(errno.EACCES, "Access is denied")
    exc.winerror = winerror
    return exc


def _sharing_violation() -> OSError:
    exc = OSError(
        errno.EACCES,
        "The process cannot access the file because it is being used by another process",
    )
    exc.winerror = 32
    return exc


def _eacces() -> OSError:
    return OSError(errno.EACCES, "Permission denied")


def _eperm() -> OSError:
    return OSError(errno.EPERM, "Operation not permitted")


class TestRetryTransientFileAccessHelper:
    def test_succeeds_on_first_attempt_without_sleep(self):
        sleeps: list[float] = []
        calls = {"n": 0}

        def op():
            calls["n"] += 1
            return "ok"

        assert _retry_transient_file_access(op, sleep=sleeps.append) == "ok"
        assert calls["n"] == 1
        assert sleeps == []

    def test_winerror_5_retries_then_succeeds(self):
        sleeps: list[float] = []
        attempts = {"n": 0}

        def op():
            attempts["n"] += 1
            if attempts["n"] <= 3:
                raise _access_denied(5)
            return "recovered"

        assert _retry_transient_file_access(op, sleep=sleeps.append) == "recovered"
        assert attempts["n"] == 4
        assert sleeps == list(TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS[:3])

    def test_winerror_32_succeeds_on_later_attempt(self):
        sleeps: list[float] = []
        attempts = {"n": 0}

        def op():
            attempts["n"] += 1
            if attempts["n"] == 1:
                raise _sharing_violation()
            return "shared-ok"

        assert _retry_transient_file_access(op, sleep=sleeps.append) == "shared-ok"
        assert attempts["n"] == 2
        assert sleeps == [TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS[0]]

    def test_eacces_and_eperm_are_retryable(self):
        for factory in (_eacces, _eperm):
            sleeps: list[float] = []
            attempts = {"n": 0}

            def op(factory=factory):
                attempts["n"] += 1
                if attempts["n"] == 1:
                    raise factory()
                return "ok"

            assert _retry_transient_file_access(op, sleep=sleeps.append) == "ok"
            assert attempts["n"] == 2
            assert sleeps == [TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS[0]]

    def test_exhausted_retries_reraise_final_exception(self):
        sleeps: list[float] = []
        attempts = {"n": 0}

        def op():
            attempts["n"] += 1
            raise _access_denied(5)

        with pytest.raises(PermissionError) as exc_info:
            _retry_transient_file_access(op, sleep=sleeps.append)
        assert exc_info.value.winerror == 5
        assert attempts["n"] == TRANSIENT_FILE_ACCESS_MAX_ATTEMPTS
        assert sleeps == list(TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS)

    def test_unrelated_oserror_is_not_retried(self):
        sleeps: list[float] = []
        attempts = {"n": 0}

        def op():
            attempts["n"] += 1
            raise OSError("disk full")

        with pytest.raises(OSError, match="disk full"):
            _retry_transient_file_access(op, sleep=sleeps.append)
        assert attempts["n"] == 1
        assert sleeps == []

    def test_non_oserror_is_not_retried(self):
        sleeps: list[float] = []
        attempts = {"n": 0}

        def op():
            attempts["n"] += 1
            raise ValueError("not a filesystem error")

        with pytest.raises(ValueError, match="not a filesystem error"):
            _retry_transient_file_access(op, sleep=sleeps.append)
        assert attempts["n"] == 1
        assert sleeps == []


class TestAtomicWriteJsonRetry:
    def test_replace_succeeds_on_first_attempt(self, tmp_path: Path, monkeypatch):
        target = tmp_path / "content-store.json"
        target.write_text('{"records": {}}', encoding="utf-8")
        sleeps: list[float] = []
        calls = {"n": 0}
        real_replace = filesystem_module.os.replace

        def tracking_replace(source, dest):
            calls["n"] += 1
            return real_replace(source, dest)

        monkeypatch.setattr(filesystem_module.os, "replace", tracking_replace)
        atomic_write_json(target, {"records": {"ok": True}}, sleep=sleeps.append)

        assert calls["n"] == 1
        assert sleeps == []
        assert json.loads(target.read_text(encoding="utf-8")) == {"records": {"ok": True}}
        assert list(tmp_path.glob(".content-store.json.tmp-*")) == []

    def test_replace_succeeds_beyond_old_point_three_five_second_window(
        self, tmp_path: Path, monkeypatch
    ):
        """Old window: 4 attempts / ~0.35s sleep. Succeed on attempt 5."""
        target = tmp_path / "content-store.json"
        target.write_text('{"records": {"old": true}}', encoding="utf-8")
        sleeps: list[float] = []
        attempts = {"n": 0}
        real_replace = filesystem_module.os.replace

        def flaky_replace(source, dest):
            attempts["n"] += 1
            if attempts["n"] <= 4:
                raise _access_denied(5)
            return real_replace(source, dest)

        monkeypatch.setattr(filesystem_module.os, "replace", flaky_replace)
        atomic_write_json(target, {"records": {"new": True}}, sleep=sleeps.append)

        assert attempts["n"] == 5
        assert sleeps == list(TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS[:4])
        assert sum(sleeps) > 0.35
        assert json.loads(target.read_text(encoding="utf-8")) == {"records": {"new": True}}
        assert list(tmp_path.glob(".content-store.json.tmp-*")) == []

    def test_all_attempts_fail_preserves_destination(self, tmp_path: Path, monkeypatch):
        target = tmp_path / "content-store.json"
        original = {"records": {"keep": True}}
        target.write_text(json.dumps(original), encoding="utf-8")
        sleeps: list[float] = []
        attempts = {"n": 0}

        def always_fail(source, dest):
            attempts["n"] += 1
            raise _access_denied(5)

        monkeypatch.setattr(filesystem_module.os, "replace", always_fail)
        with pytest.raises(PermissionError) as exc_info:
            atomic_write_json(target, {"records": {"lost": True}}, sleep=sleeps.append)

        assert exc_info.value.winerror == 5
        assert attempts["n"] == TRANSIENT_FILE_ACCESS_MAX_ATTEMPTS
        assert sleeps == list(TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS)
        assert json.loads(target.read_text(encoding="utf-8")) == original
        assert list(tmp_path.glob(".content-store.json.tmp-*")) == []

    def test_winerror_32_is_retryable(self, tmp_path: Path, monkeypatch):
        target = tmp_path / "content-store.json"
        target.write_text('{"records": {}}', encoding="utf-8")
        sleeps: list[float] = []
        attempts = {"n": 0}
        real_replace = filesystem_module.os.replace

        def flaky_replace(source, dest):
            attempts["n"] += 1
            if attempts["n"] == 1:
                raise _sharing_violation()
            return real_replace(source, dest)

        monkeypatch.setattr(filesystem_module.os, "replace", flaky_replace)
        atomic_write_json(target, {"records": {"shared": True}}, sleep=sleeps.append)

        assert attempts["n"] == 2
        assert sleeps == [TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS[0]]
        assert json.loads(target.read_text(encoding="utf-8"))["records"]["shared"] is True

    def test_unrelated_oserror_is_not_retried(self, tmp_path: Path, monkeypatch):
        target = tmp_path / "content-store.json"
        original = {"records": {"stable": True}}
        target.write_text(json.dumps(original), encoding="utf-8")
        sleeps: list[float] = []
        attempts = {"n": 0}

        def fail_once(source, dest):
            attempts["n"] += 1
            raise OSError("replace failed")

        monkeypatch.setattr(filesystem_module.os, "replace", fail_once)
        with pytest.raises(OSError, match="replace failed"):
            atomic_write_json(target, {"records": {"nope": True}}, sleep=sleeps.append)

        assert attempts["n"] == 1
        assert sleeps == []
        assert json.loads(target.read_text(encoding="utf-8")) == original
        assert list(tmp_path.glob(".content-store.json.tmp-*")) == []


class TestEditorialStoreReadRetry:
    def test_read_recovers_from_transient_open_permission_error(
        self, tmp_path: Path, monkeypatch
    ):
        repository = FilesystemContentRepository(tmp_path)
        repository.create_glossary_entry("Alpha", content_id="alpha")
        sleeps: list[float] = []
        attempts = {"n": 0}
        real_open = Path.open

        def flaky_open(self, *args, **kwargs):
            if self == repository._store_path and args and args[0] == "r":
                attempts["n"] += 1
                if attempts["n"] == 1:
                    raise _access_denied(5)
            return real_open(self, *args, **kwargs)

        monkeypatch.setattr(Path, "open", flaky_open)
        original_retry = filesystem_module._retry_transient_file_access

        def retry_with_recorded_sleep(operation, *, sleep=None):
            return original_retry(
                operation, sleep=sleeps.append if sleep is None else sleep
            )

        monkeypatch.setattr(
            filesystem_module, "_retry_transient_file_access", retry_with_recorded_sleep
        )

        records = repository._read_store()
        assert any("alpha" in key for key in records)
        assert attempts["n"] == 2
        assert sleeps == [TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS[0]]

    def test_read_exhausted_permission_errors_propagate(self, tmp_path: Path, monkeypatch):
        repository = FilesystemContentRepository(tmp_path)
        repository.create_glossary_entry("Beta", content_id="beta")
        attempts = {"n": 0}
        real_open = Path.open

        def always_fail_open(self, *args, **kwargs):
            if self == repository._store_path and args and args[0] == "r":
                attempts["n"] += 1
                raise _access_denied(5)
            return real_open(self, *args, **kwargs)

        monkeypatch.setattr(Path, "open", always_fail_open)
        monkeypatch.setattr(filesystem_module.time, "sleep", lambda _seconds: None)

        with pytest.raises(PermissionError):
            repository._read_store()
        assert attempts["n"] == TRANSIENT_FILE_ACCESS_MAX_ATTEMPTS

    def test_malformed_json_is_not_retried(self, tmp_path: Path, monkeypatch):
        repository = FilesystemContentRepository(tmp_path)
        repository._store_path.write_text("{not-json", encoding="utf-8")
        sleeps: list[float] = []
        original_retry = filesystem_module._retry_transient_file_access

        def retry_with_recorded_sleep(operation, *, sleep=None):
            return original_retry(
                operation, sleep=sleeps.append if sleep is None else sleep
            )

        monkeypatch.setattr(
            filesystem_module, "_retry_transient_file_access", retry_with_recorded_sleep
        )

        with pytest.raises(json.JSONDecodeError):
            repository._read_store()
        assert sleeps == []


def _glossary_body(term: str = "Termen", definition: str = "Definiție.") -> dict:
    return {
        "term": term,
        "definitionBlocks": [{"type": "paragraph", "text": definition}],
        "media": [],
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


class TestGlossaryPublishAtomicReplaceRetry:
    def test_publish_recovers_beyond_old_retry_window(self, tmp_path: Path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        repository = FilesystemContentRepository(tmp_path)
        meta = repository.create_glossary_entry("Termen", content_id="termen")
        content_id = meta["contentId"]
        repository.save_glossary_variant(content_id, "ro", _glossary_body())

        store_path = repository._store_path
        attempts = {"n": 0}
        real_replace = filesystem_module.os.replace

        def flaky_replace(source, dest):
            if Path(dest) == store_path:
                attempts["n"] += 1
                if attempts["n"] <= 4:
                    raise _access_denied(5)
            return real_replace(source, dest)

        monkeypatch.setattr(filesystem_module.os, "replace", flaky_replace)
        monkeypatch.setattr(filesystem_module.time, "sleep", lambda _seconds: None)

        result = GlossaryPublishService(repository).publish_variant(content_id, "ro")
        assert result.status.value == "published"
        variant = repository.get_glossary_variant(content_id, "ro")
        assert variant is not None
        assert variant["status"] == "published"
        snapshot = repository.read_glossary_snapshot("ro")
        assert snapshot is not None
        assert any(entry.get("term") == "Termen" for entry in snapshot.get("entries", []))
        assert attempts["n"] == 5

    def test_publish_exhausted_replace_failures_leave_draft_and_snapshot(
        self, tmp_path: Path, monkeypatch
    ):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        repository = FilesystemContentRepository(tmp_path)
        meta = repository.create_glossary_entry("Păstrat", content_id="pastrat")
        content_id = meta["contentId"]
        repository.save_glossary_variant(content_id, "ro", _glossary_body("Păstrat", "Text salvat."))

        before = repository.get_glossary_variant(content_id, "ro")
        assert before is not None
        assert before["status"] == "draft"
        store_before = json.loads(repository._store_path.read_text(encoding="utf-8"))
        snapshot_before = repository.read_glossary_snapshot("ro")

        store_path = repository._store_path
        real_replace = filesystem_module.os.replace

        def always_fail_store(source, dest):
            if Path(dest) == store_path:
                raise _access_denied(5)
            return real_replace(source, dest)

        monkeypatch.setattr(filesystem_module.os, "replace", always_fail_store)
        monkeypatch.setattr(filesystem_module.time, "sleep", lambda _seconds: None)

        with pytest.raises(PermissionError):
            GlossaryPublishService(repository).publish_variant(content_id, "ro")

        after = repository.get_glossary_variant(content_id, "ro")
        assert after is not None
        assert after["status"] == "draft"
        assert after["draftBody"]["term"] == "Păstrat"
        assert after["draftBody"]["definitionBlocks"][0]["text"] == "Text salvat."
        assert json.loads(repository._store_path.read_text(encoding="utf-8")) == store_before
        assert repository.read_glossary_snapshot("ro") == snapshot_before
        assert list(store_path.parent.glob(".content-store.json.tmp-*")) == []


class TestReferenceSearchReadRetry:
    def test_reference_search_recovers_from_transient_read_lock(
        self, tmp_path: Path, monkeypatch
    ):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        repository = FilesystemContentRepository(tmp_path)
        repository.create_glossary_entry("Căutare", content_id="cautare")
        repository.save_glossary_variant(
            "cautare", "ro", _glossary_body("Căutare", "Definiție de test.")
        )

        attempts = {"n": 0}
        real_open = Path.open

        def flaky_open(self, *args, **kwargs):
            if self == repository._store_path and args and args[0] == "r":
                attempts["n"] += 1
                if attempts["n"] == 1:
                    raise PermissionError(errno.EACCES, "Permission denied")
            return real_open(self, *args, **kwargs)

        monkeypatch.setattr(Path, "open", flaky_open)
        monkeypatch.setattr(filesystem_module.time, "sleep", lambda _seconds: None)

        results = ReferenceSearchService(repository).search_references(
            "Căutare", "ro", published_only=False
        )
        assert attempts["n"] >= 2
        assert any(getattr(item, "contentId", None) == "cautare" for item in results)


class TestSharedPersistenceRegression:
    def test_manual_create_still_persists_through_shared_atomic_write(self, tmp_path: Path):
        repository = FilesystemContentRepository(tmp_path)
        meta = repository.create_manual_chapter("Capitol", content_id="capitol")
        assert meta["contentId"] == "capitol"
        variant = repository.get_manual_variant("capitol", "ro")
        assert variant is not None
        assert variant["draftBody"]["title"] == "Capitol"
