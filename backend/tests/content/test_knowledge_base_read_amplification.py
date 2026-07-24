"""Knowledge Base list/snapshot single-store-read optimization tests."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from content.repositories import filesystem as filesystem_module
from content.repositories.filesystem import EDITORIAL_LOCALES, FilesystemContentRepository
from content.schemas.common import ContentStatus
from content.schemas.glossary import GlossaryVariantBody
from content.schemas.knowledge_base import (
    KnowledgeBaseEntryListItem,
    KnowledgeBaseVariantBody,
    KnowledgeBaseVariantSummary,
)
from content.schemas.manual import ManualVariantBody
from content.services.editorial_identity import entry_identity_title
from content.services.glossary_entries import GlossaryEntryService
from content.services.knowledge_base_entries import KnowledgeBaseEntryService, empty_variant_body
from content.services.knowledge_base_public import KnowledgeBasePublicService
from content.services.knowledge_base_publish import KnowledgeBasePublishService
from content.services.manual_chapters import ManualChapterService, empty_variant_body as empty_manual_body
from content.services.manual_publish import ManualPublishService


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _kb_body(title: str, **overrides) -> KnowledgeBaseVariantBody:
    payload = {
        **empty_variant_body(title),
        "problemSummary": f"Problem for {title}",
        "symptoms": ["symptom"],
        "possibleCauses": ["cause"],
        "solution": ["do the fix"],
        **overrides,
    }
    return KnowledgeBaseVariantBody.model_validate(payload)


def _legacy_list_entries(repository: FilesystemContentRepository, locale: str) -> list[dict]:
    from content.repositories.filesystem import parse_iso
    from content.schemas.knowledge_base import parse_admin_locale

    parsed_locale = parse_admin_locale(locale)
    items: list[dict] = []
    for content_id in repository.list_kb_entry_ids():
        meta = repository.get_kb_entry_meta(content_id)
        if not meta:
            continue
        variants: dict[str, dict] = {}
        active_variant: dict | None = None
        for variant_locale in EDITORIAL_LOCALES:
            variant = repository.get_kb_variant(content_id, variant_locale)
            if not variant:
                continue
            variants[variant_locale] = {
                "status": variant["status"],
                "updatedAt": parse_iso(variant.get("updatedAt")),
                "publishedAt": parse_iso(variant.get("publishedAt")),
            }
            if variant_locale == parsed_locale:
                active_variant = variant
        active_title = ""
        if active_variant is not None:
            active_title = active_variant.get("draftBody", {}).get("title", "").strip()
        items.append(
            {
                "contentId": content_id,
                "title": active_title or entry_identity_title(repository, content_id),
                "category": meta["category"],
                "difficulty": meta["difficulty"],
                "sortOrder": meta["sortOrder"],
                "variants": variants,
            }
        )
    return items


def _legacy_build_admin_snapshot(repository: FilesystemContentRepository, locale: str) -> dict:
    service = KnowledgeBasePublicService(repository)
    entries: list[dict] = []
    for content_id in repository.list_kb_entry_ids():
        variant = repository.get_kb_variant(content_id, locale)
        if not variant or variant["status"] != "published":
            continue
        public_entry = service._build_public_entry(content_id, variant, locale)
        entries.append(public_entry.model_dump())
    return {"locale": locale, "entries": entries}


def _list_payload(items: list[KnowledgeBaseEntryListItem]) -> list[dict]:
    return [item.model_dump(mode="python") for item in items]


def _normalize_list_payload(items: list[dict]) -> list[dict]:
    normalized = []
    for item in items:
        variants = {}
        for locale, summary in item["variants"].items():
            if isinstance(summary, KnowledgeBaseVariantSummary):
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
                "title": item["title"],
                "category": item["category"],
                "difficulty": item["difficulty"],
                "sortOrder": item["sortOrder"],
                "variants": variants,
            }
        )
    return normalized


@pytest.fixture
def repository(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> FilesystemContentRepository:
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.delenv("EDITORIAL_CONTENT_MODE", raising=False)
    return FilesystemContentRepository(tmp_path)


def _count_reads(repository: FilesystemContentRepository) -> dict[str, int]:
    reads = {"n": 0}
    real = repository._read_store

    def counting():
        reads["n"] += 1
        return real()

    repository._read_store = counting  # type: ignore[method-assign]
    return reads


def _seed_mixed_kb(repository: FilesystemContentRepository) -> dict[str, str]:
    service = KnowledgeBaseEntryService(repository)
    publish = KnowledgeBasePublishService(repository)
    now = datetime.now(timezone.utc)
    earlier = now - timedelta(hours=2)

    draft = service.create_entry("Draft Only Entry", category="Epoxy", difficulty="Beginner")
    service.save_variant(
        draft.contentId, "ro", "Epoxy", "Beginner", _kb_body("Draft Only Entry")
    )

    published = service.create_entry("Published Entry", category="Epoxy", difficulty="Beginner")
    service.save_variant(
        published.contentId, "ro", "Epoxy", "Beginner", _kb_body("Published Entry")
    )
    publish.publish_variant(published.contentId, "ro")

    outdated = service.create_entry("Outdated Entry", category="Wood", difficulty="Professional")
    service.save_variant(
        outdated.contentId, "ro", "Wood", "Professional", _kb_body("Outdated Entry", solution=["old"])
    )
    publish.publish_variant(outdated.contentId, "ro")
    service.save_variant(
        outdated.contentId,
        "ro",
        "Wood",
        "Professional",
        _kb_body("Outdated Entry", solution=["newer draft"]),
    )

    missing_en = service.create_entry("Missing EN Entry", category="Epoxy", difficulty="Beginner")
    service.save_variant(
        missing_en.contentId, "ro", "Epoxy", "Beginner", _kb_body("Missing EN Entry")
    )
    publish.publish_variant(missing_en.contentId, "ro")

    en_draft = service.create_entry("Fallback Identity", category="Epoxy", difficulty="Beginner")
    service.save_variant(
        en_draft.contentId, "ro", "Epoxy", "Beginner", _kb_body("Fallback Identity")
    )
    service.save_variant(
        en_draft.contentId,
        "en",
        "Epoxy",
        "Beginner",
        _kb_body("English Fallback Identity"),
    )

    records = repository.read_editorial_records()
    from content.repositories.filesystem import make_kb_variant_key

    variant = repository.get_kb_variant_from_store(records, outdated.contentId, "ro")
    assert variant is not None
    variant["publishedAt"] = _iso(earlier)
    variant["updatedAt"] = _iso(now)
    records[make_kb_variant_key(outdated.contentId, "ro")] = variant
    repository._write_store(records)

    return {
        "draft": draft.contentId,
        "published": published.contentId,
        "outdated": outdated.contentId,
        "missing_en": missing_en.contentId,
        "fallback": en_draft.contentId,
    }


def _seed_kb_count(
    repository: FilesystemContentRepository, count: int, *, with_relations: bool = False
) -> list[str]:
    service = KnowledgeBaseEntryService(repository)
    ids: list[str] = []
    for index in range(count):
        meta = service.create_entry(
            f"KB Entry {index:03d}", category="Epoxy", difficulty="Beginner"
        )
        body = _kb_body(f"KB Entry {index:03d}")
        service.save_variant(meta.contentId, "ro", "Epoxy", "Beginner", body)
        ids.append(meta.contentId)

    if with_relations and len(ids) > 1:
        # Attach relations only after the target entry exists; publish order is caller's job.
        for content_id in ids[1:]:
            meta = repository.get_kb_entry_meta(content_id)
            assert meta is not None
            current = repository.get_kb_variant(content_id, "ro")
            assert current is not None
            body = _kb_body(
                current["draftBody"]["title"],
                relatedKbEntryIds=[ids[0]],
            )
            service.save_variant(content_id, "ro", meta["category"], meta["difficulty"], body)
    return ids


class TestKnowledgeBaseListReadAmplification:
    def test_list_entries_uses_exactly_one_store_read(self, repository):
        _seed_mixed_kb(repository)
        service = KnowledgeBaseEntryService(repository)
        reads = _count_reads(repository)
        items = service.list_entries("ro")
        assert reads["n"] == 1
        assert len(items) == 5

    @pytest.mark.parametrize("count", [10, 20])
    def test_list_read_count_constant_across_corpus_sizes(self, repository, count: int):
        _seed_kb_count(repository, count)
        service = KnowledgeBaseEntryService(repository)
        reads = _count_reads(repository)
        items = service.list_entries("ro")
        assert len(items) == count
        assert reads["n"] == 1

    def test_empty_kb_one_read_and_empty_response(self, repository):
        service = KnowledgeBaseEntryService(repository)
        reads = _count_reads(repository)
        items = service.list_entries("ro")
        assert reads["n"] == 1
        assert items == []

    def test_list_response_parity_with_legacy_algorithm(self, repository):
        _seed_mixed_kb(repository)
        service = KnowledgeBaseEntryService(repository)
        optimized = _normalize_list_payload(_list_payload(service.list_entries("ro")))
        legacy = _normalize_list_payload(_legacy_list_entries(repository, "ro"))
        assert optimized == legacy

        optimized_en = _normalize_list_payload(_list_payload(service.list_entries("en")))
        legacy_en = _normalize_list_payload(_legacy_list_entries(repository, "en"))
        assert optimized_en == legacy_en

    def test_mixed_entry_states_from_one_store(self, repository):
        ids = _seed_mixed_kb(repository)
        service = KnowledgeBaseEntryService(repository)
        reads = _count_reads(repository)
        items = {item.contentId: item for item in service.list_entries("ro")}
        assert reads["n"] == 1

        assert items[ids["draft"]].variants["ro"].status == ContentStatus.DRAFT
        assert items[ids["published"]].variants["ro"].status == ContentStatus.PUBLISHED
        assert items[ids["outdated"]].variants["ro"].updatedAt > items[ids["outdated"]].variants["ro"].publishedAt
        assert "en" not in items[ids["missing_en"]].variants
        assert items[ids["missing_en"]].title == "Missing EN Entry"

        en_items = {item.contentId: item for item in service.list_entries("en")}
        assert en_items[ids["missing_en"]].title == "Missing EN Entry"
        assert en_items[ids["fallback"]].title == "English Fallback Identity"


class TestKnowledgeBaseSnapshotReadAmplification:
    def test_snapshot_uses_exactly_one_editorial_store_read(self, repository):
        ids = _seed_mixed_kb(repository)
        service = KnowledgeBasePublicService(repository)
        reads = _count_reads(repository)
        snapshot = service.build_admin_snapshot("ro")
        assert reads["n"] == 1
        published_ids = {entry["id"] for entry in snapshot["entries"]}
        assert ids["published"] in published_ids
        assert ids["missing_en"] in published_ids
        assert ids["draft"] not in published_ids

    def test_snapshot_parity_with_legacy_algorithm(self, repository):
        ids = _seed_mixed_kb(repository)
        kb = KnowledgeBaseEntryService(repository)
        meta = repository.get_kb_entry_meta(ids["published"])
        assert meta is not None
        kb.save_variant(
            ids["published"],
            "ro",
            meta["category"],
            meta["difficulty"],
            _kb_body("Published Entry", relatedKbEntryIds=[ids["missing_en"]]),
        )
        KnowledgeBasePublishService(repository).publish_variant(ids["published"], "ro")

        optimized = KnowledgeBasePublicService(repository).build_admin_snapshot("ro")
        legacy = _legacy_build_admin_snapshot(repository, "ro")
        assert optimized == legacy

    def test_relations_do_not_increase_store_reads(self, repository):
        # Seed related glossary + manual targets so all three relation resolvers run.
        glossary = GlossaryEntryService(repository)
        g_meta = glossary.create_entry("Related Glossary Term")
        glossary.save_variant(
            g_meta.contentId,
            "ro",
            GlossaryVariantBody.model_validate(
                {
                    "term": "Related Glossary Term",
                    "definitionBlocks": [{"type": "paragraph", "text": "Definition."}],
                    "media": [],
                    "relatedTermIds": [],
                    "synonymTermIds": [],
                    "seeAlso": [],
                }
            ),
        )
        from content.services.glossary_publish import GlossaryPublishService

        GlossaryPublishService(repository).publish_variant(g_meta.contentId, "ro")

        manual = ManualChapterService(repository)
        m_meta = manual.create_chapter("Related Manual Chapter", locale="ro")
        payload = empty_manual_body("Related Manual Chapter")
        payload["sections"][0]["blocks"] = [{"type": "paragraph", "text": "Manual body."}]
        manual.save_variant(m_meta.contentId, "ro", ManualVariantBody.model_validate(payload))
        ManualPublishService(repository).publish_variant(m_meta.contentId, "ro")

        ids = _seed_kb_count(repository, 15, with_relations=False)
        kb = KnowledgeBaseEntryService(repository)
        publish = KnowledgeBasePublishService(repository)

        # Publish the relation target first so cross-reference validation succeeds.
        publish.publish_variant(ids[0], "ro")

        for content_id in ids:
            meta = repository.get_kb_entry_meta(content_id)
            assert meta is not None
            current = repository.get_kb_variant(content_id, "ro")
            assert current is not None
            title = current["draftBody"]["title"]
            related_kb = [ids[0]] if content_id != ids[0] else []
            titled = _kb_body(
                title,
                relatedKbEntryIds=related_kb,
                relatedGlossaryEntryIds=[g_meta.contentId],
                relatedManualChapterIds=[m_meta.contentId],
            )
            kb.save_variant(content_id, "ro", meta["category"], meta["difficulty"], titled)
            publish.publish_variant(content_id, "ro")

        reads = _count_reads(repository)
        snapshot = KnowledgeBasePublicService(repository).build_admin_snapshot("ro")
        assert reads["n"] == 1
        assert len(snapshot["entries"]) == 15
        related = next(entry for entry in snapshot["entries"] if entry["id"] == ids[1])
        assert related["relatedKbArticles"]
        assert related["relatedGlossaryTerms"]
        assert related["relatedManualChapters"]

    @pytest.mark.parametrize("count", [10, 20])
    def test_snapshot_read_count_constant_across_corpus_sizes(self, repository, count: int):
        ids = _seed_kb_count(repository, count, with_relations=True)
        publish = KnowledgeBasePublishService(repository)
        publish.publish_variant(ids[0], "ro")
        for content_id in ids[1:]:
            publish.publish_variant(content_id, "ro")
        reads = _count_reads(repository)
        KnowledgeBasePublicService(repository).build_admin_snapshot("ro")
        assert reads["n"] == 1

    def test_rebuild_published_snapshot_single_editorial_read(self, repository):
        ids = _seed_kb_count(repository, 12, with_relations=True)
        publish = KnowledgeBasePublishService(repository)
        publish.publish_variant(ids[0], "ro")
        for content_id in ids[1:]:
            publish.publish_variant(content_id, "ro")
        reads = _count_reads(repository)
        publish.rebuild_published_snapshot("ro")
        assert reads["n"] == 1

    def test_publish_one_triggers_constant_snapshot_rebuild(self, repository):
        ids = _seed_kb_count(repository, 20, with_relations=True)
        publish = KnowledgeBasePublishService(repository)
        publish.publish_variant(ids[0], "ro")
        publish.publish_variant(ids[1], "ro")

        reads = _count_reads(repository)
        publish.publish_variant(ids[2], "ro")
        # Publish core + reference checks are a small constant; must not scale with N or relations.
        assert reads["n"] <= 20

        reads["n"] = 0
        publish.rebuild_published_snapshot("ro")
        assert reads["n"] == 1

    def test_failed_snapshot_write_leaves_existing_snapshot_unchanged(self, repository, monkeypatch):
        ids = _seed_mixed_kb(repository)
        publish = KnowledgeBasePublishService(repository)
        key = publish.rebuild_published_snapshot("ro")
        assert key
        original = repository.read_kb_snapshot("ro")
        assert original is not None
        assert any(entry["id"] == ids["published"] for entry in original["entries"])

        def fail_write(path, payload, sleep=None):
            raise OSError("simulated snapshot write failure")

        monkeypatch.setattr(filesystem_module, "atomic_write_json", fail_write)
        with pytest.raises(OSError, match="simulated snapshot write failure"):
            publish.rebuild_published_snapshot("ro")

        assert repository.read_kb_snapshot("ro") == original
