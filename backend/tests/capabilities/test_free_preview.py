from pathlib import Path

from public.product.capabilities.free_preview import (
    filter_free_preview_entries,
    load_free_preview_config,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
PRIVATE_CONFIG = REPOSITORY_ROOT / "private" / "content" / "config" / "free-preview.json"
PUBLIC_CONFIG = REPOSITORY_ROOT / "public" / "content" / "config" / "free-preview.json"


def test_preview_configuration_has_exactly_five_unique_ids_per_module():
    preview = load_free_preview_config(PRIVATE_CONFIG)

    assert len(preview["knowledgeBaseEntryIds"]) == 5
    assert len(set(preview["knowledgeBaseEntryIds"])) == 5
    assert len(preview["glossaryEntryIds"]) == 5
    assert len(set(preview["glossaryEntryIds"])) == 5


def test_private_and_public_release_configurations_match():
    assert load_free_preview_config(PRIVATE_CONFIG) == load_free_preview_config(PUBLIC_CONFIG)


def test_free_filter_uses_canonical_ids_and_configured_order_not_snapshot_order():
    allowed_ids = ("preview-second", "preview-first")
    entries = [
        {"id": "premium", "title": "Premium"},
        {"id": "preview-first", "title": "First"},
        {"id": "preview-second", "title": "Second"},
    ]

    assert filter_free_preview_entries(entries, allowed_ids, "free") == [
        {"id": "preview-second", "title": "Second"},
        {"id": "preview-first", "title": "First"},
    ]


def test_free_filter_returns_available_intersection_without_premium_entries():
    entries = [{"id": "preview-first"}, {"id": "premium"}]

    assert filter_free_preview_entries(entries, ("preview-first", "missing"), "free") == [
        {"id": "preview-first"}
    ]


def test_subscriber_filter_returns_complete_available_corpus():
    entries = [{"id": "preview-first"}, {"id": "premium"}]

    assert filter_free_preview_entries(entries, ("preview-first",), "subscriber") == entries
