import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from public.auth.dependencies import get_current_user
from public.content_api import router
from public.content_corpus import (
    CONTENT_CORPUS_HEADER,
    PACKAGED_PUBLIC,
    install_content_corpus_header,
)
from public.content_routers import get_capability_resolver
from public.product.capabilities.resolver import CapabilityResolver
from tests.support.in_memory_entitlements_repository import InMemoryEntitlementsRepository

BACKEND_ROOT = Path(__file__).resolve().parents[2]
PUBLIC_CORPUS = BACKEND_ROOT / "public" / "content"
PRIVATE_CORPUS = BACKEND_ROOT / "private" / "content"

JPEG_FILENAME = "d3a552fc-7f95-4c27-9494-588304928ddb.jpg"
PNG_FILENAME = "4e561613-0f56-4d06-a5b9-170d1361cdff.png"
WEBP_FILENAME = "20d85f36-6b20-4600-a2d1-4b02b24d5807.webp"
WAX_PREVIEW_SRC = "/api/content/glossary/images/b84d62e6-9c20-4746-a751-33ea6e3cced0.webp"
OIL_PREVIEW_SRC = "/api/content/glossary/images/7a9e4198-74e2-4d81-a36c-3117b04df471.webp"


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api")
    install_content_corpus_header(app, PACKAGED_PUBLIC)
    return TestClient(app)


def _authenticated_content_client(access_tier: str) -> TestClient:
    entitlements = InMemoryEntitlementsRepository()
    entitlements.save_access_tier("user-a", access_tier)
    app = FastAPI()
    app.include_router(router, prefix="/api")
    install_content_corpus_header(app, PACKAGED_PUBLIC)
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-a", "role": "user"}
    app.dependency_overrides[get_capability_resolver] = lambda: CapabilityResolver(entitlements)
    return TestClient(app)


def test_guest_can_read_published_languages_and_website_without_a_token():
    client = _client()

    languages = client.get("/api/content/public-languages")
    website = client.get("/api/content/website/home?locale=en")

    assert languages.status_code == 200
    assert languages.json()["activePublicLocales"] == ["en", "ro"]
    assert "fr" not in languages.json()["activePublicLocales"]
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


def test_authenticated_manual_en_follows_packaged_corpus_not_admin_live_status():
    """Production Manual reads backend/public/content, not Admin's private snapshot.

    Admin Publish writes private/content. Production Manual is served from the
    packaged public EN snapshot, which must contain the same 18 live chapters.
    """
    public_en = json.loads(
        (PUBLIC_CORPUS / "published" / "manual" / "en" / "document.json").read_text(
            encoding="utf-8"
        )
    )
    private_en = json.loads(
        (PRIVATE_CORPUS / "published" / "manual" / "en" / "document.json").read_text(
            encoding="utf-8"
        )
    )
    public_ro = json.loads(
        (PUBLIC_CORPUS / "published" / "manual" / "ro" / "document.json").read_text(
            encoding="utf-8"
        )
    )
    public_glossary_en = json.loads(
        (PUBLIC_CORPUS / "published" / "glossary" / "en" / "entries.json").read_text(
            encoding="utf-8"
        )
    )
    public_kb_en = json.loads(
        (PUBLIC_CORPUS / "published" / "knowledge-base" / "en" / "entries.json").read_text(
            encoding="utf-8"
        )
    )
    packaged_en_count = len(public_en.get("chapters") or [])
    packaged_glossary_en_count = len(public_glossary_en.get("entries") or [])
    packaged_kb_en_count = len(public_kb_en.get("entries") or [])
    client = _authenticated_content_client("subscriber")

    english_response = client.get("/api/content/manual?locale=en")
    romanian_response = client.get("/api/content/manual?locale=ro")
    glossary_en = client.get("/api/content/glossary?locale=en")
    kb_en = client.get("/api/content/knowledge-base?locale=en")
    french = client.get("/api/content/manual?locale=fr")
    english = english_response.json()
    romanian = romanian_response.json()

    assert english_response.headers[CONTENT_CORPUS_HEADER] == PACKAGED_PUBLIC
    assert glossary_en.headers[CONTENT_CORPUS_HEADER] == PACKAGED_PUBLIC
    assert kb_en.headers[CONTENT_CORPUS_HEADER] == PACKAGED_PUBLIC
    assert len(private_en.get("chapters") or []) == packaged_en_count == 18
    assert english["requestedLocale"] == "en"
    assert english["available"] is True
    assert len(english["sections"]) == 18
    assert english["sections"][0]["title"] == public_en["chapters"][0]["title"]
    assert romanian["available"] is True
    assert len(romanian["sections"]) == len(public_ro.get("chapters") or []) == 18
    assert english["sections"][0]["title"] != romanian["sections"][0]["title"]
    assert glossary_en.json()["available"] is True
    assert len(glossary_en.json()["entries"]) == packaged_glossary_en_count
    assert kb_en.json()["available"] is True
    assert len(kb_en.json()["entries"]) == packaged_kb_en_count
    assert french.status_code == 400


def test_production_reader_cannot_see_private_editorial_snapshots(tmp_path, monkeypatch):
    """Packaged reader uses only CORPUS_ROOT; private published files must not leak."""
    from public import content_api

    public_root = tmp_path / "packaged"
    (public_root / "config").mkdir(parents=True)
    (public_root / "published" / "manual" / "en").mkdir(parents=True)
    (public_root / "config" / "public-languages.json").write_text(
        json.dumps({"defaultPublicLocale": "en", "activePublicLocales": ["en", "ro"]}),
        encoding="utf-8",
    )
    (public_root / "published" / "manual" / "en" / "document.json").write_text(
        json.dumps({"locale": "en", "chapters": []}),
        encoding="utf-8",
    )
    monkeypatch.setattr(content_api, "CORPUS_ROOT", public_root)

    private_en = json.loads(
        (PRIVATE_CORPUS / "published" / "manual" / "en" / "document.json").read_text(
            encoding="utf-8"
        )
    )
    assert len(private_en.get("chapters") or []) == 18

    payload = content_api._manual_response("en")
    assert payload["available"] is False
    assert payload["sections"] == []


def test_subscriber_glossary_keeps_canonical_image_urls():
    client = _authenticated_content_client("subscriber")

    response = client.get("/api/content/glossary?locale=ro")
    assert response.status_code == 200
    entries = {entry["id"]: entry for entry in response.json()["entries"]}
    assert entries["alburn"]["media"][0]["src"].endswith(JPEG_FILENAME)
    assert entries["boloboc-nivel"]["media"][0]["src"].endswith(PNG_FILENAME)
    assert entries["agent-de-demulare"]["media"][0]["src"].endswith(WEBP_FILENAME)
