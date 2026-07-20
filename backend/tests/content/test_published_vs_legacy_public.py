"""Public content must not resurrect Phase 6 legacy seed over admin published snapshots."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_manual, public_content
from content.services.glossary_public import GlossaryPublicService
from content.services.knowledge_base_public import KnowledgeBasePublicService
from content.services.manual_public import ManualPublicService


@pytest.fixture
def repository(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    return FilesystemContentRepository(tmp_path)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_manual.reset_repository_cache()
    public_content.reset_repository_cache()
    from app import app

    return TestClient(app)


def admin_headers():
    return {"X-Mock-Role": "administrator", "X-Mock-User-Id": "admin-user"}


class TestPublishedSnapshotOwnsLocale:
    def test_empty_manual_published_snapshot_does_not_fall_back_to_legacy(self, repository):
        repository.write_legacy_manual_document(
            "en",
            {
                "locale": "en",
                "sections": [
                    {"id": "introduction", "title": "Introduction", "blocks": []},
                ],
            },
        )
        repository.write_manual_snapshot("en", {"locale": "en", "chapters": []})

        response = ManualPublicService(repository).get_published_manual("en")
        assert response.available is False
        assert response.sections == []

    def test_missing_manual_published_snapshot_still_uses_legacy(self, repository):
        repository.write_legacy_manual_document(
            "en",
            {
                "locale": "en",
                "sections": [
                    {"id": "introduction", "title": "Introduction", "blocks": []},
                ],
            },
        )

        response = ManualPublicService(repository).get_published_manual("en")
        assert response.available is True
        assert response.sections[0].title == "Introduction"

    def test_empty_glossary_and_kb_published_snapshots_do_not_fall_back(self, repository):
        repository.write_legacy_glossary_document(
            "en",
            {"locale": "en", "entries": [{"id": "old", "term": "Old", "definition": ["x"]}]},
        )
        repository.write_legacy_kb_document(
            "en",
            {
                "locale": "en",
                "entries": [
                    {
                        "id": "old",
                        "title": "Old",
                        "problemSummary": "p",
                        "solution": ["s"],
                    }
                ],
            },
        )
        repository.write_glossary_snapshot("en", {"locale": "en", "entries": []})
        repository.write_kb_snapshot("en", {"locale": "en", "entries": []})

        assert GlossaryPublicService(repository).get_published_glossary("en").available is False
        assert (
            KnowledgeBasePublicService(repository).get_published_knowledge_base("en").available
            is False
        )

    def test_publish_replaces_legacy_visibility_for_marker(self, client, tmp_path):
        repository = FilesystemContentRepository(tmp_path)
        repository.write_legacy_manual_document(
            "en",
            {
                "locale": "en",
                "sections": [
                    {"id": "introduction", "title": "Introduction", "blocks": []},
                ],
            },
        )

        marker = "PO-PUBLISH-MARKER-UNIQUE"
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": marker},
            headers=admin_headers(),
        ).json()["contentId"]
        body = {
            "title": marker,
            "sections": [
                {
                    "id": "main",
                    "title": "",
                    "blocks": [{"type": "paragraph", "text": f"Body {marker}"}],
                }
            ],
        }
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": body},
            headers=admin_headers(),
        )
        publish = client.post(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en/publish",
            headers=admin_headers(),
        )
        assert publish.status_code == 200

        snapshot = repository.read_manual_snapshot("en")
        assert snapshot is not None
        assert any(chapter["title"] == marker for chapter in snapshot["chapters"])

        public = client.get("/api/content/manual?locale=en").json()
        titles = [section["title"] for section in public["sections"]]
        assert marker in titles
        assert "Introduction" not in titles
