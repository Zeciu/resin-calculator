"""Task B — bulk translation preview and chunked update."""

from __future__ import annotations

from typing import Any, Literal

import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_manual, admin_translation_bulk, public_content
from content.services.translation_bulk import (
    TranslationBulkService,
    reset_bulk_run_locks_for_tests,
)
from content.services.translation_update import TranslationUpdateService
from content.translation.types import TranslationResult


class FakeTranslationProvider:
    def __init__(self, *, fail_on_titles: set[str] | None = None) -> None:
        self.calls: list[dict[str, Any]] = []
        self.batch_calls: list[dict[str, Any]] = []
        self.fail_on_titles = fail_on_titles or set()

    def translate(
        self,
        text: str,
        *,
        source_locale: str,
        target_locale: str,
        context: str | None = None,
        content_format: Literal["plain", "html"] = "html",
        glossary_id: str | None = None,
    ) -> TranslationResult:
        return self.translate_many(
            [text],
            source_locale=source_locale,
            target_locale=target_locale,
            context=context,
            content_format=content_format,
            glossary_id=glossary_id,
        )[0]

    def translate_many(
        self,
        texts: list[str],
        *,
        source_locale: str,
        target_locale: str,
        context: str | None = None,
        content_format: Literal["plain", "html"] = "html",
        glossary_id: str | None = None,
    ) -> list[TranslationResult]:
        self.batch_calls.append(
            {
                "texts": list(texts),
                "target_locale": target_locale,
                "context": context,
            }
        )
        results: list[TranslationResult] = []
        for text in texts:
            self.calls.append({"text": text, "target_locale": target_locale})
            if text in self.fail_on_titles or (context and context in self.fail_on_titles):
                from content.translation.exceptions import TranslationTemporaryProviderError

                raise TranslationTemporaryProviderError("provider boom")
            results.append(
                TranslationResult(
                    text=f"[{target_locale}]{text}",
                    provider="deepl",
                    source_locale=source_locale,
                    target_locale=target_locale,
                    billed_characters=len(text),
                )
            )
        return results


@pytest.fixture
def repository(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    reset_bulk_run_locks_for_tests()
    return FilesystemContentRepository(tmp_path)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_manual.reset_repository_cache()
    admin_translation_bulk.reset_repository_cache()
    public_content.reset_repository_cache()
    reset_bulk_run_locks_for_tests()
    from app import app

    return TestClient(app)


def admin_headers():
    return {"X-Mock-Role": "administrator", "X-Mock-User-Id": "admin-user"}


def manual_body(title="Capitol", paragraph="Text.", *, blocks=None):
    return {
        "title": title,
        "sections": [
            {
                "id": "main",
                "title": "",
                "blocks": blocks
                if blocks is not None
                else [{"type": "paragraph", "text": paragraph}],
            }
        ],
    }


def seed_chapter(repo, title, paragraph="Text."):
    meta = repo.create_manual_chapter(title)
    cid = meta["contentId"]
    repo.save_manual_variant(cid, "ro", manual_body(title, paragraph))
    return cid


class TestBulkPreviewAndUpdate:
    def test_preview_tracks_ro_draft_revision_changes(self, repository):
        """PO regression: preview must match single-item after RO media/text edits."""
        cid = seed_chapter(repository, "TrackMe", paragraph="Hello")
        provider = FakeTranslationProvider()
        updater = TranslationUpdateService(repository, provider=provider)
        updater.update(module="manual", content_id=cid, target_locale="en")

        bulk = TranslationBulkService(repository, provider=provider)
        assert bulk.preview(module="manual", target_locale="en")["counts"]["current"] == 1

        repository.save_manual_variant(
            cid,
            "ro",
            manual_body(
                "TrackMe",
                blocks=[
                    {"type": "paragraph", "text": "Hello"},
                    {"type": "image", "src": "/media.png", "alt": "", "caption": ""},
                ],
            ),
        )
        _, _, after_media = updater.classify_item(
            module="manual", content_id=cid, target_locale="en"
        )
        preview_media = bulk.preview(module="manual", target_locale="en")
        assert after_media.state.value == "media_only_outdated"
        assert preview_media["counts"]["mediaOnlyOutdated"] == 1
        assert preview_media["counts"]["current"] == 0
        assert preview_media["items"][0]["state"] == "media_only_outdated"

        updater.update(module="manual", content_id=cid, target_locale="en")
        assert bulk.preview(module="manual", target_locale="en")["counts"]["current"] == 1

        repository.save_manual_variant(
            cid,
            "ro",
            manual_body(
                "TrackMe",
                blocks=[
                    {"type": "paragraph", "text": "Hello changed"},
                    {"type": "image", "src": "/media.png", "alt": "", "caption": ""},
                ],
            ),
        )
        _, _, after_text = updater.classify_item(
            module="manual", content_id=cid, target_locale="en"
        )
        preview_text = bulk.preview(module="manual", target_locale="en")
        assert after_text.state.value == "text_outdated"
        assert preview_text["counts"]["textOutdated"] == 1
        assert preview_text["counts"]["current"] == 0
        assert preview_text["items"][0]["state"] == "text_outdated"

    def test_preview_counts_and_no_deepl(self, repository):
        seed_chapter(repository, "Missing")
        current_id = seed_chapter(repository, "Current")
        media_id = seed_chapter(repository, "Media")
        text_id = seed_chapter(repository, "Text")
        manual_id = seed_chapter(repository, "Manual")

        provider = FakeTranslationProvider()
        updater = TranslationUpdateService(repository, provider=provider)
        updater.update(module="manual", content_id=current_id, target_locale="en")
        updater.update(module="manual", content_id=media_id, target_locale="en")
        updater.update(module="manual", content_id=text_id, target_locale="en")
        repository.save_manual_variant(
            manual_id, "en", manual_body("Manual EN", "Human.")
        )

        blocks = [
            {"type": "paragraph", "text": "Text."},
            {"type": "image", "src": "/a.png", "alt": "", "caption": ""},
        ]
        repository.save_manual_variant(media_id, "ro", manual_body("Media", blocks=blocks))
        repository.save_manual_variant(
            text_id, "ro", manual_body("Text", paragraph="Changed.")
        )

        calls_before = len(provider.calls)
        bulk = TranslationBulkService(repository, provider=provider)
        preview = bulk.preview(module="manual", target_locale="en")
        assert len(provider.calls) == calls_before
        assert preview["counts"]["missing"] >= 1
        assert preview["counts"]["current"] >= 1
        assert preview["counts"]["mediaOnlyOutdated"] >= 1
        assert preview["counts"]["textOutdated"] >= 1
        assert preview["counts"]["manualUntracked"] >= 1

    def test_execution_policies(self, repository):
        missing_id = seed_chapter(repository, "MissingOne")
        current_id = seed_chapter(repository, "CurrentOne")
        media_id = seed_chapter(repository, "MediaOne")
        text_id = seed_chapter(repository, "TextOne")
        manual_id = seed_chapter(repository, "ManualOne")

        provider = FakeTranslationProvider()
        updater = TranslationUpdateService(repository, provider=provider)
        updater.update(module="manual", content_id=current_id, target_locale="fr")
        updater.update(module="manual", content_id=media_id, target_locale="fr")
        updater.update(module="manual", content_id=text_id, target_locale="fr")
        repository.save_manual_variant(
            manual_id, "fr", manual_body("Manual FR", "Human.")
        )
        repository.save_manual_variant(
            media_id,
            "ro",
            manual_body(
                "MediaOne",
                blocks=[
                    {"type": "paragraph", "text": "Text."},
                    {"type": "image", "src": "/new.png", "alt": "", "caption": ""},
                ],
            ),
        )
        repository.save_manual_variant(
            text_id, "ro", manual_body("TextOne", paragraph="Changed FR.")
        )

        calls_before = len(provider.calls)
        bulk = TranslationBulkService(repository, provider=provider)
        result = bulk.process_chunk(
            module="manual",
            target_locale="fr",
            include_text_outdated=False,
            offset=0,
            limit=50,
        )
        assert result["done"] is True
        by_id = {item["contentId"]: item for item in result["items"]}
        assert by_id[missing_id]["action"] == "generate_full"
        assert by_id[missing_id]["finalState"] == "current"
        assert by_id[current_id]["action"] == "skip_current"
        assert by_id[media_id]["action"] == "sync_media_only"
        assert by_id[media_id]["providerCalled"] is False
        assert by_id[text_id]["action"] == "skip_text_outdated"
        assert by_id[manual_id]["action"] == "skip_manual_untracked"
        assert repository.get_manual_variant(manual_id, "fr")["draftBody"]["title"] == "Manual FR"
        assert len(provider.calls) > calls_before
        media_fr = repository.get_manual_variant(media_id, "fr")
        assert media_fr["draftBody"]["sections"][0]["blocks"][1]["src"] == "/new.png"

    def test_text_outdated_included_when_enabled(self, repository):
        text_id = seed_chapter(repository, "RegenMe")
        provider = FakeTranslationProvider()
        updater = TranslationUpdateService(repository, provider=provider)
        updater.update(module="manual", content_id=text_id, target_locale="en")
        repository.save_manual_variant(
            text_id, "ro", manual_body("RegenMe", paragraph="New text.")
        )
        bulk = TranslationBulkService(repository, provider=provider)
        result = bulk.process_chunk(
            module="manual",
            target_locale="en",
            include_text_outdated=True,
            offset=0,
            limit=20,
        )
        item = next(i for i in result["items"] if i["contentId"] == text_id)
        assert item["action"] == "generate_full"
        assert item["finalState"] == "current"
        assert item["providerCalled"] is True

    def test_partial_failure_continues(self, repository):
        good = seed_chapter(repository, "Good")
        bad = seed_chapter(repository, "Bad")
        provider = FakeTranslationProvider(fail_on_titles={"Bad"})
        bulk = TranslationBulkService(repository, provider=provider)
        result = bulk.process_chunk(
            module="manual", target_locale="en", offset=0, limit=20
        )
        by_id = {i["contentId"]: i for i in result["items"]}
        assert by_id[good]["status"] == "completed"
        assert by_id[bad]["status"] == "failed"
        assert repository.get_manual_variant(good, "en") is not None
        assert repository.get_manual_variant(bad, "en") is None

    def test_published_and_ro_untouched(self, repository):
        cid = seed_chapter(repository, "Pub")
        provider = FakeTranslationProvider()
        updater = TranslationUpdateService(repository, provider=provider)
        updater.update(module="manual", content_id=cid, target_locale="en")
        repository.publish_manual_variant(cid, "en")
        snap_before = repository.read_manual_snapshot("en")

        repository.save_manual_variant(
            cid,
            "ro",
            manual_body(
                "Pub",
                blocks=[
                    {"type": "paragraph", "text": "Text."},
                    {"type": "image", "src": "/x.png", "alt": "", "caption": ""},
                ],
            ),
        )
        TranslationBulkService(repository, provider=provider).process_chunk(
            module="manual", target_locale="en", offset=0, limit=20
        )
        assert repository.read_manual_snapshot("en") == snap_before
        assert repository.get_manual_variant(cid, "ro")["draftBody"]["title"] == "Pub"
        assert repository.get_manual_variant(cid, "de") is None

    def test_duplicate_run_rejected(self, repository):
        seed_chapter(repository, "Lock")
        provider = FakeTranslationProvider()
        bulk = TranslationBulkService(repository, provider=provider)
        from content.services import translation_bulk as tb

        key = ("manual", "en")
        with tb._bulk_locks_guard:
            tb._bulk_locks[key] = __import__("threading").Lock()
            tb._bulk_locks[key].acquire()
            tb._active_runs.add(key)
        try:
            with pytest.raises(Exception):
                bulk.process_chunk(module="manual", target_locale="en", offset=0, limit=1)
        finally:
            reset_bulk_run_locks_for_tests()

        out = bulk.process_chunk(module="manual", target_locale="en", offset=0, limit=20)
        assert out["done"] is True

    def test_ro_locale_rejected(self, repository):
        seed_chapter(repository, "RO")
        bulk = TranslationBulkService(repository, provider=FakeTranslationProvider())
        with pytest.raises(Exception):
            bulk.preview(module="manual", target_locale="ro")

    def test_api_preview_and_chunk(self, client, monkeypatch):
        from content.services import translation_bulk as bulk_mod

        fake = FakeTranslationProvider()

        monkeypatch.setattr(
            "content.routers.admin_translation_bulk.TranslationBulkService",
            lambda repo, provider=None: TranslationBulkService(repo, provider=provider or fake),
        )

        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "API Chapter"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            json={"body": manual_body("API Chapter", "Body.")},
            headers=admin_headers(),
        )

        preview = client.post(
            "/api/admin/manual/translations/en/bulk-preview",
            json={"includeTextOutdated": False},
            headers=admin_headers(),
        )
        assert preview.status_code == 200
        assert preview.json()["counts"]["missing"] >= 1

        update = client.post(
            "/api/admin/manual/translations/en/bulk-update",
            json={"includeTextOutdated": False, "offset": 0, "limit": 10},
            headers=admin_headers(),
        )
        assert update.status_code == 200
        body = update.json()
        assert body["done"] is True
        assert any(i["action"] == "generate_full" for i in body["items"])

        conflict_ro = client.post(
            "/api/admin/manual/translations/ro/bulk-preview",
            json={},
            headers=admin_headers(),
        )
        assert conflict_ro.status_code == 400


class RateLimitedProvider(FakeTranslationProvider):
    def __init__(self, *, fail_on_titles: set[str] | None = None) -> None:
        super().__init__(fail_on_titles=fail_on_titles)

    def translate_many(self, texts, **kwargs):
        self.batch_calls.append({"texts": list(texts), "target_locale": kwargs.get("target_locale")})
        context = kwargs.get("context")
        for text in texts:
            self.calls.append({"text": text, "target_locale": kwargs.get("target_locale")})
            if text in self.fail_on_titles or (context and context in self.fail_on_titles):
                from content.translation.exceptions import TranslationRateLimitedError

                raise TranslationRateLimitedError(
                    "DeepL rate limit exceeded.",
                    http_status=429,
                )
        return [
            TranslationResult(
                text=f"[{kwargs['target_locale']}]{text}",
                provider="deepl",
                source_locale=kwargs["source_locale"],
                target_locale=kwargs["target_locale"],
                billed_characters=len(text),
            )
            for text in texts
        ]


class QuotaExceededProvider(FakeTranslationProvider):
    def __init__(self, *, fail_on_titles: set[str] | None = None) -> None:
        super().__init__(fail_on_titles=fail_on_titles)

    def translate_many(self, texts, **kwargs):
        self.batch_calls.append({"texts": list(texts), "target_locale": kwargs.get("target_locale")})
        context = kwargs.get("context")
        for text in texts:
            self.calls.append({"text": text, "target_locale": kwargs.get("target_locale")})
            if text in self.fail_on_titles or (context and context in self.fail_on_titles):
                from content.translation.exceptions import TranslationQuotaExceededError

                raise TranslationQuotaExceededError(
                    "DeepL quota exceeded.",
                    http_status=456,
                )
        return [
            TranslationResult(
                text=f"[{kwargs['target_locale']}]{text}",
                provider="deepl",
                source_locale=kwargs["source_locale"],
                target_locale=kwargs["target_locale"],
                billed_characters=len(text),
            )
            for text in texts
        ]


class TestBulkEarlyStop:
    def test_rate_limit_stops_remaining_items(self, repository):
        first = seed_chapter(repository, "First")
        second = seed_chapter(repository, "Second")
        third = seed_chapter(repository, "Third")
        provider = RateLimitedProvider(fail_on_titles={"Second"})
        bulk = TranslationBulkService(repository, provider=provider)
        result = bulk.process_chunk(
            module="manual",
            target_locale="en",
            offset=0,
            limit=20,
        )
        assert result["stoppedEarly"] is True
        assert result["stopReason"] == "rate_limited"
        assert result["done"] is True
        assert result["nextOffset"] is None
        assert result["unprocessedCount"] >= 1
        by_id = {item["contentId"]: item for item in result["items"]}
        assert by_id[first]["status"] == "completed"
        assert by_id[second]["status"] == "failed"
        assert third not in by_id
        assert repository.get_manual_variant(first, "en") is not None
        assert repository.get_manual_variant(second, "en") is None
        assert repository.get_manual_variant(third, "en") is None
        assert result["chunkSummary"]["providerCallItems"] == 1
        assert result["chunkSummary"]["generated"] == 1
        assert result["chunkSummary"]["failed"] == 1

    def test_rerun_after_partial_rate_limit_skips_completed(self, repository):
        first = seed_chapter(repository, "AgainFirst")
        second = seed_chapter(repository, "AgainSecond")
        provider = RateLimitedProvider(fail_on_titles={"AgainSecond"})
        bulk = TranslationBulkService(repository, provider=provider)
        first_run = bulk.process_chunk(
            module="manual",
            target_locale="en",
            offset=0,
            limit=20,
        )
        assert first_run["stoppedEarly"] is True
        assert repository.get_manual_variant(first, "en") is not None

        provider2 = FakeTranslationProvider()
        bulk2 = TranslationBulkService(repository, provider=provider2)
        second_run = bulk2.process_chunk(
            module="manual",
            target_locale="en",
            offset=0,
            limit=20,
        )
        by_id = {item["contentId"]: item for item in second_run["items"]}
        assert by_id[first]["action"] == "skip_current"
        assert by_id[second]["action"] == "generate_full"
        assert by_id[second]["status"] == "completed"
        assert repository.get_manual_variant(second, "en") is not None
        assert second_run["stoppedEarly"] is False

    def test_quota_exceeded_stops_without_retrying_remaining(self, repository):
        first = seed_chapter(repository, "QuotaFirst")
        second = seed_chapter(repository, "QuotaSecond")
        third = seed_chapter(repository, "QuotaThird")
        provider = QuotaExceededProvider(fail_on_titles={"QuotaSecond"})
        bulk = TranslationBulkService(repository, provider=provider)
        result = bulk.process_chunk(
            module="manual",
            target_locale="en",
            offset=0,
            limit=20,
        )
        assert result["stoppedEarly"] is True
        assert result["stopReason"] == "quota_exceeded"
        assert result["unprocessedCount"] >= 1
        by_id = {item["contentId"]: item for item in result["items"]}
        assert by_id[first]["status"] == "completed"
        assert by_id[second]["status"] == "failed"
        assert third not in by_id
        assert repository.get_manual_variant(first, "en") is not None
        assert repository.get_manual_variant(third, "en") is None

    def test_ordinary_item_failure_does_not_stop_bulk(self, repository):
        good = seed_chapter(repository, "StillGood")
        bad = seed_chapter(repository, "StillBad")
        later = seed_chapter(repository, "StillLater")
        provider = FakeTranslationProvider(fail_on_titles={"StillBad"})
        bulk = TranslationBulkService(repository, provider=provider)
        result = bulk.process_chunk(
            module="manual",
            target_locale="en",
            offset=0,
            limit=20,
        )
        assert result["stoppedEarly"] is False
        by_id = {item["contentId"]: item for item in result["items"]}
        assert by_id[good]["status"] == "completed"
        assert by_id[bad]["status"] == "failed"
        assert by_id[later]["status"] == "completed"
        assert repository.get_manual_variant(later, "en") is not None

    def test_nothing_published_on_generate(self, repository):
        cid = seed_chapter(repository, "DraftOnly")
        bulk = TranslationBulkService(repository, provider=FakeTranslationProvider())
        bulk.process_chunk(module="manual", target_locale="en", offset=0, limit=20)
        variant = repository.get_manual_variant(cid, "en")
        assert variant is not None
        assert variant["status"] == "draft"
        assert repository.read_manual_snapshot("en") is None
