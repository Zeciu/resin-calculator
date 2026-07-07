#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from content.repositories.filesystem import FilesystemContentRepository
from content.services.migrate_phase2_manual import LegacyManualMigrationService


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Migrate static manualContent.js into the legacy public Manual store only.",
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=None,
        help="Optional path to manualContent.js (defaults to frontend/src/manual/manualContent.js).",
    )
    args = parser.parse_args()

    repository = FilesystemContentRepository()
    service = LegacyManualMigrationService(repository)
    result = service.migrate(args.source)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
