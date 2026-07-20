import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_manual, public_content
from content.services.manual_source import load_manual_sections
from content.services.migrate_phase2_manual import LegacyManualMigrationService


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_manual.reset_repository_cache()
    public_content.reset_repository_cache()
    from content.routers import admin_public_languages, public_languages

    admin_public_languages.reset_repository_cache()
    public_languages.reset_repository_cache()
    from app import app

    return TestClient(app)


def assert_sections_match_source(source_sections: list[dict], api_sections: list[dict]) -> None:
    assert len(source_sections) == len(api_sections)
    for source_section, api_section in zip(source_sections, api_sections, strict=True):
        assert source_section["id"] == api_section["id"]
        assert source_section["title"] == api_section["title"]
        assert source_section["blocks"] == api_section["blocks"]


def admin_headers(role: str = "administrator") -> dict[str, str]:
    return {
        "X-Mock-Role": role,
        "X-Mock-User-Id": "admin-user",
    }


def sample_body(title: str = "Chapter One", text: str = "Body text.") -> dict:
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


class TestManualSourceLoader:
    def test_reads_manual_content_js_not_fixture(self):
        sections = load_manual_sections()
        assert len(sections) >= 4
        assert sections[0]["id"] == "introduction"
        assert any(block.get("type") == "image" for section in sections for block in section["blocks"])
        assert any(block.get("type") == "video" for section in sections for block in section["blocks"])


class TestLegacyManualMigration:
    def test_migration_writes_legacy_public_document_only(self, tmp_path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        source_sections = load_manual_sections()
        repository = FilesystemContentRepository()
        repository.create_manual_chapter("Introduction", content_id="introduction")
        repository.create_manual_chapter("Admin Chapter", content_id="admin-chapter")

        result = LegacyManualMigrationService(repository).migrate()

        assert result["locale"] == "en"
        assert result["sectionCount"] == len(source_sections)
        assert result["sectionIds"] == [section["id"] for section in source_sections]
        assert "introduction" in result["removedFromEditorial"]

        legacy_document = repository.read_legacy_manual_document("en")
        assert legacy_document is not None
        assert legacy_document["sections"] == source_sections
        assert repository.list_manual_chapter_ids() == ["admin-chapter"]
        assert repository.read_manual_snapshot("en") == {"locale": "en", "chapters": []}

    def test_migration_removes_stale_legacy_editorial_chapters(self, client, tmp_path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        repository = FilesystemContentRepository()
        for section in load_manual_sections():
            repository.create_manual_chapter(section["title"], content_id=section["id"])

        LegacyManualMigrationService(repository).migrate()

        response = client.get("/api/admin/manual/chapters", headers={"X-Mock-Role": "administrator"})
        assert response.status_code == 200
        assert response.json() == []

    def test_public_api_matches_manual_sections_after_migration(self, client):
        source_sections = load_manual_sections()
        LegacyManualMigrationService(FilesystemContentRepository()).migrate()

        response = client.get("/api/content/manual?locale=en")
        assert response.status_code == 200
        payload = response.json()
        assert payload["available"] is True
        assert payload["requestedLocale"] == "en"
        assert_sections_match_source(source_sections, payload["sections"])

    def test_migration_does_not_populate_admin_chapters(self, client):
        LegacyManualMigrationService(FilesystemContentRepository()).migrate()

        response = client.get("/api/admin/manual/chapters", headers={"X-Mock-Role": "administrator"})
        assert response.status_code == 200
        assert response.json() == []

    def test_public_api_requires_no_auth(self, client):
        LegacyManualMigrationService(FilesystemContentRepository()).migrate()
        response = client.get("/api/content/manual?locale=en")
        assert response.status_code == 200


class TestPublicManualApi:
    def test_inactive_ro_locale_is_rejected(self, client):
        LegacyManualMigrationService(FilesystemContentRepository()).migrate()

        response = client.get("/api/content/manual?locale=ro")
        assert response.status_code == 400
        assert "not active" in response.json()["detail"].lower()

    def test_active_ro_locale_is_unavailable_without_autofallback(self, client):
        LegacyManualMigrationService(FilesystemContentRepository()).migrate()
        assert (
            client.post(
                "/api/admin/public-languages/ro/activate",
                headers=admin_headers(),
            ).status_code
            == 200
        )

        response = client.get("/api/content/manual?locale=ro")
        assert response.status_code == 200
        payload = response.json()
        assert payload["available"] is False
        assert payload["requestedLocale"] == "ro"
        assert payload["englishAvailable"] is True
        assert payload["sections"] == []

    def test_en_locale_unavailable_before_migration(self, client):
        response = client.get("/api/content/manual?locale=en")
        assert response.status_code == 200
        payload = response.json()
        assert payload["available"] is False
        assert payload["sections"] == []

    def test_inactive_configured_locale_returns_400(self, client):
        response = client.get("/api/content/manual?locale=fr")
        assert response.status_code == 400
        assert "not active" in response.json()["detail"].lower()

    def test_unsupported_locale_returns_400(self, client):
        response = client.get("/api/content/manual?locale=xx")
        assert response.status_code == 400

    def test_admin_published_manual_takes_priority_over_legacy(self, client):
        LegacyManualMigrationService(FilesystemContentRepository()).migrate()

        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Capitolul 1"},
            headers=admin_headers(),
        ).json()["contentId"]

        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": sample_body("Capitolul 1", "Admin chapter body.")},
            headers=admin_headers(),
        )
        client.post(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en/publish",
            headers=admin_headers(),
        )

        response = client.get("/api/content/manual?locale=en")
        payload = response.json()
        assert payload["available"] is True
        assert len(payload["sections"]) == 1
        assert payload["sections"][0]["title"] == "Capitolul 1"
        assert payload["sections"][0]["id"] == chapter_id
        assert payload["sections"][0]["blocks"][0]["text"] == "Admin chapter body."
