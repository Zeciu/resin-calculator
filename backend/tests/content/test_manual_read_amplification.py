"""Manual list/snapshot single-store-read optimization tests."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from content.repositories import filesystem as filesystem_module
from content.repositories.filesystem import EDITORIAL_LOCALES, FilesystemContentRepository
from content.schemas.common import ContentStatus
from content.schemas.manual import ManualChapterListItem, ManualVariantBody, ManualVariantSummary
from content.services.editorial_identity import chapter_identity_title
from content.services.manual_chapters import ManualChapterService, empty_variant_body
from content.services.manual_publish import ManualPublishService


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _manual_body(title: str, text: str = "Body text.") -> ManualVariantBody:
    payload = empty_variant_body(title)
    payload["sections"][0]["blocks"] = [{"type": "paragraph", "text": text}]
    return ManualVariantBody.model_validate(payload)


def _legacy_list_chapters(repository: FilesystemContentRepository, locale: str) -> list[dict]:
    """Pre-optimization list algorithm: one store read per getter call."""
    from content.repositories.filesystem import parse_iso
    from content.schemas.manual import parse_admin_locale

    parsed_locale = parse_admin_locale(locale)
    items: list[dict] = []
    for content_id in repository.list_manual_chapter_ids():
        meta = repository.get_manual_chapter_meta(content_id)
        if not meta:
            continue
        variants: dict[str, dict] = {}
        active_variant: dict | None = None
        for variant_locale in EDITORIAL_LOCALES:
            variant = repository.get_manual_variant(content_id, variant_locale)
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
                "title": active_title or chapter_identity_title(repository, content_id),
                "sortOrder": meta["sortOrder"],
                "variants": variants,
            }
        )
    return items


def _legacy_assemble_document(repository: FilesystemContentRepository, locale: str) -> dict:
    chapters = []
    for content_id in repository.list_manual_chapter_ids():
        variant = repository.get_manual_variant(content_id, locale)
        if not variant or variant["status"] != "published":
            continue
        meta = repository.get_manual_chapter_meta(content_id)
        if not meta:
            continue
        chapters.append(
            {
                "contentId": content_id,
                "sortOrder": meta["sortOrder"],
                "title": variant["draftBody"]["title"],
                "sections": variant["draftBody"]["sections"],
            }
        )
    return {"locale": locale, "chapters": chapters}


def _list_payload(items: list[ManualChapterListItem]) -> list[dict]:
    return [item.model_dump(mode="python") for item in items]


def _normalize_list_payload(items: list[dict]) -> list[dict]:
    normalized = []
    for item in items:
        variants = {}
        for locale, summary in item["variants"].items():
            if isinstance(summary, ManualVariantSummary):
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


def _seed_mixed_manual(repository: FilesystemContentRepository) -> dict[str, str]:
    service = ManualChapterService(repository)
    now = datetime.now(timezone.utc)
    earlier = now - timedelta(hours=2)

    draft = service.create_chapter("Draft Only Chapter", locale="ro")
    service.save_variant(draft.contentId, "ro", _manual_body("Draft Only Chapter", "Draft body."))

    published = service.create_chapter("Published Chapter", locale="ro")
    service.save_variant(published.contentId, "ro", _manual_body("Published Chapter", "Live body."))
    ManualPublishService(repository).publish_variant(published.contentId, "ro")

    outdated = service.create_chapter("Outdated Chapter", locale="ro")
    service.save_variant(outdated.contentId, "ro", _manual_body("Outdated Chapter", "Original."))
    ManualPublishService(repository).publish_variant(outdated.contentId, "ro")
    service.save_variant(outdated.contentId, "ro", _manual_body("Outdated Chapter", "Newer draft."))

    missing_en = service.create_chapter("Missing EN Chapter", locale="ro")
    service.save_variant(missing_en.contentId, "ro", _manual_body("Missing EN Chapter", "RO only."))
    ManualPublishService(repository).publish_variant(missing_en.contentId, "ro")

    en_draft = service.create_chapter("Fallback Identity", locale="ro")
    service.save_variant(en_draft.contentId, "ro", _manual_body("Fallback Identity", "RO body."))
    service.save_variant(
        en_draft.contentId, "en", _manual_body("English Fallback Identity", "EN draft.")
    )

    records = repository.read_editorial_records()
    from content.repositories.filesystem import make_manual_variant_key

    variant = repository.get_manual_variant_from_store(records, outdated.contentId, "ro")
    assert variant is not None
    variant["publishedAt"] = _iso(earlier)
    variant["updatedAt"] = _iso(now)
    records[make_manual_variant_key(outdated.contentId, "ro")] = variant
    repository._write_store(records)

    return {
        "draft": draft.contentId,
        "published": published.contentId,
        "outdated": outdated.contentId,
        "missing_en": missing_en.contentId,
        "fallback": en_draft.contentId,
    }


def _seed_manual_count(repository: FilesystemContentRepository, count: int) -> list[str]:
    service = ManualChapterService(repository)
    ids: list[str] = []
    for index in range(count):
        meta = service.create_chapter(f"Chapter {index:03d}", locale="ro")
        service.save_variant(meta.contentId, "ro", _manual_body(f"Chapter {index:03d}"))
        ids.append(meta.contentId)
    return ids


def _count_reads(repository: FilesystemContentRepository) -> dict[str, int]:
    reads = {"n": 0}
    real = repository._read_store

    def counting():
        reads["n"] += 1
        return real()

    repository._read_store = counting  # type: ignore[method-assign]
    return reads


class TestManualListReadAmplification:
    def test_list_chapters_uses_exactly_one_store_read(self, repository):
        _seed_mixed_manual(repository)
        service = ManualChapterService(repository)
        reads = _count_reads(repository)
        items = service.list_chapters("ro")
        assert reads["n"] == 1
        assert len(items) == 5

    @pytest.mark.parametrize("count", [10, 20])
    def test_list_read_count_constant_across_corpus_sizes(self, repository, count: int):
        _seed_manual_count(repository, count)
        service = ManualChapterService(repository)
        reads = _count_reads(repository)
        items = service.list_chapters("ro")
        assert len(items) == count
        assert reads["n"] == 1

    def test_empty_manual_one_read_and_empty_response(self, repository):
        service = ManualChapterService(repository)
        reads = _count_reads(repository)
        items = service.list_chapters("ro")
        assert reads["n"] == 1
        assert items == []

    def test_list_response_parity_with_legacy_algorithm(self, repository):
        _seed_mixed_manual(repository)
        service = ManualChapterService(repository)
        optimized = _normalize_list_payload(_list_payload(service.list_chapters("ro")))
        legacy = _normalize_list_payload(_legacy_list_chapters(repository, "ro"))
        assert optimized == legacy

        optimized_en = _normalize_list_payload(_list_payload(service.list_chapters("en")))
        legacy_en = _normalize_list_payload(_legacy_list_chapters(repository, "en"))
        assert optimized_en == legacy_en

    def test_mixed_chapter_states_from_one_store(self, repository):
        ids = _seed_mixed_manual(repository)
        service = ManualChapterService(repository)
        reads = _count_reads(repository)
        items = {item.contentId: item for item in service.list_chapters("ro")}
        assert reads["n"] == 1

        assert items[ids["draft"]].variants["ro"].status == ContentStatus.DRAFT
        assert items[ids["published"]].variants["ro"].status == ContentStatus.PUBLISHED
        assert items[ids["outdated"]].variants["ro"].status == ContentStatus.PUBLISHED
        assert items[ids["outdated"]].variants["ro"].updatedAt > items[ids["outdated"]].variants["ro"].publishedAt
        assert "en" not in items[ids["missing_en"]].variants
        assert items[ids["missing_en"]].title == "Missing EN Chapter"

        en_items = {item.contentId: item for item in service.list_chapters("en")}
        assert en_items[ids["missing_en"]].title == "Missing EN Chapter"
        assert en_items[ids["fallback"]].title == "English Fallback Identity"


class TestManualSnapshotReadAmplification:
    def test_snapshot_uses_exactly_one_editorial_store_read(self, repository):
        ids = _seed_mixed_manual(repository)
        publish = ManualPublishService(repository)
        reads = _count_reads(repository)
        document = publish._assemble_document("ro")
        assert reads["n"] == 1
        published_ids = {chapter["contentId"] for chapter in document["chapters"]}
        assert ids["published"] in published_ids
        assert ids["missing_en"] in published_ids
        assert ids["draft"] not in published_ids

    def test_snapshot_parity_with_legacy_algorithm(self, repository):
        _seed_mixed_manual(repository)
        optimized = ManualPublishService(repository)._assemble_document("ro")
        legacy = _legacy_assemble_document(repository, "ro")
        assert optimized == legacy

    def test_unpublished_drafts_excluded_from_snapshot(self, repository):
        ids = _seed_mixed_manual(repository)
        document = ManualPublishService(repository)._assemble_document("ro")
        published_ids = {chapter["contentId"] for chapter in document["chapters"]}
        assert ids["draft"] not in published_ids
        assert ids["fallback"] not in published_ids
        assert ids["outdated"] in published_ids
        assert ids["published"] in published_ids

    def test_rebuild_published_snapshot_single_editorial_read(self, repository):
        _seed_mixed_manual(repository)
        publish = ManualPublishService(repository)
        reads = _count_reads(repository)
        publish.rebuild_published_snapshot("ro")
        assert reads["n"] == 1

    @pytest.mark.parametrize("count", [10, 20])
    def test_snapshot_read_count_constant_across_corpus_sizes(self, repository, count: int):
        ids = _seed_manual_count(repository, count)
        publish = ManualPublishService(repository)
        for content_id in ids[:3]:
            publish.publish_variant(content_id, "ro")
        reads = _count_reads(repository)
        publish.rebuild_published_snapshot("ro")
        assert reads["n"] == 1

    def test_publish_one_triggers_constant_snapshot_rebuild(self, repository):
        ids = _seed_manual_count(repository, 20)
        publish = ManualPublishService(repository)
        publish.publish_variant(ids[0], "ro")

        reads = _count_reads(repository)
        publish.publish_variant(ids[1], "ro")
        publish_one_reads = reads["n"]

        # Publish-core getters are a small constant; snapshot rebuild must stay 1.
        # Total must not scale with the remaining unpublished corpus.
        assert publish_one_reads <= 8

        reads["n"] = 0
        publish.rebuild_published_snapshot("ro")
        assert reads["n"] == 1

    def test_failed_snapshot_write_leaves_existing_snapshot_unchanged(self, repository, monkeypatch):
        ids = _seed_mixed_manual(repository)
        publish = ManualPublishService(repository)
        key = publish.rebuild_published_snapshot("ro")
        assert key
        original = repository.read_manual_snapshot("ro")
        assert original is not None
        assert any(chapter["contentId"] == ids["published"] for chapter in original["chapters"])

        def fail_write(path, payload, sleep=None):
            raise OSError("simulated snapshot write failure")

        monkeypatch.setattr(filesystem_module, "atomic_write_json", fail_write)
        with pytest.raises(OSError, match="simulated snapshot write failure"):
            publish.rebuild_published_snapshot("ro")

        assert repository.read_manual_snapshot("ro") == original
