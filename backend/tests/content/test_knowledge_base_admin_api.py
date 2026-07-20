import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_knowledge_base, public_content
from content.services.knowledge_base_source import load_knowledge_base_entries
from content.services.migrate_phase2_knowledge_base import (
    EditorialKnowledgeBaseMigrationService,
    LegacyKnowledgeBaseMigrationService,
)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_knowledge_base.reset_repository_cache()
    public_content.reset_repository_cache()
    from app import app

    return TestClient(app)


def admin_headers(role: str = "administrator") -> dict[str, str]:
    return {
        "X-Mock-Role": role,
        "X-Mock-User-Id": "admin-user",
    }


def sample_body(
    title: str = "Bubbles after curing",
    summary: str = "Small voids remain visible after cure.",
    solution: str = "Seal porous wood before the main pour.",
) -> dict:
    return {
        "title": title,
        "problemSummary": summary,
        "symptoms": ["Tiny pits across the surface"],
        "possibleCauses": ["Air introduced during mixing"],
        "solution": [solution],
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


def save_payload(body: dict, category: str = "Epoxy", difficulty: str = "Beginner") -> dict:
    return {"category": category, "difficulty": difficulty, "body": body}


class TestKnowledgeBaseAdminAuth:
    def test_non_admin_is_rejected(self, client):
        response = client.get("/api/admin/knowledge-base/entries", headers=admin_headers("user"))
        assert response.status_code == 403


class TestKnowledgeBaseEntryCrud:
    def test_create_list_get_delete_entry(self, client):
        create_response = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Cloudy epoxy", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        )
        assert create_response.status_code == 201
        entry_id = create_response.json()["contentId"]
        assert entry_id == "cloudy-epoxy"
        assert create_response.json()["category"] == "Epoxy"

        list_response = client.get("/api/admin/knowledge-base/entries", headers=admin_headers())
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1
        assert list_response.json()[0]["title"] == "Cloudy epoxy"

        get_response = client.get(
            f"/api/admin/knowledge-base/entries/{entry_id}",
            headers=admin_headers(),
        )
        assert get_response.status_code == 200

        delete_response = client.delete(
            f"/api/admin/knowledge-base/entries/{entry_id}",
            headers=admin_headers(),
        )
        assert delete_response.status_code == 204


class TestKnowledgeBaseVariants:
    def test_create_defaults_to_romanian_variant(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Articol Nou", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]

        ro_variant = client.get(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/ro",
            headers=admin_headers(),
        ).json()
        en_variant = client.get(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            headers=admin_headers(),
        ).json()

        assert ro_variant["exists"] is True
        assert ro_variant["body"]["title"] == "Articol Nou"
        assert en_variant["exists"] is False

    def test_save_and_load_draft_variant(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Mold leakage", "category": "Wood", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]

        save_response = client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(sample_body("Mold leakage"), category="Wood"),
            headers=admin_headers(),
        )
        assert save_response.status_code == 200
        assert save_response.json()["status"] == "draft"
        assert save_response.json()["category"] == "Wood"

    def test_rejects_invalid_category_on_save(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Test entry", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]

        response = client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json={
                "category": "Invalid",
                "difficulty": "Beginner",
                "body": sample_body(),
            },
            headers=admin_headers(),
        )
        assert response.status_code == 422


class TestKnowledgeBasePublish:
    def test_publish_makes_entry_available_publicly(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Sticky resin", "category": "Epoxy", "difficulty": "Intermediate"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(sample_body("Sticky resin")),
            headers=admin_headers(),
        )
        publish_response = client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert publish_response.status_code == 200

        public_response = client.get("/api/content/knowledge-base?locale=en")
        assert public_response.status_code == 200
        payload = public_response.json()
        assert payload["available"] is True
        assert any(entry["title"] == "Sticky resin" for entry in payload["entries"])

    def test_publish_requires_problem_summary_and_solution(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Incomplete article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(
                {
                    **sample_body("Incomplete article"),
                    "problemSummary": "",
                    "solution": [],
                }
            ),
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 400


class TestKnowledgeBaseRelationshipValidation:
    def _create_and_publish(self, client, title: str) -> str:
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": title, "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(sample_body(title)),
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        return entry_id

    def test_rejects_self_reference(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Self reference", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        body = sample_body("Self reference")
        body["relatedKbEntryIds"] = [entry_id]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(body),
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "itself" in response.json()["detail"].lower()

    def test_rejects_unpublished_related_kb_article(self, client):
        related_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Draft related", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{related_id}/variants/en",
            json=save_payload(sample_body("Draft related")),
            headers=admin_headers(),
        )

        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Main article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        body = sample_body("Main article")
        body["relatedKbEntryIds"] = [related_id]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(body),
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 400
        assert "published" in response.json()["detail"].lower()


class TestKnowledgeBaseUnpublishAndDelete:
    def test_unpublish_removes_entry_from_public_snapshot(self, client):
        entry_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Temporary article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en",
            json=save_payload(sample_body("Temporary article")),
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/publish",
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/en/unpublish",
            headers=admin_headers(),
        )
        public_entries = client.get("/api/content/knowledge-base?locale=en").json()["entries"]
        assert all(item["id"] != entry_id for item in public_entries)

    def test_delete_rebuilds_snapshot_without_removed_entry(self, client):
        keep_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Keep article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{keep_id}/variants/en",
            json=save_payload(sample_body("Keep article")),
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/knowledge-base/entries/{keep_id}/variants/en/publish",
            headers=admin_headers(),
        )

        remove_id = client.post(
            "/api/admin/knowledge-base/entries",
            json={"title": "Remove article", "category": "Epoxy", "difficulty": "Beginner"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/knowledge-base/entries/{remove_id}/variants/en",
            json=save_payload(sample_body("Remove article")),
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/knowledge-base/entries/{remove_id}/variants/en/publish",
            headers=admin_headers(),
        )

        client.delete(f"/api/admin/knowledge-base/entries/{remove_id}", headers=admin_headers())
        public_ids = [item["id"] for item in client.get("/api/content/knowledge-base?locale=en").json()["entries"]]
        assert remove_id not in public_ids
        assert keep_id in public_ids


class TestKnowledgeBaseSourceLoader:
    def test_reads_knowledge_base_content_js(self):
        entries = load_knowledge_base_entries()
        assert len(entries) >= 12
        assert entries[0]["id"]
        assert entries[0]["category"]
        assert entries[0]["difficulty"]


class TestLegacyKnowledgeBaseMigration:
    def test_migration_writes_legacy_public_entries_only(self, tmp_path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        source_entries = load_knowledge_base_entries()
        repository = FilesystemContentRepository()
        repository.create_kb_entry("Admin article", "Epoxy", "Beginner", content_id="admin-article")

        result = LegacyKnowledgeBaseMigrationService(repository).migrate()

        assert result["entryCount"] == len(source_entries)
        legacy_document = repository.read_legacy_kb_document("en")
        assert legacy_document is not None
        assert len(legacy_document["entries"]) == len(source_entries)
        assert repository.list_kb_entry_ids() == ["admin-article"]
        assert repository.read_kb_snapshot("en") == {"locale": "en", "entries": []}


class TestKnowledgeBasePublicApi:
    def test_legacy_knowledge_base_served_when_no_admin_snapshot(self, client, tmp_path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        admin_knowledge_base.reset_repository_cache()
        public_content.reset_repository_cache()
        LegacyKnowledgeBaseMigrationService(FilesystemContentRepository()).migrate()

        response = client.get("/api/content/knowledge-base?locale=en")
        assert response.status_code == 200
        payload = response.json()
        assert payload["available"] is True
        titles = [entry["title"] for entry in payload["entries"]]
        assert "Bubbles after curing" in titles
        assert titles.index("Bubbles after curing") < titles.index("Resin remains sticky")
