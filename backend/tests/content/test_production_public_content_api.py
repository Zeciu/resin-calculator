from fastapi import FastAPI
from fastapi.testclient import TestClient

from public.auth.dependencies import get_current_user
from public.content_api import router
from public.content_routers import get_capability_resolver
from public.product.capabilities.resolver import CapabilityResolver
from tests.support.in_memory_entitlements_repository import InMemoryEntitlementsRepository

JPEG_FILENAME = "d3a552fc-7f95-4c27-9494-588304928ddb.jpg"
PNG_FILENAME = "4e561613-0f56-4d06-a5b9-170d1361cdff.png"
WEBP_FILENAME = "20d85f36-6b20-4600-a2d1-4b02b24d5807.webp"
WAX_PREVIEW_SRC = "/api/content/glossary/images/b84d62e6-9c20-4746-a751-33ea6e3cced0.webp"
OIL_PREVIEW_SRC = "/api/content/glossary/images/7a9e4198-74e2-4d81-a36c-3117b04df471.webp"


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api")
    return TestClient(app)


def _authenticated_content_client(access_tier: str) -> TestClient:
    entitlements = InMemoryEntitlementsRepository()
    entitlements.save_access_tier("user-a", access_tier)
    app = FastAPI()
    app.include_router(router, prefix="/api")
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-a", "role": "user"}
    app.dependency_overrides[get_capability_resolver] = lambda: CapabilityResolver(entitlements)
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


def test_guest_cannot_read_protected_glossary_json():
    response = _client().get("/api/content/glossary?locale=ro")

    assert response.status_code == 401


def test_guest_cannot_read_protected_glossary_images_without_a_token():
    client = _client()
    cases = (JPEG_FILENAME, PNG_FILENAME, WEBP_FILENAME)
    for filename in cases:
        response = client.get(f"/api/content/glossary/images/{filename}")
        assert response.status_code == 401, filename


def test_guest_cannot_read_manual_or_knowledge_base_images_without_a_token():
    client = _client()

    manual = client.get(f"/api/content/manual/images/{JPEG_FILENAME}")
    knowledge_base = client.get(f"/api/content/knowledge-base/images/{JPEG_FILENAME}")

    assert manual.status_code == 401
    assert knowledge_base.status_code == 401


def test_free_preview_glossary_image_urls_remain_unchanged():
    client = _authenticated_content_client("free")

    response = client.get("/api/content/glossary?locale=ro")
    assert response.status_code == 200
    entries = {entry["id"]: entry for entry in response.json()["entries"]}
    assert set(entries) == {
        "finisaj-satinat",
        "finisaj-lucios",
        "cear-de-protec-ie",
        "ulei-pentru-lemn",
        "turnare-n-straturi",
    }
    assert entries["cear-de-protec-ie"]["media"][0]["src"] == WAX_PREVIEW_SRC
    assert entries["ulei-pentru-lemn"]["media"][0]["src"] == OIL_PREVIEW_SRC


def test_subscriber_glossary_keeps_canonical_image_urls():
    client = _authenticated_content_client("subscriber")

    response = client.get("/api/content/glossary?locale=ro")
    assert response.status_code == 200
    entries = {entry["id"]: entry for entry in response.json()["entries"]}
    assert entries["alburn"]["media"][0]["src"].endswith(JPEG_FILENAME)
    assert entries["boloboc-nivel"]["media"][0]["src"].endswith(PNG_FILENAME)
    assert entries["agent-de-demulare"]["media"][0]["src"].endswith(WEBP_FILENAME)
