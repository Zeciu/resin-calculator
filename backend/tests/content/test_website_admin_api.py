"""Website Admin API tests (Stage 2)."""

from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_glossary, admin_manual, admin_website, public_content
from content.website_pages import WEBSITE_PAGE_DEFINITIONS, empty_website_draft_body

PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_website.reset_repository_cache()
    admin_manual.reset_repository_cache()
    admin_glossary.reset_repository_cache()
    public_content.reset_repository_cache()
    from app import app

    return TestClient(app)


def admin_headers(role: str = "administrator") -> dict[str, str]:
    return {
        "X-Mock-Role": role,
        "X-Mock-User-Id": "admin-user",
    }


def home_body(**overrides) -> dict:
    body = empty_website_draft_body("home")
    body["publicTitle"] = "HFZWood"
    body.update(overrides)
    return body


def pricing_body(**overrides) -> dict:
    body = empty_website_draft_body("pricing")
    body["publicTitle"] = "Pricing"
    body["offers"][0]["title"] = "Free"
    body["offers"][1]["title"] = "Subscriber"
    body["offers"][2]["title"] = "Lifetime"
    body.update(overrides)
    return body


class TestWebsiteAdminAuth:
    def test_non_admin_is_rejected(self, client):
        response = client.get("/api/admin/website/pages", headers=admin_headers("user"))
        assert response.status_code == 403


class TestWebsiteAdminListAndGet:
    def test_list_returns_exactly_six_stable_page_keys(self, client):
        response = client.get("/api/admin/website/pages?locale=ro", headers=admin_headers())
        assert response.status_code == 200
        items = response.json()
        assert [item["pageKey"] for item in items] == [page["pageKey"] for page in WEBSITE_PAGE_DEFINITIONS]
        assert len(items) == 6

    def test_unknown_page_key_returns_404(self, client):
        response = client.get(
            "/api/admin/website/pages/unknown-page/variants/ro",
            headers=admin_headers(),
        )
        assert response.status_code == 404

    def test_invalid_locale_returns_400(self, client):
        response = client.get(
            "/api/admin/website/pages/home/variants/zz",
            headers=admin_headers(),
        )
        assert response.status_code == 400

    def test_get_seeded_romanian_home_variant(self, client):
        response = client.get("/api/admin/website/pages/home/variants/ro", headers=admin_headers())
        assert response.status_code == 200
        payload = response.json()
        assert payload["pageKey"] == "home"
        assert payload["locale"] == "ro"
        assert payload["exists"] is True
        assert payload["body"]["pageKind"] == "home"


class TestWebsiteAdminMutations:
    def test_save_draft(self, client):
        response = client.put(
            "/api/admin/website/pages/home/variants/ro",
            json={"body": home_body(subtitle="Subtitle")},
            headers=admin_headers(),
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["body"]["publicTitle"] == "HFZWood"
        assert payload["body"]["subtitle"] == "Subtitle"
        assert payload["status"] == "draft"

    def test_schema_validation_failure_on_empty_title(self, client):
        body = home_body()
        body["publicTitle"] = "   "
        response = client.put(
            "/api/admin/website/pages/home/variants/ro",
            json={"body": body},
            headers=admin_headers(),
        )
        assert response.status_code == 422

    def test_pricing_retains_approved_offer_ids(self, client):
        body = pricing_body()
        body["offers"] = [body["offers"][0]]
        response = client.put(
            "/api/admin/website/pages/pricing/variants/ro",
            json={"body": body},
            headers=admin_headers(),
        )
        assert response.status_code == 422

    def test_publish_and_unpublish(self, client, tmp_path):
        client.put(
            "/api/admin/website/pages/contact/variants/ro",
            json={
                "body": {
                    **empty_website_draft_body("contact"),
                    "publicTitle": "Contact",
                }
            },
            headers=admin_headers(),
        )
        publish = client.post(
            "/api/admin/website/pages/contact/variants/ro/publish",
            headers=admin_headers(),
        )
        assert publish.status_code == 200
        assert publish.json()["status"] == "published"

        snapshot_path = tmp_path / "published" / "website" / "ro" / "pages.json"
        assert snapshot_path.exists()
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        assert "contact" in snapshot["pages"]

        unpublish = client.post(
            "/api/admin/website/pages/contact/variants/ro/unpublish",
            headers=admin_headers(),
        )
        assert unpublish.status_code == 204

        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        assert "contact" not in snapshot["pages"]


class TestWebsiteAdminRestrictions:
    def test_create_endpoint_is_not_available(self, client):
        response = client.post("/api/admin/website/pages", json={}, headers=admin_headers())
        assert response.status_code == 405

    def test_delete_page_endpoint_is_not_available(self, client):
        response = client.delete("/api/admin/website/pages/home", headers=admin_headers())
        assert response.status_code in {404, 405}

    def test_delete_variant_endpoint_is_not_available(self, client):
        response = client.delete(
            "/api/admin/website/pages/home/variants/ro",
            headers=admin_headers(),
        )
        assert response.status_code in {404, 405}


class TestWebsiteImageUpload:
    def test_upload_website_image(self, client):
        response = client.post(
            "/api/admin/website/pages/images",
            files={"file": ("hero.png", PNG_1X1, "image/png")},
            headers=admin_headers(),
        )
        assert response.status_code == 201
        assert response.json()["url"].startswith("/api/content/website/images/")


class TestEnsureWebsitePagesNonDestructive:
    def test_ensure_does_not_overwrite_existing_records_or_snapshot(self, tmp_path):
        repository = FilesystemContentRepository(tmp_path)
        repository.ensure_website_pages_exist()

        body = home_body(description="Existing description")
        repository.save_website_variant("home", "ro", body)
        repository.publish_website_variant("home", "ro")
        repository.write_website_snapshot(
            "ro",
            {
                "locale": "ro",
                "pages": {
                    "home": {
                        "pageKey": "home",
                        "slug": "/",
                        "pageKind": "home",
                        "body": body,
                    }
                },
            },
        )

        before_variant = repository.get_website_variant("home", "ro")
        before_meta = repository.get_website_page_meta("home")
        before_snapshot = repository.read_website_snapshot("ro")

        repository.ensure_website_pages_exist()

        after_variant = repository.get_website_variant("home", "ro")
        after_meta = repository.get_website_page_meta("home")
        after_snapshot = repository.read_website_snapshot("ro")

        assert before_variant == after_variant
        assert before_meta == after_meta
        assert before_snapshot == after_snapshot
