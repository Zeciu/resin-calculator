from fastapi import FastAPI
from fastapi.testclient import TestClient

from public.content_api import router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api")
    return TestClient(app)


def test_guest_can_read_published_languages_and_website_without_a_token():
    client = _client()

    languages = client.get("/api/content/public-languages")
    website = client.get("/api/content/website/home?locale=en")

    assert languages.status_code == 200
    assert "ro" in languages.json()["activePublicLocales"]
    assert website.status_code == 200
    assert website.json()["available"] is True


def test_guest_cannot_read_protected_knowledge_base_content():
    response = _client().get("/api/content/knowledge-base?locale=en")

    assert response.status_code == 401
