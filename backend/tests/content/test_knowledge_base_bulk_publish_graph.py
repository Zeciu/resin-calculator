"""Knowledge Base Publish All against a copy of the real EN editorial store."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from private.repositories.filesystem import FilesystemContentRepository
from private.services.knowledge_base_publish import KnowledgeBasePublishService

BACKEND_ROOT = Path(__file__).resolve().parents[2]
PRIVATE_CORPUS = BACKEND_ROOT / "private" / "content"


def test_copied_en_kb_draft_graph_publishes_without_touching_romanian(tmp_path):
    source_store = PRIVATE_CORPUS / "editorial" / "content-store.json"
    source_ro = PRIVATE_CORPUS / "published" / "knowledge-base" / "ro" / "entries.json"
    source_en = PRIVATE_CORPUS / "published" / "knowledge-base" / "en" / "entries.json"
    assert source_store.is_file()

    editorial_dir = tmp_path / "editorial"
    editorial_dir.mkdir()
    shutil.copy2(source_store, editorial_dir / "content-store.json")
    if (PRIVATE_CORPUS / "config").is_dir():
        shutil.copytree(PRIVATE_CORPUS / "config", tmp_path / "config")
    published_en_dir = tmp_path / "published" / "knowledge-base" / "en"
    published_ro_dir = tmp_path / "published" / "knowledge-base" / "ro"
    published_en_dir.mkdir(parents=True)
    published_ro_dir.mkdir(parents=True)
    shutil.copy2(source_en, published_en_dir / "entries.json")
    shutil.copy2(source_ro, published_ro_dir / "entries.json")
    romanian_before = (published_ro_dir / "entries.json").read_bytes()
    english_before = json.loads((published_en_dir / "entries.json").read_text(encoding="utf-8"))

    repository = FilesystemContentRepository(tmp_path)
    records_before = repository.read_editorial_records()
    published_before = 0
    draft_before = 0
    for content_id in repository.list_kb_entry_ids_from_store(records_before):
        variant = repository.get_kb_variant_from_store(records_before, content_id, "en")
        assert variant is not None
        if variant["status"] == "published":
            published_before += 1
        elif variant["status"] == "draft":
            draft_before += 1
    total_en = published_before + draft_before
    assert total_en == 112
    assert len(english_before.get("entries") or []) == published_before

    result = KnowledgeBasePublishService(repository).publish_all_drafts("en")

    assert result.failedCount == 0, [item.model_dump() for item in result.failed[:8]]
    assert result.publishedCount == draft_before
    assert result.skippedCount == published_before
    assert result.publishedCount + result.failedCount + result.skippedCount == total_en

    english_after = json.loads((published_en_dir / "entries.json").read_text(encoding="utf-8"))
    assert len(english_after.get("entries") or []) == total_en
    assert (published_ro_dir / "entries.json").read_bytes() == romanian_before

    records = repository.read_editorial_records()
    published_en = 0
    draft_en = 0
    for content_id in repository.list_kb_entry_ids_from_store(records):
        variant = repository.get_kb_variant_from_store(records, content_id, "en")
        assert variant is not None
        if variant["status"] == "published":
            published_en += 1
        else:
            draft_en += 1
    assert published_en == total_en
    assert draft_en == 0
