"""Focused tests for editorial cross-reference search load-once behaviour."""

from __future__ import annotations

from pathlib import Path

from private.repositories.filesystem import FilesystemContentRepository
from private.services.reference_search import ReferenceSearchService


def _glossary_body(term: str, definition: str) -> dict:
    return {
        "term": term,
        "definitionBlocks": [{"type": "paragraph", "text": definition}],
        "media": [],
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


def _kb_body(title: str) -> dict:
    return {
        "title": title,
        "problemSummary": "Summary.",
        "symptoms": [],
        "possibleCauses": [],
        "solution": ["Fix it."],
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
    }


def _manual_body(title: str) -> dict:
    return {
        "title": title,
        "summary": "Chapter summary.",
        "bodyBlocks": [],
        "media": [],
        "relatedChapterIds": [],
        "relatedGlossaryEntryIds": [],
        "relatedKbEntryIds": [],
    }


def _seed_corpus(repository: FilesystemContentRepository) -> None:
    repository.create_glossary_entry("Pot life", content_id="pot-life")
    repository.save_glossary_variant("pot-life", "ro", _glossary_body("Pot life", "Working time."))
    repository.create_glossary_entry("Hardener", content_id="hardener")
    repository.save_glossary_variant("hardener", "ro", _glossary_body("Hardener", "Curing agent."))
    repository.create_kb_entry(
        "Sticky resin",
        category="troubleshooting",
        difficulty="beginner",
        content_id="sticky-resin",
    )
    repository.save_kb_variant(
        "sticky-resin",
        "ro",
        _kb_body("Sticky resin"),
        "troubleshooting",
        "beginner",
    )
    repository.create_manual_chapter("Mixing", content_id="mixing")
    repository.save_manual_variant("mixing", "ro", _manual_body("Mixing"))


class TestReferenceSearchLoadOnce:
    def test_search_reads_editorial_store_once(self, tmp_path: Path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        repository = FilesystemContentRepository(tmp_path)
        _seed_corpus(repository)

        reads = {"n": 0}
        real_read = repository._read_store

        def counting_read():
            reads["n"] += 1
            return real_read()

        repository._read_store = counting_read

        results = ReferenceSearchService(repository).search_references("", "ro")
        assert reads["n"] == 1
        assert {item.contentId for item in results} >= {
            "pot-life",
            "hardener",
            "sticky-resin",
            "mixing",
        }

    def test_query_filter_and_published_only_semantics(self, tmp_path: Path, monkeypatch):
        monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
        repository = FilesystemContentRepository(tmp_path)
        _seed_corpus(repository)
        repository.publish_glossary_variant("pot-life", "ro")

        service = ReferenceSearchService(repository)
        matches = service.search_references("pot", "ro", published_only=False)
        assert [item.contentId for item in matches if item.contentType == "glossary_entry"] == [
            "pot-life"
        ]

        published = service.search_references("pot", "ro", published_only=True)
        published_ids = {
            item.contentId for item in published if item.contentType == "glossary_entry"
        }
        assert "pot-life" in published_ids
        assert "hardener" not in published_ids
