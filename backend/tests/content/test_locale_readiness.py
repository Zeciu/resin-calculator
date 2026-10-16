"""Read-only locale readiness: structural completeness, not translation quality.

Tests use temporary fixture trees. They must not mutate
backend/private/content or backend/public/content.
"""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from io import StringIO
from pathlib import Path
from unittest.mock import patch

import pytest

from private.schemas.common import ADMIN_EDITORIAL_LOCALE_ORDER, ContentStatus
from private.repositories.filesystem import FilesystemContentRepository
from private.services.locale_readiness import (
    CanonicalCatalogs,
    LayerStatus,
    LocaleReadinessRoots,
    evaluate_configured_locales,
    evaluate_id_snapshot_layer,
    evaluate_locale_readiness,
    evaluate_ui_layer,
    evaluate_website_integrity,
    evaluate_website_snapshot_layer,
    load_canonical_catalogs,
)
from private.services.website_publish import WebsitePublishService
from private.translation_metadata import translation_metadata_on_generation
from private.tools.locale_readiness import (
    HUMAN_MISSING_LIST_LIMIT,
    format_missing_for_human,
    locale_to_json,
    main as locale_readiness_cli,
)
from private.website_pages import (
    WEBSITE_PAGE_KEYS,
    empty_website_draft_body,
    website_page_definition,
)


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _empty_roots(tmp_path: Path) -> LocaleReadinessRoots:
    return LocaleReadinessRoots(
        i18n_dir=tmp_path / "i18n",
        private_content_root=tmp_path / "private-content",
        public_content_root=tmp_path / "public-content",
    )


def _catalogs(
    *,
    ui_keys: tuple[str, ...] = ("nav.home", "nav.glossary"),
    website_pages: tuple[str, ...] | None = None,
    manual_ids: tuple[str, ...] = ("chapter-a", "chapter-b"),
    glossary_ids: tuple[str, ...] = ("term-a", "term-b"),
    knowledge_base_ids: tuple[str, ...] = ("article-a", "article-b"),
) -> CanonicalCatalogs:
    return CanonicalCatalogs(
        ui_keys=ui_keys,
        website_pages=website_pages if website_pages is not None else tuple(sorted(WEBSITE_PAGE_KEYS)),
        manual_ids=manual_ids,
        glossary_ids=glossary_ids,
        knowledge_base_ids=knowledge_base_ids,
    )


def _complete_pages() -> dict[str, dict]:
    pages: dict[str, dict] = {}
    for page_key in WEBSITE_PAGE_KEYS:
        definition = website_page_definition(page_key)
        body = empty_website_draft_body(definition["pageKind"])
        body["publicTitle"] = page_key
        pages[page_key] = {
            "pageKey": page_key,
            "pageKind": definition["pageKind"],
            "body": body,
        }
    return pages


def _items(ids: list[str], *, id_field: str) -> list[dict]:
    return [{id_field: item_id, "label": item_id} for item_id in ids]


def _write_complete_locale_tree(
    roots: LocaleReadinessRoots,
    locale: str,
    catalogs: CanonicalCatalogs,
    *,
    ui: dict[str, str] | None = None,
    extra_ui: dict[str, str] | None = None,
    skip_public_manual: bool = False,
    empty_public_glossary: bool = False,
    glossary_preview_ids: list[str] | None = None,
    store_records: dict | None = None,
) -> None:
    english = {key: f"EN {key}" for key in catalogs.ui_keys}
    _write_json(roots.i18n_dir / "en.json", english)
    target_ui = ui if ui is not None else {key: f"{locale} {key}" for key in catalogs.ui_keys}
    if extra_ui:
        target_ui = {**target_ui, **extra_ui}
    _write_json(roots.i18n_dir / f"{locale}.json", target_ui)

    pages = {"locale": locale, "pages": _complete_pages()}
    _write_json(roots.private_content_root / "published" / "website" / locale / "pages.json", pages)
    _write_json(roots.public_content_root / "published" / "website" / locale / "pages.json", pages)

    manual = {
        "locale": locale,
        "chapters": _items(list(catalogs.manual_ids), id_field="contentId"),
    }
    _write_json(
        roots.private_content_root / "published" / "manual" / locale / "document.json",
        manual,
    )
    if not skip_public_manual:
        _write_json(
            roots.public_content_root / "published" / "manual" / locale / "document.json",
            manual,
        )

    glossary_ids = (
        list(catalogs.glossary_ids) if glossary_preview_ids is None else glossary_preview_ids
    )
    glossary = {"locale": locale, "entries": _items(glossary_ids, id_field="id")}
    _write_json(
        roots.private_content_root / "published" / "glossary" / locale / "entries.json",
        glossary,
    )
    public_glossary = (
        {"locale": locale, "entries": []}
        if empty_public_glossary
        else glossary
    )
    _write_json(
        roots.public_content_root / "published" / "glossary" / locale / "entries.json",
        public_glossary,
    )

    kb = {"locale": locale, "entries": _items(list(catalogs.knowledge_base_ids), id_field="id")}
    _write_json(
        roots.private_content_root / "published" / "knowledge-base" / locale / "entries.json",
        kb,
    )
    _write_json(
        roots.public_content_root / "published" / "knowledge-base" / locale / "entries.json",
        kb,
    )

    if store_records is not None:
        _write_json(roots.private_content_root / "editorial" / "content-store.json", {"records": store_records})


def _meta_record(content_type: str, content_id: str) -> dict:
    return {
        "contentId": content_id,
        "contentType": content_type,
        "sk": "META",
        "pk": f"CONTENT#{content_id}",
    }


def _variant_record(content_id: str, locale: str, status: str) -> dict:
    return {
        "contentId": content_id,
        "locale": locale,
        "status": status,
        "sk": f"VARIANT#{locale}",
        "pk": f"CONTENT#{content_id}",
        "draftBody": {"term": content_id},
    }


def _website_integrity_repository(
    tmp_path: Path,
) -> tuple[
    LocaleReadinessRoots,
    FilesystemContentRepository,
    WebsitePublishService,
]:
    roots = _empty_roots(tmp_path)
    repository = FilesystemContentRepository(roots.private_content_root)
    repository.ensure_website_pages_exist()
    publisher = WebsitePublishService(
        repository, public_content_root=roots.public_content_root
    )
    return roots, repository, publisher


def _publish_website_body(
    repository: FilesystemContentRepository,
    publisher: WebsitePublishService,
    page_key: str,
    locale: str,
    body: dict,
) -> None:
    generation_metadata = None
    if locale != "ro":
        source = repository.get_website_variant(page_key, "ro")
        generation_metadata = translation_metadata_on_generation(
            source_revision=source["sourceRevision"],
            source_text_revision=source["sourceTextRevision"],
            provider="test",
            generated_at=datetime.now(timezone.utc),
        )
    repository.save_website_variant(
        page_key,
        locale,
        body,
        generation_metadata=generation_metadata,
    )
    publisher.publish_variant(page_key, locale, confirm_text_outdated=True)


class TestUiLayer:
    def test_complete_target_ui(self, tmp_path: Path) -> None:
        i18n_dir = tmp_path / "i18n"
        required = ("nav.home", "nav.glossary")
        _write_json(i18n_dir / "fr.json", {"nav.home": "Accueil", "nav.glossary": "Glossaire"})
        result = evaluate_ui_layer("fr", i18n_dir, required)
        assert result.status is LayerStatus.COMPLETE
        assert result.required_count == 2
        assert result.present_count == 2
        assert result.missing == ()
        assert result.extra == ()

    def test_missing_key_is_incomplete(self, tmp_path: Path) -> None:
        i18n_dir = tmp_path / "i18n"
        required = ("nav.home", "nav.glossary")
        _write_json(i18n_dir / "fr.json", {"nav.home": "Accueil"})
        result = evaluate_ui_layer("fr", i18n_dir, required)
        assert result.status is LayerStatus.INCOMPLETE
        assert result.missing == ("nav.glossary",)
        assert result.present_count == 1

    def test_empty_and_whitespace_strings_are_missing(self, tmp_path: Path) -> None:
        i18n_dir = tmp_path / "i18n"
        required = ("nav.home", "nav.glossary")
        _write_json(i18n_dir / "fr.json", {"nav.home": "", "nav.glossary": "   "})
        result = evaluate_ui_layer("fr", i18n_dir, required)
        assert result.status is LayerStatus.INCOMPLETE
        assert result.missing == ("nav.glossary", "nav.home")
        assert result.present_count == 0

    def test_non_string_value_is_missing(self, tmp_path: Path) -> None:
        i18n_dir = tmp_path / "i18n"
        required = ("nav.home",)
        _write_json(i18n_dir / "fr.json", {"nav.home": 12})
        result = evaluate_ui_layer("fr", i18n_dir, required)
        assert result.status is LayerStatus.INCOMPLETE
        assert result.missing == ("nav.home",)

    def test_value_identical_to_english_is_present(self, tmp_path: Path) -> None:
        i18n_dir = tmp_path / "i18n"
        required = ("nav.home",)
        _write_json(i18n_dir / "fr.json", {"nav.home": "Home"})
        result = evaluate_ui_layer("fr", i18n_dir, required)
        assert result.status is LayerStatus.COMPLETE
        assert result.missing == ()

    def test_extra_key_does_not_block_complete(self, tmp_path: Path) -> None:
        i18n_dir = tmp_path / "i18n"
        required = ("nav.home",)
        _write_json(i18n_dir / "fr.json", {"nav.home": "Accueil", "legacy.unused": "x"})
        result = evaluate_ui_layer("fr", i18n_dir, required)
        assert result.status is LayerStatus.COMPLETE
        assert result.extra == ("legacy.unused",)

    def test_missing_locale_bundle_is_missing(self, tmp_path: Path) -> None:
        i18n_dir = tmp_path / "i18n"
        required = ("nav.home", "nav.glossary")
        result = evaluate_ui_layer("it", i18n_dir, required)
        assert result.status is LayerStatus.MISSING
        assert result.present_count == 0
        assert result.missing == ("nav.glossary", "nav.home")


class TestIdSnapshotLayer:
    def test_complete_id_set(self, tmp_path: Path) -> None:
        path = tmp_path / "entries.json"
        required = ("term-b", "term-a")
        _write_json(path, {"entries": _items(["term-a", "term-b"], id_field="id")})
        result = evaluate_id_snapshot_layer(path, required, items_key="entries", id_field="id")
        assert result.status is LayerStatus.COMPLETE
        assert result.present_count == 2

    def test_one_missing_canonical_id_is_incomplete(self, tmp_path: Path) -> None:
        path = tmp_path / "entries.json"
        required = ("term-a", "term-b")
        _write_json(path, {"entries": _items(["term-a"], id_field="id")})
        result = evaluate_id_snapshot_layer(path, required, items_key="entries", id_field="id")
        assert result.status is LayerStatus.INCOMPLETE
        assert result.missing == ("term-b",)

    def test_empty_snapshot_is_incomplete_not_missing(self, tmp_path: Path) -> None:
        path = tmp_path / "document.json"
        required = ("chapter-a", "chapter-b")
        _write_json(path, {"locale": "fr", "chapters": []})
        result = evaluate_id_snapshot_layer(
            path, required, items_key="chapters", id_field="contentId"
        )
        assert result.status is LayerStatus.INCOMPLETE
        assert result.status is not LayerStatus.MISSING
        assert result.present_count == 0
        assert result.missing == ("chapter-a", "chapter-b")

    def test_missing_snapshot_file_is_missing(self, tmp_path: Path) -> None:
        path = tmp_path / "document.json"
        required = ("chapter-a",)
        result = evaluate_id_snapshot_layer(
            path, required, items_key="chapters", id_field="contentId"
        )
        assert result.status is LayerStatus.MISSING
        assert result.missing == ("chapter-a",)

    def test_extra_id_does_not_block_complete(self, tmp_path: Path) -> None:
        path = tmp_path / "entries.json"
        required = ("term-a",)
        _write_json(path, {"entries": _items(["term-a", "orphan"], id_field="id")})
        result = evaluate_id_snapshot_layer(path, required, items_key="entries", id_field="id")
        assert result.status is LayerStatus.COMPLETE
        assert result.extra == ("orphan",)

    def test_ordering_does_not_affect_completeness(self, tmp_path: Path) -> None:
        path = tmp_path / "entries.json"
        required = ("term-a", "term-b", "term-c")
        _write_json(path, {"entries": _items(["term-c", "term-a", "term-b"], id_field="id")})
        result = evaluate_id_snapshot_layer(path, required, items_key="entries", id_field="id")
        assert result.status is LayerStatus.COMPLETE
        assert result.missing == ()


class TestWebsiteSnapshotLayer:
    def test_all_registry_pages_complete(self, tmp_path: Path) -> None:
        path = tmp_path / "pages.json"
        required = tuple(sorted(WEBSITE_PAGE_KEYS))
        _write_json(path, {"locale": "de", "pages": _complete_pages()})
        result = evaluate_website_snapshot_layer(path, required)
        assert result.status is LayerStatus.COMPLETE
        assert result.required_count == len(WEBSITE_PAGE_KEYS)
        assert set(required) == WEBSITE_PAGE_KEYS

    def test_one_required_page_missing(self, tmp_path: Path) -> None:
        path = tmp_path / "pages.json"
        required = tuple(sorted(WEBSITE_PAGE_KEYS))
        pages = _complete_pages()
        del pages["privacy"]
        _write_json(path, {"locale": "it", "pages": pages})
        result = evaluate_website_snapshot_layer(path, required)
        assert result.status is LayerStatus.INCOMPLETE
        assert result.missing == ("privacy",)

    def test_missing_pages_file(self, tmp_path: Path) -> None:
        path = tmp_path / "pages.json"
        required = tuple(sorted(WEBSITE_PAGE_KEYS))
        result = evaluate_website_snapshot_layer(path, required)
        assert result.status is LayerStatus.MISSING
        assert set(result.missing) == WEBSITE_PAGE_KEYS

    def test_extra_page_does_not_block_complete(self, tmp_path: Path) -> None:
        path = tmp_path / "pages.json"
        required = tuple(sorted(WEBSITE_PAGE_KEYS))
        pages = _complete_pages()
        pages["legacy"] = {"pageKey": "legacy"}
        _write_json(path, {"locale": "en", "pages": pages})
        result = evaluate_website_snapshot_layer(path, required)
        assert result.status is LayerStatus.COMPLETE
        assert result.extra == ("legacy",)


class TestWebsiteIntegrityDiagnostics:
    def test_snapshot_mismatch_is_error_when_no_pending_draft(self, tmp_path: Path) -> None:
        roots, repository, publisher = _website_integrity_repository(tmp_path)
        ro = empty_website_draft_body("pricing")
        ro["publicTitle"] = "Prețuri"
        ro["intro"] = "Introducere canonică"
        _publish_website_body(repository, publisher, "pricing", "ro", ro)
        es = deepcopy(ro)
        es["publicTitle"] = "Precios"
        es["intro"] = "Introducción"
        _publish_website_body(repository, publisher, "pricing", "es", es)

        production_path = (
            roots.public_content_root / "published" / "website" / "es" / "pages.json"
        )
        production = json.loads(production_path.read_text(encoding="utf-8"))
        production["pages"]["pricing"]["body"]["intro"] = "Snapshot vechi"
        _write_json(production_path, production)

        diagnostics = evaluate_website_integrity(
            "es",
            roots=roots,
            records=repository.read_editorial_records(),
            required_pages=("pricing",),
        )
        assert any(
            issue.code == "snapshot_editorial_mismatch"
            and issue.plane == "production"
            for issue in diagnostics.issues
        )

    def test_pending_draft_does_not_create_snapshot_parity_error(self, tmp_path: Path) -> None:
        roots, repository, publisher = _website_integrity_repository(tmp_path)
        ro = empty_website_draft_body("home")
        ro.update(
            {
                "publicTitle": "Acasă",
                "subtitle": "Subtitlu",
                "description": "Descriere canonică suficient de lungă.",
            }
        )
        _publish_website_body(repository, publisher, "home", "ro", ro)
        fr = deepcopy(ro)
        fr["publicTitle"] = "Accueil"
        _publish_website_body(repository, publisher, "home", "fr", fr)
        pending = deepcopy(fr)
        pending["description"] = "Brouillon non publié"
        repository.save_website_variant("home", "fr", pending)

        diagnostics = evaluate_website_integrity(
            "fr",
            roots=roots,
            records=repository.read_editorial_records(),
            required_pages=("home",),
        )
        assert not any(
            issue.code == "snapshot_editorial_mismatch"
            for issue in diagnostics.issues
        )
        assert any(
            issue.code == "unpublished_draft" for issue in diagnostics.issues
        )

    def test_structural_difference_from_canonical_is_error(self, tmp_path: Path) -> None:
        roots, repository, publisher = _website_integrity_repository(tmp_path)
        ro = empty_website_draft_body("pricing")
        ro["publicTitle"] = "Prețuri"
        _publish_website_body(repository, publisher, "pricing", "ro", ro)
        it = deepcopy(ro)
        it["publicTitle"] = "Prezzi"
        it["offers"] = list(reversed(it["offers"]))
        _publish_website_body(repository, publisher, "pricing", "it", it)

        diagnostics = evaluate_website_integrity(
            "it",
            roots=roots,
            records=repository.read_editorial_records(),
            required_pages=("pricing",),
        )
        assert any(
            issue.code == "canonical_structure_mismatch"
            for issue in diagnostics.issues
        )

    def test_text_and_media_freshness_are_distinguished(self, tmp_path: Path) -> None:
        roots, repository, publisher = _website_integrity_repository(tmp_path)
        ro = empty_website_draft_body("home")
        ro.update(
            {
                "publicTitle": "Acasă",
                "subtitle": "Subtitlu",
                "description": "Descriere canonică.",
            }
        )
        _publish_website_body(repository, publisher, "home", "ro", ro)
        es = deepcopy(ro)
        es["publicTitle"] = "Inicio"
        es["description"] = "Descripción."
        _publish_website_body(repository, publisher, "home", "es", es)
        it = deepcopy(es)
        it["publicTitle"] = "Home"
        _publish_website_body(repository, publisher, "home", "it", it)

        changed = deepcopy(ro)
        changed["description"] = "Text canonic revizuit."
        _publish_website_body(repository, publisher, "home", "ro", changed)
        es_diagnostics = evaluate_website_integrity(
            "es",
            roots=roots,
            records=repository.read_editorial_records(),
            required_pages=("home",),
        )
        assert any(issue.code == "text_outdated" for issue in es_diagnostics.issues)

        _publish_website_body(repository, publisher, "home", "it", deepcopy(changed))
        media_changed = deepcopy(changed)
        media_changed["video"]["url"] = "https://example.com/new-video"
        _publish_website_body(repository, publisher, "home", "ro", media_changed)
        it_diagnostics = evaluate_website_integrity(
            "it",
            roots=roots,
            records=repository.read_editorial_records(),
            required_pages=("home",),
        )
        assert any(
            issue.code == "media_only_outdated" for issue in it_diagnostics.issues
        )
        assert not any(
            issue.code == "text_outdated" for issue in it_diagnostics.issues
        )

    def test_suspicious_english_warning_ignores_prices_and_ids(self, tmp_path: Path) -> None:
        roots, repository, publisher = _website_integrity_repository(tmp_path)
        ro = empty_website_draft_body("pricing")
        ro["publicTitle"] = "Prețuri"
        _publish_website_body(repository, publisher, "pricing", "ro", ro)
        english = deepcopy(ro)
        english["publicTitle"] = "Pricing"
        english["intro"] = (
            "Start free and upgrade when you need complete subscriber access."
        )
        english["offers"][0]["benefits"] = [
            "Save and reopen your projects on your device."
        ]
        _publish_website_body(repository, publisher, "pricing", "en", english)
        es = deepcopy(english)
        es["publicTitle"] = "Precios"
        _publish_website_body(repository, publisher, "pricing", "es", es)

        diagnostics = evaluate_website_integrity(
            "es",
            roots=roots,
            records=repository.read_editorial_records(),
            required_pages=("pricing",),
        )
        suspicious_paths = {
            issue.path
            for issue in diagnostics.issues
            if issue.code == "suspicious_english_text"
        }
        assert "intro" in suspicious_paths
        assert "offers/0/benefits/0" in suspicious_paths
        assert not any("displayedPriceText" in path for path in suspicious_paths)
        assert not any(path.endswith("/id") for path in suspicious_paths)

    def test_plain_text_entity_warning_does_not_flag_rich_text(self, tmp_path: Path) -> None:
        roots, repository, publisher = _website_integrity_repository(tmp_path)
        ro = empty_website_draft_body("terms")
        ro["publicTitle"] = "Termeni"
        ro["sections"] = [
            {
                "id": "usage",
                "title": "Utilizare",
                "blocks": [
                    {"type": "paragraph", "text": "Textul aplicației."}
                ],
            }
        ]
        _publish_website_body(repository, publisher, "terms", "ro", ro)
        it = deepcopy(ro)
        it["publicTitle"] = "Termini"
        it["sections"][0]["title"] = "Utilizzo dell&#x27;applicazione"
        it["sections"][0]["blocks"][0]["text"] = "Uso dell&#x27;applicazione"
        _publish_website_body(repository, publisher, "terms", "it", it)

        diagnostics = evaluate_website_integrity(
            "it",
            roots=roots,
            records=repository.read_editorial_records(),
            required_pages=("terms",),
        )
        entity_paths = {
            issue.path
            for issue in diagnostics.issues
            if issue.code == "plain_text_html_entity"
        }
        assert entity_paths == {"sections/0/title"}


class TestReadinessAggregation:
    def test_all_preview_layers_complete(self, tmp_path: Path) -> None:
        roots = _empty_roots(tmp_path)
        catalogs = _catalogs()
        _write_complete_locale_tree(roots, "fr", catalogs)
        result = evaluate_locale_readiness("fr", roots=roots, catalogs=catalogs)
        assert result.preview_ready is True
        assert result.production_ready is True

    def test_one_preview_layer_incomplete_blocks_preview(self, tmp_path: Path) -> None:
        roots = _empty_roots(tmp_path)
        catalogs = _catalogs()
        _write_complete_locale_tree(
            roots,
            "ro",
            catalogs,
            glossary_preview_ids=["term-a"],
        )
        result = evaluate_locale_readiness("ro", roots=roots, catalogs=catalogs)
        assert result.glossary_preview.status is LayerStatus.INCOMPLETE
        assert result.glossary_preview.missing == ("term-b",)
        assert result.preview_ready is False
        assert result.production_ready is False

    def test_preview_complete_production_layer_missing(self, tmp_path: Path) -> None:
        roots = _empty_roots(tmp_path)
        catalogs = _catalogs()
        _write_complete_locale_tree(roots, "de", catalogs, skip_public_manual=True)
        result = evaluate_locale_readiness("de", roots=roots, catalogs=catalogs)
        assert result.preview_ready is True
        assert result.manual_production.status is LayerStatus.MISSING
        assert result.production_ready is False

    def test_preview_complete_production_layer_empty_incomplete(self, tmp_path: Path) -> None:
        roots = _empty_roots(tmp_path)
        catalogs = _catalogs()
        _write_complete_locale_tree(roots, "de", catalogs, empty_public_glossary=True)
        result = evaluate_locale_readiness("de", roots=roots, catalogs=catalogs)
        assert result.preview_ready is True
        assert result.glossary_production.status is LayerStatus.INCOMPLETE
        assert result.glossary_production.present_count == 0
        assert result.production_ready is False

    def test_all_layers_complete_both_ready(self, tmp_path: Path) -> None:
        roots = _empty_roots(tmp_path)
        catalogs = _catalogs()
        _write_complete_locale_tree(roots, "en", catalogs)
        result = evaluate_locale_readiness("en", roots=roots, catalogs=catalogs)
        assert result.preview_ready is True
        assert result.production_ready is True

    def test_activation_state_is_not_read(self, tmp_path: Path) -> None:
        roots = _empty_roots(tmp_path)
        catalogs = _catalogs()
        _write_complete_locale_tree(roots, "de", catalogs)
        _write_json(
            roots.public_content_root / "config" / "public-languages.json",
            {"defaultPublicLocale": "en", "activePublicLocales": ["en"]},
        )
        _write_json(
            roots.private_content_root / "config" / "public-languages.json",
            {"defaultPublicLocale": "en", "activePublicLocales": ["en", "ro"]},
        )
        result = evaluate_locale_readiness("de", roots=roots, catalogs=catalogs)
        assert result.preview_ready is True
        assert result.production_ready is True


class TestStoreDiagnostics:
    def test_published_draft_and_no_variant_counts(self, tmp_path: Path) -> None:
        roots = _empty_roots(tmp_path)
        catalogs = _catalogs(glossary_ids=("term-a", "term-b", "term-c"))
        records = {
            "CONTENT#glossary_entry#term-a|META": _meta_record("glossary_entry", "term-a"),
            "CONTENT#glossary_entry#term-a|VARIANT#ro": _variant_record(
                "term-a", "ro", ContentStatus.PUBLISHED.value
            ),
            "CONTENT#glossary_entry#term-b|META": _meta_record("glossary_entry", "term-b"),
            "CONTENT#glossary_entry#term-b|VARIANT#ro": _variant_record(
                "term-b", "ro", ContentStatus.DRAFT.value
            ),
            "CONTENT#glossary_entry#term-c|META": _meta_record("glossary_entry", "term-c"),
        }
        _write_complete_locale_tree(
            roots,
            "ro",
            catalogs,
            glossary_preview_ids=["term-a"],
            store_records=records,
        )
        result = evaluate_locale_readiness("ro", roots=roots, catalogs=catalogs)
        diagnostic = result.store.glossary
        assert diagnostic.canonical_count == 3
        assert diagnostic.published_count == 1
        assert diagnostic.draft_count == 1
        assert diagnostic.no_variant_count == 1
        assert diagnostic.published_ids == ("term-a",)
        assert diagnostic.draft_ids == ("term-b",)
        assert diagnostic.no_variant_ids == ("term-c",)

    def test_draft_variant_does_not_satisfy_preview_ready(self, tmp_path: Path) -> None:
        roots = _empty_roots(tmp_path)
        catalogs = _catalogs(glossary_ids=("term-a", "term-b"))
        records = {
            "CONTENT#glossary_entry#term-a|META": _meta_record("glossary_entry", "term-a"),
            "CONTENT#glossary_entry#term-a|VARIANT#ro": _variant_record(
                "term-a", "ro", ContentStatus.PUBLISHED.value
            ),
            "CONTENT#glossary_entry#term-b|META": _meta_record("glossary_entry", "term-b"),
            "CONTENT#glossary_entry#term-b|VARIANT#ro": _variant_record(
                "term-b", "ro", ContentStatus.DRAFT.value
            ),
        }
        _write_complete_locale_tree(
            roots,
            "ro",
            catalogs,
            glossary_preview_ids=["term-a"],
            store_records=records,
        )
        result = evaluate_locale_readiness("ro", roots=roots, catalogs=catalogs)
        assert result.store.glossary.draft_ids == ("term-b",)
        assert result.glossary_preview.missing == ("term-b",)
        assert result.preview_ready is False


class TestCheckoutReadOnly:
    def test_real_checkout_matches_architectural_expectations(self) -> None:
        catalogs = load_canonical_catalogs()
        assert catalogs.website_pages == tuple(sorted(WEBSITE_PAGE_KEYS))
        assert len(catalogs.ui_keys) > 0
        assert len(catalogs.manual_ids) > 0
        assert len(catalogs.glossary_ids) > 0
        assert len(catalogs.knowledge_base_ids) > 0
        assert "contur-exterior" in catalogs.glossary_ids

        by_locale = {
            row.locale: row for row in evaluate_configured_locales(catalogs=catalogs)
        }
        assert tuple(by_locale) == ADMIN_EDITORIAL_LOCALE_ORDER

        english = by_locale["en"]
        assert english.ui.status is LayerStatus.COMPLETE
        assert english.ui.required_count == len(catalogs.ui_keys)
        assert english.ui.present_count == len(catalogs.ui_keys)
        assert english.manual_preview.present_count == len(catalogs.manual_ids)
        assert english.glossary_preview.present_count == len(catalogs.glossary_ids)
        assert english.knowledge_base_preview.present_count == len(catalogs.knowledge_base_ids)
        assert english.preview_ready is True
        assert english.production_ready is True

        german = by_locale["de"]
        assert german.preview_ready is True
        assert german.production_ready is True
        assert german.website_production.status is LayerStatus.COMPLETE
        assert german.website_production.present_count == len(catalogs.website_pages)
        assert german.manual_production.status is LayerStatus.COMPLETE
        assert german.manual_production.present_count == len(catalogs.manual_ids)
        assert german.manual_production.missing == ()
        assert german.glossary_production.status is LayerStatus.COMPLETE
        assert german.glossary_production.present_count == len(catalogs.glossary_ids)
        assert german.glossary_production.missing == ()
        assert german.knowledge_base_production.status is LayerStatus.COMPLETE
        assert german.knowledge_base_production.present_count == len(catalogs.knowledge_base_ids)
        assert german.knowledge_base_production.missing == ()

        romanian = by_locale["ro"]
        assert romanian.preview_ready is True
        assert romanian.production_ready is True
        assert romanian.glossary_preview.status is LayerStatus.COMPLETE
        assert romanian.glossary_preview.present_count == len(catalogs.glossary_ids)
        assert romanian.glossary_preview.missing == ()
        assert romanian.glossary_production.status is LayerStatus.COMPLETE
        assert romanian.glossary_production.present_count == len(catalogs.glossary_ids)
        assert romanian.glossary_production.missing == ()
        assert romanian.store.glossary.canonical_count == len(catalogs.glossary_ids)
        assert romanian.store.glossary.published_count == len(catalogs.glossary_ids)
        assert romanian.store.glossary.draft_count == 0
        assert romanian.store.glossary.no_variant_count == 0
        assert romanian.store.glossary.draft_ids == ()


def _run_cli(argv: list[str], *, roots: LocaleReadinessRoots | None = None) -> tuple[int, str, str]:
    stdout = StringIO()
    stderr = StringIO()
    code = locale_readiness_cli(argv, roots=roots, stdout=stdout, stderr=stderr)
    return code, stdout.getvalue(), stderr.getvalue()


class TestLocaleReadinessCli:
    def test_locale_en_succeeds_and_is_ready(self) -> None:
        code, stdout, stderr = _run_cli(["--locale", "en"])
        assert code == 0
        assert stderr == ""
        assert "Preview Ready:    YES" in stdout
        assert "Production Ready: YES" in stdout

    def test_locale_de_preview_and_production_ready(self) -> None:
        code, stdout, stderr = _run_cli(["--locale", "de"])
        assert code == 0
        assert stderr == ""
        assert "Preview Ready:    YES" in stdout
        assert "Production Ready: YES" in stdout
        assert "Production Ready: NO" not in stdout
        website = stdout.split("Website", 1)[1].split("Manual", 1)[0]
        assert "Preview:    COMPLETE 6/6" in website
        assert "Production: COMPLETE 6/6" in website
        manual = stdout.split("Manual", 1)[1].split("Glossary", 1)[0]
        assert "Preview:    COMPLETE 18/18" in manual
        assert "Production: COMPLETE 18/18" in manual
        glossary = stdout.split("Glossary", 1)[1].split("Knowledge Base", 1)[0]
        assert "Preview:    COMPLETE 173/173" in glossary
        assert "Production: COMPLETE 173/173" in glossary
        knowledge_base = stdout.split("Knowledge Base", 1)[1]
        assert "Preview:    COMPLETE 112/112" in knowledge_base
        assert "Production: COMPLETE 112/112" in knowledge_base
        assert "Production blockers:" not in stdout

    def test_locale_ro_preview_and_production_ready(self) -> None:
        code, stdout, stderr = _run_cli(["--locale", "ro"])
        assert code == 0
        assert stderr == ""
        assert "Preview Ready:    YES" in stdout
        assert "Production Ready: YES" in stdout
        glossary = stdout.split("Glossary", 1)[1].split("Knowledge Base", 1)[0]
        assert "Preview:    COMPLETE 173/173" in glossary
        assert "Production: COMPLETE 173/173" in glossary
        assert "INCOMPLETE 172/173" not in stdout
        assert "Production blockers:" not in stdout

    def test_all_includes_every_configured_locale(self) -> None:
        code, stdout, stderr = _run_cli(["--all"])
        assert code == 0
        assert stderr == ""
        reported = [
            line.split()[0]
            for line in stdout.splitlines()
            if line.split() and line.split()[0] in ADMIN_EDITORIAL_LOCALE_ORDER and "preview=" in line
        ]
        assert reported == list(ADMIN_EDITORIAL_LOCALE_ORDER)
        for locale in ADMIN_EDITORIAL_LOCALE_ORDER:
            assert f"{locale}  preview=" in stdout

    def test_json_locale_en_is_valid_and_complete(self) -> None:
        code, stdout, stderr = _run_cli(["--locale", "en", "--json"])
        assert code == 0
        assert stderr == ""
        payload = json.loads(stdout)
        assert payload["locale"] == "en"
        assert payload["preview_ready"] is True
        assert payload["production_ready"] is True
        for key in (
            "ui",
            "website_preview",
            "website_production",
            "manual_preview",
            "manual_production",
            "glossary_preview",
            "glossary_production",
            "knowledge_base_preview",
            "knowledge_base_production",
        ):
            layer = payload[key]
            assert set(layer) >= {"status", "required_count", "present_count", "missing", "extra"}
            assert layer["status"] == "complete"
            assert layer["required_count"] == layer["present_count"]
            assert layer["missing"] == []
        assert payload["store"]["glossary"]["canonical_count"] == payload["glossary_preview"]["required_count"]

    def test_json_all_contains_every_configured_locale(self) -> None:
        code, stdout, stderr = _run_cli(["--all", "--json"])
        assert code == 0
        assert stderr == ""
        payload = json.loads(stdout)
        locales = [row["locale"] for row in payload["locales"]]
        assert locales == list(ADMIN_EDITORIAL_LOCALE_ORDER)

    def test_unknown_locale_fails_nonzero(self) -> None:
        code, stdout, stderr = _run_cli(["--locale", "xx"])
        assert code == 2
        assert stdout == ""
        assert "Unsupported locale" in stderr
        assert "xx" in stderr

    def test_locale_and_all_together_fail_via_argparse(self) -> None:
        with pytest.raises(SystemExit) as exc:
            locale_readiness_cli(["--locale", "en", "--all"])
        assert exc.value.code == 2

    def test_neither_locale_nor_all_fails_via_argparse(self) -> None:
        with pytest.raises(SystemExit) as exc:
            locale_readiness_cli([])
        assert exc.value.code == 2

    def test_unready_locale_exit_code_is_zero(self) -> None:
        de_code, _, _ = _run_cli(["--locale", "de"])
        ro_code, _, _ = _run_cli(["--locale", "ro"])
        assert de_code == 0
        assert ro_code == 0

    def test_human_output_truncates_large_missing_lists(self, tmp_path: Path) -> None:
        roots = _empty_roots(tmp_path)
        ui_keys = tuple(f"key.{index:03d}" for index in range(30))
        catalogs = _catalogs(ui_keys=ui_keys)
        _write_complete_locale_tree(
            roots,
            "fr",
            catalogs,
            ui={key: f"FR {key}" for key in ui_keys[:5]},
        )
        code, stdout, stderr = _run_cli(["--locale", "fr"], roots=roots)
        assert code == 0
        assert stderr == ""
        missing = ui_keys[5:]
        assert len(missing) > HUMAN_MISSING_LIST_LIMIT
        rendered = format_missing_for_human(missing)
        assert rendered == f"{len(missing)} items"
        assert rendered in stdout
        assert "key.020" not in stdout
        json_code, json_out, json_err = _run_cli(["--locale", "fr", "--json"], roots=roots)
        assert json_code == 0
        assert json_err == ""
        payload = json.loads(json_out)
        assert payload["ui"]["missing"] == list(missing)
        assert "key.020" in payload["ui"]["missing"]

    def test_cli_reuses_phase1a_service(self) -> None:
        calls: list[str] = []
        real_evaluate = evaluate_locale_readiness

        def wrapped(locale, *, roots=None, catalogs=None):
            calls.append(locale)
            return real_evaluate(locale, roots=roots, catalogs=catalogs)

        with patch("private.tools.locale_readiness.evaluate_locale_readiness", wrapped):
            code, stdout, _ = _run_cli(["--locale", "de"])
        assert code == 0
        assert calls == ["de"]
        assert "Preview Ready:    YES" in stdout
        serialized = locale_to_json(real_evaluate("de"))
        assert serialized["preview_ready"] is True
        assert serialized["production_ready"] is True
        assert serialized["website_production"]["status"] == "complete"
        assert serialized["manual_production"]["status"] == "complete"
        assert serialized["glossary_production"]["status"] == "complete"
        assert serialized["knowledge_base_production"]["status"] == "complete"
