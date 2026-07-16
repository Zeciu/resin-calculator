import json
import os
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


def test_legacy_shared_key_content_type_mismatch_is_not_returned_for_wrong_module(tmp_path: Path) -> None:
    _write_store(tmp_path, _legacy_manual_store_records("calibration"))
    repository = FilesystemContentRepository(tmp_path)

    assert repository.get_manual_variant("calibration", "en") is not None
    assert repository.get_glossary_variant("calibration", "en") is None
    assert repository.get_kb_variant("calibration", "en") is None


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
