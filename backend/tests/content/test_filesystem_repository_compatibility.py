import json
import os
from copy import deepcopy
from pathlib import Path

import pytest

from content.repositories.filesystem import (
    CONTENT_TYPE_GLOSSARY_ENTRY,
    CONTENT_TYPE_KB_ENTRY,
    CONTENT_TYPE_MANUAL_CHAPTER,
    FilesystemContentRepository,
    INITIALIZATION_MARKER,
    initialize_production_content_root,
    is_fully_initialized,
    make_glossary_meta_key,
    make_glossary_variant_key,
    make_kb_meta_key,
    make_kb_variant_key,
    make_legacy_meta_key,
    make_legacy_variant_key,
    make_manual_meta_key,
    make_manual_variant_key,
    make_order_key,
    root_has_authoritative_content,
)


def _legacy_manual_store_records(content_id: str = "introduction") -> dict:
    now = "2026-01-01T00:00:00+00:00"
    return {
        make_legacy_meta_key(content_id): {
            "pk": f"CONTENT#{content_id}",
            "sk": "META",
            "contentId": content_id,
            "contentType": CONTENT_TYPE_MANUAL_CHAPTER,
            "sortOrder": 100,
            "createdAt": now,
            "updatedAt": now,
        },
        make_legacy_variant_key(content_id, "en"): {
            "pk": f"CONTENT#{content_id}",
            "sk": "VARIANT#en",
            "contentId": content_id,
            "locale": "en",
            "status": "published",
            "draftBody": {
                "title": "Legacy Introduction",
                "sections": [
                    {
                        "id": "main",
                        "title": "",
                        "blocks": [{"type": "paragraph", "text": "Legacy body."}],
                    }
                ],
            },
            "updatedAt": now,
            "publishedAt": now,
            "snapshotKey": "published/manual/en/document.json",
        },
        make_order_key(100): {
            "pk": "INDEX#manual",
            "sk": "ORDER#000100",
            "contentId": content_id,
        },
    }


def _legacy_glossary_store_records(content_id: str = "calibration") -> dict:
    now = "2026-01-01T00:00:00+00:00"
    return {
        make_legacy_meta_key(content_id): {
            "pk": f"CONTENT#{content_id}",
            "sk": "META",
            "contentId": content_id,
            "contentType": CONTENT_TYPE_GLOSSARY_ENTRY,
            "sortOrder": 100,
            "createdAt": now,
            "updatedAt": now,
        },
        make_legacy_variant_key(content_id, "en"): {
            "pk": f"CONTENT#{content_id}",
            "sk": "VARIANT#en",
            "contentId": content_id,
            "locale": "en",
            "status": "published",
            "draftBody": {
                "term": "Calibration",
                "definitionBlocks": [{"type": "paragraph", "text": "Legacy glossary definition."}],
                "media": [],
                "relatedTermIds": [],
                "synonymTermIds": [],
                "seeAlso": [],
            },
            "updatedAt": now,
            "publishedAt": now,
            "snapshotKey": "published/glossary/en/entries.json",
        },
        "INDEX#glossary|ORDER#000100": {
            "pk": "INDEX#glossary",
            "sk": "ORDER#000100",
            "contentId": content_id,
        },
    }


def _legacy_kb_store_records(content_id: str = "bubbles-after-curing") -> dict:
    now = "2026-01-01T00:00:00+00:00"
    return {
        make_legacy_meta_key(content_id): {
            "pk": f"CONTENT#{content_id}",
            "sk": "META",
            "contentId": content_id,
            "contentType": CONTENT_TYPE_KB_ENTRY,
            "category": "Epoxy",
            "difficulty": "Beginner",
            "sortOrder": 100,
            "createdAt": now,
            "updatedAt": now,
        },
        make_legacy_variant_key(content_id, "en"): {
            "pk": f"CONTENT#{content_id}",
            "sk": "VARIANT#en",
            "contentId": content_id,
            "locale": "en",
            "status": "published",
            "draftBody": {
                "title": "Legacy KB Title",
                "problemSummary": "Legacy summary",
                "symptoms": ["Legacy symptom"],
                "possibleCauses": [],
                "solution": ["Legacy solution"],
                "prevention": [],
                "tips": [],
                "warnings": [],
                "searchKeywords": [],
                "estimatedRepairTime": None,
                "requiredTools": [],
                "requiredMaterials": [],
                "bodyBlocks": [],
                "media": [],
                "relatedKbEntryIds": [],
                "relatedGlossaryEntryIds": [],
                "relatedManualChapterIds": [],
            },
            "updatedAt": now,
            "publishedAt": now,
            "snapshotKey": "published/knowledge-base/en/entries.json",
        },
        "INDEX#kb|ORDER#000100": {
            "pk": "INDEX#kb",
            "sk": "ORDER#000100",
            "contentId": content_id,
        },
    }


def _write_store(root: Path, records: dict) -> None:
    store_path = root / "editorial" / "content-store.json"
    store_path.parent.mkdir(parents=True, exist_ok=True)
    store_path.write_text(json.dumps({"records": records}, indent=2), encoding="utf-8")


def _write_required_artifacts_from_repository(repository: FilesystemContentRepository, root: Path) -> None:
    repository.write_manual_snapshot(
        "en",
        {
            "locale": "en",
            "chapters": [
                {
                    "contentId": "introduction",
                    "sortOrder": 100,
                    "title": "Legacy Introduction",
                    "sections": [
                        {
                            "id": "main",
                            "title": "",
                            "blocks": [{"type": "paragraph", "text": "Legacy body."}],
                        }
                    ],
                }
            ],
        },
    )
    repository.write_glossary_snapshot(
        "en",
        {
            "locale": "en",
            "entries": [
                {
                    "id": "calibration",
                    "term": "Calibration",
                    "definition": ["Legacy glossary definition."],
                    "media": [],
                    "relatedTerms": [],
                    "synonyms": [],
                    "seeAlso": [],
                }
            ],
        },
    )
    repository.write_kb_snapshot(
        "en",
        {
            "locale": "en",
            "entries": [
                {
                    "id": "bubbles-after-curing",
                    "title": "Legacy KB Title",
                    "problemSummary": "Legacy summary",
                    "symptoms": ["Legacy symptom"],
                    "possibleCauses": [],
                    "solution": ["Legacy solution"],
                    "prevention": [],
                    "tips": [],
                    "warnings": [],
                    "searchKeywords": [],
                    "estimatedRepairTime": None,
                    "requiredTools": [],
                    "requiredMaterials": [],
                    "media": [],
                    "relatedKbArticles": [],
                    "relatedGlossaryTerms": [],
                    "relatedManualChapters": [],
                }
            ],
        },
    )
    repository.write_legacy_manual_document(
        "en",
        {
            "locale": "en",
            "sections": [
                {
                    "id": "introduction",
                    "title": "Legacy Introduction",
                    "blocks": [{"type": "paragraph", "text": "Legacy body."}],
                }
            ],
        },
    )
    repository.write_legacy_glossary_document(
        "en",
        {
            "locale": "en",
            "entries": [
                {
                    "id": "calibration",
                    "term": "Calibration",
                    "definition": ["Legacy glossary definition."],
                    "media": [],
                    "relatedTerms": [],
                    "synonyms": [],
                    "seeAlso": [],
                }
            ],
        },
    )
    repository.write_legacy_kb_document(
        "en",
        {
            "locale": "en",
            "entries": [
                {
                    "id": "bubbles-after-curing",
                    "title": "Legacy KB Title",
                    "problemSummary": "Legacy summary",
                    "symptoms": ["Legacy symptom"],
                    "possibleCauses": [],
                    "solution": ["Legacy solution"],
                    "prevention": [],
                    "tips": [],
                    "warnings": [],
                    "searchKeywords": [],
                    "estimatedRepairTime": None,
                    "requiredTools": [],
                    "requiredMaterials": [],
                    "media": [],
                    "relatedKbArticles": [],
                    "relatedGlossaryTerms": [],
                    "relatedManualChapters": [],
                }
            ],
        },
    )


def test_authoritative_existing_root_without_marker_is_adopted_not_reseeded(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))

    records = {
        **_legacy_manual_store_records(),
        **_legacy_glossary_store_records(),
        **_legacy_kb_store_records(),
    }
    _write_store(tmp_path, records)
    repository = FilesystemContentRepository(tmp_path)
    _write_required_artifacts_from_repository(repository, tmp_path)

    store_before = (tmp_path / "editorial" / "content-store.json").read_text(encoding="utf-8")
    published_before = (tmp_path / "published" / "manual" / "en" / "document.json").read_text(encoding="utf-8")
    assert not (tmp_path / INITIALIZATION_MARKER).exists()

    initialize_production_content_root(tmp_path)

    assert is_fully_initialized(tmp_path)
    assert (tmp_path / INITIALIZATION_MARKER).is_file()
    assert (tmp_path / "editorial" / "content-store.json").read_text(encoding="utf-8") == store_before
    assert (
        (tmp_path / "published" / "manual" / "en" / "document.json").read_text(encoding="utf-8")
        == published_before
    )
    assert repository.list_manual_chapter_ids() == ["introduction"]
    assert repository.get_manual_variant("introduction", "en")["draftBody"]["title"] == "Legacy Introduction"


def test_authoritative_root_with_missing_required_artifact_fails_closed_without_modification(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    _write_store(tmp_path, _legacy_manual_store_records())
    store_before = (tmp_path / "editorial" / "content-store.json").read_text(encoding="utf-8")

    with pytest.raises(RuntimeError, match="required artifacts are missing"):
        initialize_production_content_root(tmp_path)

    assert (tmp_path / "editorial" / "content-store.json").read_text(encoding="utf-8") == store_before
    assert not (tmp_path / INITIALIZATION_MARKER).exists()


def test_legacy_manual_store_is_readable_editable_and_migrates_on_write(tmp_path: Path) -> None:
    _write_store(tmp_path, _legacy_manual_store_records())
    repository = FilesystemContentRepository(tmp_path)

    assert repository.list_manual_chapter_ids() == ["introduction"]
    variant = repository.get_manual_variant("introduction", "en")
    assert variant["draftBody"]["title"] == "Legacy Introduction"

    repository.save_manual_variant(
        "introduction",
        "en",
        {
            "title": "Updated Legacy Title",
            "sections": [
                {"id": "main", "title": "", "blocks": [{"type": "paragraph", "text": "Updated legacy body."}]}
            ],
        },
    )

    records = json.loads(repository._store_path.read_text(encoding="utf-8"))["records"]
    assert make_manual_meta_key("introduction") in records
    assert make_manual_variant_key("introduction", "en") in records
    assert make_legacy_meta_key("introduction") not in records
    assert make_legacy_variant_key("introduction", "en") not in records
    assert records[make_manual_variant_key("introduction", "en")]["draftBody"]["title"] == "Updated Legacy Title"


def test_legacy_glossary_store_supports_read_save_publish_delete(tmp_path: Path) -> None:
    _write_store(tmp_path, _legacy_glossary_store_records())
    repository = FilesystemContentRepository(tmp_path)

    assert repository.get_glossary_variant("calibration", "en")["draftBody"]["term"] == "Calibration"

    repository.save_glossary_variant(
        "calibration",
        "en",
        {
            "term": "Updated Calibration",
            "definitionBlocks": [{"type": "paragraph", "text": "Updated definition."}],
            "media": [],
            "relatedTermIds": [],
            "synonymTermIds": [],
            "seeAlso": [],
        },
    )
    repository.publish_glossary_variant("calibration", "en")

    records = json.loads(repository._store_path.read_text(encoding="utf-8"))["records"]
    assert make_glossary_meta_key("calibration") in records
    assert make_legacy_meta_key("calibration") not in records

    repository.delete_glossary_entry("calibration")
    records_after_delete = json.loads(repository._store_path.read_text(encoding="utf-8"))["records"]
    assert "calibration" not in repository.list_glossary_entry_ids()
    assert make_glossary_meta_key("calibration") not in records_after_delete
    assert make_legacy_meta_key("calibration") not in records_after_delete


def test_legacy_kb_store_supports_read_save_publish(tmp_path: Path) -> None:
    _write_store(tmp_path, _legacy_kb_store_records())
    repository = FilesystemContentRepository(tmp_path)

    variant = repository.get_kb_variant("bubbles-after-curing", "en")
    assert variant["draftBody"]["title"] == "Legacy KB Title"

    repository.save_kb_variant(
        "bubbles-after-curing",
        "en",
        {
            **variant["draftBody"],
            "title": "Updated Legacy KB Title",
        },
        "Epoxy",
        "Beginner",
    )

    records = json.loads(repository._store_path.read_text(encoding="utf-8"))["records"]
    assert make_kb_meta_key("bubbles-after-curing") in records
    assert make_legacy_meta_key("bubbles-after-curing") not in records


def test_mixed_old_and_new_store_resolves_typed_precedence_and_cross_module_ids(tmp_path: Path) -> None:
    now = "2026-01-01T00:00:00+00:00"
    records = {
        make_manual_meta_key("calibration"): {
            "pk": "CONTENT#calibration",
            "sk": "META",
            "contentId": "calibration",
            "contentType": CONTENT_TYPE_MANUAL_CHAPTER,
            "sortOrder": 100,
            "createdAt": now,
            "updatedAt": now,
        },
        make_manual_variant_key("calibration", "en"): {
            "pk": "CONTENT#calibration",
            "sk": "VARIANT#en",
            "contentId": "calibration",
            "locale": "en",
            "status": "published",
            "draftBody": {
                "title": "Typed Manual Calibration",
                "sections": [{"id": "main", "title": "", "blocks": []}],
            },
            "updatedAt": now,
            "publishedAt": now,
            "snapshotKey": None,
        },
        **_legacy_glossary_store_records("calibration"),
        make_order_key(100): {
            "pk": "INDEX#manual",
            "sk": "ORDER#000100",
            "contentId": "calibration",
        },
    }
    _write_store(tmp_path, records)
    repository = FilesystemContentRepository(tmp_path)

    manual_variant = repository.get_manual_variant("calibration", "en")
    glossary_variant = repository.get_glossary_variant("calibration", "en")
    assert manual_variant["draftBody"]["title"] == "Typed Manual Calibration"
    assert glossary_variant["draftBody"]["term"] == "Calibration"

    wrong_type = repository.get_glossary_variant("introduction", "en")
    assert wrong_type is None


def test_legacy_glossary_en_only_preserves_en_when_saving_ro(tmp_path: Path) -> None:
    """Observation 005: first RO save must promote legacy EN, not delete it."""
    records = _legacy_glossary_store_records("bubble-removal")
    # Use a realistic English term for this content id.
    records[make_legacy_variant_key("bubble-removal", "en")]["draftBody"]["term"] = "Bubble removal"
    en_body = deepcopy(records[make_legacy_variant_key("bubble-removal", "en")]["draftBody"])
    en_variant_before = deepcopy(records[make_legacy_variant_key("bubble-removal", "en")])
    _write_store(tmp_path, records)
    repository = FilesystemContentRepository(tmp_path)

    assert repository.get_glossary_variant("bubble-removal", "ro") is None
    assert repository.list_glossary_entry_ids() == ["bubble-removal"]

    repository.save_glossary_variant(
        "bubble-removal",
        "ro",
        {
            "term": "Indepartarea bulelor",
            "definitionBlocks": [],
            "media": [],
            "relatedTermIds": list(en_body.get("relatedTermIds", [])),
            "synonymTermIds": list(en_body.get("synonymTermIds", [])),
            "seeAlso": list(en_body.get("seeAlso", [])),
        },
    )

    assert repository.list_glossary_entry_ids() == ["bubble-removal"]
    ro = repository.get_glossary_variant("bubble-removal", "ro")
    en = repository.get_glossary_variant("bubble-removal", "en")
    assert ro is not None
    assert ro["draftBody"]["term"] == "Indepartarea bulelor"
    assert en is not None
    assert en["draftBody"] == en_body
    assert en["status"] == en_variant_before["status"]
    assert en["publishedAt"] == en_variant_before["publishedAt"]
    assert en["snapshotKey"] == en_variant_before["snapshotKey"]

    stored = json.loads(repository._store_path.read_text(encoding="utf-8"))["records"]
    assert make_glossary_meta_key("bubble-removal") in stored
    assert make_glossary_variant_key("bubble-removal", "ro") in stored
    assert make_glossary_variant_key("bubble-removal", "en") in stored
    assert make_legacy_meta_key("bubble-removal") not in stored
    assert make_legacy_variant_key("bubble-removal", "en") not in stored
    assert "INDEX#glossary|ORDER#000100" in stored


def test_legacy_kb_en_only_preserves_en_when_saving_ro(tmp_path: Path) -> None:
    records = _legacy_kb_store_records("bubbles-after-curing")
    en_before = deepcopy(records[make_legacy_variant_key("bubbles-after-curing", "en")])
    meta_before = deepcopy(records[make_legacy_meta_key("bubbles-after-curing")])
    _write_store(tmp_path, records)
    repository = FilesystemContentRepository(tmp_path)

    assert repository.get_kb_variant("bubbles-after-curing", "ro") is None

    repository.save_kb_variant(
        "bubbles-after-curing",
        "ro",
        {
            "title": "Bule dupa intarire",
            "problemSummary": "",
            "symptoms": [],
            "possibleCauses": [],
            "solution": [],
            "prevention": [],
            "tips": [],
            "warnings": [],
            "searchKeywords": [],
            "estimatedRepairTime": None,
            "requiredTools": [],
            "requiredMaterials": [],
            "media": [],
            "relatedKbEntryIds": list(en_before["draftBody"].get("relatedKbEntryIds", [])),
            "relatedGlossaryEntryIds": list(
                en_before["draftBody"].get("relatedGlossaryEntryIds", [])
            ),
            "relatedManualChapterIds": list(
                en_before["draftBody"].get("relatedManualChapterIds", [])
            ),
        },
        meta_before["category"],
        meta_before["difficulty"],
    )

    en = repository.get_kb_variant("bubbles-after-curing", "en")
    ro = repository.get_kb_variant("bubbles-after-curing", "ro")
    meta = repository.get_kb_entry_meta("bubbles-after-curing")
    assert ro is not None
    assert ro["draftBody"]["title"] == "Bule dupa intarire"
    assert en is not None
    assert en["draftBody"] == en_before["draftBody"]
    assert en["status"] == en_before["status"]
    assert en["publishedAt"] == en_before["publishedAt"]
    assert en["snapshotKey"] == en_before["snapshotKey"]
    assert meta["category"] == meta_before["category"]
    assert meta["difficulty"] == meta_before["difficulty"]
    assert meta["sortOrder"] == meta_before["sortOrder"]

    stored = json.loads(repository._store_path.read_text(encoding="utf-8"))["records"]
    assert make_kb_variant_key("bubbles-after-curing", "en") in stored
    assert make_kb_variant_key("bubbles-after-curing", "ro") in stored
    assert make_legacy_variant_key("bubbles-after-curing", "en") not in stored


def test_legacy_multi_locale_promotes_all_siblings_on_single_save(tmp_path: Path) -> None:
    now = "2026-01-01T00:00:00+00:00"
    content_id = "multi-legacy"
    records = {
        make_legacy_meta_key(content_id): {
            "pk": f"CONTENT#{content_id}",
            "sk": "META",
            "contentId": content_id,
            "contentType": CONTENT_TYPE_GLOSSARY_ENTRY,
            "sortOrder": 200,
            "createdAt": now,
            "updatedAt": now,
        },
        make_legacy_variant_key(content_id, "en"): {
            "pk": f"CONTENT#{content_id}",
            "sk": "VARIANT#en",
            "contentId": content_id,
            "locale": "en",
            "status": "published",
            "draftBody": {
                "term": "English term",
                "definitionBlocks": [{"type": "paragraph", "text": "EN body"}],
                "media": [],
                "relatedTermIds": ["other"],
                "synonymTermIds": [],
                "seeAlso": [],
            },
            "updatedAt": now,
            "publishedAt": now,
            "snapshotKey": "published/glossary/en/entries.json",
            "generatedFromSourceRevision": 1,
            "generatedFromSourceTextRevision": 1,
            "translationProvider": "deepl",
            "generatedAt": now,
        },
        make_legacy_variant_key(content_id, "fr"): {
            "pk": f"CONTENT#{content_id}",
            "sk": "VARIANT#fr",
            "contentId": content_id,
            "locale": "fr",
            "status": "draft",
            "draftBody": {
                "term": "Terme francais",
                "definitionBlocks": [{"type": "paragraph", "text": "FR body"}],
                "media": [],
                "relatedTermIds": [],
                "synonymTermIds": [],
                "seeAlso": [],
            },
            "updatedAt": now,
            "publishedAt": None,
            "snapshotKey": None,
            "generatedFromSourceRevision": None,
            "generatedFromSourceTextRevision": None,
            "translationProvider": None,
            "generatedAt": None,
        },
        "INDEX#glossary|ORDER#000200": {
            "pk": "INDEX#glossary",
            "sk": "ORDER#000200",
            "contentId": content_id,
        },
    }
    _write_store(tmp_path, records)
    repository = FilesystemContentRepository(tmp_path)

    repository.save_glossary_variant(
        content_id,
        "ro",
        {
            "term": "Termen romanesc",
            "definitionBlocks": [],
            "media": [],
            "relatedTermIds": ["other"],
            "synonymTermIds": [],
            "seeAlso": [],
        },
    )

    en = repository.get_glossary_variant(content_id, "en")
    fr = repository.get_glossary_variant(content_id, "fr")
    ro = repository.get_glossary_variant(content_id, "ro")
    assert ro["draftBody"]["term"] == "Termen romanesc"
    assert en["draftBody"]["term"] == "English term"
    assert en["generatedFromSourceRevision"] == 1
    assert en["translationProvider"] == "deepl"
    assert fr["draftBody"]["term"] == "Terme francais"
    assert fr["status"] == "draft"

    stored = json.loads(repository._store_path.read_text(encoding="utf-8"))["records"]
    assert make_glossary_variant_key(content_id, "en") in stored
    assert make_glossary_variant_key(content_id, "fr") in stored
    assert make_glossary_variant_key(content_id, "ro") in stored
    assert make_legacy_variant_key(content_id, "en") not in stored
    assert make_legacy_variant_key(content_id, "fr") not in stored
    assert "INDEX#glossary|ORDER#000200" in stored


def test_legacy_migration_refuses_to_drop_unpromoted_siblings(tmp_path: Path) -> None:
    from content.repositories import filesystem as filesystem_module

    _write_store(tmp_path, _legacy_glossary_store_records("bubble-removal"))
    records = json.loads(
        (tmp_path / "editorial" / "content-store.json").read_text(encoding="utf-8")
    )["records"]

    # Pretend typed META already exists (as during save) but promotion is incomplete.
    records[make_glossary_meta_key("bubble-removal")] = deepcopy(
        records[make_legacy_meta_key("bubble-removal")]
    )

    original_promote = filesystem_module._promote_legacy_records_for_content

    def broken_promote(records_arg, content_id, content_type):
        # Intentionally skip promoting sibling variants.
        return None

    filesystem_module._promote_legacy_records_for_content = broken_promote
    try:
        with pytest.raises(RuntimeError, match="not fully promoted"):
            filesystem_module._migrate_legacy_keys_for_content(
                records,
                "bubble-removal",
                CONTENT_TYPE_GLOSSARY_ENTRY,
            )
    finally:
        filesystem_module._promote_legacy_records_for_content = original_promote

    assert make_legacy_variant_key("bubble-removal", "en") in records
    assert make_legacy_meta_key("bubble-removal") in records


def test_modern_typed_glossary_rename_preserves_siblings_and_id(tmp_path: Path) -> None:
    now = "2026-01-01T00:00:00+00:00"
    content_id = "modern-term"
    records = {
        make_glossary_meta_key(content_id): {
            "pk": f"CONTENT#{content_id}",
            "sk": "META",
            "contentId": content_id,
            "contentType": CONTENT_TYPE_GLOSSARY_ENTRY,
            "sortOrder": 50,
            "createdAt": now,
            "updatedAt": now,
        },
        make_glossary_variant_key(content_id, "ro"): {
            "pk": f"CONTENT#{content_id}",
            "sk": "VARIANT#ro",
            "contentId": content_id,
            "locale": "ro",
            "status": "draft",
            "draftBody": {
                "term": "Termen vechi",
                "definitionBlocks": [{"type": "paragraph", "text": "Definitie"}],
                "media": [],
                "relatedTermIds": [],
                "synonymTermIds": [],
                "seeAlso": [],
            },
            "updatedAt": now,
            "publishedAt": None,
            "snapshotKey": None,
            "sourceRevision": 1,
            "sourceTextRevision": 1,
        },
        make_glossary_variant_key(content_id, "en"): {
            "pk": f"CONTENT#{content_id}",
            "sk": "VARIANT#en",
            "contentId": content_id,
            "locale": "en",
            "status": "draft",
            "draftBody": {
                "term": "Old term",
                "definitionBlocks": [{"type": "paragraph", "text": "Definition"}],
                "media": [],
                "relatedTermIds": [],
                "synonymTermIds": [],
                "seeAlso": [],
            },
            "updatedAt": now,
            "publishedAt": None,
            "snapshotKey": None,
            "generatedFromSourceRevision": 1,
            "generatedFromSourceTextRevision": 1,
            "translationProvider": "deepl",
            "generatedAt": now,
        },
        make_glossary_variant_key(content_id, "fr"): {
            "pk": f"CONTENT#{content_id}",
            "sk": "VARIANT#fr",
            "contentId": content_id,
            "locale": "fr",
            "status": "draft",
            "draftBody": {
                "term": "Ancien terme",
                "definitionBlocks": [{"type": "paragraph", "text": "Definition FR"}],
                "media": [],
                "relatedTermIds": [],
                "synonymTermIds": [],
                "seeAlso": [],
            },
            "updatedAt": now,
            "publishedAt": None,
            "snapshotKey": None,
            "generatedFromSourceRevision": 1,
            "generatedFromSourceTextRevision": 1,
            "translationProvider": "deepl",
            "generatedAt": now,
        },
        "INDEX#glossary|ORDER#000050": {
            "pk": "INDEX#glossary",
            "sk": "ORDER#000050",
            "contentId": content_id,
        },
    }
    _write_store(tmp_path, records)
    repository = FilesystemContentRepository(tmp_path)

    saved = repository.save_glossary_variant(
        content_id,
        "ro",
        {
            "term": "Termen nou",
            "definitionBlocks": [{"type": "paragraph", "text": "Definitie"}],
            "media": [],
            "relatedTermIds": [],
            "synonymTermIds": [],
            "seeAlso": [],
        },
    )

    assert saved["contentId"] == content_id
    assert saved["sourceTextRevision"] == 2
    assert repository.get_glossary_variant(content_id, "en")["draftBody"]["term"] == "Old term"
    assert repository.get_glossary_variant(content_id, "fr")["draftBody"]["term"] == "Ancien terme"
    assert repository.list_glossary_entry_ids() == [content_id]


def test_legacy_glossary_ro_draft_save_does_not_mutate_published_snapshot(
    tmp_path: Path,
) -> None:
    records = _legacy_glossary_store_records("bubble-removal")
    records[make_legacy_variant_key("bubble-removal", "en")]["draftBody"]["term"] = "Bubble removal"
    _write_store(tmp_path, records)
    repository = FilesystemContentRepository(tmp_path)
    snapshot = {
        "locale": "en",
        "entries": [
            {
                "id": "bubble-removal",
                "term": "Bubble removal",
                "definition": ["Legacy public text"],
                "media": [],
                "relatedTerms": [],
                "synonyms": [],
                "seeAlso": [],
            }
        ],
    }
    repository.write_glossary_snapshot("en", snapshot)
    before = (tmp_path / "published" / "glossary" / "en" / "entries.json").read_text(
        encoding="utf-8"
    )

    repository.save_glossary_variant(
        "bubble-removal",
        "ro",
        {
            "term": "Indepartarea bulelor",
            "definitionBlocks": [{"type": "paragraph", "text": "Text RO"}],
            "media": [],
            "relatedTermIds": [],
            "synonymTermIds": [],
            "seeAlso": [],
        },
    )

    after = (tmp_path / "published" / "glossary" / "en" / "entries.json").read_text(
        encoding="utf-8"
    )
    assert after == before
    assert repository.get_glossary_variant("bubble-removal", "en") is not None

    repository.publish_glossary_variant("bubble-removal", "ro")
    assert repository.get_glossary_variant("bubble-removal", "en")["draftBody"]["term"] == (
        "Bubble removal"
    )
    en_snapshot_after_ro_publish = (
        tmp_path / "published" / "glossary" / "en" / "entries.json"
    ).read_text(encoding="utf-8")
    assert en_snapshot_after_ro_publish == before

    repository.publish_glossary_variant("bubble-removal", "en")
    en_public = repository.read_glossary_snapshot("en")
    assert any(entry.get("id") == "bubble-removal" for entry in en_public.get("entries", []))


def test_observation_008_delete_semantics_unchanged_after_migration(tmp_path: Path) -> None:
    records = _legacy_glossary_store_records("bubble-removal")
    records[make_legacy_variant_key("bubble-removal", "en")]["draftBody"]["term"] = "Bubble removal"
    _write_store(tmp_path, records)
    repository = FilesystemContentRepository(tmp_path)
    repository.save_glossary_variant(
        "bubble-removal",
        "ro",
        {
            "term": "Indepartarea bulelor",
            "definitionBlocks": [],
            "media": [],
            "relatedTermIds": [],
            "synonymTermIds": [],
            "seeAlso": [],
        },
    )

    repository.delete_glossary_entry_variant("bubble-removal", "en")
    assert repository.get_glossary_variant("bubble-removal", "en") is None
    assert repository.get_glossary_variant("bubble-removal", "ro") is not None
    assert "bubble-removal" in repository.list_glossary_entry_ids()

    repository.delete_glossary_entry("bubble-removal")
    assert "bubble-removal" not in repository.list_glossary_entry_ids()
    assert repository.get_glossary_variant("bubble-removal", "ro") is None


def test_cleanup_refuses_authoritative_editorial_records(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    _write_store(tmp_path, _legacy_manual_store_records())
    (tmp_path / "published").mkdir(parents=True, exist_ok=True)

    assert root_has_authoritative_content(tmp_path)

    with pytest.raises(RuntimeError, match="required artifacts are missing"):
        initialize_production_content_root(tmp_path)

    assert (tmp_path / "editorial" / "content-store.json").is_file()


def test_cleanup_refuses_non_empty_published_snapshot(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    snapshot_path = tmp_path / "published" / "manual" / "en" / "document.json"
    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot_path.write_text(
        json.dumps({"locale": "en", "chapters": [{"contentId": "existing", "title": "Existing"}]}),
        encoding="utf-8",
    )

    with pytest.raises(RuntimeError, match="required artifacts are missing"):
        initialize_production_content_root(tmp_path)

    assert snapshot_path.read_text(encoding="utf-8")


def test_unrelated_files_still_cause_safe_refusal(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    unrelated = tmp_path / "preexisting-note.txt"
    unrelated.write_text("keep me", encoding="utf-8")

    with pytest.raises(RuntimeError, match="refusing initialization"):
        initialize_production_content_root(tmp_path)

    assert unrelated.read_text(encoding="utf-8") == "keep me"


def test_empty_partial_initialization_artifacts_remain_recoverable(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    _write_store(tmp_path, {})
    (tmp_path / "published").mkdir(parents=True, exist_ok=True)

    assert not root_has_authoritative_content(tmp_path)
    initialize_production_content_root(tmp_path)

    assert is_fully_initialized(tmp_path)
    assert len(FilesystemContentRepository(tmp_path).list_manual_chapter_ids()) > 0


@pytest.mark.skipif(os.name == "nt", reason="Symlink ownership semantics differ on Windows.")
def test_cleanup_does_not_follow_symlink_outside_root(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    outside_dir = tmp_path / "outside"
    outside_dir.mkdir()
    sentinel = outside_dir / "sentinel.txt"
    sentinel.write_text("outside", encoding="utf-8")

    editorial_link = tmp_path / "editorial"
    editorial_link.symlink_to(outside_dir, target_is_directory=True)
    assert not root_has_authoritative_content(tmp_path)

    monkeypatch.setenv("REQUIRE_CONTENT_DATA_DIR", "1")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    initialize_production_content_root(tmp_path)

    assert sentinel.read_text(encoding="utf-8") == "outside"
