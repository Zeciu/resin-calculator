"""Stage 5B schema extension tests: About images, Pricing visibility, Contact labels."""

from __future__ import annotations

import json
from copy import deepcopy

import pytest

from content.repositories.filesystem import FilesystemContentRepository
from content.schemas.website import (
    AboutWebsiteBody,
    ContactWebsiteBody,
    PublicWebsitePage,
    SaveAboutWebsiteBody,
    SaveContactWebsiteBody,
    SavePricingWebsiteBody,
)
from content.services.translation_update import TranslationUpdateService, classify_translation_update
from content.translation.editorial_text import extract_translatable_items, reconstruct_draft_body
from content.website_pages import (
    DEFAULT_KNOWLEDGE_BASE_LINK_LABEL,
    DEFAULT_MANUAL_LINK_LABEL,
    empty_website_draft_body,
)


@pytest.fixture
def repository(tmp_path):
    return FilesystemContentRepository(tmp_path)


def about_with_section_image() -> dict:
    body = empty_website_draft_body("about")
    body["publicTitle"] = "Despre"
    body["sections"] = [
        {
            "id": "story",
            "title": "Povestea noastră",
            "blocks": [{"type": "paragraph", "text": "Text secțiune"}],
            "image": {
                "src": "/api/content/website/images/story.png",
                "alt": "Echipa HFZWood",
            },
        }
    ]
    return body


def pricing_with_visibility() -> dict:
    body = empty_website_draft_body("pricing")
    body["publicTitle"] = "Prețuri"
    body["offers"][0]["title"] = "Gratuit"
    body["offers"][0]["visible"] = False
    body["offers"][1]["visible"] = True
    body["offers"][2]["visible"] = True
    return body


def contact_with_labels() -> dict:
    body = empty_website_draft_body("contact")
    body["publicTitle"] = "Contact"
    body["manualLinkLabel"] = "Manual personalizat"
    body["knowledgeBaseLinkLabel"] = "KB personalizat"
    body["showManualLink"] = True
    body["showKnowledgeBaseLink"] = False
    return body


class TestAboutSectionImages:
    def test_save_load_round_trip(self, repository):
        repository.ensure_website_pages_exist()
        body = about_with_section_image()
        saved = repository.save_website_variant("about", "ro", body)
        loaded = repository.get_website_variant("about", "ro")
        section = loaded["draftBody"]["sections"][0]
        assert section["image"]["src"].endswith("story.png")
        assert section["image"]["alt"] == "Echipa HFZWood"
        assert saved["draftBody"]["sections"][0]["image"] == section["image"]

    def test_missing_image_defaults_on_validate(self):
        legacy = {
            "pageKind": "about",
            "publicTitle": "About",
            "sections": [{"id": "intro", "title": "Intro", "blocks": []}],
        }
        validated = SaveAboutWebsiteBody.model_validate(legacy)
        assert validated.sections[0].image.src == ""
        assert validated.sections[0].image.alt == ""

    def test_alt_is_translated_src_preserved(self):
        body = about_with_section_image()
        items = extract_translatable_items("website", body)
        alt_items = [item for item in items if item.path[-1] == "alt"]
        assert len(alt_items) == 1
        assert alt_items[0].text == "Echipa HFZWood"
        assert all("src" not in item.path for item in items)

        rebuilt = reconstruct_draft_body(
            body,
            [(item, f"[en]{item.text}") for item in items],
        )
        assert rebuilt["sections"][0]["image"]["src"] == body["sections"][0]["image"]["src"]
        assert rebuilt["sections"][0]["image"]["alt"].startswith("[en]")

    def test_image_only_change_is_media_only(self, repository):
        from content.translation.types import TranslationResult

        class FakeProvider:
            def translate(self, text, **kwargs):
                return TranslationResult(
                    text=f"[en]{text}",
                    provider="deepl",
                    source_locale="ro",
                    target_locale="en",
                    billed_characters=len(text),
                )

        class NoopProvider:
            def translate(self, *args, **kwargs):
                raise AssertionError("provider should not be called")

        repository.ensure_website_pages_exist()
        body = about_with_section_image()
        repository.save_website_variant("about", "ro", body)
        service = TranslationUpdateService(repository, provider=FakeProvider())
        service.update(module="website", content_id="about", target_locale="en")

        ro_body = deepcopy(repository.get_website_variant("about", "ro")["draftBody"])
        ro_body["sections"][0]["image"]["src"] = "/api/content/website/images/new.png"
        repository.save_website_variant("about", "ro", ro_body)

        classification = classify_translation_update(
            ro_variant=repository.get_website_variant("about", "ro"),
            target_variant=repository.get_website_variant("about", "en"),
        )
        assert classification.state.value == "media_only_outdated"

        sync_service = TranslationUpdateService(repository, provider=NoopProvider())
        synced, sync_classification = sync_service.update(
            module="website",
            content_id="about",
            target_locale="en",
        )
        assert sync_classification.action.value == "skip_current"
        assert synced["draftBody"]["sections"][0]["image"]["src"].endswith("new.png")
        assert synced["draftBody"]["sections"][0]["image"]["alt"].startswith("[en]")


class TestPricingOfferVisibility:
    def test_visible_saved_per_offer(self, repository):
        repository.ensure_website_pages_exist()
        body = pricing_with_visibility()
        repository.save_website_variant("pricing", "ro", body)
        loaded = repository.get_website_variant("pricing", "ro")
        by_id = {offer["id"]: offer for offer in loaded["draftBody"]["offers"]}
        assert by_id["free"]["visible"] is False
        assert by_id["subscriber"]["visible"] is True
        assert by_id["lifetime"]["visible"] is True

    def test_missing_visible_defaults_true(self):
        legacy = empty_website_draft_body("pricing")
        legacy["publicTitle"] = "Pricing"
        del legacy["offers"][0]["visible"]
        validated = SavePricingWebsiteBody.model_validate(legacy)
        assert validated.offers[0].visible is True

    def test_visible_not_sent_to_translation_provider(self):
        body = pricing_with_visibility()
        items = extract_translatable_items("website", body)
        assert all("visible" not in item.path for item in items)

    def test_visible_preserved_during_translation(self, repository):
        class FakeProvider:
            def translate(self, text, **kwargs):
                from content.translation.types import TranslationResult

                return TranslationResult(
                    text=f"[en]{text}",
                    provider="deepl",
                    source_locale="ro",
                    target_locale="en",
                    billed_characters=len(text),
                )

        repository.ensure_website_pages_exist()
        repository.save_website_variant("pricing", "ro", pricing_with_visibility())
        service = TranslationUpdateService(repository, provider=FakeProvider())
        saved, _ = service.update(module="website", content_id="pricing", target_locale="en")
        by_id = {offer["id"]: offer for offer in saved["draftBody"]["offers"]}
        assert by_id["free"]["visible"] is False
        assert {offer["id"] for offer in saved["draftBody"]["offers"]} == {
            "free",
            "subscriber",
            "lifetime",
        }


class TestContactBuiltInLinkLabels:
    def test_labels_save_correctly(self, repository):
        repository.ensure_website_pages_exist()
        body = contact_with_labels()
        repository.save_website_variant("contact", "ro", body)
        loaded = repository.get_website_variant("contact", "ro")["draftBody"]
        assert loaded["manualLinkLabel"] == "Manual personalizat"
        assert loaded["knowledgeBaseLinkLabel"] == "KB personalizat"
        assert loaded["showManualLink"] is True
        assert loaded["showKnowledgeBaseLink"] is False

    def test_missing_labels_get_romanian_defaults_on_validate(self):
        legacy = {
            "pageKind": "contact",
            "publicTitle": "Contact",
            "intro": "",
            "supportEmail": "",
            "links": [],
            "showManualLink": True,
            "showKnowledgeBaseLink": True,
        }
        validated = SaveContactWebsiteBody.model_validate(legacy)
        assert validated.manualLinkLabel == DEFAULT_MANUAL_LINK_LABEL
        assert validated.knowledgeBaseLinkLabel == DEFAULT_KNOWLEDGE_BASE_LINK_LABEL

    def test_labels_translated_toggles_preserved(self):
        body = contact_with_labels()
        items = extract_translatable_items("website", body)
        paths = {tuple(item.path) for item in items}
        assert ("manualLinkLabel",) in paths
        assert ("knowledgeBaseLinkLabel",) in paths
        assert ("showManualLink",) not in paths
        assert ("showKnowledgeBaseLink",) not in paths

        rebuilt = reconstruct_draft_body(
            body,
            [(item, f"[en]{item.text}") for item in items],
        )
        assert rebuilt["manualLinkLabel"].startswith("[en]")
        assert rebuilt["knowledgeBaseLinkLabel"].startswith("[en]")
        assert rebuilt["showManualLink"] is True
        assert rebuilt["showKnowledgeBaseLink"] is False


class TestBackwardCompatibility:
    def test_legacy_about_variant_readable(self, repository, tmp_path):
        repository.ensure_website_pages_exist()
        legacy_body = {
            "pageKind": "about",
            "publicTitle": "Legacy About",
            "sections": [
                {
                    "id": "legacy",
                    "title": "Old section",
                    "blocks": [{"type": "paragraph", "text": "Old text"}],
                }
            ],
        }
        repository.save_website_variant("about", "ro", legacy_body)
        loaded = repository.get_website_variant("about", "ro")
        assert loaded["draftBody"]["sections"][0]["title"] == "Old section"
        assert "image" not in loaded["draftBody"]["sections"][0]

    def test_legacy_published_snapshot_readable(self, repository):
        from content.services.website_publish import WebsitePublishService

        repository.ensure_website_pages_exist()
        legacy_body = {
            "pageKind": "pricing",
            "publicTitle": "Legacy Pricing",
            "intro": "",
            "offers": [
                {
                    "id": offer_id,
                    "title": offer_id,
                    "displayedPriceText": "",
                    "benefits": [],
                    "ctaLabel": "",
                    "ctaDestination": "",
                }
                for offer_id in ("free", "subscriber", "lifetime")
            ],
            "footnote": "",
        }
        repository.save_website_variant("pricing", "en", legacy_body)
        WebsitePublishService(repository).publish_variant("pricing", "en")

        snapshot_path = repository._root / "published" / "website" / "en" / "pages.json"
        assert snapshot_path.exists()
        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        page = PublicWebsitePage.model_validate(snapshot["pages"]["pricing"])
        by_id = {offer.id: offer for offer in page.body.offers}
        assert by_id["free"].visible is True

    def test_initialization_does_not_overwrite_populated_variant(self, repository):
        repository.ensure_website_pages_exist()
        body = contact_with_labels()
        body["intro"] = "Populated intro"
        repository.save_website_variant("contact", "ro", body)

        repository.ensure_website_pages_exist()
        loaded = repository.get_website_variant("contact", "ro")["draftBody"]
        assert loaded["intro"] == "Populated intro"
        assert loaded["manualLinkLabel"] == "Manual personalizat"

    def test_about_body_model_accepts_section_image(self):
        body = AboutWebsiteBody.model_validate(about_with_section_image())
        assert body.sections[0].image.alt == "Echipa HFZWood"

    def test_contact_body_model_defaults(self):
        body = ContactWebsiteBody.model_validate(
            {"pageKind": "contact", "publicTitle": "Contact"}
        )
        assert body.manualLinkLabel == DEFAULT_MANUAL_LINK_LABEL
        assert body.knowledgeBaseLinkLabel == DEFAULT_KNOWLEDGE_BASE_LINK_LABEL
