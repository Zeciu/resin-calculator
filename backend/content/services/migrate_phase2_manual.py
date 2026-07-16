from pathlib import Path

from ..repositories.filesystem import FilesystemContentRepository
from .manual_publish import ManualPublishService
from .manual_source import load_manual_sections


class LegacyManualMigrationService:
    """Migrate static manualContent.js into the legacy public Manual store only."""

    def __init__(self, repository: FilesystemContentRepository):
        self._repository = repository
        self._publish_service = ManualPublishService(repository)

    def migrate(self, source_path: Path | None = None) -> dict:
        sections = load_manual_sections(source_path)
        legacy_ids = [section["id"] for section in sections]
        removed_from_editorial = self._repository.purge_manual_chapters_if_present(legacy_ids)

        document = {
            "locale": "en",
            "sections": sections,
        }
        snapshot_key = self._repository.write_legacy_manual_document("en", document)

        if self._repository.list_manual_chapter_ids():
            self._publish_service.rebuild_published_snapshot("en")
        else:
            self._repository.delete_admin_manual_snapshot("en")

        return {
            "locale": "en",
            "sectionCount": len(sections),
            "sectionIds": legacy_ids,
            "snapshotKey": snapshot_key,
            "removedFromEditorial": removed_from_editorial,
        }


def section_to_variant_body(section: dict) -> dict:
    return {
        "title": section["title"],
        "sections": [
            {
                "id": "main",
                "title": "",
                "blocks": list(section.get("blocks", [])),
            }
        ],
    }


class EditorialManualMigrationService:
    """Create editorial manual chapters from static source and publish EN."""

    def __init__(self, repository: FilesystemContentRepository):
        self._repository = repository
        self._publish_service = ManualPublishService(repository)

    def migrate(self, source_path: Path | None = None) -> dict:
        sections = load_manual_sections(source_path)
        created_ids: list[str] = []
        for section in sections:
            meta = self._repository.create_manual_chapter(
                section["title"],
                content_id=section["id"],
                locale="en",
            )
            body = section_to_variant_body(section)
            self._repository.save_manual_variant(meta["contentId"], "en", body)
            self._publish_service.publish_variant(meta["contentId"], "en")
            created_ids.append(meta["contentId"])
        return {
            "locale": "en",
            "sectionCount": len(created_ids),
            "sectionIds": created_ids,
        }
