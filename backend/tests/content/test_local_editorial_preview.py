"""Local editorial preview: published private snapshots, not drafts or packaged-only."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from private.routers import (
    admin_glossary,
    admin_knowledge_base,
    admin_manual,
    admin_public_languages,
    public_content,
    public_languages,
)
from public.content_corpus import CONTENT_CORPUS_HEADER, EDITORIAL_PUBLISHED
from tests.support.authenticated_client import AuthenticatedTestClient
from tests.support.in_memory_entitlements_repository import InMemoryEntitlementsRepository

BACKEND_ROOT = Path(__file__).resolve().parents[2]
PRIVATE_CORPUS = BACKEND_ROOT / "private" / "content"
PUBLIC_CORPUS = BACKEND_ROOT / "public" / "content"

ADMIN_HEADERS = {
    "X-Mock-Role": "administrator",
    "X-Mock-User-Id": "admin-user",
}

FREE_PREVIEW_CONFIG = {
    "knowledgeBaseEntryIds": [
        "preview-kb-one",
        "preview-kb-two",
        "preview-kb-three",
        "preview-kb-four",
        "preview-kb-five",
    ],
    "glossaryEntryIds": [
        "preview-glossary-one",
        "preview-glossary-two",
        "preview-glossary-three",
        "preview-glossary-four",
        "preview-glossary-five",
    ],
}


def _reset_editorial_caches() -> None:
    admin_manual.reset_repository_cache()
    admin_glossary.reset_repository_cache()
    admin_knowledge_base.reset_repository_cache()
    admin_public_languages.reset_repository_cache()
    public_content.reset_repository_cache()
    public_languages.reset_repository_cache()


def _manual_body(title: str, text: str) -> dict:
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


def _glossary_body(term: str, text: str) -> dict:
    return {
        "term": term,
        "definitionBlocks": [{"type": "paragraph", "text": text}],
        "media": [],
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


def _kb_body(title: str, text: str) -> dict:
    return {
        "category": "Epoxy",
        "difficulty": "Beginner",
        "body": {
            "title": title,
            "problemSummary": text,
            "symptoms": ["A visible symptom"],
            "possibleCauses": ["A likely cause"],
            "solution": [text],
            "prevention": [],
            "tips": [],
            "warnings": [],
            "searchKeywords": [],
            "estimatedRepairTime": None,
            "requiredTools": [],
            "requiredMaterials": [],
            "bodyBlocks": [],
            "media": [],
            "relatedKbEntryIds": [],
            "relatedGlossaryEntryIds": [],
            "relatedManualChapterIds": [],
        },
    }


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    (config_dir / "free-preview.json").write_text(
        json.dumps(FREE_PREVIEW_CONFIG),
        encoding="utf-8",
    )
    _reset_editorial_caches()
    from app import app
    from public.content_routers import get_capability_resolver
    from public.product.capabilities.resolver import CapabilityResolver

    entitlements = InMemoryEntitlementsRepository()
    entitlements.save_access_tier("test-user", "subscriber")
    app.dependency_overrides[get_capability_resolver] = lambda: CapabilityResolver(entitlements)
    test_client = AuthenticatedTestClient(app)
    try:
        yield test_client
    finally:
        test_client.close()
        app.dependency_overrides.pop(get_capability_resolver, None)
        _reset_editorial_caches()


def _activate_ro(client: AuthenticatedTestClient) -> None:
    assert (
        client.post(
            "/api/admin/public-languages/ro/activate",
            headers=ADMIN_HEADERS,
        ).status_code
        == 200
    )


def _publish_manual(client: AuthenticatedTestClient, locale: str, title: str, text: str) -> str:
    created = client.post(
        "/api/admin/manual/chapters",
        json={"title": title, "locale": locale},
        headers=ADMIN_HEADERS,
    )
    assert created.status_code == 201
    chapter_id = created.json()["contentId"]
    assert (
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/{locale}",
            json={"body": _manual_body(title, text)},
            headers=ADMIN_HEADERS,
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/admin/manual/chapters/{chapter_id}/variants/{locale}/publish",
            headers=ADMIN_HEADERS,
        ).status_code
        == 200
    )
    return chapter_id


def _save_manual_draft(client: AuthenticatedTestClient, locale: str, title: str, text: str) -> str:
    created = client.post(
        "/api/admin/manual/chapters",
        json={"title": title, "locale": locale},
        headers=ADMIN_HEADERS,
    )
    assert created.status_code == 201
    chapter_id = created.json()["contentId"]
    assert (
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/{locale}",
            json={"body": _manual_body(title, text)},
            headers=ADMIN_HEADERS,
        ).status_code
        == 200
    )
    return chapter_id


def _publish_glossary(client: AuthenticatedTestClient, locale: str, term: str, text: str) -> str:
    created = client.post(
        "/api/admin/glossary/entries",
        json={"term": term, "locale": locale},
        headers=ADMIN_HEADERS,
    )
    assert created.status_code == 201
    entry_id = created.json()["contentId"]
    assert (
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/{locale}",
            json={"body": _glossary_body(term, text)},
            headers=ADMIN_HEADERS,
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/admin/glossary/entries/{entry_id}/variants/{locale}/publish",
            headers=ADMIN_HEADERS,
        ).status_code
        == 200
    )
    return entry_id


def _save_glossary_draft(client: AuthenticatedTestClient, locale: str, term: str, text: str) -> str:
    created = client.post(
        "/api/admin/glossary/entries",
        json={"term": term, "locale": locale},
        headers=ADMIN_HEADERS,
    )
    assert created.status_code == 201
    entry_id = created.json()["contentId"]
    assert (
        client.put(
            f"/api/admin/glossary/entries/{entry_id}/variants/{locale}",
            json={"body": _glossary_body(term, text)},
            headers=ADMIN_HEADERS,
        ).status_code
        == 200
    )
    return entry_id


def _publish_kb(client: AuthenticatedTestClient, locale: str, title: str, text: str) -> str:
    created = client.post(
        "/api/admin/knowledge-base/entries",
        json={"title": title, "locale": locale, "category": "Epoxy", "difficulty": "Beginner"},
        headers=ADMIN_HEADERS,
    )
    assert created.status_code == 201
    entry_id = created.json()["contentId"]
    assert (
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/{locale}",
            json=_kb_body(title, text),
            headers=ADMIN_HEADERS,
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/{locale}/publish",
            headers=ADMIN_HEADERS,
        ).status_code
        == 200
    )
    return entry_id


def _save_kb_draft(client: AuthenticatedTestClient, locale: str, title: str, text: str) -> str:
    created = client.post(
        "/api/admin/knowledge-base/entries",
        json={"title": title, "locale": locale, "category": "Epoxy", "difficulty": "Beginner"},
        headers=ADMIN_HEADERS,
    )
    assert created.status_code == 201
    entry_id = created.json()["contentId"]
    assert (
        client.put(
            f"/api/admin/knowledge-base/entries/{entry_id}/variants/{locale}",
            json=_kb_body(title, text),
            headers=ADMIN_HEADERS,
        ).status_code
        == 200
    )
    return entry_id


class TestLocalEditorialPreview:
    def test_published_private_manual_is_visible_for_ro_and_en(self, client):
        _activate_ro(client)
        _publish_manual(client, "ro", "Capitol RO", "Corp RO.")
        _publish_manual(client, "en", "Chapter EN", "Body EN.")

        romanian = client.get("/api/content/manual?locale=ro")
        english = client.get("/api/content/manual?locale=en")

        assert romanian.headers[CONTENT_CORPUS_HEADER] == EDITORIAL_PUBLISHED
        assert english.headers[CONTENT_CORPUS_HEADER] == EDITORIAL_PUBLISHED
        assert romanian.json()["available"] is True
        assert english.json()["available"] is True
        assert romanian.json()["sections"][0]["title"] == "Capitol RO"
        assert english.json()["sections"][0]["title"] == "Chapter EN"

    def test_en_manual_draft_is_not_visible_in_workspace(self, client):
        _save_manual_draft(client, "en", "Draft Only", "Secret draft body.")

        payload = client.get("/api/content/manual?locale=en").json()
        assert payload["available"] is False
        assert payload["sections"] == []

    def test_published_private_glossary_is_visible_for_ro_and_en(self, client):
        _activate_ro(client)
        _publish_glossary(client, "ro", "Rășină", "Definiție RO.")
        _publish_glossary(client, "en", "Resin", "Definition EN.")

        romanian = client.get("/api/content/glossary?locale=ro").json()
        english = client.get("/api/content/glossary?locale=en").json()

        assert romanian["available"] is True
        assert english["available"] is True
        assert {entry["term"] for entry in romanian["entries"]} == {"Rășină"}
        assert {entry["term"] for entry in english["entries"]} == {"Resin"}

    def test_en_glossary_draft_is_not_visible_in_workspace(self, client):
        _save_glossary_draft(client, "en", "Draft Term", "Unpublished definition.")

        payload = client.get("/api/content/glossary?locale=en").json()
        assert payload["available"] is False
        assert payload["entries"] == []

    def test_published_private_knowledge_base_is_visible_for_ro_and_en(self, client):
        _activate_ro(client)
        _publish_kb(client, "ro", "Articol RO", "Soluție RO.")
        _publish_kb(client, "en", "Article EN", "Solution EN.")

        romanian = client.get("/api/content/knowledge-base?locale=ro").json()
        english = client.get("/api/content/knowledge-base?locale=en").json()

        assert romanian["available"] is True
        assert english["available"] is True
        assert romanian["entries"][0]["title"] == "Articol RO"
        assert english["entries"][0]["title"] == "Article EN"

    def test_en_knowledge_base_draft_is_not_visible_in_workspace(self, client):
        _save_kb_draft(client, "en", "Draft Article", "Unpublished solution.")

        payload = client.get("/api/content/knowledge-base?locale=en").json()
        assert payload["available"] is False
        assert payload["entries"] == []


class TestCommittedEditorialCorpus:
    """The workstation private snapshots currently on disk, via the full local app."""

    def test_local_app_serves_published_private_en_and_ro_manual(self, monkeypatch):
        monkeypatch.delenv("CONTENT_DATA_DIR", raising=False)
        _reset_editorial_caches()
        from app import app
        from public.content_routers import get_capability_resolver
        from public.product.capabilities.resolver import CapabilityResolver

        entitlements = InMemoryEntitlementsRepository()
        entitlements.save_access_tier("test-user", "subscriber")
        app.dependency_overrides[get_capability_resolver] = lambda: CapabilityResolver(
            entitlements
        )
        client = AuthenticatedTestClient(app)
        try:
            english = client.get("/api/content/manual?locale=en")
            romanian = client.get("/api/content/manual?locale=ro")
            glossary_en = client.get("/api/content/glossary?locale=en")
            kb_en = client.get("/api/content/knowledge-base?locale=en")
        finally:
            client.close()
            app.dependency_overrides.pop(get_capability_resolver, None)
            _reset_editorial_caches()

        private_en = json.loads(
            (PRIVATE_CORPUS / "published" / "manual" / "en" / "document.json").read_text(
                encoding="utf-8"
            )
        )
        private_ro = json.loads(
            (PRIVATE_CORPUS / "published" / "manual" / "ro" / "document.json").read_text(
                encoding="utf-8"
            )
        )
        private_glossary_en = json.loads(
            (PRIVATE_CORPUS / "published" / "glossary" / "en" / "entries.json").read_text(
                encoding="utf-8"
            )
        )
        private_kb_en = json.loads(
            (PRIVATE_CORPUS / "published" / "knowledge-base" / "en" / "entries.json").read_text(
                encoding="utf-8"
            )
        )
        assert english.headers[CONTENT_CORPUS_HEADER] == EDITORIAL_PUBLISHED
        assert english.status_code == 200
        assert english.json()["available"] is True
        assert len(english.json()["sections"]) == len(private_en["chapters"]) == 18
        assert romanian.json()["available"] is True
        assert len(romanian.json()["sections"]) == len(private_ro["chapters"]) == 18
        assert glossary_en.json()["available"] is bool(private_glossary_en.get("entries"))
        assert len(glossary_en.json()["entries"]) == len(private_glossary_en.get("entries") or [])
        assert kb_en.json()["available"] is bool(private_kb_en.get("entries"))
        assert len(kb_en.json()["entries"]) == len(private_kb_en.get("entries") or [])
        assert (PUBLIC_CORPUS / "published" / "manual" / "en" / "document.json").is_file()
