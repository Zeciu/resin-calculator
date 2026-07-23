"""Focused tests for EDITORIAL_CONTENT_MODE write guard (Release A)."""

from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient

from content.editorial_content_mode import (
    EDITORIAL_CONTENT_MODE_ENV,
    EDITORIAL_CONTENT_MODE_RELEASE,
    EDITORIAL_CONTENT_MODE_WRITABLE,
    InvalidEditorialContentModeError,
    RELEASE_MODE_MUTATION_DETAIL,
    editorial_content_mode,
    editorial_writes_allowed,
    require_editorial_writes_allowed,
)
from content.repositories.entitlements import FilesystemEntitlementsRepository
from content.routers import (
    admin_glossary,
    admin_knowledge_base,
    admin_manual,
    admin_public_languages,
    admin_translation_bulk,
    admin_website,
    public_content,
)
from fastapi import HTTPException


def admin_headers(role: str = "administrator") -> dict[str, str]:
    return {
        "X-Mock-Role": role,
        "X-Mock-User-Id": "admin-user",
    }


def user_headers() -> dict[str, str]:
    return {
        "X-Mock-Role": "user",
        "X-Mock-User-Id": "user-a",
    }


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    monkeypatch.delenv(EDITORIAL_CONTENT_MODE_ENV, raising=False)
    for module in (
        admin_manual,
        admin_glossary,
        admin_knowledge_base,
        admin_website,
        admin_public_languages,
        admin_translation_bulk,
        public_content,
    ):
        if hasattr(module, "reset_repository_cache"):
            module.reset_repository_cache()
    from content.routers import admin_editorial

    admin_editorial.reset_repository_cache()
    from app import app

    return TestClient(app)


@pytest.fixture
def release_client(client, monkeypatch):
    monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, EDITORIAL_CONTENT_MODE_RELEASE)
    return client


@pytest.fixture
def writable_client(client, monkeypatch):
    monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, EDITORIAL_CONTENT_MODE_WRITABLE)
    return client


class TestEditorialContentModeHelper:
    def test_missing_defaults_to_writable(self, monkeypatch):
        monkeypatch.delenv(EDITORIAL_CONTENT_MODE_ENV, raising=False)
        assert editorial_content_mode() == EDITORIAL_CONTENT_MODE_WRITABLE
        assert editorial_writes_allowed() is True

    def test_blank_defaults_to_writable(self, monkeypatch):
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "  ")
        assert editorial_content_mode() == EDITORIAL_CONTENT_MODE_WRITABLE

    def test_explicit_writable(self, monkeypatch):
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "writable")
        assert editorial_content_mode() == EDITORIAL_CONTENT_MODE_WRITABLE
        assert editorial_writes_allowed() is True

    def test_explicit_release(self, monkeypatch):
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "RELEASE")
        assert editorial_content_mode() == EDITORIAL_CONTENT_MODE_RELEASE
        assert editorial_writes_allowed() is False

    def test_invalid_mode_raises(self, monkeypatch):
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "packaged")
        with pytest.raises(InvalidEditorialContentModeError, match="Invalid EDITORIAL_CONTENT_MODE"):
            editorial_content_mode()

    def test_require_dependency_blocks_release(self, monkeypatch):
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "release")
        with pytest.raises(HTTPException) as exc_info:
            require_editorial_writes_allowed()
        assert exc_info.value.status_code == 403
        assert RELEASE_MODE_MUTATION_DETAIL in str(exc_info.value.detail)

    def test_require_dependency_rejects_invalid_with_500(self, monkeypatch):
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "nope")
        with pytest.raises(HTTPException) as exc_info:
            require_editorial_writes_allowed()
        assert exc_info.value.status_code == 500
        assert "Invalid EDITORIAL_CONTENT_MODE" in str(exc_info.value.detail)


class TestDefaultAndWritableRemainOpen:
    def test_default_mode_allows_glossary_create(self, client):
        response = client.post(
            "/api/admin/glossary/entries",
            headers=admin_headers(),
            json={"term": "Pot life"},
        )
        assert response.status_code == 201
        assert response.json()["contentId"]

    def test_explicit_writable_allows_manual_create(self, writable_client):
        response = writable_client.post(
            "/api/admin/manual/chapters",
            headers=admin_headers(),
            json={"title": "Mixing resin", "locale": "ro"},
        )
        assert response.status_code == 201


class TestReleaseModeBlocksMutations:
    def test_glossary_create_forbidden(self, release_client):
        response = release_client.post(
            "/api/admin/glossary/entries",
            headers=admin_headers(),
            json={"term": "Blocked term"},
        )
        assert response.status_code == 403
        assert "EDITORIAL_CONTENT_MODE=release" in response.json()["detail"]

    def test_manual_save_forbidden(self, release_client, client, monkeypatch):
        monkeypatch.delenv(EDITORIAL_CONTENT_MODE_ENV, raising=False)
        created = client.post(
            "/api/admin/manual/chapters",
            headers=admin_headers(),
            json={"title": "Chapter", "locale": "ro"},
        )
        assert created.status_code == 201
        content_id = created.json()["contentId"]
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, EDITORIAL_CONTENT_MODE_RELEASE)
        response = release_client.put(
            f"/api/admin/manual/chapters/{content_id}/variants/ro",
            headers=admin_headers(),
            json={
                "body": {
                    "title": "Chapter",
                    "blocks": [{"type": "paragraph", "text": "Body"}],
                    "media": [],
                    "seeAlso": [],
                }
            },
        )
        assert response.status_code == 403

    def test_kb_delete_forbidden(self, release_client, client, monkeypatch):
        monkeypatch.delenv(EDITORIAL_CONTENT_MODE_ENV, raising=False)
        created = client.post(
            "/api/admin/knowledge-base/entries",
            headers=admin_headers(),
            json={"title": "Sticky resin"},
        )
        assert created.status_code == 201
        content_id = created.json()["contentId"]
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, EDITORIAL_CONTENT_MODE_RELEASE)
        response = release_client.delete(
            f"/api/admin/knowledge-base/entries/{content_id}",
            headers=admin_headers(),
        )
        assert response.status_code == 403

    def test_website_publish_forbidden(self, release_client):
        response = release_client.post(
            "/api/admin/website/pages/home/variants/ro/publish",
            headers=admin_headers(),
        )
        assert response.status_code == 403

    def test_website_unpublish_forbidden(self, release_client):
        response = release_client.post(
            "/api/admin/website/pages/home/variants/en/unpublish",
            headers=admin_headers(),
        )
        assert response.status_code == 403

    def test_image_upload_forbidden(self, release_client):
        response = release_client.post(
            "/api/admin/glossary/entries/images",
            headers=admin_headers(),
            files={"file": ("shot.png", io.BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")},
        )
        assert response.status_code == 403

    def test_generate_translation_forbidden(self, release_client):
        response = release_client.post(
            "/api/admin/glossary/entries/any-id/variants/en/generate-translation",
            headers=admin_headers(),
            json={"confirmOverwrite": False},
        )
        assert response.status_code == 403

    def test_bulk_update_forbidden(self, release_client):
        response = release_client.post(
            "/api/admin/glossary/translations/en/bulk-update",
            headers=admin_headers(),
            json={"offset": 0, "limit": 1, "includeTextOutdated": True},
        )
        assert response.status_code == 403

    def test_public_language_activate_forbidden(self, release_client):
        response = release_client.post(
            "/api/admin/public-languages/fr/activate",
            headers=admin_headers(),
        )
        assert response.status_code == 403

    def test_public_language_deactivate_forbidden(self, release_client):
        response = release_client.post(
            "/api/admin/public-languages/en/deactivate",
            headers=admin_headers(),
        )
        assert response.status_code == 403

    def test_publish_drafts_forbidden(self, release_client):
        response = release_client.post(
            "/api/admin/manual/chapters/variants/ro/publish-drafts",
            headers=admin_headers(),
        )
        assert response.status_code == 403


class TestReleaseModeAllowsReads:
    def test_glossary_list_ok(self, release_client):
        response = release_client.get(
            "/api/admin/glossary/entries?locale=ro",
            headers=admin_headers(),
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_manual_list_ok(self, release_client):
        response = release_client.get(
            "/api/admin/manual/chapters?locale=ro",
            headers=admin_headers(),
        )
        assert response.status_code == 200

    def test_website_list_ok(self, release_client):
        response = release_client.get(
            "/api/admin/website/pages?locale=ro",
            headers=admin_headers(),
        )
        assert response.status_code == 200

    def test_public_languages_admin_get_ok(self, release_client):
        response = release_client.get(
            "/api/admin/public-languages",
            headers=admin_headers(),
        )
        assert response.status_code == 200

    def test_bulk_preview_ok(self, release_client):
        response = release_client.post(
            "/api/admin/glossary/translations/en/bulk-preview",
            headers=admin_headers(),
            json={"includeTextOutdated": True},
        )
        assert response.status_code == 200

    def test_public_content_read_ok(self, release_client):
        response = release_client.get("/api/content/glossary?locale=en")
        assert response.status_code == 200


class TestNonEditorialUnaffected:
    def test_preferences_put_in_release_mode(self, release_client):
        response = release_client.put(
            "/api/preferences",
            headers=user_headers(),
            json={"interfaceLanguage": "ro", "lengthUnit": "mm", "volumeUnit": "L"},
        )
        assert response.status_code == 200
        assert response.json()["interfaceLanguage"] == "ro"

    def test_entitlements_write_in_release_mode(self, tmp_path, monkeypatch):
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, EDITORIAL_CONTENT_MODE_RELEASE)
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        repo = FilesystemEntitlementsRepository(tmp_path)
        saved = repo.save_access_tier("user-a", "subscriber")
        assert saved == "subscriber"
        assert repo.get_access_tier("user-a") == "subscriber"

    def test_invalid_mode_on_mutation_returns_500(self, client, monkeypatch):
        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "invalid-mode")
        response = client.post(
            "/api/admin/glossary/entries",
            headers=admin_headers(),
            json={"term": "Should fail closed"},
        )
        assert response.status_code == 500
        assert "Invalid EDITORIAL_CONTENT_MODE" in response.json()["detail"]
