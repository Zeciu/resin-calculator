import pytest

from private.routers import admin_manual, public_content
from tests.support.authenticated_client import AuthenticatedTestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    admin_manual.reset_repository_cache()
    public_content.reset_repository_cache()
    from private.routers import admin_public_languages, public_languages

    admin_public_languages.reset_repository_cache()
    public_languages.reset_repository_cache()
    from app import app

    return AuthenticatedTestClient(app)


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


def publish_en_chapter(client, title: str = "Chapter One", text: str = "Body text.") -> str:
    """Create, save and publish one English chapter through the admin API."""
    chapter_id = client.post(
        "/api/admin/manual/chapters",
        json={"title": title},
        headers=admin_headers(),
    ).json()["contentId"]
    client.put(
        f"/api/admin/manual/chapters/{chapter_id}/variants/en",
        json={"body": sample_body(title, text)},
        headers=admin_headers(),
    )
    client.post(
        f"/api/admin/manual/chapters/{chapter_id}/variants/en/publish",
        headers=admin_headers(),
    )
    return chapter_id


class TestPublicManualApi:
    def test_public_api_requires_no_auth(self, client):
        publish_en_chapter(client)
        response = client.get("/api/content/manual?locale=en")
        assert response.status_code == 200

    def test_inactive_ro_locale_is_rejected(self, client):
        publish_en_chapter(client)

        response = client.get("/api/content/manual?locale=ro")
        assert response.status_code == 400
        assert "not active" in response.json()["detail"].lower()

    def test_active_ro_locale_is_unavailable_without_autofallback(self, client):
        publish_en_chapter(client)
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

    def test_en_locale_unavailable_without_published_content(self, client):
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

    def test_published_admin_chapter_is_served(self, client):
        chapter_id = publish_en_chapter(client, "Capitolul 1", "Admin chapter body.")

        response = client.get("/api/content/manual?locale=en")
        payload = response.json()
        assert payload["available"] is True
        assert len(payload["sections"]) == 1
        assert payload["sections"][0]["title"] == "Capitolul 1"
        assert payload["sections"][0]["id"] == chapter_id
        assert payload["sections"][0]["blocks"][0]["text"] == "Admin chapter body."

    def test_unpublished_draft_is_not_served(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Draft Only"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en",
            json={"body": sample_body("Draft Only", "Draft body.")},
            headers=admin_headers(),
        )

        payload = client.get("/api/content/manual?locale=en").json()
        assert payload["available"] is False
        assert payload["sections"] == []

    def test_published_en_drafts_are_served_without_changing_romanian(self, client):
        """RO live + EN generated drafts + Publish all EN must serve EN, not unavailable."""
        assert (
            client.post(
                "/api/admin/public-languages/ro/activate",
                headers=admin_headers(),
            ).status_code
            == 200
        )

        chapter_count = 18
        for index in range(1, chapter_count + 1):
            ro_title = f"Capitol {index}"
            en_title = f"Chapter {index}"
            chapter_id = client.post(
                "/api/admin/manual/chapters",
                json={"title": ro_title, "locale": "ro"},
                headers=admin_headers(),
            ).json()["contentId"]
            assert (
                client.put(
                    f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
                    json={"body": sample_body(ro_title, f"Corp {index}.")},
                    headers=admin_headers(),
                ).status_code
                == 200
            )
            assert (
                client.post(
                    f"/api/admin/manual/chapters/{chapter_id}/variants/ro/publish",
                    headers=admin_headers(),
                ).status_code
                == 200
            )
            # Generated translations are saved as drafts, then published as a batch.
            assert (
                client.put(
                    f"/api/admin/manual/chapters/{chapter_id}/variants/en",
                    json={"body": sample_body(en_title, f"Body {index}.")},
                    headers=admin_headers(),
                ).status_code
                == 200
            )

        bulk = client.post(
            "/api/admin/manual/chapters/variants/en/publish-drafts",
            headers=admin_headers(),
        )
        assert bulk.status_code == 200
        assert bulk.json()["publishedCount"] == chapter_count
        assert bulk.json()["failedCount"] == 0

        english = client.get("/api/content/manual?locale=en").json()
        romanian = client.get("/api/content/manual?locale=ro").json()

        assert english["available"] is True
        assert english["requestedLocale"] == "en"
        assert [section["title"] for section in english["sections"]] == [
            f"Chapter {index}" for index in range(1, chapter_count + 1)
        ]
        assert [section["blocks"][0]["text"] for section in english["sections"]] == [
            f"Body {index}." for index in range(1, chapter_count + 1)
        ]
        assert romanian["available"] is True
        assert [section["title"] for section in romanian["sections"]] == [
            f"Capitol {index}" for index in range(1, chapter_count + 1)
        ]
        assert [section["blocks"][0]["text"] for section in romanian["sections"]] == [
            f"Corp {index}." for index in range(1, chapter_count + 1)
        ]
