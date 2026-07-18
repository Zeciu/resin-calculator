"""Observation 008 — locale-specific editorial variant deletion."""

import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_glossary, admin_knowledge_base, admin_manual, public_content


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_manual.reset_repository_cache()
    admin_glossary.reset_repository_cache()
    admin_knowledge_base.reset_repository_cache()
    public_content.reset_repository_cache()
    from app import app

    return TestClient(app), tmp_path


def admin_headers():
    return {"X-Mock-Role": "administrator", "X-Mock-User-Id": "admin-user"}


def manual_body(title: str, text: str) -> dict:
    return {
        "title": title,
        "sections": [{"id": "main", "title": "", "blocks": [{"type": "paragraph", "text": text}]}],
    }


def glossary_body(term: str, text: str) -> dict:
    return {
        "term": term,
        "definitionBlocks": [{"type": "paragraph", "text": text}],
        "media": [],
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


def kb_body(title: str) -> dict:
    return {
        "title": title,
        "problemSummary": "Problem",
        "symptoms": ["Symptom"],
        "possibleCauses": [],
        "solution": ["Fix"],
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


def _seed_manual_ro_en_fr(client: TestClient) -> str:
    chapter_id = client.post(
        "/api/admin/manual/chapters",
        json={"title": "Multi Locale Chapter", "locale": "ro"},
        headers=admin_headers(),
    ).json()["contentId"]
    client.put(
        f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
        json={"body": manual_body("Capitol RO", "Text RO")},
        headers=admin_headers(),
    )
    client.put(
        f"/api/admin/manual/chapters/{chapter_id}/variants/en",
        json={"body": manual_body("Chapter EN", "Text EN")},
        headers=admin_headers(),
    )
    client.put(
        f"/api/admin/manual/chapters/{chapter_id}/variants/fr",
        json={"body": manual_body("Chapitre FR", "Texte FR")},
        headers=admin_headers(),
    )
    client.post(
        f"/api/admin/manual/chapters/{chapter_id}/variants/fr/publish",
        headers=admin_headers(),
    )
    client.post(
        f"/api/admin/manual/chapters/{chapter_id}/variants/en/publish",
        headers=admin_headers(),
    )
    return chapter_id


class TestManualLocaleVariantDeletion:
    def test_delete_fr_keeps_ro_en_meta_and_order(self, client):
        api, root = client
        chapter_id = _seed_manual_ro_en_fr(api)

        delete = api.delete(
            f"/api/admin/manual/chapters/{chapter_id}/variants/fr",
            headers=admin_headers(),
        )
        assert delete.status_code == 204

        assert api.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/fr",
            headers=admin_headers(),
        ).json()["exists"] is False
        assert api.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            headers=admin_headers(),
        ).json()["exists"] is True
        assert api.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            headers=admin_headers(),
        ).json()["exists"] is True

        repo = FilesystemContentRepository(root)
        records = repo._read_store()
        assert repo.get_manual_chapter_meta(chapter_id) is not None
        assert chapter_id in repo.list_manual_chapter_ids()
        assert repo.get_manual_variant(chapter_id, "fr") is None
        assert repo.get_manual_variant(chapter_id, "ro") is not None
        assert repo.get_manual_variant(chapter_id, "en") is not None
        assert not any(
            key.endswith(f"|VARIANT#fr") and chapter_id in key for key in records
        )
        fr_snapshot = repo.read_manual_snapshot("fr")
        if fr_snapshot:
            assert all(chapter.get("contentId") != chapter_id for chapter in fr_snapshot.get("chapters", []))
        en_snapshot = repo.read_manual_snapshot("en")
        assert en_snapshot is not None
        assert any(chapter.get("contentId") == chapter_id for chapter in en_snapshot.get("chapters", []))

    def test_delete_missing_locale_returns_404(self, client):
        api, _ = client
        chapter_id = api.post(
            "/api/admin/manual/chapters",
            json={"title": "Only RO", "locale": "ro"},
            headers=admin_headers(),
        ).json()["contentId"]
        response = api.delete(
            f"/api/admin/manual/chapters/{chapter_id}/variants/fr",
            headers=admin_headers(),
        )
        assert response.status_code == 404

    def test_delete_ro_locale_rejected(self, client):
        api, _ = client
        chapter_id = api.post(
            "/api/admin/manual/chapters",
            json={"title": "Canonical", "locale": "ro"},
            headers=admin_headers(),
        ).json()["contentId"]
        response = api.delete(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            headers=admin_headers(),
        )
        assert response.status_code == 409
        assert "Romanian" in response.json()["detail"]

    def test_entity_delete_still_removes_all(self, client):
        api, root = client
        chapter_id = _seed_manual_ro_en_fr(api)
        assert api.delete(
            f"/api/admin/manual/chapters/{chapter_id}",
            headers=admin_headers(),
        ).status_code == 204
        repo = FilesystemContentRepository(root)
        assert repo.get_manual_chapter_meta(chapter_id) is None
        assert chapter_id not in repo.list_manual_chapter_ids()
        assert repo.get_manual_variant(chapter_id, "ro") is None
        assert repo.get_manual_variant(chapter_id, "en") is None
        assert repo.get_manual_variant(chapter_id, "fr") is None


class TestGlossaryLocaleVariantDeletion:
    def test_delete_fr_keeps_other_locales(self, client):
        api, root = client
        entry_id = api.post(
            "/api/admin/glossary/entries",
            json={"term": "Termen"},
            headers=admin_headers(),
        ).json()["contentId"]
        for locale, term, text in (
            ("ro", "Termen", "Def RO"),
            ("en", "Term", "Def EN"),
            ("fr", "Terme", "Def FR"),
        ):
            api.put(
                f"/api/admin/glossary/entries/{entry_id}/variants/{locale}",
                json={"body": glossary_body(term, text)},
                headers=admin_headers(),
            )
        api.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/fr/publish",
            headers=admin_headers(),
        )

        assert api.delete(
            f"/api/admin/glossary/entries/{entry_id}/variants/fr",
            headers=admin_headers(),
        ).status_code == 204

        repo = FilesystemContentRepository(root)
        assert repo.get_glossary_entry_meta(entry_id) is not None
        assert entry_id in repo.list_glossary_entry_ids()
        assert repo.get_glossary_variant(entry_id, "fr") is None
        assert repo.get_glossary_variant(entry_id, "ro") is not None
        assert repo.get_glossary_variant(entry_id, "en") is not None
        snapshot = repo.read_glossary_snapshot("fr")
        if snapshot:
            assert all(entry.get("id") != entry_id and entry.get("contentId") != entry_id for entry in snapshot.get("entries", []))

    def test_delete_ro_rejected(self, client):
        api, _ = client
        entry_id = api.post(
            "/api/admin/glossary/entries",
            json={"term": "RO Only"},
            headers=admin_headers(),
        ).json()["contentId"]
        assert api.delete(
            f"/api/admin/glossary/entries/{entry_id}/variants/ro",
            headers=admin_headers(),
        ).status_code == 409


class TestKnowledgeBaseLocaleVariantDeletion:
    def test_delete_fr_keeps_other_locales(self, client):
        api, root = client
        entry_id = api.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Articol", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        for locale, title in (("ro", "Articol RO"), ("en", "Article EN"), ("fr", "Article FR")):
            body = kb_body(title)
            api.put(
                f"/api/admin/knowledge-base/entries/{entry_id}/variants/{locale}",
                json={"category": "Epoxy", "difficulty": "Beginner", "body": body},
                headers=admin_headers(),
            )
        api.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/fr/publish",
            headers=admin_headers(),
        )

        assert api.delete(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/fr",
            headers=admin_headers(),
        ).status_code == 204

        repo = FilesystemContentRepository(root)
        assert repo.get_kb_entry_meta(entry_id) is not None
        assert entry_id in repo.list_kb_entry_ids()
        assert repo.get_kb_variant(entry_id, "fr") is None
        assert repo.get_kb_variant(entry_id, "ro") is not None
        assert repo.get_kb_variant(entry_id, "en") is not None

    def test_delete_ro_rejected(self, client):
        api, _ = client
        entry_id = api.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "RO KB", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        assert api.delete(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/ro",
            headers=admin_headers(),
        ).status_code == 409
