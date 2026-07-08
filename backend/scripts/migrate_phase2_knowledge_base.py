#!/usr/bin/env python3
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from content.repositories.filesystem import FilesystemContentRepository
from content.services.migrate_phase2_knowledge_base import (
    EditorialKnowledgeBaseMigrationService,
    LegacyKnowledgeBaseMigrationService,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate Phase 2 static Knowledge Base content.")
    parser.add_argument(
        "--legacy",
        action="store_true",
        help="Write legacy public Knowledge Base only (no editorial entries).",
    )
    args = parser.parse_args()

    repository = FilesystemContentRepository()
    if args.legacy:
        result = LegacyKnowledgeBaseMigrationService(repository).migrate()
        print(
            f"Migrated {result['entryCount']} Knowledge Base entries to legacy public store "
            f"({result['snapshotKey']})."
        )
        return

    result = EditorialKnowledgeBaseMigrationService(repository).migrate()
    print(
        f"Migrated {result['entryCount']} Knowledge Base entries to editorial store "
        f"and published EN snapshot."
    )


if __name__ == "__main__":
    main()
