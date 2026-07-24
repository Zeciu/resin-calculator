"""Task 7.1.4 — Editorial translation generation tests (mocked provider)."""

from __future__ import annotations

from typing import Any, Literal

import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_glossary, admin_knowledge_base, admin_manual, public_content
from content.services.translation_generation import (
    MissingRomanianSourceError,
    NothingToTranslateError,
    OverwriteConfirmationRequired,
    TranslationGenerationService,
)
from content.translation.editorial_text import (
    extract_translatable_items,
    reconstruct_draft_body,
)
from content.translation.exceptions import TranslationConfigurationError, TranslationTemporaryProviderError
from content.translation.types import TranslationResult
from content.translation_metadata import read_generated_from_source_revision, read_source_revision


class FakeTranslationProvider:
    def __init__(self, *, fail_after: int | None = None) -> None:
        self.calls: list[dict[str, Any]] = []
        self.batch_calls: list[dict[str, Any]] = []
        self.fail_after = fail_after

    def translate(
        self,
        text: str,
        *,
        source_locale: str,
        target_locale: str,
        context: str | None = None,
        content_format: Literal["plain", "html"] = "html",
        glossary_id: str | None = None,
    ) -> TranslationResult:
        return self.translate_many(
            [text],
            source_locale=source_locale,
            target_locale=target_locale,
            context=context,
            content_format=content_format,
            glossary_id=glossary_id,
        )[0]

    def translate_many(
        self,
        texts: list[str],
        *,
        source_locale: str,
        target_locale: str,
        context: str | None = None,
        content_format: Literal["plain", "html"] = "html",
        glossary_id: str | None = None,
    ) -> list[TranslationResult]:
        self.batch_calls.append(
            {
                "texts": list(texts),
                "source_locale": source_locale,
                "target_locale": target_locale,
                "context": context,
                "content_format": content_format,
            }
        )
        results: list[TranslationResult] = []
        for text in texts:
            self.calls.append(
                {
                    "text": text,
                    "source_locale": source_locale,
                    "target_locale": target_locale,
                    "context": context,
                    "content_format": content_format,
                }
            )
            results.append(
                TranslationResult(
                    text=f"[{target_locale}]{text}",
                    provider="deepl",
                    source_locale=source_locale,
                    target_locale=target_locale,
                    billed_characters=len(text),
                )
            )
        if self.fail_after is not None and len(self.batch_calls) > self.fail_after:
            raise TranslationTemporaryProviderError("provider boom")
        return results


@pytest.fixture
def repository(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    return FilesystemContentRepository(tmp_path)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_manual.reset_repository_cache()
    admin_glossary.reset_repository_cache()
    admin_knowledge_base.reset_repository_cache()
    public_content.reset_repository_cache()
    from app import app

    return TestClient(app)


def admin_headers() -> dict[str, str]:
    return {"X-Mock-Role": "administrator", "X-Mock-User-Id": "admin-user"}


def sample_manual_body(title: str = "Capitol", paragraph: str = "Formă de epoxy") -> dict:
    return {
        "title": title,
        "sections": [
            {
                "id": "main",
                "title": "",
                "blocks": [
                    {"type": "paragraph", "text": f"<strong>{paragraph}</strong>"},
                    {"type": "image", "src": "/img/a.png", "alt": "matriță", "caption": "vedere"},
                ],
            }
        ],
    }


class TestExtractionReconstruction:
    def test_manual_extracts_explicit_formats_and_skips_structure(self):
        items = extract_translatable_items("manual", sample_manual_body())
        formats = {(tuple(i.path), i.content_format) for i in items}
        assert (("title",), "plain") in formats
        assert (("sections", 0, "blocks", 0, "text"), "html") in formats
        assert (("sections", 0, "blocks", 1, "alt"), "plain") in formats
        assert all("src" not in str(i.path) for i in items)

    def test_reconstruct_preserves_ids_and_urls(self):
        body = sample_manual_body()
        items = extract_translatable_items("manual", body)
        pairs = [(item, f"T:{item.text}") for item in items]
        rebuilt = reconstruct_draft_body(body, pairs)
        assert rebuilt["sections"][0]["id"] == "main"
        assert rebuilt["sections"][0]["blocks"][1]["src"] == "/img/a.png"
        assert rebuilt["title"].startswith("T:")

    def test_glossary_and_kb_field_maps(self):
        glossary_items = extract_translatable_items(
            "glossary",
            {
                "term": "Rășină",
                "definitionBlocks": [{"type": "paragraph", "text": "Definiție"}],
                "media": [],
                "relatedTermIds": ["x"],
                "synonymTermIds": [],
                "seeAlso": [{"targetContentId": "a", "targetType": "manual_chapter", "label": "Vezi"}],
            },
        )
        assert any(i.path == ("term",) and i.content_format == "plain" for i in glossary_items)
        assert any(i.path == ("seeAlso", 0, "label") for i in glossary_items)

        kb_items = extract_translatable_items(
            "knowledge_base",
            {
                "title": "Problemă",
                "problemSummary": "Sumar",
                "symptoms": ["S1"],
                "possibleCauses": [],
                "solution": ["Sol"],
                "prevention": [],
                "tips": [],
                "warnings": [],
                "searchKeywords": ["cheie"],
                "estimatedRepairTime": "30 min",
                "requiredTools": ["spatulă"],
                "requiredMaterials": ["epoxy"],
                "bodyBlocks": [],
                "media": [],
                "relatedKbEntryIds": [],
                "relatedGlossaryEntryIds": [],
                "relatedManualChapterIds": [],
            },
        )
        paths = {i.path for i in kb_items}
        assert ("requiredTools", 0) in paths
        assert ("estimatedRepairTime",) in paths
        assert ("searchKeywords", 0) in paths


class TestGenerationService:
    def test_generates_and_stamps_metadata(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        content_id = meta["contentId"]
        repository.save_manual_variant(content_id, "ro", sample_manual_body())
        provider = FakeTranslationProvider()
        service = TranslationGenerationService(repository, provider=provider)
        saved = service.generate(
            module="manual",
            content_id=content_id,
            target_locale="en",
            confirm_overwrite=False,
        )
        assert saved["draftBody"]["title"].startswith("[en]")
        assert saved["translationProvider"] == "deepl"
        assert saved["generatedFromSourceRevision"] == read_source_revision(
            repository.get_manual_variant(content_id, "ro")
        )
        assert saved["generatedAt"]
        assert saved["status"] == "draft"
        assert saved.get("publishedAt") is None
        assert all(call["source_locale"] == "ro" for call in provider.calls)
        assert all(call["target_locale"] == "en" for call in provider.calls)

    def test_overwrite_requires_confirmation_when_text_outdated(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        content_id = meta["contentId"]
        repository.save_manual_variant(content_id, "ro", sample_manual_body())
        provider = FakeTranslationProvider()
        service = TranslationGenerationService(repository, provider=provider)
        service.generate(module="manual", content_id=content_id, target_locale="en")
        # Current → skip, no DeepL, no overwrite required.
        calls_after_first = len(provider.calls)
        skipped = service.generate(module="manual", content_id=content_id, target_locale="en")
        assert skipped["_translationUpdateAction"] == "skip_current"
        assert len(provider.calls) == calls_after_first

        # Text change → full regen requires confirmation.
        body = sample_manual_body()
        body["title"] = "Capitol schimbat"
        repository.save_manual_variant(content_id, "ro", body)
        with pytest.raises(OverwriteConfirmationRequired):
            service.generate(module="manual", content_id=content_id, target_locale="en")
        regenerated = service.generate(
            module="manual",
            content_id=content_id,
            target_locale="en",
            confirm_overwrite=True,
        )
        assert regenerated["draftBody"]["title"].startswith("[en]")
        assert regenerated["_translationUpdateAction"] == "skip_current"
        assert regenerated["_translationUpdateState"] == "current"
    def test_nothing_to_translate(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        content_id = meta["contentId"]
        repository.save_manual_variant(
            content_id,
            "ro",
            {"title": "   ", "sections": [{"id": "main", "title": "", "blocks": []}]},
        )
        service = TranslationGenerationService(repository, provider=FakeTranslationProvider())
        with pytest.raises(NothingToTranslateError):
            service.generate(module="manual", content_id=content_id, target_locale="en")
        assert repository.get_manual_variant(content_id, "en") is None

    def test_missing_romanian_source(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        content_id = meta["contentId"]
        # Delete RO variant by writing empty store entry removal — chapter has RO from create.
        # Create only creates RO; remove it via store mutation.
        records = repository._read_store()
        from content.repositories.filesystem import make_manual_variant_key

        del records[make_manual_variant_key(content_id, "ro")]
        repository._write_store(records)
        service = TranslationGenerationService(repository, provider=FakeTranslationProvider())
        with pytest.raises(MissingRomanianSourceError):
            service.generate(module="manual", content_id=content_id, target_locale="en")

    def test_provider_failure_does_not_persist(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        content_id = meta["contentId"]
        repository.save_manual_variant(content_id, "ro", sample_manual_body())
        provider = FakeTranslationProvider(fail_after=0)
        service = TranslationGenerationService(repository, provider=provider)
        with pytest.raises(TranslationTemporaryProviderError):
            service.generate(module="manual", content_id=content_id, target_locale="fr")
        assert repository.get_manual_variant(content_id, "fr") is None

    def test_rejects_romanian_target(self, repository):
        meta = repository.create_manual_chapter("Capitol")
        content_id = meta["contentId"]
        repository.save_manual_variant(content_id, "ro", sample_manual_body())
        service = TranslationGenerationService(repository, provider=FakeTranslationProvider())
        with pytest.raises(Exception):
            service.generate(module="manual", content_id=content_id, target_locale="ro")


class TestGenerateApiAndLocales:
    def test_admin_can_generate_english_draft(self, client, monkeypatch):
        from content.services import translation_generation as tg_module

        fake = FakeTranslationProvider()

        original_init = tg_module.TranslationGenerationService.__init__

        def patched_init(self, repository, *, provider=None):
            original_init(self, repository, provider=provider or fake)

        monkeypatch.setattr(tg_module.TranslationGenerationService, "__init__", patched_init)

        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Capitol"},
            headers=admin_headers(),
        ).json()["contentId"]
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            json={"body": sample_manual_body()},
            headers=admin_headers(),
        )
        response = client.post(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en/generate-translation",
            json={"confirmOverwrite": False},
            headers=admin_headers(),
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["locale"] == "en"
        assert payload["translationProvider"] == "deepl"
        assert payload["body"]["title"].startswith("[en]")
        assert payload["status"] == "draft"
        assert payload["generatedFromSourceTextRevision"] is not None
        assert payload["translationUpdateAction"] == "skip_current"
        assert payload["translationUpdateState"] == "current"

        # Unchanged RO → current → skip (200, no conflict).
        skip = client.post(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en/generate-translation",
            json={"confirmOverwrite": False},
            headers=admin_headers(),
        )
        assert skip.status_code == 200
        assert skip.json()["translationUpdateAction"] == "skip_current"

        # Text change → conflict until confirm.
        changed = sample_manual_body()
        changed["title"] = "Alt capitol"
        client.put(
            f"/api/admin/manual/chapters/{chapter_id}/variants/ro",
            json={"body": changed},
            headers=admin_headers(),
        )
        conflict = client.post(
            f"/api/admin/manual/chapters/{chapter_id}/variants/en/generate-translation",
            json={"confirmOverwrite": False},
            headers=admin_headers(),
        )
        assert conflict.status_code == 409

    def test_public_still_rejects_unprepared_public_locale(self, client):
        response = client.get("/api/content/manual?locale=fr")
        assert response.status_code == 400

    def test_admin_accepts_prepared_locale_get(self, client):
        chapter_id = client.post(
            "/api/admin/manual/chapters",
            json={"title": "Capitol"},
            headers=admin_headers(),
        ).json()["contentId"]
        response = client.get(
            f"/api/admin/manual/chapters/{chapter_id}/variants/fr",
            headers=admin_headers(),
        )
        assert response.status_code == 200
        assert response.json()["exists"] is False
        assert response.json()["locale"] == "fr"

    def test_generate_requires_administrator(self, client):
        response = client.post(
            "/api/admin/manual/chapters/x/variants/en/generate-translation",
            json={},
            headers={"X-Mock-Role": "user", "X-Mock-User-Id": "u1"},
        )
        assert response.status_code in {401, 403}
