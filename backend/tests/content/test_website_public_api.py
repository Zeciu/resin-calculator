"""Website public API tests (Stage 3)."""

from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_public_languages, admin_website, public_content, public_languages
from content.website_pages import WEBSITE_PAGE_DEFINITIONS, empty_website_draft_body, website_page_definition

PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)

FORBIDDEN_PUBLIC_KEYS = {
    "draftBody",
    "status",
    "editorialVisibility",
    "sourceRevision",
    "sourceTextRevision",
    "generatedFromSourceRevision",
    "generatedFromSourceTextRevision",
    "translationProvider",
    "generatedAt",
    "translationUpdateState",
    "translationUpdateAction",
    "adminLabel",
    "sortOrder",
    "snapshotKey",
    "contentId",
}


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_website.reset_repository_cache()
    admin_public_languages.reset_repository_cache()
    public_content.reset_repository_cache()
    public_languages.reset_repository_cache()
    from app import app

    return TestClient(app)


def admin_headers() -> dict[str, str]:
    return {
        "X-Mock-Role": "administrator",
        "X-Mock-User-Id": "admin-user",
    }


def publish_page(client: TestClient, page_key: str, locale: str = "en", **body_overrides) -> None:
    page = website_page_definition(page_key)
    body = empty_website_draft_body(page["pageKind"])
    body["publicTitle"] = f"Public {page_key}"
    body.update(body_overrides)
    save = client.put(
        f"/api/admin/website/pages/{page_key}/variants/{locale}",
        json={"body": body},
        headers=admin_headers(),
    )
    assert save.status_code == 200
    publish = client.post(
        f"/api/admin/website/pages/{page_key}/variants/{locale}/publish",
        headers=admin_headers(),
    )
    assert publish.status_code == 200


@pytest.mark.parametrize("page_key", [page["pageKey"] for page in WEBSITE_PAGE_DEFINITIONS])
class TestWebsitePublicPages:
    def test_published_page_is_available(self, client, page_key):
        publish_page(client, page_key, locale="en")

        response = client.get(f"/api/content/website/{page_key}?locale=en")
        assert response.status_code == 200
        payload = response.json()
        assert payload["available"] is True
        assert payload["requestedLocale"] == "en"
        assert payload["locale"] == "en"
        assert payload["page"]["pageKey"] == page_key
        assert payload["page"]["body"]["publicTitle"] == f"Public {page_key}"
        assert FORBIDDEN_PUBLIC_KEYS.isdisjoint(payload.keys())
        assert FORBIDDEN_PUBLIC_KEYS.isdisjoint(payload["page"].keys())

    def test_unpublished_page_is_unavailable(self, client, page_key):
        page = website_page_definition(page_key)
        body = empty_website_draft_body(page["pageKind"])
        body["publicTitle"] = f"Draft {page_key}"
        client.put(
            f"/api/admin/website/pages/{page_key}/variants/en",
            json={"body": body},
            headers=admin_headers(),
        )

        response = client.get(f"/api/content/website/{page_key}?locale=en")
        assert response.status_code == 200
        payload = response.json()
        assert payload["available"] is False
        assert payload["page"] is None


class TestWebsitePublicGating:
    def test_unknown_page_key_returns_404(self, client):
        response = client.get("/api/content/website/not-a-page?locale=en")
        assert response.status_code == 404

    def test_invalid_locale_returns_400(self, client):
        response = client.get("/api/content/website/home?locale=xx")
        assert response.status_code == 400

    def test_inactive_public_locale_returns_400(self, client):
        response = client.get("/api/content/website/home?locale=fr")
        assert response.status_code == 400
        assert "not active" in response.json()["detail"].lower()

    def test_active_romanian_locale_returns_published_content(self, client):
        publish_page(client, "home", locale="ro", subtitle="RO subtitle")
        assert (
            client.post(
                "/api/admin/public-languages/ro/activate",
                headers=admin_headers(),
            ).status_code
            == 200
        )

        response = client.get("/api/content/website/home?locale=ro")
        assert response.status_code == 200
        payload = response.json()
        assert payload["available"] is True
        assert payload["requestedLocale"] == "ro"
        assert payload["page"]["body"]["subtitle"] == "RO subtitle"


class TestWebsitePublicPublishLifecycle:
    def test_snapshot_rebuild_is_reflected_publicly(self, client, tmp_path):
        publish_page(client, "about", locale="en", description="ignored")

        response = client.get("/api/content/website/about?locale=en")
        assert response.status_code == 200
        assert response.json()["page"]["body"]["publicTitle"] == "Public about"

        body = empty_website_draft_body("about")
        body["publicTitle"] = "Updated About"
        client.put(
            "/api/admin/website/pages/about/variants/en",
            json={"body": body},
            headers=admin_headers(),
        )
        client.post(
            "/api/admin/website/pages/about/variants/en/publish",
            headers=admin_headers(),
        )

        updated = client.get("/api/content/website/about?locale=en")
        assert updated.status_code == 200
        assert updated.json()["page"]["body"]["publicTitle"] == "Updated About"

        snapshot_path = tmp_path / "published" / "website" / "en" / "pages.json"
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        assert snapshot["pages"]["about"]["body"]["publicTitle"] == "Updated About"

    def test_unpublish_removes_public_availability(self, client):
        publish_page(client, "contact", locale="en")

        assert client.get("/api/content/website/contact?locale=en").json()["available"] is True

        client.post(
            "/api/admin/website/pages/contact/variants/en/unpublish",
            headers=admin_headers(),
        )

        response = client.get("/api/content/website/contact?locale=en")
        assert response.status_code == 200
        assert response.json()["available"] is False
        assert response.json()["page"] is None


class TestWebsitePublicImages:
    def test_uploaded_website_image_can_be_served(self, client):
        upload = client.post(
            "/api/admin/website/pages/images",
            files={"file": ("hero.png", PNG_1X1, "image/png")},
            headers=admin_headers(),
        )
        assert upload.status_code == 201
        image_url = upload.json()["url"]

        response = client.get(image_url)
        assert response.status_code == 200
        assert response.content == PNG_1X1
        assert response.headers["content-type"].startswith("image/png")

    def test_missing_image_returns_404(self, client):
        response = client.get(
            "/api/content/website/images/00000000-0000-0000-0000-000000000099.png"
        )
        assert response.status_code == 404

    def test_path_traversal_is_rejected(self, client):
        response = client.get("/api/content/website/images/..%2F..%2Fetc%2Fpasswd")
        assert response.status_code == 404

    def test_public_image_endpoint_requires_no_auth(self, client):
        upload = client.post(
            "/api/admin/website/pages/images",
            files={"file": ("hero.png", PNG_1X1, "image/png")},
            headers=admin_headers(),
        )
        image_url = upload.json()["url"]
        response = client.get(image_url)
        assert response.status_code == 200


class TestWebsitePublicStage5BFields:
    def test_published_about_section_image_in_public_api(self, client):
        body = empty_website_draft_body("about")
        body["publicTitle"] = "About public"
        body["sections"] = [
            {
                "id": "story",
                "title": "Story",
                "blocks": [{"type": "paragraph", "text": "Body"}],
                "image": {
                    "src": "/api/content/website/images/story.png",
                    "alt": "Story image",
                },
            }
        ]
        publish_page(client, "about", locale="en", **body)

        response = client.get("/api/content/website/about?locale=en")
        section = response.json()["page"]["body"]["sections"][0]
        assert section["image"]["src"].endswith("story.png")
        assert section["image"]["alt"] == "Story image"
        assert FORBIDDEN_PUBLIC_KEYS.isdisjoint(response.json().keys())

    def test_published_pricing_visible_in_public_api(self, client):
        body = empty_website_draft_body("pricing")
        body["publicTitle"] = "Pricing public"
        body["offers"][0]["visible"] = False
        publish_page(client, "pricing", locale="en", **body)

        response = client.get("/api/content/website/pricing?locale=en")
        offers = response.json()["page"]["body"]["offers"]
        by_id = {offer["id"]: offer for offer in offers}
        assert by_id["free"]["visible"] is False
        assert by_id["subscriber"]["visible"] is True

    def test_published_contact_labels_in_public_api(self, client):
        publish_page(
            client,
            "contact",
            locale="en",
            manualLinkLabel="Custom manual",
            knowledgeBaseLinkLabel="Custom KB",
            showManualLink=True,
            showKnowledgeBaseLink=False,
        )

        response = client.get("/api/content/website/contact?locale=en")
        body = response.json()["page"]["body"]
        assert body["manualLinkLabel"] == "Custom manual"
        assert body["knowledgeBaseLinkLabel"] == "Custom KB"
        assert body["showManualLink"] is True
        assert body["showKnowledgeBaseLink"] is False


class TestWebsitePublicServiceUnit:
    def test_reads_only_published_snapshot_not_draft_variant(self, tmp_path):
        repository = FilesystemContentRepository(tmp_path)
        repository.ensure_website_pages_exist()
        body = empty_website_draft_body("home")
        body["publicTitle"] = "Draft only"
        repository.save_website_variant("home", "en", body)

        from content.services.website_public import WebsitePublicService

        service = WebsitePublicService(repository)
        response = service.get_published_page("home", "en")
        assert response.available is False
        assert response.page is None
