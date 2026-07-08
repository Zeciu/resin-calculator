#!/usr/bin/env python3
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from content.repositories.filesystem import FilesystemContentRepository
from content.services.migrate_phase2_glossary import (
    EditorialGlossaryMigrationService,
    LegacyGlossaryMigrationService,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate Phase 2 static glossary content.")
    parser.add_argument(
        "--legacy",
        action="store_true",
        help="Write legacy public glossary only (no editorial entries).",
    )
    args = parser.parse_args()

    repository = FilesystemContentRepository()
    if args.legacy:
        result = LegacyGlossaryMigrationService(repository).migrate()
        print(
            f"Migrated {result['entryCount']} glossary entries to legacy public store "
            f"({result['snapshotKey']})."
        )
        return

    result = EditorialGlossaryMigrationService(repository).migrate()
    print(
        f"Migrated {result['entryCount']} glossary entries to editorial store "
        f"and published EN snapshot."
    )


if __name__ == "__main__":
    main()
