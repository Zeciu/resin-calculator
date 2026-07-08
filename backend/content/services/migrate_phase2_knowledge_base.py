from pathlib import Path

from ..repositories.filesystem import FilesystemContentRepository
from .knowledge_base_publish import KnowledgeBasePublishService
from .knowledge_base_source import load_knowledge_base_entries


def static_entry_to_variant_body(entry: dict) -> dict:
    return {
        "title": entry["title"],
        "problemSummary": entry.get("problemSummary", ""),
        "symptoms": entry.get("symptoms", []),
        "possibleCauses": entry.get("possibleCauses", []),
        "solution": entry.get("solution", []),
        "prevention": entry.get("prevention", []),
        "tips": entry.get("tips", []),
        "warnings": entry.get("warnings", []),
        "searchKeywords": entry.get("searchKeywords", []),
        "estimatedRepairTime": entry.get("estimatedRepairTime"),
        "requiredTools": entry.get("requiredTools", []),
        "requiredMaterials": entry.get("requiredMaterials", []),
        "bodyBlocks": [],
        "media": entry.get("media", []),
        "relatedKbEntryIds": [],
        "relatedGlossaryEntryIds": [],
        "relatedManualChapterIds": [],
    }


def static_entry_to_public_entry(entry: dict) -> dict:
    return {
        "id": entry["id"],
        "title": entry["title"],
        "problemSummary": entry.get("problemSummary", ""),
        "symptoms": entry.get("symptoms", []),
        "possibleCauses": entry.get("possibleCauses", []),
        "solution": entry.get("solution", []),
        "prevention": entry.get("prevention", []),
        "tips": entry.get("tips", []),
        "warnings": entry.get("warnings", []),
        "searchKeywords": entry.get("searchKeywords", []),
        "estimatedRepairTime": entry.get("estimatedRepairTime"),
        "requiredTools": entry.get("requiredTools", []),
        "requiredMaterials": entry.get("requiredMaterials", []),
        "media": entry.get("media", []),
        "relatedKbArticles": [],
        "relatedGlossaryTerms": [],
        "relatedManualChapters": [],
    }


class LegacyKnowledgeBaseMigrationService:
    """Migrate static knowledgeBaseContent.js into the legacy public KB store only."""

    def __init__(self, repository: FilesystemContentRepository):
        self._repository = repository
        self._publish_service = KnowledgeBasePublishService(repository)

    def migrate(self, source_path: Path | None = None) -> dict:
        entries = load_knowledge_base_entries(source_path)
        legacy_ids = [entry["id"] for entry in entries]
        removed_from_editorial = self._repository.purge_kb_entries_if_present(legacy_ids)

        document = {
            "locale": "en",
            "entries": [static_entry_to_public_entry(entry) for entry in entries],
        }
        snapshot_key = self._repository.write_legacy_kb_document("en", document)

        if self._repository.list_kb_entry_ids():
            self._publish_service.rebuild_published_snapshot("en")
        else:
            self._repository.delete_admin_kb_snapshot("en")

        return {
            "locale": "en",
            "entryCount": len(entries),
            "entryIds": legacy_ids,
            "snapshotKey": snapshot_key,
            "removedFromEditorial": removed_from_editorial,
        }


class EditorialKnowledgeBaseMigrationService:
    """Create editorial KB entries from static source and publish EN."""

    def __init__(self, repository: FilesystemContentRepository):
        self._repository = repository
        self._publish_service = KnowledgeBasePublishService(repository)

    def migrate(self, source_path: Path | None = None) -> dict:
        entries = load_knowledge_base_entries(source_path)
        created_ids: list[str] = []
        for entry in entries:
            meta = self._repository.create_kb_entry(
                entry["title"],
                entry["category"],
                entry["difficulty"],
                content_id=entry["id"],
            )
            body = static_entry_to_variant_body(entry)
            self._repository.save_kb_variant(
                meta["contentId"],
                "en",
                body,
                entry["category"],
                entry["difficulty"],
            )
            self._publish_service.publish_variant(meta["contentId"], "en")
            created_ids.append(meta["contentId"])
        return {
            "locale": "en",
            "entryCount": len(created_ids),
            "entryIds": created_ids,
        }
