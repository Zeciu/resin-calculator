"""Website module repository and schema tests (Stage 1)."""

from __future__ import annotations

import json

import pytest
from pydantic import ValidationError

from content.repositories.filesystem import FilesystemContentRepository
from content.schemas.website import SaveHomeWebsiteBody, SavePricingWebsiteBody
from content.translation.editorial_text import extract_website_items
from content.website_pages import (
    WEBSITE_PAGE_DEFINITIONS,
    WEBSITE_PAGE_KEYS,
    empty_website_draft_body,
)


@pytest.fixture
def repository(tmp_path):
    return FilesystemContentRepository(tmp_path)


def test_website_page_registry_has_six_fixed_pages():
    assert len(WEBSITE_PAGE_DEFINITIONS) == 6
    assert WEBSITE_PAGE_KEYS == {
        "home",
        "about",
        "pricing",
        "privacy",
        "terms",
        "contact",
    }


def test_empty_pricing_body_includes_approved_offer_ids():
    body = empty_website_draft_body("pricing")
    offer_ids = {offer["id"] for offer in body["offers"]}
    assert offer_ids == {"free", "subscriber", "lifetime"}


def test_save_home_schema_requires_public_title():
    with pytest.raises(ValidationError):
        SaveHomeWebsiteBody(publicTitle="   ")


def test_save_pricing_schema_requires_approved_offer_ids():
    body = empty_website_draft_body("pricing")
    body["publicTitle"] = "Pricing"
    body["offers"] = [body["offers"][0]]
    with pytest.raises(ValidationError):
        SavePricingWebsiteBody.model_validate(body)


def test_ensure_website_pages_exist_is_idempotent(repository: FilesystemContentRepository):
    repository.ensure_website_pages_exist()
    first_ids = repository.list_website_page_ids()
    repository.ensure_website_pages_exist()
    second_ids = repository.list_website_page_ids()

    assert first_ids == second_ids == [page["pageKey"] for page in WEBSITE_PAGE_DEFINITIONS]
    assert repository.get_website_page_meta("home") is not None
    home_variant = repository.get_website_variant("home", "ro")
    assert home_variant is not None
    assert home_variant["draftBody"]["pageKind"] == "home"
    assert home_variant["status"] == "draft"

    snapshot_path = repository._root / "published" / "website" / "en" / "pages.json"
    assert snapshot_path.exists()
    snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
    assert snapshot == {"locale": "en", "pages": {}}


def test_save_website_variant_updates_romanian_metadata(repository: FilesystemContentRepository):
    repository.ensure_website_pages_exist()
    body = empty_website_draft_body("home")
    body["publicTitle"] = "HFZWood"
    body["subtitle"] = "Subtitle"

    saved = repository.save_website_variant("home", "ro", body)
    assert saved["draftBody"]["publicTitle"] == "HFZWood"
    assert saved["sourceRevision"] == 2
    assert saved["sourceTextRevision"] == 2


def test_save_website_variant_rejects_page_kind_mismatch(repository: FilesystemContentRepository):
    repository.ensure_website_pages_exist()
    body = empty_website_draft_body("about")
    body["publicTitle"] = "About"

    with pytest.raises(ValueError, match="pageKind"):
        repository.save_website_variant("home", "ro", body)


def test_publish_and_unpublish_website_variant(repository: FilesystemContentRepository):
    repository.ensure_website_pages_exist()
    body = empty_website_draft_body("contact")
    body["publicTitle"] = "Contact"
    repository.save_website_variant("contact", "ro", body)

    published = repository.publish_website_variant("contact", "ro")
    assert published["status"] == "published"
    assert published["publishedAt"] is not None

    unpublished = repository.unpublish_website_variant("contact", "ro")
    assert unpublished["status"] == "draft"


def test_delete_non_romanian_website_variant(repository: FilesystemContentRepository):
    repository.ensure_website_pages_exist()
    body = empty_website_draft_body("about")
    body["publicTitle"] = "About"
    repository.save_website_variant("about", "en", body)

    repository.delete_website_page_variant("about", "en")
    assert repository.get_website_variant("about", "en") is None


def test_delete_romanian_website_variant_is_blocked(repository: FilesystemContentRepository):
    repository.ensure_website_pages_exist()
    with pytest.raises(ValueError, match="canonical Romanian"):
        repository.delete_website_page_variant("home", "ro")


def test_extract_website_items_includes_home_and_pricing_strings():
    home_items = extract_website_items(
        {
            "pageKind": "home",
            "publicTitle": "Title",
            "subtitle": "Sub",
            "description": "Desc",
            "image": {"src": "", "alt": "Alt", "visible": True},
            "video": {"url": "", "visible": False},
            "cta": {"label": "Go", "destination": "/pricing", "visible": True},
        }
    )
    assert {item.text for item in home_items} == {"Title", "Sub", "Desc", "Alt", "Go"}

    pricing_body = empty_website_draft_body("pricing")
    pricing_body["publicTitle"] = "Pricing"
    pricing_body["intro"] = "Intro"
    pricing_body["offers"][0]["title"] = "Free"
    pricing_items = extract_website_items(pricing_body)
    assert any(item.text == "Free" for item in pricing_items)
