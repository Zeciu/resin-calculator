"""Task 7.1.2 — Editorial translation metadata foundation tests."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_glossary, admin_knowledge_base, admin_manual, public_content
from content.translation_metadata import (
    TranslationFreshness,
    derive_translation_freshness,
    next_source_revision,
    was_edited_after_generation,
)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_manual.reset_repository_cache()
    admin_glossary.reset_repository_cache()
    admin_knowledge_base.reset_repository_cache()
    public_content.reset_repository_cache()
    from app import app

    return TestClient(app)


@pytest.fixture
def repository(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    return FilesystemContentRepository(tmp_path)


def admin_headers() -> dict[str, str]:
    return {
        "X-Mock-Role": "administrator",
        "X-Mock-User-Id": "admin-user",
    }


def manual_body(title: str = "Capitol", text: str = "Text.") -> dict:
    return {
        "title": title,
        "sections": [
            {
                "id": "main",
                "title": "",
                "blocks": [{"type": "paragraph", "text": text}],
            }
        ],
    }


def glossary_body(term: str = "Termen", text: str = "Definitie.") -> dict:
    return {
        "term": term,
        "definitionBlocks": [{"type": "paragraph", "text": text}],
        "media": [],
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


def kb_body(title: str = "Articol", summary: str = "Sumar.") -> dict:
    return {
        "title": title,
        "problemSummary": summary,
        "symptoms": [],
        "possibleCauses": [],
        "solution": ["Pas."],
        "prevention": [],
        "tips": [],
        "warnings": [],
        "searchKeywords": [],
        "estimatedRepairTime": None,
        "requiredTools": [],
        "requiredMaterials": [],
        "bodyBlocks": [],
        "media": [],
        "relatedKbEntryIds": [],
        "relatedGlossaryEntryIds": [],
        "relatedManualChapterIds": [],
    }


class TestSourceRevisionHelpers:
    def test_next_revision_starts_at_one_for_new_variant(self):
        assert next_source_revision(None, {"title": "A"}) == 1

    def test_next_revision_initialises_legacy_without_increment(self):
        existing = {"draftBody": {"title": "A"}, "sourceRevision": None}
        assert next_source_revision(existing, {"title": "B"}) == 1
        assert next_source_revision(existing, {"title": "A"}) == 1

    def test_next_revision_increments_only_when_body_changes(self):
        existing = {"draftBody": {"title": "A"}, "sourceRevision": 3}
        assert next_source_revision(existing, {"title": "A"}) == 3
        assert next_source_revision(existing, {"title": "B"}) == 4


class TestFreshnessDerivation:
    def test_missing_when_target_absent(self):
        assert (
            derive_translation_freshness(target_variant=None, ro_source_revision=1)
            == TranslationFreshness.MISSING
        )

    def test_manual_untracked_when_generation_metadata_absent(self):
        assert (
            derive_translation_freshness(
                target_variant={"draftBody": {"title": "EN"}},
                ro_source_revision=2,
            )
            == TranslationFreshness.MANUAL_UNTRACKED
        )
        assert (
            derive_translation_freshness(
                target_variant={"generatedFromSourceRevision": None},
                ro_source_revision=2,
            )
            == TranslationFreshness.MANUAL_UNTRACKED
        )

    def test_current_and_outdated(self):
        assert (
            derive_translation_freshness(
                target_variant={"generatedFromSourceRevision": 4},
                ro_source_revision=4,
            )
            == TranslationFreshness.CURRENT
        )
        assert (
            derive_translation_freshness(
                target_variant={"generatedFromSourceRevision": 3},
                ro_source_revision=4,
            )
            == TranslationFreshness.OUTDATED
        )

    def test_manual_untracked_is_not_missing(self):
        freshness = derive_translation_freshness(
            target_variant={"draftBody": {"x": 1}},
            ro_source_revision=1,
        )
        assert freshness != TranslationFreshness.MISSING
        assert freshness == TranslationFreshness.MANUAL_UNTRACKED


class TestManualEditDetection:
    def test_updated_after_generated(self):
        generated = datetime(2026, 1, 1, tzinfo=timezone.utc)
        updated = generated + timedelta(minutes=5)
        assert was_edited_after_generation(updated_at=updated, generated_at=generated) is True
        assert was_edited_after_generation(updated_at=generated, generated_at=generated) is False
        assert was_edited_after_generation(updated_at=updated, generated_at=None) is False


class TestManualRepositoryMetadata:
    def test_create_romanian_variant_starts_at_revision_one(self, repository):
        meta = repository.create_manual_chapter("Capitol", locale="ro")
        variant = repository.get_manual_variant(meta["contentId"], "ro")
        assert variant["sourceRevision"] == 1

    def test_identical_romanian_save_does_not_increment(self, repository):
        meta = repository.create_manual_chapter("Capitol", locale="ro")
        body = manual_body("Capitol", "Unu.")
        first = repository.save_manual_variant(meta["contentId"], "ro", body)
        second = repository.save_manual_variant(meta["contentId"], "ro", body)
        # Create used a different draftBody, so the first material save becomes 2.
        assert first["sourceRevision"] == 2
        assert second["sourceRevision"] == 2

    def test_changed_romanian_body_increments(self, repository):
        meta = repository.create_manual_chapter("Capitol", locale="ro")
        repository.save_manual_variant(meta["contentId"], "ro", manual_body("Capitol", "Unu."))
        updated = repository.save_manual_variant(
            meta["contentId"], "ro", manual_body("Capitol", "Doi.")
        )
        assert updated["sourceRevision"] == 3

    def test_publish_does_not_increment_source_revision(self, repository):
        meta = repository.create_manual_chapter("Capitol", locale="ro")
        repository.save_manual_variant(meta["contentId"], "ro", manual_body("Capitol", "Unu."))
        before = repository.get_manual_variant(meta["contentId"], "ro")["sourceRevision"]
        published = repository.publish_manual_variant(meta["contentId"], "ro")
        assert published["sourceRevision"] == before

    def test_target_save_does_not_change_romanian_revision(self, repository):
        meta = repository.create_manual_chapter("Capitol", locale="ro")
        repository.save_manual_variant(meta["contentId"], "ro", manual_body("Capitol", "RO."))
        ro_before = repository.get_manual_variant(meta["contentId"], "ro")["sourceRevision"]
        repository.save_manual_variant(meta["contentId"], "en", manual_body("Chapter", "EN."))
        ro_after = repository.get_manual_variant(meta["contentId"], "ro")["sourceRevision"]
        assert ro_before == ro_after == 2

    def test_legacy_romanian_without_revision_normalises_on_save(self, repository):
        meta = repository.create_manual_chapter("Legacy", locale="ro")
        content_id = meta["contentId"]
        variant = repository.get_manual_variant(content_id, "ro")
        del variant["sourceRevision"]
        records = repository._read_store()
        from content.repositories.filesystem import make_manual_variant_key

        records[make_manual_variant_key(content_id, "ro")] = variant
        repository._write_store(records)

        loaded = repository.get_manual_variant(content_id, "ro")
        assert "sourceRevision" not in loaded or loaded.get("sourceRevision") is None

        saved = repository.save_manual_variant(content_id, "ro", loaded["draftBody"])
        assert saved["sourceRevision"] == 1

    def test_target_preserves_generation_metadata_on_manual_save(self, repository):
        meta = repository.create_manual_chapter("Capitol", locale="ro")
        content_id = meta["contentId"]
        repository.save_manual_variant(content_id, "ro", manual_body("Capitol", "RO."))
        repository.save_manual_variant(content_id, "en", manual_body("Chapter", "EN."))

        en = repository.get_manual_variant(content_id, "en")
        en["generatedFromSourceRevision"] = 1
        en["translationProvider"] = "deepl"
        en["generatedAt"] = "2026-01-01T00:00:00+00:00"
        records = repository._read_store()
        from content.repositories.filesystem import make_manual_variant_key

        records[make_manual_variant_key(content_id, "en")] = en
        repository._write_store(records)

        saved = repository.save_manual_variant(content_id, "en", manual_body("Chapter", "EN edited."))
        assert saved["generatedFromSourceRevision"] == 1
        assert saved["translationProvider"] == "deepl"
        assert saved["generatedAt"] == "2026-01-01T00:00:00+00:00"
        assert saved["draftBody"]["sections"][0]["blocks"][0]["text"] == "EN edited."

    def test_metadata_round_trip_api(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Capitol API"},
            headers=admin_headers(),
        ).json()["contentId"]

        saved = client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            json={"body": manual_body("Capitol API", "Continut.")},
            headers=admin_headers(),
        ).json()
        assert saved["sourceRevision"] == 2

        loaded = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            headers=admin_headers(),
        ).json()
        assert loaded["sourceRevision"] == 2
        assert loaded["generatedFromSourceRevision"] is None


class TestGlossaryAndKnowledgeBaseConsistency:
    def test_glossary_create_and_revision(self, client):
        entry_id = client.post(
            "/api/admin/glossary/entries",
            json={"term": "Termen"},
            headers=admin_headers(),
        ).json()["contentId"]
        created = client.get(
            f"/api/admin/glossary/entries/{entry_id}/variants/ro",
            headers=admin_headers(),
        ).json()
        assert created["sourceRevision"] == 1

        first = client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/ro",
            json={"body": glossary_body("Termen", "Unu.")},
            headers=admin_headers(),
        ).json()
        second_same = client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/ro",
            json={"body": glossary_body("Termen", "Unu.")},
            headers=admin_headers(),
        ).json()
        second = client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/ro",
            json={"body": glossary_body("Termen", "Doi.")},
            headers=admin_headers(),
        ).json()
        assert first["sourceRevision"] == 2
        assert second_same["sourceRevision"] == 2
        assert second["sourceRevision"] == 3

        en = client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/en",
            json={"body": glossary_body("Term", "One.")},
            headers=admin_headers(),
        ).json()
        assert en["generatedFromSourceRevision"] is None
        assert en["exists"] is True

        client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        public = client.get("/api/content/glossary?locale=en")
        assert public.status_code == 200
        assert public.json()["available"] is True

    def test_knowledge_base_create_and_target_manual_edit(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Articol", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        ro = client.get(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/ro",
            headers=admin_headers(),
        ).json()
        assert ro["sourceRevision"] == 1

        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/ro",
            json={
                "category": "Epoxy",
                "difficulty": "Beginner",
                "body": kb_body("Articol", "RO"),
            },
            headers=admin_headers(),
        )
        en = client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json={
                "category": "Epoxy",
                "difficulty": "Beginner",
                "body": kb_body("Article", "EN"),
            },
            headers=admin_headers(),
        ).json()
        assert en["generatedFromSourceRevision"] is None
        assert en["translationProvider"] is None
        assert en["generatedAt"] is None

        ro_after = client.get(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/ro",
            headers=admin_headers(),
        ).json()
        assert ro_after["sourceRevision"] == 2
