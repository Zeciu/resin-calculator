from pathlib import Path

from ..repositories.filesystem import FilesystemContentRepository
from .glossary_publish import GlossaryPublishService
from .glossary_source import load_glossary_entries


def static_entry_to_variant_body(entry: dict) -> dict:
    definition_blocks = [
        {"type": "paragraph", "text": paragraph}
        for paragraph in entry.get("definition", [])
        if str(paragraph).strip()
    ]
    media = entry.get("media", [])
    return {
        "term": entry["term"],
        "definitionBlocks": definition_blocks,
        "media": media,
        "relatedTermIds": [],
        "synonymTermIds": [],
        "seeAlso": [],
    }


class LegacyGlossaryMigrationService:
    """Migrate static glossaryContent.js into the legacy public Glossary store only."""

    def __init__(self, repository: FilesystemContentRepository):
        self._repository = repository
        self._publish_service = GlossaryPublishService(repository)

    def migrate(self, source_path: Path | None = None) -> dict:
        entries = load_glossary_entries(source_path)
        legacy_ids = [entry["id"] for entry in entries]
        removed_from_editorial = self._repository.purge_glossary_entries_if_present(legacy_ids)

        document = {
            "locale": "en",
            "entries": sorted(
                [
                    {
                        "id": entry["id"],
                        "term": entry["term"],
                        "definition": entry.get("definition", []),
                        "media": entry.get("media", []),
                        "relatedTerms": [],
                        "synonyms": [],
                        "seeAlso": [],
                    }
                    for entry in entries
                ],
                key=lambda item: item["term"].casefold(),
            ),
        }
        snapshot_key = self._repository.write_legacy_glossary_document("en", document)

        if self._repository.list_glossary_entry_ids():
            self._publish_service.rebuild_published_snapshot("en")
        else:
            self._repository.delete_admin_glossary_snapshot("en")

        return {
            "locale": "en",
            "entryCount": len(entries),
            "entryIds": legacy_ids,
            "snapshotKey": snapshot_key,
            "removedFromEditorial": removed_from_editorial,
        }


class EditorialGlossaryMigrationService:
    """Create editorial glossary entries from static source and publish EN."""

    def __init__(self, repository: FilesystemContentRepository):
        self._repository = repository
        self._publish_service = GlossaryPublishService(repository)

    def migrate(self, source_path: Path | None = None) -> dict:
        entries = load_glossary_entries(source_path)
        created_ids: list[str] = []
        for entry in entries:
            meta = self._repository.create_glossary_entry(entry["term"], content_id=entry["id"])
            body = static_entry_to_variant_body(entry)
            self._repository.save_glossary_variant(meta["contentId"], "en", body)
            self._publish_service.publish_variant(meta["contentId"], "en")
            created_ids.append(meta["contentId"])
        return {
            "locale": "en",
            "entryCount": len(created_ids),
            "entryIds": created_ids,
        }
