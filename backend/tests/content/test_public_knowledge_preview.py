"""Anonymous Public Knowledge Preview contract and security tests."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from public.auth.dependencies import get_current_user
from public.content_api import router as content_router
from public.content_routers import get_capability_resolver
from public.product.capabilities.free_preview import load_free_preview_config
from public.product.capabilities.public_preview import load_public_preview_config
from public.product.capabilities.resolver import CapabilityResolver
from public.public_preview_api import router as preview_router
from tests.support.in_memory_entitlements_repository import InMemoryEntitlementsRepository

BACKEND_ROOT = Path(__file__).resolve().parents[2]
PUBLIC_CORPUS = BACKEND_ROOT / "public" / "content"
PUBLIC_PREVIEW_CONFIG = PUBLIC_CORPUS / "config" / "public-preview.json"
PRIVATE_PREVIEW_CONFIG = BACKEND_ROOT / "private" / "content" / "config" / "public-preview.json"
FREE_PREVIEW_CONFIG = PUBLIC_CORPUS / "config" / "free-preview.json"
MANUAL_RO = PUBLIC_CORPUS / "published" / "manual" / "ro" / "document.json"
KB_RO = PUBLIC_CORPUS / "published" / "knowledge-base" / "ro" / "entries.json"
GLOSSARY_RO = PUBLIC_CORPUS / "published" / "glossary" / "ro" / "entries.json"

GLOSSARY_PREVIEW_IMAGE = "9f48ddc9-0ce1-4574-a047-65f3eef8ab50.png"
LOCKED_GLOSSARY_IMAGE = "d3a552fc-7f95-4c27-9494-588304928ddb.jpg"
LOCKED_KB_IMAGE = "5f8add0d-32fa-49d3-9932-0dd8c470c7c0.png"
LOCKED_MANUAL_IMAGE = "22aab4b8-adbe-4b8b-8437-af59e8edde15.png"

PROTECTED_KB_FIELDS = {
    "problemSummary",
    "symptoms",
    "possibleCauses",
    "solution",
    "prevention",
    "tips",
    "warnings",
    "searchKeywords",
    "estimatedRepairTime",
    "requiredTools",
    "requiredMaterials",
    "media",
    "relatedKbArticles",
    "relatedGlossaryTerms",
    "relatedManualChapters",
    "bodyBlocks",
}
PROTECTED_GLOSSARY_FIELDS = {
    "definition",
    "definitionBlocks",
    "media",
    "relatedTerms",
    "synonyms",
    "seeAlso",
    "searchKeywords",
    "aliases",
}


def _preview_client() -> TestClient:
    app = FastAPI()
    app.include_router(preview_router, prefix="/api")
    return TestClient(app)


def _content_client() -> TestClient:
    app = FastAPI()
    app.include_router(content_router, prefix="/api")
    return TestClient(app)


def _authenticated_content_client(access_tier: str) -> TestClient:
    entitlements = InMemoryEntitlementsRepository()
    entitlements.save_access_tier("user-a", access_tier)
    app = FastAPI()
    app.include_router(content_router, prefix="/api")
    app.dependency_overrides[get_current_user] = lambda: {"id": "user-a", "role": "user"}
    app.dependency_overrides[get_capability_resolver] = lambda: CapabilityResolver(entitlements)
    return TestClient(app)


def _config() -> dict[str, tuple[str, ...]]:
    return load_public_preview_config(PUBLIC_PREVIEW_CONFIG)


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _locked_manual_phrase() -> str:
    chapter = next(
        item
        for item in _load_json(MANUAL_RO)["chapters"]
        if item["contentId"] == "alegerea-lemnului"
    )
    text = chapter["sections"][0]["blocks"][0]["text"]
    return text[40:90]


def _locked_kb_phrase() -> str:
    entry = next(
        item
        for item in _load_json(KB_RO)["entries"]
        if item["id"] == "de-ce-nu-trebuie-dep-it-grosimea-maxim-recomandat-pentru-o-turnare"
    )
    return entry["solution"][0]


def _locked_glossary_phrase() -> str:
    entry = next(item for item in _load_json(GLOSSARY_RO)["entries"] if item["id"] == "abonament")
    return entry["definition"][0]


class TestPublicPreviewManifest:
    def test_counts_uniqueness_and_ro_existence(self):
        preview = _config()
        manual_ids = {chapter["contentId"] for chapter in _load_json(MANUAL_RO)["chapters"]}
        kb_ids = {entry["id"] for entry in _load_json(KB_RO)["entries"]}
        glossary_ids = {entry["id"] for entry in _load_json(GLOSSARY_RO)["entries"]}

        assert len(preview["manualChapterIds"]) == 1
        assert len(set(preview["manualChapterIds"])) == 1
        assert preview["manualChapterIds"][0] in manual_ids

        assert len(preview["knowledgeBaseEntryIds"]) == 3
        assert len(set(preview["knowledgeBaseEntryIds"])) == 3
        assert set(preview["knowledgeBaseEntryIds"]) <= kb_ids

        assert len(preview["glossaryEntryIds"]) == 3
        assert len(set(preview["glossaryEntryIds"])) == 3
        assert set(preview["glossaryEntryIds"]) <= glossary_ids

    def test_schema_is_valid_and_distinct_from_free_preview(self):
        preview = _config()
        free = load_free_preview_config(FREE_PREVIEW_CONFIG)
        assert set(preview) == {
            "manualChapterIds",
            "knowledgeBaseEntryIds",
            "glossaryEntryIds",
        }
        assert "manualChapterIds" not in free
        assert preview["knowledgeBaseEntryIds"] != free["knowledgeBaseEntryIds"]
        assert preview["glossaryEntryIds"] != free["glossaryEntryIds"]

    def test_private_and_public_copies_match(self):
        assert load_public_preview_config(PRIVATE_PREVIEW_CONFIG) == _config()

    def test_invalid_manifest_is_rejected(self, tmp_path: Path):
        path = tmp_path / "public-preview.json"
        path.write_text(
            json.dumps(
                {
                    "manualChapterIds": [],
                    "knowledgeBaseEntryIds": ["a"],
                    "glossaryEntryIds": ["b", "c", "d"],
                }
            ),
            encoding="utf-8",
        )
        with pytest.raises(RuntimeError, match="manualChapterIds"):
            load_public_preview_config(path)


class TestAnonymousManualPreview:
    def test_anonymous_manual_preview_succeeds_with_complete_title_list(self):
        response = _preview_client().get("/api/public-preview/manual?locale=ro")
        assert response.status_code == 200
        payload = response.json()
        published_ids = [chapter["contentId"] for chapter in _load_json(MANUAL_RO)["chapters"]]
        published_titles = [chapter["title"] for chapter in _load_json(MANUAL_RO)["chapters"]]
        assert [chapter["id"] for chapter in payload["chapters"]] == published_ids
        assert [chapter["title"] for chapter in payload["chapters"]] == published_titles
        assert len(payload["chapters"]) == 18

    def test_only_configured_manual_chapter_includes_body(self):
        unlocked_id = _config()["manualChapterIds"][0]
        payload = _preview_client().get("/api/public-preview/manual?locale=ro").json()
        unlocked = [chapter for chapter in payload["chapters"] if chapter["locked"] is False]
        locked = [chapter for chapter in payload["chapters"] if chapter["locked"] is True]
        assert [chapter["id"] for chapter in unlocked] == [unlocked_id]
        assert "blocks" in unlocked[0]
        assert unlocked[0]["blocks"]
        assert len(locked) == 17
        for chapter in locked:
            assert set(chapter) == {"id", "title", "locked"}
            assert "blocks" not in chapter
            assert "sections" not in chapter


class TestAnonymousKnowledgeBasePreview:
    def test_anonymous_kb_preview_succeeds_with_all_titles(self):
        response = _preview_client().get("/api/public-preview/knowledge-base?locale=ro")
        assert response.status_code == 200
        payload = response.json()
        published = _load_json(KB_RO)["entries"]
        assert [entry["id"] for entry in payload["entries"]] == [entry["id"] for entry in published]
        assert [entry["title"] for entry in payload["entries"]] == [entry["title"] for entry in published]
        assert len(payload["entries"]) == 112

    def test_only_configured_kb_entries_include_bodies(self):
        unlocked_ids = set(_config()["knowledgeBaseEntryIds"])
        payload = _preview_client().get("/api/public-preview/knowledge-base?locale=ro").json()
        unlocked = [entry for entry in payload["entries"] if entry["locked"] is False]
        locked = [entry for entry in payload["entries"] if entry["locked"] is True]
        assert {entry["id"] for entry in unlocked} == unlocked_ids
        assert len(unlocked) == 3
        assert len(locked) == 109
        for entry in unlocked:
            assert entry.get("solution")
            assert "problemSummary" in entry
        for entry in locked:
            assert set(entry) == {"id", "title", "locked"}
            assert PROTECTED_KB_FIELDS.isdisjoint(entry)


class TestAnonymousGlossaryPreview:
    def test_anonymous_glossary_preview_succeeds_with_complete_term_list(self):
        response = _preview_client().get("/api/public-preview/glossary?locale=ro")
        assert response.status_code == 200
        payload = response.json()
        published = _load_json(GLOSSARY_RO)["entries"]
        assert [entry["id"] for entry in payload["entries"]] == [entry["id"] for entry in published]
        assert [entry["term"] for entry in payload["entries"]] == [entry["term"] for entry in published]

    def test_only_configured_glossary_entries_include_definitions(self):
        unlocked_ids = set(_config()["glossaryEntryIds"])
        payload = _preview_client().get("/api/public-preview/glossary?locale=ro").json()
        unlocked = [entry for entry in payload["entries"] if entry["locked"] is False]
        locked = [entry for entry in payload["entries"] if entry["locked"] is True]
        assert {entry["id"] for entry in unlocked} == unlocked_ids
        assert len(unlocked) == 3
        for entry in unlocked:
            assert entry.get("definition")
        for entry in locked:
            assert set(entry) == {"id", "term", "locked"}
            assert PROTECTED_GLOSSARY_FIELDS.isdisjoint(entry)


class TestExistingEndpointsStayProtected:
    def test_normal_manual_kb_glossary_remain_unauthorized_for_anonymous_users(self):
        client = _content_client()
        assert client.get("/api/content/manual?locale=ro").status_code == 401
        assert client.get("/api/content/knowledge-base?locale=ro").status_code == 401
        assert client.get("/api/content/glossary?locale=ro").status_code == 401

    def test_app_middleware_keeps_authenticated_content_protected(self):
        from app import app

        with patch("public.app._AUTH_ENABLED", True), TestClient(app) as client:
            assert client.get("/api/content/manual?locale=ro").status_code == 401
            assert client.get("/api/content/knowledge-base?locale=ro").status_code == 401
            assert client.get("/api/content/glossary?locale=ro").status_code == 401
            preview = client.get("/api/public-preview/manual?locale=ro")
            assert preview.status_code == 200


class TestPreviewMediaAuthorization:
    def test_preview_approved_glossary_image_is_anonymously_accessible(self):
        payload = _preview_client().get("/api/public-preview/glossary?locale=ro").json()
        unlocked = next(entry for entry in payload["entries"] if entry["id"] == "bule-de-aer")
        src = unlocked["media"][0]["src"]
        assert src == f"/api/public-preview/glossary/images/{GLOSSARY_PREVIEW_IMAGE}"
        response = _preview_client().get(src)
        assert response.status_code == 200
        assert response.content.startswith(b"\x89PNG")

    def test_selected_manual_and_kb_items_currently_have_no_media(self):
        manual = _preview_client().get("/api/public-preview/manual?locale=ro").json()
        kb = _preview_client().get("/api/public-preview/knowledge-base?locale=ro").json()
        unlocked_manual = next(
            chapter for chapter in manual["chapters"] if chapter["locked"] is False
        )
        unlocked_kb = [entry for entry in kb["entries"] if entry["locked"] is False]
        serialized = json.dumps(unlocked_manual) + json.dumps(unlocked_kb)
        assert "/images/" not in serialized

    def test_locked_content_images_are_not_anonymously_accessible_via_preview(self):
        client = _preview_client()
        assert (
            client.get(f"/api/public-preview/glossary/images/{LOCKED_GLOSSARY_IMAGE}").status_code
            == 404
        )
        assert (
            client.get(f"/api/public-preview/knowledge-base/images/{LOCKED_KB_IMAGE}").status_code
            == 404
        )
        assert (
            client.get(f"/api/public-preview/manual/images/{LOCKED_MANUAL_IMAGE}").status_code == 404
        )

    def test_authenticated_manual_and_kb_images_remain_unauthorized_for_anonymous_users(self):
        client = _content_client()
        assert client.get(f"/api/content/manual/images/{LOCKED_MANUAL_IMAGE}").status_code == 401
        assert client.get(f"/api/content/knowledge-base/images/{LOCKED_KB_IMAGE}").status_code == 401

    def test_path_traversal_and_arbitrary_filenames_are_rejected(self):
        client = _preview_client()
        assert client.get("/api/public-preview/glossary/images/..%2F..%2Fetc%2Fpasswd").status_code == 404
        assert client.get("/api/public-preview/glossary/images/not-a-valid-name.png").status_code == 404
        assert (
            client.get(
                "/api/public-preview/website/images/8ec2f4f1-d2f5-4c96-a9ad-8438d9cc0849.png"
            ).status_code
            == 404
        )


class TestAuthenticatedRegression:
    def test_free_behavior_is_unchanged(self):
        client = _authenticated_content_client("free")
        free = load_free_preview_config(FREE_PREVIEW_CONFIG)
        manual = client.get("/api/content/manual?locale=ro").json()
        kb = client.get("/api/content/knowledge-base?locale=ro").json()
        glossary = client.get("/api/content/glossary?locale=ro").json()
        assert len(manual["sections"]) == 18
        assert all(section.get("blocks") for section in manual["sections"])
        assert [entry["id"] for entry in kb["entries"]] == list(free["knowledgeBaseEntryIds"])
        assert [entry["id"] for entry in glossary["entries"]] == list(free["glossaryEntryIds"])

    def test_subscriber_behavior_is_unchanged(self):
        client = _authenticated_content_client("subscriber")
        manual = client.get("/api/content/manual?locale=ro").json()
        kb = client.get("/api/content/knowledge-base?locale=ro").json()
        glossary = client.get("/api/content/glossary?locale=ro").json()
        assert len(manual["sections"]) == 18
        assert len(kb["entries"]) == 112
        assert len(glossary["entries"]) == len(_load_json(GLOSSARY_RO)["entries"])
        assert all("blocks" in section for section in manual["sections"])
        assert all("solution" in entry for entry in kb["entries"])
        assert all("definition" in entry for entry in glossary["entries"])


class TestLocaleAbsenceDoesNotSubstitute:
    def test_en_does_not_unlock_a_substitute_full_item(self):
        config = _config()
        packaged_en_manual = _load_json(PUBLIC_CORPUS / "published" / "manual" / "en" / "document.json")
        packaged_en_glossary = _load_json(PUBLIC_CORPUS / "published" / "glossary" / "en" / "entries.json")
        packaged_en_kb = _load_json(
            PUBLIC_CORPUS / "published" / "knowledge-base" / "en" / "entries.json"
        )
        packaged_en_count = len(packaged_en_manual.get("chapters") or [])
        packaged_en_glossary_ids = {
            entry["id"] for entry in packaged_en_glossary.get("entries") or []
        }
        packaged_en_kb_ids = {entry["id"] for entry in packaged_en_kb.get("entries") or []}
        manual = _preview_client().get("/api/public-preview/manual?locale=en").json()
        kb = _preview_client().get("/api/public-preview/knowledge-base?locale=en").json()
        glossary = _preview_client().get("/api/public-preview/glossary?locale=en").json()
        romanian = _preview_client().get("/api/public-preview/manual?locale=ro").json()

        assert len(manual["chapters"]) == packaged_en_count
        assert len(kb["entries"]) == len(packaged_en_kb.get("entries") or [])
        assert len(glossary["entries"]) == len(packaged_en_glossary.get("entries") or [])
        unlocked_kb = [entry["id"] for entry in kb["entries"] if entry["locked"] is False]
        unlocked_glossary = [entry["id"] for entry in glossary["entries"] if entry["locked"] is False]
        assert set(unlocked_kb) == set(config["knowledgeBaseEntryIds"]) & packaged_en_kb_ids
        assert set(unlocked_glossary) == set(config["glossaryEntryIds"]) & packaged_en_glossary_ids
        if packaged_en_count:
            en_titles = [chapter["title"] for chapter in manual["chapters"]]
            ro_titles = [chapter["title"] for chapter in romanian["chapters"]]
            assert en_titles != ro_titles
            unlocked = [chapter["id"] for chapter in manual["chapters"] if chapter["locked"] is False]
            assert unlocked == [chapter_id for chapter_id in config["manualChapterIds"] if chapter_id in unlocked]
        else:
            assert [chapter["id"] for chapter in manual["chapters"] if chapter["locked"] is False] == []
            assert config["manualChapterIds"][0] not in [chapter["id"] for chapter in manual["chapters"]]
            assert manual["chapters"] == []

    def test_inactive_locale_follows_existing_content_api_convention(self):
        preview = _preview_client().get("/api/public-preview/manual?locale=de")
        content = _authenticated_content_client("subscriber").get("/api/content/manual?locale=de")
        french_preview = _preview_client().get("/api/public-preview/manual?locale=fr")
        french_content = _authenticated_content_client("subscriber").get(
            "/api/content/manual?locale=fr"
        )
        assert preview.status_code == 400
        assert content.status_code == 400
        assert french_preview.status_code == 400
        assert french_content.status_code == 400
        assert preview.json()["detail"] == content.json()["detail"]


class TestLockedTextIsAbsentFromSerializedPreview:
    def test_locked_body_phrases_are_absent_from_anonymous_preview_payloads(self):
        client = _preview_client()
        serialized = json.dumps(
            [
                client.get("/api/public-preview/manual?locale=ro").json(),
                client.get("/api/public-preview/knowledge-base?locale=ro").json(),
                client.get("/api/public-preview/glossary?locale=ro").json(),
            ],
            ensure_ascii=False,
        )
        assert _locked_manual_phrase() not in serialized
        assert _locked_kb_phrase() not in serialized
        assert _locked_glossary_phrase() not in serialized
        assert "Calitatea materialului, starea lui" not in serialized
