"""Glossary list/snapshot single-store-read optimization tests."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from content.repositories import filesystem as filesystem_module
from content.repositories.filesystem import EDITORIAL_LOCALES, FilesystemContentRepository
from content.schemas.common import ContentStatus
from content.schemas.glossary import GlossaryEntryListItem, GlossaryVariantSummary
from content.services.editorial_identity import entry_identity_term
from content.services.glossary_entries import GlossaryEntryService
from content.services.glossary_public import GlossaryPublicService
from content.services.glossary_publish import GlossaryPublishService


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _definition_body(term: str, text: str = "Definition text.") -> dict:
    return {
        "term": term,
        "definitionBlocks": [{"type": "paragraph", "text": text}],
        "media": [],
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


def _legacy_list_entries(repository: FilesystemContentRepository, locale: str) -> list[dict]:
    """Pre-optimization list algorithm: one store read per getter call."""
    from content.repositories.filesystem import parse_iso
    from content.schemas.glossary import parse_admin_locale

    parsed_locale = parse_admin_locale(locale)
    items: list[dict] = []
    for content_id in repository.list_glossary_entry_ids():
        meta = repository.get_glossary_entry_meta(content_id)
        if not meta:
            continue
        variants: dict[str, dict] = {}
        active_variant: dict | None = None
        for variant_locale in EDITORIAL_LOCALES:
            variant = repository.get_glossary_variant(content_id, variant_locale)
            if not variant:
                continue
            variants[variant_locale] = {
                "status": variant["status"],
                "updatedAt": parse_iso(variant.get("updatedAt")),
                "publishedAt": parse_iso(variant.get("publishedAt")),
            }
            if variant_locale == parsed_locale:
                active_variant = variant
        active_term = ""
        if active_variant is not None:
            active_term = active_variant.get("draftBody", {}).get("term", "").strip()
        items.append(
            {
                "contentId": content_id,
                "term": active_term or entry_identity_term(repository, content_id),
                "sortOrder": meta["sortOrder"],
                "variants": variants,
            }
        )
    return items


def _legacy_build_admin_snapshot(repository: FilesystemContentRepository, locale: str) -> dict:
    """Pre-optimization snapshot algorithm using per-call getters."""
    service = GlossaryPublicService(repository)
    entries: list[dict] = []
    for content_id in repository.list_glossary_entry_ids():
        variant = repository.get_glossary_variant(content_id, locale)
        if not variant or variant["status"] != "published":
            continue
        # Use from-store path only through one-shot public entry helper that reloads —
        # call the public entry builder which itself loads store (matches old multi-read
        # semantic output, not call counts).
        public_entry = service._build_public_entry(content_id, variant, locale)
        entries.append(public_entry.model_dump())
    entries.sort(key=lambda item: item["term"].casefold())
    return {"locale": locale, "entries": entries}


def _list_payload(items: list[GlossaryEntryListItem]) -> list[dict]:
    return [item.model_dump(mode="python") for item in items]


def _normalize_list_payload(items: list[dict]) -> list[dict]:
    normalized = []
    for item in items:
        variants = {}
        for locale, summary in item["variants"].items():
            if isinstance(summary, GlossaryVariantSummary):
                summary = summary.model_dump(mode="python")
            variants[locale] = {
                "status": (
                    summary["status"].value
                    if isinstance(summary["status"], ContentStatus)
                    else summary["status"]
                ),
                "updatedAt": summary["updatedAt"],
                "publishedAt": summary["publishedAt"],
            }
        normalized.append(
            {
                "contentId": item["contentId"],
                "term": item["term"],
                "sortOrder": item["sortOrder"],
                "variants": variants,
            }
        )
    return normalized


@pytest.fixture
def repository(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> FilesystemContentRepository:
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    return FilesystemContentRepository(tmp_path)


def _seed_mixed_glossary(repository: FilesystemContentRepository) -> dict[str, str]:
    now = datetime.now(timezone.utc)
    earlier = now - timedelta(hours=2)

    draft = repository.create_glossary_entry("Draft Only Term", content_id="draft-only")
    repository.save_glossary_variant(
        draft["contentId"], "ro", _definition_body("Draft Only Term", "Draft definition.")
    )

    published = repository.create_glossary_entry("Published Term", content_id="published-term")
    repository.save_glossary_variant(
        published["contentId"], "ro", _definition_body("Published Term", "Live definition.")
    )
    repository.publish_glossary_variant(published["contentId"], "ro")

    outdated = repository.create_glossary_entry("Outdated Term", content_id="outdated-term")
    repository.save_glossary_variant(
        outdated["contentId"], "ro", _definition_body("Outdated Term", "Original published.")
    )
    repository.publish_glossary_variant(outdated["contentId"], "ro")
    repository.save_glossary_variant(
        outdated["contentId"], "ro", _definition_body("Outdated Term", "Newer draft text.")
    )

    # Entry with RO published and EN missing entirely.
    missing_en = repository.create_glossary_entry("Missing EN Term", content_id="missing-en")
    repository.save_glossary_variant(
        missing_en["contentId"], "ro", _definition_body("Missing EN Term", "Romanian only.")
    )
    repository.publish_glossary_variant(missing_en["contentId"], "ro")

    # Entry with EN draft but empty/missing FR; RO identity for fallback listing.
    en_draft = repository.create_glossary_entry("Fallback Identity", content_id="fallback-identity")
    repository.save_glossary_variant(
        en_draft["contentId"], "ro", _definition_body("Fallback Identity", "RO body.")
    )
    repository.save_glossary_variant(
        en_draft["contentId"], "en", _definition_body("English Fallback Identity", "EN draft.")
    )

    # Touch timestamps for outdated visibility clarity (status fields still drive list summaries).
    records = repository.read_editorial_records()
    variant = repository.get_glossary_variant_from_store(records, outdated["contentId"], "ro")
    assert variant is not None
    variant["publishedAt"] = _iso(earlier)
    variant["updatedAt"] = _iso(now)
    from content.repositories.filesystem import make_glossary_variant_key

    records[make_glossary_variant_key(outdated["contentId"], "ro")] = variant
    repository._write_store(records)

    return {
        "draft": draft["contentId"],
        "published": published["contentId"],
        "outdated": outdated["contentId"],
        "missing_en": missing_en["contentId"],
        "fallback": en_draft["contentId"],
    }


class TestGlossaryListReadAmplification:
    def test_list_entries_uses_exactly_one_store_read(self, repository):
        _seed_mixed_glossary(repository)
        service = GlossaryEntryService(repository)
        reads = {"n": 0}
        real = repository._read_store

        def counting():
            reads["n"] += 1
            return real()

        repository._read_store = counting  # type: ignore[method-assign]
        items = service.list_entries("ro")
        assert reads["n"] == 1
        assert len(items) == 5

    def test_empty_glossary_one_read_and_empty_response(self, repository):
        service = GlossaryEntryService(repository)
        reads = {"n": 0}
        real = repository._read_store

        def counting():
            reads["n"] += 1
            return real()

        repository._read_store = counting  # type: ignore[method-assign]
        items = service.list_entries("ro")
        assert reads["n"] == 1
        assert items == []

    def test_list_response_parity_with_legacy_algorithm(self, repository):
        _seed_mixed_glossary(repository)
        service = GlossaryEntryService(repository)
        optimized = _normalize_list_payload(_list_payload(service.list_entries("ro")))
        legacy = _normalize_list_payload(_legacy_list_entries(repository, "ro"))
        assert optimized == legacy

        optimized_en = _normalize_list_payload(_list_payload(service.list_entries("en")))
        legacy_en = _normalize_list_payload(_legacy_list_entries(repository, "en"))
        assert optimized_en == legacy_en

    def test_mixed_entry_states_from_one_store(self, repository):
        ids = _seed_mixed_glossary(repository)
        service = GlossaryEntryService(repository)
        reads = {"n": 0}
        real = repository._read_store

        def counting():
            reads["n"] += 1
            return real()

        repository._read_store = counting  # type: ignore[method-assign]
        items = {item.contentId: item for item in service.list_entries("ro")}
        assert reads["n"] == 1

        assert items[ids["draft"]].variants["ro"].status == ContentStatus.DRAFT
        assert items[ids["published"]].variants["ro"].status == ContentStatus.PUBLISHED
        # Post-publish edits keep status=published; outdated is updatedAt > publishedAt.
        assert items[ids["outdated"]].variants["ro"].status == ContentStatus.PUBLISHED
        assert items[ids["outdated"]].variants["ro"].publishedAt is not None
        assert items[ids["outdated"]].variants["ro"].updatedAt is not None
        assert items[ids["outdated"]].variants["ro"].updatedAt > items[ids["outdated"]].variants["ro"].publishedAt
        assert "en" not in items[ids["missing_en"]].variants
        assert items[ids["missing_en"]].term == "Missing EN Term"

        en_items = {item.contentId: item for item in service.list_entries("en")}
        # Selected EN missing → fallback to Romanian identity term.
        assert en_items[ids["missing_en"]].term == "Missing EN Term"
        assert en_items[ids["fallback"]].term == "English Fallback Identity"


class TestGlossarySnapshotReadAmplification:
    def test_snapshot_uses_exactly_one_editorial_store_read(self, repository):
        ids = _seed_mixed_glossary(repository)
        # Ensure at least one published entry with a relation for label resolution.
        repository.save_glossary_variant(
            ids["published"],
            "ro",
            {
                **_definition_body("Published Term", "Live definition."),
                "relatedTermIds": [ids["missing_en"]],
                "seeAlso": [
                    {
                        "targetType": "glossary_entry",
                        "targetContentId": ids["missing_en"],
                        "label": "",
                    }
                ],
            },
        )
        repository.publish_glossary_variant(ids["published"], "ro")

        service = GlossaryPublicService(repository)
        reads = {"n": 0}
        real = repository._read_store

        def counting():
            reads["n"] += 1
            return real()

        repository._read_store = counting  # type: ignore[method-assign]
        snapshot = service.build_admin_snapshot("ro")
        assert reads["n"] == 1
        assert snapshot["locale"] == "ro"
        published_ids = {entry["id"] for entry in snapshot["entries"]}
        assert ids["published"] in published_ids
        assert ids["missing_en"] in published_ids
        assert ids["draft"] not in published_ids

    def test_snapshot_parity_with_legacy_algorithm(self, repository):
        ids = _seed_mixed_glossary(repository)
        repository.save_glossary_variant(
            ids["published"],
            "ro",
            {
                **_definition_body("Published Term", "Live definition."),
                "relatedTermIds": [ids["missing_en"]],
            },
        )
        repository.publish_glossary_variant(ids["published"], "ro")

        optimized = GlossaryPublicService(repository).build_admin_snapshot("ro")
        legacy = _legacy_build_admin_snapshot(repository, "ro")
        assert optimized == legacy

    def test_unpublished_drafts_excluded_from_snapshot(self, repository):
        ids = _seed_mixed_glossary(repository)
        snapshot = GlossaryPublicService(repository).build_admin_snapshot("ro")
        published_ids = {entry["id"] for entry in snapshot["entries"]}
        assert ids["draft"] not in published_ids
        assert ids["fallback"] not in published_ids  # RO exists but not published
        # Edited-after-publish entries remain status=published and stay in the snapshot.
        assert ids["outdated"] in published_ids
        assert ids["published"] in published_ids
        assert ids["missing_en"] in published_ids

    def test_failed_snapshot_write_leaves_existing_snapshot_unchanged(self, repository, monkeypatch):
        ids = _seed_mixed_glossary(repository)
        publish = GlossaryPublishService(repository)
        key = publish.rebuild_published_snapshot("ro")
        assert key
        original = repository.read_glossary_snapshot("ro")
        assert original is not None
        assert any(entry["id"] == ids["published"] for entry in original["entries"])

        def fail_write(path, payload, sleep=None):
            raise OSError("simulated snapshot write failure")

        monkeypatch.setattr(filesystem_module, "atomic_write_json", fail_write)
        with pytest.raises(OSError, match="simulated snapshot write failure"):
            publish.rebuild_published_snapshot("ro")

        assert repository.read_glossary_snapshot("ro") == original

    def test_rebuild_published_snapshot_single_editorial_read(self, repository):
        _seed_mixed_glossary(repository)
        publish = GlossaryPublishService(repository)
        reads = {"n": 0}
        real = repository._read_store

        def counting():
            reads["n"] += 1
            return real()

        repository._read_store = counting  # type: ignore[method-assign]
        publish.rebuild_published_snapshot("ro")
        assert reads["n"] == 1
