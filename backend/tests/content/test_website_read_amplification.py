"""Website list/snapshot single-store-read optimization tests."""

from __future__ import annotations

from pathlib import Path

import pytest

from content.repositories import filesystem as filesystem_module
from content.repositories.filesystem import EDITORIAL_LOCALES, FilesystemContentRepository
from content.schemas.common import ContentStatus
from content.schemas.website import WebsitePageListItem, WebsiteVariantSummary
from content.services.website_pages import WebsitePageService, resolve_public_title
from content.services.website_public import WebsitePublicService
from content.services.website_publish import WebsitePublishService
from content.website_pages import WEBSITE_PAGE_DEFINITIONS, empty_website_draft_body


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


def _legacy_list_pages(repository: FilesystemContentRepository, locale: str) -> list[dict]:
    from content.repositories.filesystem import parse_iso
    from content.schemas.website import parse_admin_locale

    parsed_locale = parse_admin_locale(locale)
    repository.ensure_website_pages_exist()
    items: list[dict] = []
    for page in WEBSITE_PAGE_DEFINITIONS:
        page_key = page["pageKey"]
        meta = repository.get_website_page_meta(page_key)
        if not meta:
            continue
        variants: dict[str, dict] = {}
        for variant_locale in EDITORIAL_LOCALES:
            variant = repository.get_website_variant(page_key, variant_locale)
            if not variant:
                continue
            variants[variant_locale] = {
                "status": variant["status"],
                "updatedAt": parse_iso(variant.get("updatedAt")),
                "publishedAt": parse_iso(variant.get("publishedAt")),
            }
        items.append(
            {
                "pageKey": page_key,
                "slug": meta["slug"],
                "adminLabel": meta["adminLabel"],
                "pageKind": meta["pageKind"],
                "sortOrder": meta["sortOrder"],
                "publicTitle": resolve_public_title(repository, page_key, parsed_locale),
                "variants": variants,
            }
        )
    return items


def _legacy_build_admin_snapshot(repository: FilesystemContentRepository, locale: str) -> dict:
    from content.schemas.website import parse_admin_locale

    parsed_locale = parse_admin_locale(locale)
    pages: dict[str, dict] = {}
    for page_key in repository.list_website_page_ids():
        meta = repository.get_website_page_meta(page_key)
        variant = repository.get_website_variant(page_key, parsed_locale)
        if not meta or not variant or variant.get("status") != "published":
            continue
        pages[page_key] = {
            "pageKey": page_key,
            "slug": meta["slug"],
            "pageKind": meta["pageKind"],
            "body": variant["draftBody"],
        }
    return {"locale": parsed_locale, "pages": pages}


def _normalize_list_payload(items: list[dict]) -> list[dict]:
    normalized = []
    for item in items:
        if isinstance(item, WebsitePageListItem):
            item = item.model_dump(mode="python")
        variants = {}
        for locale, summary in item["variants"].items():
            if isinstance(summary, WebsiteVariantSummary):
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
                "pageKey": item["pageKey"],
                "slug": item["slug"],
                "adminLabel": item["adminLabel"],
                "pageKind": item["pageKind"],
                "sortOrder": item["sortOrder"],
                "publicTitle": item["publicTitle"],
                "variants": variants,
            }
        )
    return normalized


def _seed_website_mixed(repository: FilesystemContentRepository) -> None:
    pages = WebsitePageService(repository)
    publish = WebsitePublishService(repository)
    for index, definition in enumerate(WEBSITE_PAGE_DEFINITIONS):
        page_key = definition["pageKey"]
        body = empty_website_draft_body(definition["pageKind"])
        body["publicTitle"] = f"{definition['pageKey'].title()} Title"
        pages.save_variant(page_key, "ro", body)
        if index % 2 == 0:
            publish.publish_variant(page_key, "ro")
        # Add an EN draft on one page for locale fallback coverage.
        if page_key == "home":
            en_body = empty_website_draft_body(definition["pageKind"])
            en_body["publicTitle"] = "Home EN Title"
            pages.save_variant(page_key, "en", en_body)


class TestWebsiteListReadAmplification:
    def test_list_pages_uses_exactly_one_store_read(self, repository):
        _seed_website_mixed(repository)
        service = WebsitePageService(repository)
        reads = _count_reads(repository)
        items = service.list_pages("ro")
        assert reads["n"] == 1
        assert len(items) == len(WEBSITE_PAGE_DEFINITIONS)

    def test_list_response_parity_with_legacy_algorithm(self, repository):
        _seed_website_mixed(repository)
        service = WebsitePageService(repository)
        optimized = _normalize_list_payload(
            [item.model_dump(mode="python") for item in service.list_pages("ro")]
        )
        legacy = _normalize_list_payload(_legacy_list_pages(repository, "ro"))
        assert optimized == legacy

        optimized_en = _normalize_list_payload(
            [item.model_dump(mode="python") for item in service.list_pages("en")]
        )
        legacy_en = _normalize_list_payload(_legacy_list_pages(repository, "en"))
        assert optimized_en == legacy_en

    def test_list_includes_published_and_draft_pages(self, repository):
        _seed_website_mixed(repository)
        items = {item.pageKey: item for item in WebsitePageService(repository).list_pages("ro")}
        assert items["home"].variants["ro"].status == ContentStatus.PUBLISHED
        # Odd-index pages remain draft after mixed seed.
        odd_keys = [
            definition["pageKey"]
            for index, definition in enumerate(WEBSITE_PAGE_DEFINITIONS)
            if index % 2 == 1
        ]
        for page_key in odd_keys:
            assert items[page_key].variants["ro"].status == ContentStatus.DRAFT


class TestWebsiteSnapshotReadAmplification:
    def test_snapshot_uses_exactly_one_editorial_store_read(self, repository):
        _seed_website_mixed(repository)
        service = WebsitePublicService(repository)
        reads = _count_reads(repository)
        snapshot = service.build_admin_snapshot("ro")
        assert reads["n"] == 1
        assert snapshot["locale"] == "ro"
        # Only even-index pages were published.
        expected_published = {
            definition["pageKey"]
            for index, definition in enumerate(WEBSITE_PAGE_DEFINITIONS)
            if index % 2 == 0
        }
        assert set(snapshot["pages"].keys()) == expected_published

    def test_snapshot_parity_with_legacy_algorithm(self, repository):
        _seed_website_mixed(repository)
        optimized = WebsitePublicService(repository).build_admin_snapshot("ro")
        legacy = _legacy_build_admin_snapshot(repository, "ro")
        assert optimized == legacy

    def test_rebuild_published_snapshot_single_editorial_read(self, repository):
        _seed_website_mixed(repository)
        publish = WebsitePublishService(repository)
        reads = _count_reads(repository)
        publish.rebuild_published_snapshot("ro")
        assert reads["n"] == 1

    def test_publish_one_triggers_single_snapshot_rebuild_read(self, repository):
        pages = WebsitePageService(repository)
        publish = WebsitePublishService(repository)
        for definition in WEBSITE_PAGE_DEFINITIONS:
            body = empty_website_draft_body(definition["pageKind"])
            body["publicTitle"] = f"{definition['pageKey']} Title"
            pages.save_variant(definition["pageKey"], "ro", body)

        # Publish first page without counting.
        first = WEBSITE_PAGE_DEFINITIONS[0]["pageKey"]
        publish.publish_variant(first, "ro")

        second = WEBSITE_PAGE_DEFINITIONS[1]["pageKey"]
        reads = _count_reads(repository)
        publish.publish_variant(second, "ro")
        # get variant + publish write path + one snapshot assemble read.
        assert reads["n"] <= 6

        reads["n"] = 0
        publish.rebuild_published_snapshot("ro")
        assert reads["n"] == 1

    def test_failed_snapshot_write_leaves_existing_snapshot_unchanged(self, repository, monkeypatch):
        _seed_website_mixed(repository)
        publish = WebsitePublishService(repository)
        key = publish.rebuild_published_snapshot("ro")
        assert key
        original = repository.read_website_snapshot("ro")
        assert original is not None

        def fail_write(path, payload, sleep=None):
            raise OSError("simulated snapshot write failure")

        monkeypatch.setattr(filesystem_module, "atomic_write_json", fail_write)
        with pytest.raises(OSError, match="simulated snapshot write failure"):
            publish.rebuild_published_snapshot("ro")

        assert repository.read_website_snapshot("ro") == original
