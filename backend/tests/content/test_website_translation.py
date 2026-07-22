"""Website translation wiring tests (Stage 4)."""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Literal

import pytest
from fastapi.testclient import TestClient

from content.repositories.filesystem import FilesystemContentRepository
from content.routers import admin_translation_bulk, admin_website, public_content
from content.services.translation_bulk import TranslationBulkService, reset_bulk_run_locks_for_tests
from content.services.translation_generation import TranslationGenerationService
from content.services.translation_update import (
    TranslationUpdateService,
    classify_translation_update,
)
from content.translation.editorial_text import extract_translatable_items, reconstruct_draft_body
from content.translation.exceptions import TranslationConfigurationError, TranslationTemporaryProviderError
from content.translation.types import TranslationResult
from content.translation_metadata import (
    read_generated_from_source_revision,
    read_generated_from_source_text_revision,
    read_source_revision,
)
from content.website_pages import WEBSITE_PAGE_DEFINITIONS, empty_website_draft_body


class FakeTranslationProvider:
    def __init__(self, *, fail: bool = False) -> None:
        self.calls: list[dict[str, Any]] = []
        self.fail = fail

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
        if self.fail:
            raise TranslationTemporaryProviderError("provider boom")
        self.calls.append(
            {
                "text": text,
                "source_locale": source_locale,
                "target_locale": target_locale,
                "content_format": content_format,
            }
        )
        return TranslationResult(
            text=f"[{target_locale}]{text}",
            provider="deepl",
            source_locale=source_locale,
            target_locale=target_locale,
            billed_characters=len(text),
        )


@pytest.fixture
def repository(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    return FilesystemContentRepository(tmp_path)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AUTH_MODE", "mock")
    admin_website.reset_repository_cache()
    admin_translation_bulk.reset_repository_cache()
    public_content.reset_repository_cache()
    reset_bulk_run_locks_for_tests()
    from app import app

    return TestClient(app)


def admin_headers() -> dict[str, str]:
    return {"X-Mock-Role": "administrator", "X-Mock-User-Id": "admin-user"}


def home_body() -> dict:
    body = empty_website_draft_body("home")
    body.update(
        {
            "publicTitle": "Titlu",
            "subtitle": "Subtitlu",
            "description": "Descriere",
            "image": {"src": "/api/content/website/images/a.png", "alt": "Alt", "visible": True},
            "video": {"url": "https://example.com/video", "visible": True},
            "cta": {"label": "Începe", "destination": "/pricing", "visible": True},
        }
    )
    return body


def about_body() -> dict:
    body = empty_website_draft_body("about")
    body["publicTitle"] = "Despre"
    body["sections"] = [
        {
            "id": "intro",
            "title": "Secțiune",
            "blocks": [
                {"type": "heading", "text": "Titlu"},
                {"type": "paragraph", "text": "Paragraf"},
            ],
            "image": {
                "src": "/api/content/website/images/about.png",
                "alt": "Alt secțiune",
            },
        }
    ]
    return body


def pricing_body() -> dict:
    body = empty_website_draft_body("pricing")
    body["publicTitle"] = "Prețuri"
    body["intro"] = "Intro"
    body["footnote"] = "Notă"
    body["offers"][0].update(
        {
            "title": "Gratuit",
            "displayedPriceText": "0 RON",
            "benefits": ["Beneficiu 1"],
            "ctaLabel": "Începe",
            "ctaDestination": "/register",
        }
    )
    return body


def contact_body() -> dict:
    body = empty_website_draft_body("contact")
    body.update(
        {
            "publicTitle": "Contact",
            "intro": "Intro contact",
            "supportEmail": "support@hfzwood.example",
            "links": [{"label": "Site", "url": "https://hfzwood.example", "visible": True}],
            "showManualLink": True,
            "showKnowledgeBaseLink": False,
            "manualLinkLabel": "Manual și tutoriale",
            "knowledgeBaseLinkLabel": "Baza de cunoștințe",
        }
    )
    return body


def privacy_body() -> dict:
    body = empty_website_draft_body("privacy")
    body["publicTitle"] = "Confidențialitate"
    body["sections"] = [
        {
            "id": "policy",
            "title": "Politica",
            "blocks": [{"type": "paragraph", "text": "Text legal"}],
        }
    ]
    return body


def terms_body() -> dict:
    body = empty_website_draft_body("terms")
    body["publicTitle"] = "Termeni"
    body["sections"] = [
        {
            "id": "terms-main",
            "title": "Termeni",
            "blocks": [{"type": "paragraph", "text": "Condiții"}],
        }
    ]
    return body


PAGE_BODY_BUILDERS = {
    "home": home_body,
    "about": about_body,
    "pricing": pricing_body,
    "privacy": privacy_body,
    "terms": terms_body,
    "contact": contact_body,
}


def seed_ro_page(repository: FilesystemContentRepository, page_key: str) -> dict:
    repository.ensure_website_pages_exist()
    body = PAGE_BODY_BUILDERS[page_key]()
    repository.save_website_variant(page_key, "ro", body)
    return body


class TestWebsiteExtractionReconstruction:
    @pytest.mark.parametrize("page_key", [page["pageKey"] for page in WEBSITE_PAGE_DEFINITIONS])
    def test_round_trip_preserves_structure(self, page_key: str):
        body = PAGE_BODY_BUILDERS[page_key]()
        items = extract_translatable_items("website", body)
        assert items
        rebuilt = reconstruct_draft_body(body, [(item, f"T:{item.text}") for item in items])
        assert rebuilt["pageKind"] == body["pageKind"]
        for item in items:
            original = item.text
            assert original is not None
            translated = f"T:{original}"
            path = item.path
            current = rebuilt
            for part in path[:-1]:
                current = current[part]
            assert current[path[-1]].startswith("T:")

    def test_home_preserves_urls_and_visibility(self):
        body = home_body()
        items = extract_translatable_items("website", body)
        rebuilt = reconstruct_draft_body(body, [(item, f"X:{item.text}") for item in items])
        assert rebuilt["image"]["src"] == body["image"]["src"]
        assert rebuilt["image"]["visible"] is True
        assert rebuilt["video"]["url"] == body["video"]["url"]
        assert rebuilt["cta"]["destination"] == body["cta"]["destination"]
        assert all("src" not in item.path for item in items)
        assert all("url" not in item.path for item in items)
        assert all("destination" not in item.path for item in items)
        assert all("visible" not in item.path for item in items)

    def test_pricing_preserves_offer_ids_and_destinations(self):
        body = pricing_body()
        items = extract_translatable_items("website", body)
        rebuilt = reconstruct_draft_body(body, [(item, f"X:{item.text}") for item in items])
        assert {offer["id"] for offer in rebuilt["offers"]} == {"free", "subscriber", "lifetime"}
        assert rebuilt["offers"][0]["ctaDestination"] == "/register"
        assert all("id" not in item.path for item in items)
        assert all("ctaDestination" not in item.path for item in items)

    def test_contact_preserves_email_and_urls(self):
        body = contact_body()
        items = extract_translatable_items("website", body)
        paths = {tuple(item.path) for item in items}
        assert ("supportEmail",) not in paths
        rebuilt = reconstruct_draft_body(body, [(item, f"X:{item.text}") for item in items])
        assert rebuilt["supportEmail"] == "support@hfzwood.example"
        assert rebuilt["links"][0]["url"] == "https://hfzwood.example"
        assert rebuilt["showManualLink"] is True
        assert rebuilt["showKnowledgeBaseLink"] is False

    def test_about_preserves_section_ids(self):
        body = about_body()
        items = extract_translatable_items("website", body)
        rebuilt = reconstruct_draft_body(body, [(item, f"X:{item.text}") for item in items])
        assert rebuilt["sections"][0]["id"] == "intro"
        assert rebuilt["sections"][0]["image"]["src"] == body["sections"][0]["image"]["src"]
        assert rebuilt["sections"][0]["image"]["alt"].startswith("X:")
        assert any(item.path[-1] == "alt" for item in items)
        assert all("src" not in item.path for item in items)

    def test_pricing_preserves_visible_flag(self):
        body = pricing_body()
        body["offers"][0]["visible"] = False
        items = extract_translatable_items("website", body)
        rebuilt = reconstruct_draft_body(body, [(item, f"X:{item.text}") for item in items])
        assert rebuilt["offers"][0]["visible"] is False
        assert all("visible" not in item.path for item in items)

    def test_contact_translates_builtin_link_labels(self):
        body = contact_body()
        items = extract_translatable_items("website", body)
        paths = {tuple(item.path) for item in items}
        assert ("manualLinkLabel",) in paths
        assert ("knowledgeBaseLinkLabel",) in paths
        rebuilt = reconstruct_draft_body(body, [(item, f"X:{item.text}") for item in items])
        assert rebuilt["manualLinkLabel"].startswith("X:")
        assert rebuilt["knowledgeBaseLinkLabel"].startswith("X:")


class TestWebsiteTranslationGeneration:
    def test_generate_translation_creates_target_locale_draft(self, repository):
        seed_ro_page(repository, "home")
        provider = FakeTranslationProvider()
        saved, classification = TranslationUpdateService(repository, provider=provider).update(
            module="website",
            content_id="home",
            target_locale="en",
        )
        assert classification.state.value == "current"
        assert saved["locale"] == "en"
        assert saved["draftBody"]["publicTitle"].startswith("[en]")
        assert read_generated_from_source_revision(saved) == read_source_revision(
            repository.get_website_variant("home", "ro")
        )
        assert provider.calls

    def test_source_text_change_marks_target_text_outdated(self, repository):
        seed_ro_page(repository, "about")
        provider = FakeTranslationProvider()
        TranslationUpdateService(repository, provider=provider).update(
            module="website",
            content_id="about",
            target_locale="en",
        )
        ro_body = repository.get_website_variant("about", "ro")["draftBody"]
        ro_body = deepcopy(ro_body)
        ro_body["sections"][0]["blocks"][0]["text"] = "Text nou"
        repository.save_website_variant("about", "ro", ro_body)
        ro_variant = repository.get_website_variant("about", "ro")
        target_variant = repository.get_website_variant("about", "en")
        classification = classify_translation_update(
            ro_variant=ro_variant,
            target_variant=target_variant,
        )
        assert classification.state.value == "text_outdated"

    def test_media_only_home_image_src_change(self, repository):
        seed_ro_page(repository, "home")
        provider = FakeTranslationProvider()
        TranslationUpdateService(repository, provider=provider).update(
            module="website",
            content_id="home",
            target_locale="en",
        )
        provider.calls.clear()
        ro_body = deepcopy(repository.get_website_variant("home", "ro")["draftBody"])
        ro_body["image"]["src"] = "/api/content/website/images/new.png"
        repository.save_website_variant("home", "ro", ro_body)
        classification = classify_translation_update(
            ro_variant=repository.get_website_variant("home", "ro"),
            target_variant=repository.get_website_variant("home", "en"),
        )
        assert classification.state.value == "media_only_outdated"
        synced, sync_classification = TranslationUpdateService(repository, provider=provider).update(
            module="website",
            content_id="home",
            target_locale="en",
        )
        assert sync_classification.state.value == "current"
        assert sync_classification.action.value == "skip_current"
        assert synced["draftBody"]["image"]["src"].endswith("new.png")
        assert provider.calls == []

    def test_manual_target_edit_becomes_manual_untracked(self, repository):
        seed_ro_page(repository, "contact")
        body = deepcopy(contact_body())
        body["publicTitle"] = "Manual EN"
        repository.save_website_variant("contact", "en", body)
        classification = classify_translation_update(
            ro_variant=repository.get_website_variant("contact", "ro"),
            target_variant=repository.get_website_variant("contact", "en"),
        )
        assert classification.state.value == "manual_untracked"


class TestWebsiteTranslationApi:
    def test_generate_translation_endpoint(self, client, tmp_path, monkeypatch):
        from content.services import translation_generation as tg_module

        fake = FakeTranslationProvider()

        original_init = tg_module.TranslationGenerationService.__init__

        def patched_init(self, repository, *, provider=None):
            original_init(self, repository, provider=provider or fake)

        monkeypatch.setattr(tg_module.TranslationGenerationService, "__init__", patched_init)
        admin_website.reset_repository_cache()

        seed_ro_page(FilesystemContentRepository(tmp_path), "pricing")
        response = client.post(
            "/api/admin/website/pages/pricing/variants/en/generate-translation",
            headers=admin_headers(),
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["locale"] == "en"
        assert payload["body"]["publicTitle"].startswith("[en]")
        assert payload["generatedFromSourceRevision"] is not None
        assert payload["generatedFromSourceTextRevision"] is not None

    def test_provider_configuration_error_maps_to_503(self, client, monkeypatch):
        repository = FilesystemContentRepository()
        seed_ro_page(repository, "home")

        class FailingProvider:
            def translate(self, *args, **kwargs):
                raise TranslationConfigurationError("not configured")

        from content.services import website_pages as website_pages_module

        original = website_pages_module.WebsitePageService.generate_translation

        def patched(self, page_key, locale, *, confirm_overwrite=False, provider=None):
            return original(
                self,
                page_key,
                locale,
                confirm_overwrite=confirm_overwrite,
                provider=FailingProvider(),
            )

        monkeypatch.setattr(website_pages_module.WebsitePageService, "generate_translation", patched)
        admin_website.reset_repository_cache()

        response = client.post(
            "/api/admin/website/pages/home/variants/en/generate-translation",
            headers=admin_headers(),
        )
        assert response.status_code == 503
        assert response.json()["detail"] == "Translation provider is not configured."


class TestWebsiteBulkTranslation:
    def test_bulk_preview_lists_six_website_pages(self, client):
        repository = FilesystemContentRepository()
        for page in WEBSITE_PAGE_DEFINITIONS:
            seed_ro_page(repository, page["pageKey"])

        response = client.post(
            "/api/admin/website/translations/en/bulk-preview",
            headers=admin_headers(),
            json={"includeTextOutdated": False},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["module"] == "website"
        assert payload["total"] == 6
        assert {item["contentId"] for item in payload["items"]} == {
            page["pageKey"] for page in WEBSITE_PAGE_DEFINITIONS
        }

    def test_bulk_update_generates_missing_pages_only(self, client, monkeypatch):
        from content.services.translation_bulk import TranslationBulkService

        fake = FakeTranslationProvider()
        monkeypatch.setattr(
            "content.routers.admin_translation_bulk.TranslationBulkService",
            lambda repo, provider=None: TranslationBulkService(repo, provider=provider or fake),
        )
        admin_translation_bulk.reset_repository_cache()

        repository = FilesystemContentRepository()
        for page in WEBSITE_PAGE_DEFINITIONS:
            seed_ro_page(repository, page["pageKey"])

        service = TranslationBulkService(repository, provider=fake)
        preview = service.preview(module="website", target_locale="en")
        assert preview["counts"]["missing"] == 6

        response = client.post(
            "/api/admin/website/translations/en/bulk-update",
            headers=admin_headers(),
            json={"includeTextOutdated": False, "offset": 0, "limit": 6},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["chunkSummary"]["generated"] == 6
        assert payload["chunkSummary"]["providerCallItems"] == 6
        assert fake.calls

    def test_bulk_update_preserves_pricing_offer_ids(self, repository):
        seed_ro_page(repository, "pricing")
        provider = FakeTranslationProvider()
        TranslationUpdateService(repository, provider=provider).update(
            module="website",
            content_id="pricing",
            target_locale="en",
        )
        target = repository.get_website_variant("pricing", "en")
        assert {offer["id"] for offer in target["draftBody"]["offers"]} == {
            "free",
            "subscriber",
            "lifetime",
        }
