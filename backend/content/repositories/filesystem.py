import errno
import json
import os
import re
import shutil
import tempfile
import time
from collections.abc import Callable
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, TypeVar

from content.services.glossary_source import load_glossary_entries
from content.services.knowledge_base_source import load_knowledge_base_entries
from content.services.manual_source import load_manual_sections
from content.website_pages import (
    WEBSITE_PAGE_DEFINITIONS,
    WEBSITE_PAGE_KEYS,
    empty_website_draft_body,
    empty_website_snapshot_document,
    website_page_definition,
)
from content.translation_metadata import (
    apply_translation_metadata_on_save,
    initial_translation_metadata_on_create,
)

CONTENT_TYPE_MANUAL_CHAPTER = "manual_chapter"
CONTENT_TYPE_GLOSSARY_ENTRY = "glossary_entry"
CONTENT_TYPE_KB_ENTRY = "kb_entry"
CONTENT_TYPE_WEBSITE_PAGE = "website_page"
DEFAULT_SECTION_ID = "main"
# Romanian is the canonical editorial authoring language. English remains a
# valid variant locale but is no longer the create/list default.
CANONICAL_EDITORIAL_LOCALE = "ro"
DEFAULT_LOCALE = CANONICAL_EDITORIAL_LOCALE
# Admin-prepared editorial locales (independent from public PUBLIC_LOCALES).
EDITORIAL_LOCALES = (
    CANONICAL_EDITORIAL_LOCALE,
    "en",
    "fr",
    "de",
    "es",
    "pt",
    "pl",
    "cs",
    "it",
)
INITIALIZATION_MARKER = ".hfzwood-initialized.json"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def isoformat(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def slugify_title(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.strip().lower()).strip("-")
    return base or "new-chapter"


def make_manual_meta_key(content_id: str) -> str:
    return f"CONTENT#manual_chapter#{content_id}|META"


def make_manual_variant_key(content_id: str, locale: str) -> str:
    return f"CONTENT#manual_chapter#{content_id}|VARIANT#{locale}"


def make_glossary_meta_key(content_id: str) -> str:
    return f"CONTENT#glossary_entry#{content_id}|META"


def make_glossary_variant_key(content_id: str, locale: str) -> str:
    return f"CONTENT#glossary_entry#{content_id}|VARIANT#{locale}"


def make_kb_meta_key(content_id: str) -> str:
    return f"CONTENT#kb_entry#{content_id}|META"


def make_kb_variant_key(content_id: str, locale: str) -> str:
    return f"CONTENT#kb_entry#{content_id}|VARIANT#{locale}"


def make_website_meta_key(page_key: str) -> str:
    return f"CONTENT#website_page#{page_key}|META"


def make_website_variant_key(page_key: str, locale: str) -> str:
    return f"CONTENT#website_page#{page_key}|VARIANT#{locale}"


def make_order_key(sort_order: int) -> str:
    return f"INDEX#manual|ORDER#{sort_order:06d}"


def make_glossary_order_key(sort_order: int) -> str:
    return f"INDEX#glossary|ORDER#{sort_order:06d}"


def make_kb_order_key(sort_order: int) -> str:
    return f"INDEX#kb|ORDER#{sort_order:06d}"


def make_legacy_meta_key(content_id: str) -> str:
    return f"CONTENT#{content_id}|META"


def make_legacy_variant_key(content_id: str, locale: str) -> str:
    return f"CONTENT#{content_id}|VARIANT#{locale}"


def _resolve_meta_key(
    records: dict[str, Any],
    content_id: str,
    content_type: str,
    make_typed_meta_key,
) -> tuple[str | None, dict[str, Any] | None]:
    typed_key = make_typed_meta_key(content_id)
    if typed_key in records:
        return typed_key, records[typed_key]
    legacy_key = make_legacy_meta_key(content_id)
    legacy_record = records.get(legacy_key)
    if legacy_record is not None and legacy_record.get("contentType") == content_type:
        return legacy_key, legacy_record
    return None, None


def _resolve_variant_key(
    records: dict[str, Any],
    content_id: str,
    locale: str,
    content_type: str,
    make_typed_variant_key,
    make_typed_meta_key,
) -> tuple[str | None, dict[str, Any] | None]:
    typed_variant_key = make_typed_variant_key(content_id, locale)
    if typed_variant_key in records:
        return typed_variant_key, records[typed_variant_key]

    typed_meta_key = make_typed_meta_key(content_id)
    if typed_meta_key in records:
        return None, None

    legacy_meta_key = make_legacy_meta_key(content_id)
    legacy_meta = records.get(legacy_meta_key)
    if legacy_meta is None or legacy_meta.get("contentType") != content_type:
        return None, None

    legacy_variant_key = make_legacy_variant_key(content_id, locale)
    if legacy_variant_key in records:
        return legacy_variant_key, records[legacy_variant_key]
    return None, None


def _meta_exists(
    records: dict[str, Any],
    content_id: str,
    content_type: str,
    make_typed_meta_key,
) -> bool:
    _, record = _resolve_meta_key(records, content_id, content_type, make_typed_meta_key)
    return record is not None


def _typed_key_builders_for_content_type(
    content_type: str,
) -> tuple[Any, Any]:
    if content_type == CONTENT_TYPE_MANUAL_CHAPTER:
        return make_manual_meta_key, make_manual_variant_key
    if content_type == CONTENT_TYPE_GLOSSARY_ENTRY:
        return make_glossary_meta_key, make_glossary_variant_key
    if content_type == CONTENT_TYPE_KB_ENTRY:
        return make_kb_meta_key, make_kb_variant_key
    if content_type == CONTENT_TYPE_WEBSITE_PAGE:
        return make_website_meta_key, make_website_variant_key
    raise ValueError(f"Unsupported content type for legacy migration: {content_type}")


def _legacy_variant_keys_for_content(
    records: dict[str, Any],
    content_id: str,
) -> list[tuple[str, str]]:
    """Return (legacy_key, locale) pairs for CONTENT#{id}|VARIANT#{locale}."""
    prefix = f"CONTENT#{content_id}|VARIANT#"
    found: list[tuple[str, str]] = []
    for key in records:
        if not key.startswith(prefix):
            continue
        locale = key[len(prefix) :]
        if locale:
            found.append((key, locale))
    return found


def _content_owns_legacy_namespace(
    records: dict[str, Any],
    content_id: str,
    content_type: str,
) -> bool:
    """True when legacy META for this id belongs to content_type, or typed META already does."""
    make_typed_meta_key, _ = _typed_key_builders_for_content_type(content_type)
    typed_meta = records.get(make_typed_meta_key(content_id))
    if typed_meta is not None and typed_meta.get("contentType") == content_type:
        return True
    legacy_meta = records.get(make_legacy_meta_key(content_id))
    return legacy_meta is not None and legacy_meta.get("contentType") == content_type


def _promote_legacy_records_for_content(
    records: dict[str, Any],
    content_id: str,
    content_type: str,
) -> None:
    """
    Copy every legacy META/VARIANT for content_id into typed keys.

    Does not remove legacy keys. Typed records already present win (not overwritten).
    """
    if not _content_owns_legacy_namespace(records, content_id, content_type):
        return

    make_typed_meta_key, make_typed_variant_key = _typed_key_builders_for_content_type(
        content_type
    )
    typed_meta_key = make_typed_meta_key(content_id)
    legacy_meta_key = make_legacy_meta_key(content_id)
    legacy_meta = records.get(legacy_meta_key)
    if (
        legacy_meta is not None
        and legacy_meta.get("contentType") == content_type
        and typed_meta_key not in records
    ):
        records[typed_meta_key] = deepcopy(legacy_meta)

    for legacy_key, locale in _legacy_variant_keys_for_content(records, content_id):
        typed_key = make_typed_variant_key(content_id, locale)
        if typed_key in records:
            continue
        records[typed_key] = deepcopy(records[legacy_key])


def _legacy_records_fully_promoted(
    records: dict[str, Any],
    content_id: str,
    content_type: str,
) -> bool:
    """True when every legacy variant/meta for this entity has a typed counterpart."""
    if not _content_owns_legacy_namespace(records, content_id, content_type):
        return True

    make_typed_meta_key, make_typed_variant_key = _typed_key_builders_for_content_type(
        content_type
    )
    if make_typed_meta_key(content_id) not in records:
        legacy_meta = records.get(make_legacy_meta_key(content_id))
        if legacy_meta is not None and legacy_meta.get("contentType") == content_type:
            return False

    for _legacy_key, locale in _legacy_variant_keys_for_content(records, content_id):
        if make_typed_variant_key(content_id, locale) not in records:
            return False
    return True


def _migrate_legacy_meta_key(
    records: dict[str, Any],
    content_id: str,
    content_type: str,
) -> None:
    legacy_meta_key = make_legacy_meta_key(content_id)
    legacy_meta = records.get(legacy_meta_key)
    if legacy_meta is None or legacy_meta.get("contentType") != content_type:
        return
    records.pop(legacy_meta_key, None)


def _migrate_legacy_keys_for_content(
    records: dict[str, Any],
    content_id: str,
    content_type: str,
) -> None:
    """
    Promote all legacy locale variants/meta to typed keys, then remove legacy keys.

    Never deletes legacy sibling variants until every legacy variant has been
    copied to its typed key. Raises if promotion is incomplete so callers do
    not persist a half-migrated entity.
    """
    if not _content_owns_legacy_namespace(records, content_id, content_type):
        return

    _promote_legacy_records_for_content(records, content_id, content_type)
    if not _legacy_records_fully_promoted(records, content_id, content_type):
        raise RuntimeError(
            f"Refusing to remove legacy keys for {content_type} '{content_id}': "
            "legacy records were not fully promoted to typed storage."
        )

    _migrate_legacy_meta_key(records, content_id, content_type)
    prefix = f"CONTENT#{content_id}|"
    for key in list(records):
        if key.startswith(prefix):
            records.pop(key, None)


def _load_store_records(root: Path) -> dict[str, Any] | None:
    store_path = root / "editorial" / "content-store.json"
    if not store_path.is_file():
        return None
    try:
        payload = json.loads(store_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    records = payload.get("records")
    if not isinstance(records, dict):
        return None
    return records


def _snapshot_has_corpus(path: Path, module: str) -> bool:
    if not path.is_file():
        return False
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return False
    if module == "manual":
        return bool(payload.get("chapters")) or bool(payload.get("sections"))
    return bool(payload.get("entries"))


def root_has_authoritative_editorial_records(root: Path) -> bool:
    records = _load_store_records(root)
    return bool(records)


def _module_snapshot_filename(module: str) -> str:
    return "document.json" if module == "manual" else "entries.json"


def _iter_locale_snapshot_checks(root: Path, tree: str) -> list[tuple[Path, str]]:
    """Discover published/legacy snapshots for any locale (language-neutral)."""
    module_dirs = (
        ("manual", "manual"),
        ("glossary", "glossary"),
        ("knowledge-base", "kb"),
    )
    checks: list[tuple[Path, str]] = []
    for dir_name, module in module_dirs:
        base = root / tree / dir_name
        if not base.is_dir():
            continue
        filename = _module_snapshot_filename(module)
        for locale_dir in sorted(base.iterdir()):
            if locale_dir.is_dir():
                checks.append((locale_dir / filename, module))
    return checks


def root_has_authoritative_published_corpus(root: Path) -> bool:
    checks = _iter_locale_snapshot_checks(root, "published")
    return any(_snapshot_has_corpus(path, module) for path, module in checks)


def root_has_authoritative_content(root: Path) -> bool:
    return root_has_authoritative_editorial_records(root) or root_has_authoritative_published_corpus(root)


def _validate_required_artifact_payloads(root: Path) -> None:
    store_path = root / "editorial" / "content-store.json"
    if store_path.exists() and _load_store_records(root) is None:
        raise RuntimeError(
            "CONTENT_DATA_DIR contains authoritative editorial content but editorial/content-store.json is invalid; "
            "refusing automatic adoption."
        )

    snapshot_checks = _iter_locale_snapshot_checks(root, "published") + _iter_locale_snapshot_checks(
        root, "legacy"
    )
    for path, module in snapshot_checks:
        if not path.is_file():
            continue
        if not _snapshot_has_corpus(path, module):
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                raise RuntimeError(
                    f"CONTENT_DATA_DIR contains authoritative editorial content but {path.name} is invalid; "
                    "refusing automatic adoption."
                ) from exc


def _adopt_authoritative_existing_root(root: Path) -> None:
    missing_artifacts = [
        path
        for path in required_initialization_artifacts(root)
        if path != initialization_marker_path(root) and not path.exists()
    ]
    if missing_artifacts:
        relative_paths = ", ".join(str(path.relative_to(root)).replace("\\", "/") for path in missing_artifacts)
        raise RuntimeError(
            "CONTENT_DATA_DIR contains authoritative editorial content but required artifacts are missing "
            f"({relative_paths}); refusing initialization."
        )

    _validate_required_artifact_payloads(root)
    _ensure_website_artifacts(root)
    _write_initialization_marker(root)


def strict_content_root_required() -> bool:
    return os.environ.get("REQUIRE_CONTENT_DATA_DIR", "").strip() == "1"


def default_content_root() -> Path:
    return Path(os.environ.get("CONTENT_DATA_DIR", Path(__file__).resolve().parents[2] / "data"))


COMMERCIAL_DATA_DIR_ENV = "COMMERCIAL_DATA_DIR"


def commercial_data_root() -> Path:
    """Root for durable commercial/user filesystem state (entitlements, preferences).

    Resolution order:
    1. COMMERCIAL_DATA_DIR when set and non-blank;
    2. otherwise the editorial content root (`CONTENT_DATA_DIR` or local `backend/data`).
    """
    configured = os.environ.get(COMMERCIAL_DATA_DIR_ENV, "").strip()
    if configured:
        return Path(configured)
    return default_content_root()


def validate_strict_content_root(root: Path) -> None:
    configured = os.environ.get("CONTENT_DATA_DIR", "").strip()
    if not configured:
        raise RuntimeError(
            "CONTENT_DATA_DIR must be set when REQUIRE_CONTENT_DATA_DIR=1."
        )
    if not root.exists():
        raise RuntimeError(
            f"Configured CONTENT_DATA_DIR does not exist: {root}"
        )
    if not root.is_dir():
        raise RuntimeError(
            f"Configured CONTENT_DATA_DIR is not a directory: {root}"
        )

    try:
        with tempfile.NamedTemporaryFile(dir=root, prefix=".hfzwood-write-check-", delete=True):
            pass
    except OSError as exc:
        raise RuntimeError(
            f"Configured CONTENT_DATA_DIR is not writable: {root}"
        ) from exc


def required_release_artifacts(root: Path) -> list[Path]:
    """Artifacts required for EDITORIAL_CONTENT_MODE=release packaged corpus startup."""
    return [
        root / "editorial" / "content-store.json",
        root / "published" / "manual" / "en" / "document.json",
        root / "published" / "glossary" / "en" / "entries.json",
        root / "published" / "knowledge-base" / "en" / "entries.json",
        root / "published" / "website" / "en" / "pages.json",
        root / "config" / "public-languages.json",
    ]


def validate_release_editorial_root(root: Path) -> None:
    """Validate a packaged editorial corpus for release mode (read-only; no seeding)."""
    if not root.exists():
        raise RuntimeError(
            f"Release editorial root does not exist: {root}"
        )
    if not root.is_dir():
        raise RuntimeError(
            f"Release editorial root is not a directory: {root}"
        )

    for path in required_release_artifacts(root):
        relative = str(path.relative_to(root)).replace("\\", "/")
        if not path.exists():
            raise RuntimeError(
                f"Release editorial root is missing required artifact: {relative}"
            )
        if not path.is_file():
            raise RuntimeError(
                f"Release editorial required artifact is not a file: {relative}"
            )
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as exc:
            raise RuntimeError(
                f"Release editorial required artifact could not be read: {relative}"
            ) from exc
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                f"Release editorial required artifact contains invalid JSON: {relative}"
            ) from exc

        if relative == "editorial/content-store.json":
            if not isinstance(payload, dict) or not isinstance(payload.get("records"), dict):
                raise RuntimeError(
                    "Release editorial required artifact editorial/content-store.json "
                    "must be a JSON object with a records object."
                )
        elif not isinstance(payload, dict):
            raise RuntimeError(
                f"Release editorial required artifact must be a JSON object: {relative}"
            )


def seed_data_root() -> Path:
    return Path(__file__).resolve().parents[2] / "seed-data"


def _load_seed_dataset(filename: str, fallback_loader) -> list[dict]:
    seed_path = seed_data_root() / filename
    if seed_path.is_file():
        payload = json.loads(seed_path.read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            raise ValueError(f"Seed dataset must be an array: {seed_path}")
        return payload
    return fallback_loader()


def _build_manual_legacy_document() -> dict[str, Any]:
    return {
        "locale": "en",
        "sections": _load_seed_dataset("manual-sections.json", load_manual_sections),
    }


def _build_glossary_legacy_document() -> dict[str, Any]:
    entries = _load_seed_dataset("glossary-entries.json", load_glossary_entries)
    return {
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


def _build_knowledge_base_legacy_document() -> dict[str, Any]:
    entries = _load_seed_dataset("knowledge-base-entries.json", load_knowledge_base_entries)
    return {
        "locale": "en",
        "entries": [
            {
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
            for entry in entries
        ],
    }


# Transient Windows/local file-access contention (replace and store open/read).
TRANSIENT_FILE_ACCESS_MAX_ATTEMPTS = 7
TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS = (0.05, 0.10, 0.20, 0.40, 0.80, 1.00)
# Backward-compatible aliases for callers/tests that referred to replace-only names.
ATOMIC_REPLACE_MAX_ATTEMPTS = TRANSIENT_FILE_ACCESS_MAX_ATTEMPTS
ATOMIC_REPLACE_RETRY_DELAYS_SECONDS = TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS
_WINERROR_ACCESS_DENIED = 5
_WINERROR_SHARING_VIOLATION = 32

_T = TypeVar("_T")


def _is_retryable_transient_file_access_error(exc: BaseException) -> bool:
    """Return True only for transient access/sharing failures safe to retry."""
    if not isinstance(exc, OSError):
        return False
    winerror = getattr(exc, "winerror", None)
    if winerror in (_WINERROR_ACCESS_DENIED, _WINERROR_SHARING_VIOLATION):
        return True
    if getattr(exc, "errno", None) in (errno.EACCES, errno.EPERM):
        return True
    return False


def _retry_transient_file_access(
    operation: Callable[[], _T],
    *,
    sleep: Callable[[float], None] | None = None,
) -> _T:
    """Run a filesystem operation with bounded retry for transient access errors."""
    sleeper = sleep if sleep is not None else time.sleep
    last_error: OSError | None = None
    for attempt in range(1, TRANSIENT_FILE_ACCESS_MAX_ATTEMPTS + 1):
        try:
            return operation()
        except OSError as exc:
            last_error = exc
            if (
                not _is_retryable_transient_file_access_error(exc)
                or attempt >= TRANSIENT_FILE_ACCESS_MAX_ATTEMPTS
            ):
                raise
            sleeper(TRANSIENT_FILE_ACCESS_RETRY_DELAYS_SECONDS[attempt - 1])
    assert last_error is not None
    raise last_error


def atomic_write_json(
    path: Path,
    payload: dict[str, Any],
    *,
    sleep: Callable[[float], None] | None = None,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.tmp-",
            delete=False,
        ) as handle:
            json.dump(payload, handle, indent=2, sort_keys=True)
            handle.flush()
            os.fsync(handle.fileno())
            temp_path = Path(handle.name)

        _retry_transient_file_access(
            lambda: os.replace(temp_path, path),
            sleep=sleep,
        )
        # replace() moves the temp file into place; skip cleanup unlink.
        temp_path = None
    finally:
        if temp_path is not None and temp_path.exists():
            temp_path.unlink()


def initialization_marker_path(root: Path) -> Path:
    return root / INITIALIZATION_MARKER


def required_initialization_artifacts(root: Path) -> list[Path]:
    return [
        root / "editorial" / "content-store.json",
        root / "published" / "manual" / "en" / "document.json",
        root / "published" / "glossary" / "en" / "entries.json",
        root / "published" / "knowledge-base" / "en" / "entries.json",
        root / "published" / "website" / "en" / "pages.json",
        root / "legacy" / "manual" / "en" / "document.json",
        root / "legacy" / "glossary" / "en" / "entries.json",
        root / "legacy" / "knowledge-base" / "en" / "entries.json",
        initialization_marker_path(root),
    ]


def is_fully_initialized(root: Path) -> bool:
    return all(path.exists() for path in required_initialization_artifacts(root))


def _recognized_root_entry_names() -> set[str]:
    return {"editorial", "published", "legacy", INITIALIZATION_MARKER}


def _existing_root_entries(root: Path) -> list[Path]:
    return [
        entry
        for entry in root.iterdir()
        if not entry.name.startswith(".hfzwood-write-check-")
        and not entry.name.startswith(".hfzwood-init-")
    ]


def _is_recognized_incomplete_entry(entry: Path) -> bool:
    return entry.name in _recognized_root_entry_names()


def _safe_remove_path(path: Path) -> None:
    if not path.exists():
        return
    if path.is_symlink():
        path.unlink()
        return
    if path.is_dir():
        shutil.rmtree(path)
        return
    path.unlink()


def _remove_recognized_initialization_artifacts(root: Path) -> None:
    if root_has_authoritative_content(root):
        raise RuntimeError(
            "Configured CONTENT_DATA_DIR contains authoritative editorial content; "
            "refusing to remove initialization artifacts."
        )

    for name in ("editorial", "published", "legacy"):
        _safe_remove_path(root / name)
    _safe_remove_path(initialization_marker_path(root))


def _build_legacy_compatibility_documents(repository: "FilesystemContentRepository") -> None:
    repository.write_legacy_manual_document("en", _build_manual_legacy_document())
    repository.write_legacy_glossary_document("en", _build_glossary_legacy_document())
    repository.write_legacy_kb_document("en", _build_knowledge_base_legacy_document())


def _seed_canonical_editorial_content(repository: "FilesystemContentRepository") -> None:
    from content.services.migrate_phase2_glossary import EditorialGlossaryMigrationService
    from content.services.migrate_phase2_knowledge_base import EditorialKnowledgeBaseMigrationService
    from content.services.migrate_phase2_manual import EditorialManualMigrationService

    EditorialManualMigrationService(repository).migrate()
    EditorialGlossaryMigrationService(repository).migrate()
    EditorialKnowledgeBaseMigrationService(repository).migrate()
    repository.ensure_website_pages_exist()


def _ensure_website_artifacts(root: Path) -> None:
    repository = FilesystemContentRepository(root)
    repository.ensure_website_pages_exist()


def _write_initialization_marker(root: Path) -> None:
    atomic_write_json(
        initialization_marker_path(root),
        {
            "version": 1,
            "artifacts": [
                str(path.relative_to(root)).replace("\\", "/")
                for path in required_initialization_artifacts(root)
                if path != initialization_marker_path(root)
            ],
        },
    )


def initialize_production_content_root(root: Path) -> None:
    validate_strict_content_root(root)
    if is_fully_initialized(root):
        return

    if root_has_authoritative_content(root):
        _adopt_authoritative_existing_root(root)
        return

    existing_entries = _existing_root_entries(root)
    if existing_entries and not all(_is_recognized_incomplete_entry(entry) for entry in existing_entries):
        raise RuntimeError(
            "Configured CONTENT_DATA_DIR is not empty but is not a recognized incomplete initialization state; "
            "refusing initialization."
        )

    if existing_entries:
        _remove_recognized_initialization_artifacts(root)

    staging_dir = Path(tempfile.mkdtemp(prefix=".hfzwood-init-", dir=root))
    created_targets: list[Path] = []
    try:
        repository = FilesystemContentRepository(staging_dir)
        _seed_canonical_editorial_content(repository)
        _build_legacy_compatibility_documents(repository)
        _write_initialization_marker(staging_dir)

        for name in ("editorial", "published", "legacy", INITIALIZATION_MARKER):
            source = staging_dir / name
            target = root / name
            os.replace(source, target)
            created_targets.append(target)
    except Exception:
        for target in reversed(created_targets):
            if target.exists():
                if target.is_dir():
                    shutil.rmtree(target, ignore_errors=True)
                else:
                    target.unlink()
        raise
    finally:
        shutil.rmtree(staging_dir, ignore_errors=True)


class FilesystemContentRepository:
    def __init__(self, data_dir: Path | None = None) -> None:
        from content.editorial_content_mode import (
            EDITORIAL_CONTENT_MODE_RELEASE,
            editorial_content_mode,
        )

        root = Path(data_dir) if data_dir is not None else default_content_root()
        if editorial_content_mode() == EDITORIAL_CONTENT_MODE_RELEASE:
            # Packaged release corpus: validate only — never seed, mkdir, or write.
            validate_release_editorial_root(root)
            self._root = root
            self._editorial_dir = self._root / "editorial"
            self._published_dir = self._root / "published"
            self._store_path = self._editorial_dir / "content-store.json"
            return

        strict_root = data_dir is None and strict_content_root_required()
        if strict_root:
            initialize_production_content_root(root)
        self._root = root
        self._editorial_dir = self._root / "editorial"
        self._published_dir = self._root / "published"
        self._store_path = self._editorial_dir / "content-store.json"
        if not strict_root:
            self._root.mkdir(parents=True, exist_ok=True)
        self._editorial_dir.mkdir(parents=True, exist_ok=True)
        self._published_dir.mkdir(parents=True, exist_ok=True)
        if not self._store_path.exists():
            self._write_store({})
        self.ensure_website_pages_exist()

    def ensure_website_pages_exist(self) -> dict[str, Any]:
        """Ensure fixed website pages exist; return the in-memory store used for the check."""
        records = self._read_store()
        now = utc_now()
        changed = False

        for page in WEBSITE_PAGE_DEFINITIONS:
            page_key = page["pageKey"]
            if _meta_exists(
                records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key
            ):
                continue

            meta = {
                "pk": f"CONTENT#{page_key}",
                "sk": "META",
                "contentId": page_key,
                "contentType": CONTENT_TYPE_WEBSITE_PAGE,
                "pageKey": page_key,
                "slug": page["slug"],
                "adminLabel": page["adminLabel"],
                "pageKind": page["pageKind"],
                "sortOrder": page["sortOrder"],
                "createdAt": isoformat(now),
                "updatedAt": isoformat(now),
            }
            variant = {
                "pk": f"CONTENT#{page_key}",
                "sk": f"VARIANT#{DEFAULT_LOCALE}",
                "contentId": page_key,
                "locale": DEFAULT_LOCALE,
                "status": "draft",
                "draftBody": empty_website_draft_body(page["pageKind"]),
                "updatedAt": isoformat(now),
                "publishedAt": None,
                "snapshotKey": None,
                **initial_translation_metadata_on_create(DEFAULT_LOCALE),
            }
            records[make_website_meta_key(page_key)] = meta
            records[make_website_variant_key(page_key, DEFAULT_LOCALE)] = variant
            changed = True

        if changed:
            self._write_store(records)

        snapshot_path = self._root / "published" / "website" / "en" / "pages.json"
        if not snapshot_path.exists():
            snapshot_path.parent.mkdir(parents=True, exist_ok=True)
            atomic_write_json(snapshot_path, empty_website_snapshot_document("en"))

        return records

    def _read_store(self) -> dict[str, Any]:
        if not self._store_path.exists():
            return {}

        def read_store_text() -> str:
            with self._store_path.open("r", encoding="utf-8") as handle:
                return handle.read()

        # Retry only transient open/read access failures — not JSON parse errors.
        text = _retry_transient_file_access(read_store_text)
        payload = json.loads(text)
        return payload.get("records", {})

    def _write_store(self, records: dict[str, Any]) -> None:
        atomic_write_json(self._store_path, {"records": records})

    def _get_record(self, records: dict[str, Any], key: str) -> dict[str, Any] | None:
        record = records.get(key)
        return deepcopy(record) if record is not None else None

    def _set_record(self, records: dict[str, Any], key: str, value: dict[str, Any] | None) -> None:
        if value is None:
            records.pop(key, None)
        else:
            records[key] = value

    def _persist_typed_meta(
        self,
        records: dict[str, Any],
        content_id: str,
        content_type: str,
        make_typed_meta_key,
        meta: dict[str, Any],
    ) -> str:
        typed_key = make_typed_meta_key(content_id)
        records[typed_key] = meta
        return typed_key

    def _persist_typed_variant(
        self,
        records: dict[str, Any],
        content_id: str,
        locale: str,
        content_type: str,
        make_typed_variant_key,
        make_typed_meta_key,
        variant: dict[str, Any],
    ) -> str:
        typed_key = make_typed_variant_key(content_id, locale)
        records[typed_key] = variant
        return typed_key

    def _finalize_typed_record_migration(
        self,
        records: dict[str, Any],
        content_id: str,
        content_type: str,
    ) -> None:
        _migrate_legacy_keys_for_content(records, content_id, content_type)

    def _collect_content_keys_for_deletion(
        self,
        records: dict[str, Any],
        content_id: str,
        content_type: str,
        typed_prefix: str,
    ) -> list[str]:
        keys = [key for key in records if key.startswith(typed_prefix)]
        legacy_meta_key = make_legacy_meta_key(content_id)
        legacy_meta = records.get(legacy_meta_key)
        if legacy_meta and legacy_meta.get("contentType") == content_type:
            keys.append(legacy_meta_key)
            legacy_prefix = f"CONTENT#{content_id}|"
            keys.extend(key for key in records if key.startswith(legacy_prefix))
        return list(dict.fromkeys(keys))

    def list_manual_chapter_ids(self) -> list[str]:
        return self.list_manual_chapter_ids_from_store(self._read_store())

    def get_manual_chapter_meta(self, content_id: str) -> dict[str, Any] | None:
        return self.get_manual_chapter_meta_from_store(self._read_store(), content_id)

    def get_manual_variant(self, content_id: str, locale: str) -> dict[str, Any] | None:
        return self.get_manual_variant_from_store(self._read_store(), content_id, locale)

    def create_manual_chapter(
        self, title: str, content_id: str | None = None, locale: str = DEFAULT_LOCALE
    ) -> dict[str, Any]:
        records = self._read_store()
        chapter_id = content_id or self._allocate_content_id(records, title, make_manual_meta_key)
        if _meta_exists(records, chapter_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key):
            raise ValueError(f"Chapter already exists: {chapter_id}")

        now = utc_now()
        sort_order = self._next_sort_order(records)
        meta = {
            "pk": f"CONTENT#{chapter_id}",
            "sk": "META",
            "contentId": chapter_id,
            "contentType": CONTENT_TYPE_MANUAL_CHAPTER,
            "sortOrder": sort_order,
            "createdAt": isoformat(now),
            "updatedAt": isoformat(now),
        }
        variant = {
            "pk": f"CONTENT#{chapter_id}",
            "sk": f"VARIANT#{locale}",
            "contentId": chapter_id,
            "locale": locale,
            "status": "draft",
            "draftBody": {
                "title": title.strip(),
                "sections": [
                    {
                        "id": DEFAULT_SECTION_ID,
                        "title": "",
                        "blocks": [],
                    }
                ],
            },
            "updatedAt": isoformat(now),
            "publishedAt": None,
            "snapshotKey": None,
            **initial_translation_metadata_on_create(locale),
        }
        order = {
            "pk": "INDEX#manual",
            "sk": f"ORDER#{sort_order:06d}",
            "contentId": chapter_id,
        }

        records[make_manual_meta_key(chapter_id)] = meta
        records[make_manual_variant_key(chapter_id, locale)] = variant
        records[make_order_key(sort_order)] = order
        self._write_store(records)
        return deepcopy(meta)

    def save_manual_variant(
        self,
        content_id: str,
        locale: str,
        body: dict[str, Any],
        *,
        generation_metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key
        )
        if meta is None:
            raise KeyError(content_id)

        now = utc_now()
        _, existing = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_MANUAL_CHAPTER,
            make_manual_variant_key,
            make_manual_meta_key,
        )
        metadata_fields = (
            generation_metadata
            if generation_metadata is not None
            else apply_translation_metadata_on_save(
                locale=locale,
                new_body=body,
                existing=existing,
                module="manual",
            )
        )
        variant = {
            "pk": f"CONTENT#{content_id}",
            "sk": f"VARIANT#{locale}",
            "contentId": content_id,
            "locale": locale,
            "status": existing["status"] if existing else "draft",
            "draftBody": body,
            "updatedAt": isoformat(now),
            "publishedAt": existing.get("publishedAt") if existing else None,
            "snapshotKey": existing.get("snapshotKey") if existing else None,
            **metadata_fields,
        }
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key, meta
        )
        self._persist_typed_variant(
            records,
            content_id,
            locale,
            CONTENT_TYPE_MANUAL_CHAPTER,
            make_manual_variant_key,
            make_manual_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER
        )
        self._write_store(records)
        return deepcopy(variant)

    def publish_manual_variant(self, content_id: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key
        )
        _, variant = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_MANUAL_CHAPTER,
            make_manual_variant_key,
            make_manual_meta_key,
        )
        if meta is None or variant is None:
            raise KeyError(content_id)
        now = utc_now()
        variant["status"] = "published"
        variant["publishedAt"] = isoformat(now)
        variant["updatedAt"] = isoformat(now)
        variant["snapshotKey"] = f"published/manual/{locale}/document.json"
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key, meta
        )
        self._persist_typed_variant(
            records,
            content_id,
            locale,
            CONTENT_TYPE_MANUAL_CHAPTER,
            make_manual_variant_key,
            make_manual_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER
        )
        self._write_store(records)
        return deepcopy(variant)

    def unpublish_manual_variant(self, content_id: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key
        )
        _, variant = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_MANUAL_CHAPTER,
            make_manual_variant_key,
            make_manual_meta_key,
        )
        if meta is None or variant is None:
            raise KeyError(content_id)
        now = utc_now()
        variant["status"] = "draft"
        variant["updatedAt"] = isoformat(now)
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key, meta
        )
        self._persist_typed_variant(
            records,
            content_id,
            locale,
            CONTENT_TYPE_MANUAL_CHAPTER,
            make_manual_variant_key,
            make_manual_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER
        )
        self._write_store(records)
        return deepcopy(variant)

    def delete_manual_chapter_variant(self, content_id: str, locale: str) -> None:
        normalized = locale.strip().lower()
        if normalized == CANONICAL_EDITORIAL_LOCALE:
            raise ValueError("Cannot delete the canonical Romanian variant in isolation.")
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key
        )
        variant_key, variant = _resolve_variant_key(
            records,
            content_id,
            normalized,
            CONTENT_TYPE_MANUAL_CHAPTER,
            make_manual_variant_key,
            make_manual_meta_key,
        )
        if meta is None or variant is None or variant_key is None:
            raise KeyError(content_id)
        records.pop(variant_key, None)
        self._write_store(records)

    def delete_manual_chapter(self, content_id: str) -> None:
        records = self._read_store()
        if not _meta_exists(records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key):
            raise KeyError(content_id)

        keys_to_delete = self._collect_content_keys_for_deletion(
            records,
            content_id,
            CONTENT_TYPE_MANUAL_CHAPTER,
            f"CONTENT#manual_chapter#{content_id}|",
        )
        order_keys = [
            key
            for key, value in records.items()
            if key.startswith("INDEX#manual|ORDER#") and value.get("contentId") == content_id
        ]
        for key in [*keys_to_delete, *order_keys]:
            records.pop(key, None)
        self._write_store(records)

    def purge_manual_chapters_if_present(self, content_ids: list[str]) -> list[str]:
        removed: list[str] = []
        records = self._read_store()
        for content_id in content_ids:
            if not _meta_exists(records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key):
                continue
            self.delete_manual_chapter(content_id)
            removed.append(content_id)
        return removed

    def reorder_manual_chapters(self, chapter_ids: list[str]) -> None:
        records = self._read_store()
        current_ids = self.list_manual_chapter_ids()
        if sorted(current_ids) != sorted(chapter_ids) or len(current_ids) != len(chapter_ids):
            raise ValueError("Chapter reorder payload must include all chapters exactly once.")

        order_keys = [key for key in records if key.startswith("INDEX#manual|ORDER#")]
        for key in order_keys:
            records.pop(key, None)

        now = utc_now()
        for index, content_id in enumerate(chapter_ids):
            sort_order = (index + 1) * 100
            records[make_order_key(sort_order)] = {
                "pk": "INDEX#manual",
                "sk": f"ORDER#{sort_order:06d}",
                "contentId": content_id,
            }
            _, meta = _resolve_meta_key(
                records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key
            )
            if meta is None:
                raise KeyError(content_id)
            meta["sortOrder"] = sort_order
            meta["updatedAt"] = isoformat(now)
            self._persist_typed_meta(
                records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key, meta
            )
            _migrate_legacy_meta_key(records, content_id, CONTENT_TYPE_MANUAL_CHAPTER)
        self._write_store(records)

    def write_manual_snapshot(self, locale: str, document: dict[str, Any]) -> str:
        snapshot_key = f"published/manual/{locale}/document.json"
        snapshot_path = self._root / snapshot_key
        atomic_write_json(snapshot_path, document)
        return snapshot_key

    def read_manual_snapshot(self, locale: str) -> dict[str, Any] | None:
        snapshot_path = self._root / f"published/manual/{locale}/document.json"
        if not snapshot_path.exists():
            return None
        with snapshot_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def delete_admin_manual_snapshot(self, locale: str) -> None:
        snapshot_path = self._root / f"published/manual/{locale}/document.json"
        if snapshot_path.exists():
            snapshot_path.unlink()

    def save_manual_image(self, filename: str, data: bytes) -> str:
        images_dir = self._root / "manual" / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        image_path = images_dir / filename
        image_path.write_bytes(data)
        return f"/api/content/manual/images/{filename}"

    def get_manual_image_path(self, filename: str) -> Path | None:
        image_path = self._root / "manual" / "images" / filename
        return image_path if image_path.is_file() else None

    def write_legacy_manual_document(self, locale: str, document: dict[str, Any]) -> str:
        snapshot_key = f"legacy/manual/{locale}/document.json"
        snapshot_path = self._root / snapshot_key
        atomic_write_json(snapshot_path, document)
        return snapshot_key

    def read_legacy_manual_document(self, locale: str) -> dict[str, Any] | None:
        snapshot_path = self._root / f"legacy/manual/{locale}/document.json"
        if not snapshot_path.exists():
            return None
        with snapshot_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _allocate_content_id(self, records: dict[str, Any], title: str, meta_key_builder) -> str:
        stem = slugify_title(title)
        if not _meta_exists(records, stem, self._content_type_for_meta_key_builder(meta_key_builder), meta_key_builder):
            return stem
        index = 2
        while _meta_exists(
            records,
            f"{stem}-{index}",
            self._content_type_for_meta_key_builder(meta_key_builder),
            meta_key_builder,
        ):
            index += 1
        return f"{stem}-{index}"

    @staticmethod
    def _content_type_for_meta_key_builder(meta_key_builder) -> str:
        if meta_key_builder is make_manual_meta_key:
            return CONTENT_TYPE_MANUAL_CHAPTER
        if meta_key_builder is make_glossary_meta_key:
            return CONTENT_TYPE_GLOSSARY_ENTRY
        return CONTENT_TYPE_KB_ENTRY

    def _next_sort_order(self, records: dict[str, Any]) -> int:
        orders = []
        for key in records:
            if key.startswith("INDEX#manual|ORDER#"):
                orders.append(int(key.rsplit("#", 1)[-1]))
        return (max(orders) if orders else 0) + 100

    def _next_glossary_sort_order(self, records: dict[str, Any]) -> int:
        orders = []
        for key in records:
            if key.startswith("INDEX#glossary|ORDER#"):
                orders.append(int(key.rsplit("#", 1)[-1]))
        return (max(orders) if orders else 0) + 100

    def read_editorial_records(self) -> dict[str, Any]:
        """Load editorial store records for a single operation.

        Not a cross-request cache. Callers must not mutate the returned mapping.
        """
        return self._read_store()

    def list_glossary_entry_ids_from_store(self, records: dict[str, Any]) -> list[str]:
        ordered: list[tuple[int, str]] = []
        for key, value in records.items():
            if not key.startswith("INDEX#glossary|ORDER#"):
                continue
            sort_order = int(key.rsplit("#", 1)[-1])
            ordered.append((sort_order, value["contentId"]))
        ordered.sort(key=lambda item: item[0])
        return [content_id for _, content_id in ordered]

    def get_glossary_entry_meta_from_store(
        self, records: dict[str, Any], content_id: str
    ) -> dict[str, Any] | None:
        _, record = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key
        )
        return deepcopy(record) if record is not None else None

    def get_glossary_variant_from_store(
        self, records: dict[str, Any], content_id: str, locale: str
    ) -> dict[str, Any] | None:
        _, meta = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key
        )
        if not meta:
            return None
        _, record = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_GLOSSARY_ENTRY,
            make_glossary_variant_key,
            make_glossary_meta_key,
        )
        return deepcopy(record) if record is not None else None

    def get_manual_variant_from_store(
        self, records: dict[str, Any], content_id: str, locale: str
    ) -> dict[str, Any] | None:
        _, record = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_MANUAL_CHAPTER,
            make_manual_variant_key,
            make_manual_meta_key,
        )
        return deepcopy(record) if record is not None else None

    def list_manual_chapter_ids_from_store(self, records: dict[str, Any]) -> list[str]:
        ordered: list[tuple[int, str]] = []
        for key, value in records.items():
            if not key.startswith("INDEX#manual|ORDER#"):
                continue
            sort_order = int(key.rsplit("#", 1)[-1])
            ordered.append((sort_order, value["contentId"]))
        ordered.sort(key=lambda item: item[0])
        return [content_id for _, content_id in ordered]

    def get_manual_chapter_meta_from_store(
        self, records: dict[str, Any], content_id: str
    ) -> dict[str, Any] | None:
        _, record = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_MANUAL_CHAPTER, make_manual_meta_key
        )
        return deepcopy(record) if record is not None else None

    def list_kb_entry_ids_from_store(self, records: dict[str, Any]) -> list[str]:
        ordered: list[tuple[int, str]] = []
        for key, value in records.items():
            if not key.startswith("INDEX#kb|ORDER#"):
                continue
            sort_order = int(key.rsplit("#", 1)[-1])
            ordered.append((sort_order, value["contentId"]))
        ordered.sort(key=lambda item: item[0])
        return [content_id for _, content_id in ordered]

    def get_kb_entry_meta_from_store(
        self, records: dict[str, Any], content_id: str
    ) -> dict[str, Any] | None:
        _, record = _resolve_meta_key(records, content_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key)
        return deepcopy(record) if record is not None else None

    def get_kb_variant_from_store(
        self, records: dict[str, Any], content_id: str, locale: str
    ) -> dict[str, Any] | None:
        _, meta = _resolve_meta_key(records, content_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key)
        if not meta:
            return None
        _, record = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_KB_ENTRY,
            make_kb_variant_key,
            make_kb_meta_key,
        )
        return deepcopy(record) if record is not None else None

    def list_website_page_ids_from_store(self, records: dict[str, Any]) -> list[str]:
        ordered: list[tuple[int, str]] = []
        for key, value in records.items():
            if not key.startswith("CONTENT#website_page#") or not key.endswith("|META"):
                continue
            sort_order = int(value.get("sortOrder", 0))
            ordered.append((sort_order, value["pageKey"]))
        ordered.sort(key=lambda item: item[0])
        return [page_key for _, page_key in ordered]

    def get_website_page_meta_from_store(
        self, records: dict[str, Any], page_key: str
    ) -> dict[str, Any] | None:
        if page_key not in WEBSITE_PAGE_KEYS:
            return None
        _, meta = _resolve_meta_key(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key
        )
        return deepcopy(meta) if meta is not None else None

    def get_website_variant_from_store(
        self, records: dict[str, Any], page_key: str, locale: str
    ) -> dict[str, Any] | None:
        if page_key not in WEBSITE_PAGE_KEYS:
            return None
        if not _meta_exists(records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key):
            return None
        _, record = _resolve_variant_key(
            records,
            page_key,
            locale,
            CONTENT_TYPE_WEBSITE_PAGE,
            make_website_variant_key,
            make_website_meta_key,
        )
        return deepcopy(record) if record is not None else None

    def list_glossary_entry_ids(self) -> list[str]:
        return self.list_glossary_entry_ids_from_store(self._read_store())

    def get_glossary_entry_meta(self, content_id: str) -> dict[str, Any] | None:
        return self.get_glossary_entry_meta_from_store(self._read_store(), content_id)

    def get_glossary_variant(self, content_id: str, locale: str) -> dict[str, Any] | None:
        return self.get_glossary_variant_from_store(self._read_store(), content_id, locale)

    def create_glossary_entry(self, term: str, content_id: str | None = None) -> dict[str, Any]:
        records = self._read_store()
        entry_id = content_id or self._allocate_content_id(records, term, make_glossary_meta_key)
        if _meta_exists(records, entry_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key):
            raise ValueError(f"Glossary entry already exists: {entry_id}")

        now = utc_now()
        sort_order = self._next_glossary_sort_order(records)
        meta = {
            "pk": f"CONTENT#{entry_id}",
            "sk": "META",
            "contentId": entry_id,
            "contentType": CONTENT_TYPE_GLOSSARY_ENTRY,
            "sortOrder": sort_order,
            "createdAt": isoformat(now),
            "updatedAt": isoformat(now),
        }
        variant = {
            "pk": f"CONTENT#{entry_id}",
            "sk": f"VARIANT#{DEFAULT_LOCALE}",
            "contentId": entry_id,
            "locale": DEFAULT_LOCALE,
            "status": "draft",
            "draftBody": {
                "term": term.strip(),
                "definitionBlocks": [],
                "media": [],
                "relatedTermIds": [],
                "synonymTermIds": [],
                "seeAlso": [],
            },
            "updatedAt": isoformat(now),
            "publishedAt": None,
            "snapshotKey": None,
            **initial_translation_metadata_on_create(DEFAULT_LOCALE),
        }
        order = {
            "pk": "INDEX#glossary",
            "sk": f"ORDER#{sort_order:06d}",
            "contentId": entry_id,
        }

        records[make_glossary_meta_key(entry_id)] = meta
        records[make_glossary_variant_key(entry_id, DEFAULT_LOCALE)] = variant
        records[make_glossary_order_key(sort_order)] = order
        self._write_store(records)
        return deepcopy(meta)

    def save_glossary_variant(
        self,
        content_id: str,
        locale: str,
        body: dict[str, Any],
        *,
        generation_metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key
        )
        if meta is None:
            raise KeyError(content_id)

        now = utc_now()
        _, existing = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_GLOSSARY_ENTRY,
            make_glossary_variant_key,
            make_glossary_meta_key,
        )
        metadata_fields = (
            generation_metadata
            if generation_metadata is not None
            else apply_translation_metadata_on_save(
                locale=locale,
                new_body=body,
                existing=existing,
                module="glossary",
            )
        )
        variant = {
            "pk": f"CONTENT#{content_id}",
            "sk": f"VARIANT#{locale}",
            "contentId": content_id,
            "locale": locale,
            "status": existing["status"] if existing else "draft",
            "draftBody": body,
            "updatedAt": isoformat(now),
            "publishedAt": existing.get("publishedAt") if existing else None,
            "snapshotKey": existing.get("snapshotKey") if existing else None,
            **metadata_fields,
        }
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key, meta
        )
        self._persist_typed_variant(
            records,
            content_id,
            locale,
            CONTENT_TYPE_GLOSSARY_ENTRY,
            make_glossary_variant_key,
            make_glossary_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY
        )
        self._write_store(records)
        return deepcopy(variant)

    def publish_glossary_variant(self, content_id: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key
        )
        _, variant = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_GLOSSARY_ENTRY,
            make_glossary_variant_key,
            make_glossary_meta_key,
        )
        if meta is None or variant is None:
            raise KeyError(content_id)
        now = utc_now()
        variant["status"] = "published"
        variant["publishedAt"] = isoformat(now)
        variant["updatedAt"] = isoformat(now)
        variant["snapshotKey"] = f"published/glossary/{locale}/entries.json"
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key, meta
        )
        self._persist_typed_variant(
            records,
            content_id,
            locale,
            CONTENT_TYPE_GLOSSARY_ENTRY,
            make_glossary_variant_key,
            make_glossary_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY
        )
        self._write_store(records)
        return deepcopy(variant)

    def unpublish_glossary_variant(self, content_id: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key
        )
        _, variant = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_GLOSSARY_ENTRY,
            make_glossary_variant_key,
            make_glossary_meta_key,
        )
        if meta is None or variant is None:
            raise KeyError(content_id)
        now = utc_now()
        variant["status"] = "draft"
        variant["updatedAt"] = isoformat(now)
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key, meta
        )
        self._persist_typed_variant(
            records,
            content_id,
            locale,
            CONTENT_TYPE_GLOSSARY_ENTRY,
            make_glossary_variant_key,
            make_glossary_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY
        )
        self._write_store(records)
        return deepcopy(variant)

    def delete_glossary_entry_variant(self, content_id: str, locale: str) -> None:
        normalized = locale.strip().lower()
        if normalized == CANONICAL_EDITORIAL_LOCALE:
            raise ValueError("Cannot delete the canonical Romanian variant in isolation.")
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key
        )
        variant_key, variant = _resolve_variant_key(
            records,
            content_id,
            normalized,
            CONTENT_TYPE_GLOSSARY_ENTRY,
            make_glossary_variant_key,
            make_glossary_meta_key,
        )
        if meta is None or variant is None or variant_key is None:
            raise KeyError(content_id)
        records.pop(variant_key, None)
        self._write_store(records)

    def delete_glossary_entry(self, content_id: str) -> None:
        records = self._read_store()
        if not _meta_exists(records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key):
            raise KeyError(content_id)

        keys_to_delete = self._collect_content_keys_for_deletion(
            records,
            content_id,
            CONTENT_TYPE_GLOSSARY_ENTRY,
            f"CONTENT#glossary_entry#{content_id}|",
        )
        order_keys = [
            key
            for key, value in records.items()
            if key.startswith("INDEX#glossary|ORDER#") and value.get("contentId") == content_id
        ]
        for key in [*keys_to_delete, *order_keys]:
            records.pop(key, None)
        self._write_store(records)

    def purge_glossary_entries_if_present(self, content_ids: list[str]) -> list[str]:
        removed: list[str] = []
        records = self._read_store()
        for content_id in content_ids:
            if not _meta_exists(records, content_id, CONTENT_TYPE_GLOSSARY_ENTRY, make_glossary_meta_key):
                continue
            self.delete_glossary_entry(content_id)
            removed.append(content_id)
        return removed

    def write_glossary_snapshot(self, locale: str, document: dict[str, Any]) -> str:
        snapshot_key = f"published/glossary/{locale}/entries.json"
        snapshot_path = self._root / snapshot_key
        atomic_write_json(snapshot_path, document)
        return snapshot_key

    def read_glossary_snapshot(self, locale: str) -> dict[str, Any] | None:
        snapshot_path = self._root / f"published/glossary/{locale}/entries.json"
        if not snapshot_path.exists():
            return None
        with snapshot_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def delete_admin_glossary_snapshot(self, locale: str) -> None:
        snapshot_path = self._root / f"published/glossary/{locale}/entries.json"
        if snapshot_path.exists():
            snapshot_path.unlink()

    def save_glossary_image(self, filename: str, data: bytes) -> str:
        images_dir = self._root / "glossary" / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        image_path = images_dir / filename
        image_path.write_bytes(data)
        return f"/api/content/glossary/images/{filename}"

    def get_glossary_image_path(self, filename: str) -> Path | None:
        image_path = self._root / "glossary" / "images" / filename
        return image_path if image_path.is_file() else None

    def write_legacy_glossary_document(self, locale: str, document: dict[str, Any]) -> str:
        snapshot_key = f"legacy/glossary/{locale}/entries.json"
        snapshot_path = self._root / snapshot_key
        atomic_write_json(snapshot_path, document)
        return snapshot_key

    def read_legacy_glossary_document(self, locale: str) -> dict[str, Any] | None:
        snapshot_path = self._root / f"legacy/glossary/{locale}/entries.json"
        if not snapshot_path.exists():
            return None
        with snapshot_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _next_kb_sort_order(self, records: dict[str, Any]) -> int:
        orders = []
        for key in records:
            if key.startswith("INDEX#kb|ORDER#"):
                orders.append(int(key.rsplit("#", 1)[-1]))
        return (max(orders) if orders else 0) + 100

    def list_kb_entry_ids(self) -> list[str]:
        return self.list_kb_entry_ids_from_store(self._read_store())

    def get_kb_entry_meta(self, content_id: str) -> dict[str, Any] | None:
        return self.get_kb_entry_meta_from_store(self._read_store(), content_id)

    def get_kb_variant(self, content_id: str, locale: str) -> dict[str, Any] | None:
        return self.get_kb_variant_from_store(self._read_store(), content_id, locale)

    def create_kb_entry(
        self,
        title: str,
        category: str,
        difficulty: str,
        content_id: str | None = None,
    ) -> dict[str, Any]:
        records = self._read_store()
        entry_id = content_id or self._allocate_content_id(records, title, make_kb_meta_key)
        if _meta_exists(records, entry_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key):
            raise ValueError(f"Knowledge Base entry already exists: {entry_id}")

        now = utc_now()
        sort_order = self._next_kb_sort_order(records)
        meta = {
            "pk": f"CONTENT#{entry_id}",
            "sk": "META",
            "contentId": entry_id,
            "contentType": CONTENT_TYPE_KB_ENTRY,
            "category": category,
            "difficulty": difficulty,
            "sortOrder": sort_order,
            "createdAt": isoformat(now),
            "updatedAt": isoformat(now),
        }
        variant = {
            "pk": f"CONTENT#{entry_id}",
            "sk": f"VARIANT#{DEFAULT_LOCALE}",
            "contentId": entry_id,
            "locale": DEFAULT_LOCALE,
            "status": "draft",
            "draftBody": self._empty_kb_variant_body(title.strip()),
            "updatedAt": isoformat(now),
            "publishedAt": None,
            "snapshotKey": None,
            **initial_translation_metadata_on_create(DEFAULT_LOCALE),
        }
        order = {
            "pk": "INDEX#kb",
            "sk": f"ORDER#{sort_order:06d}",
            "contentId": entry_id,
        }

        records[make_kb_meta_key(entry_id)] = meta
        records[make_kb_variant_key(entry_id, DEFAULT_LOCALE)] = variant
        records[make_kb_order_key(sort_order)] = order
        self._write_store(records)
        return deepcopy(meta)

    @staticmethod
    def _empty_kb_variant_body(title: str = "") -> dict[str, Any]:
        return {
            "title": title,
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
            "bodyBlocks": [],
            "media": [],
            "relatedKbEntryIds": [],
            "relatedGlossaryEntryIds": [],
            "relatedManualChapterIds": [],
        }

    def save_kb_variant(
        self,
        content_id: str,
        locale: str,
        body: dict[str, Any],
        category: str,
        difficulty: str,
        *,
        generation_metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(records, content_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key)
        if meta is None:
            raise KeyError(content_id)

        now = utc_now()
        _, existing = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_KB_ENTRY,
            make_kb_variant_key,
            make_kb_meta_key,
        )
        metadata_fields = (
            generation_metadata
            if generation_metadata is not None
            else apply_translation_metadata_on_save(
                locale=locale,
                new_body=body,
                existing=existing,
                module="knowledge_base",
            )
        )
        variant = {
            "pk": f"CONTENT#{content_id}",
            "sk": f"VARIANT#{locale}",
            "contentId": content_id,
            "locale": locale,
            "status": existing["status"] if existing else "draft",
            "draftBody": body,
            "updatedAt": isoformat(now),
            "publishedAt": existing.get("publishedAt") if existing else None,
            "snapshotKey": existing.get("snapshotKey") if existing else None,
            **metadata_fields,
        }
        meta["category"] = category
        meta["difficulty"] = difficulty
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(records, content_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key, meta)
        self._persist_typed_variant(
            records,
            content_id,
            locale,
            CONTENT_TYPE_KB_ENTRY,
            make_kb_variant_key,
            make_kb_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(records, content_id, CONTENT_TYPE_KB_ENTRY)
        self._write_store(records)
        return deepcopy(variant)

    def publish_kb_variant(self, content_id: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(records, content_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key)
        _, variant = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_KB_ENTRY,
            make_kb_variant_key,
            make_kb_meta_key,
        )
        if meta is None or variant is None:
            raise KeyError(content_id)
        now = utc_now()
        variant["status"] = "published"
        variant["publishedAt"] = isoformat(now)
        variant["updatedAt"] = isoformat(now)
        variant["snapshotKey"] = f"published/knowledge-base/{locale}/entries.json"
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(records, content_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key, meta)
        self._persist_typed_variant(
            records,
            content_id,
            locale,
            CONTENT_TYPE_KB_ENTRY,
            make_kb_variant_key,
            make_kb_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(records, content_id, CONTENT_TYPE_KB_ENTRY)
        self._write_store(records)
        return deepcopy(variant)

    def unpublish_kb_variant(self, content_id: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(records, content_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key)
        _, variant = _resolve_variant_key(
            records,
            content_id,
            locale,
            CONTENT_TYPE_KB_ENTRY,
            make_kb_variant_key,
            make_kb_meta_key,
        )
        if meta is None or variant is None:
            raise KeyError(content_id)
        now = utc_now()
        variant["status"] = "draft"
        variant["updatedAt"] = isoformat(now)
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(records, content_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key, meta)
        self._persist_typed_variant(
            records,
            content_id,
            locale,
            CONTENT_TYPE_KB_ENTRY,
            make_kb_variant_key,
            make_kb_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(records, content_id, CONTENT_TYPE_KB_ENTRY)
        self._write_store(records)
        return deepcopy(variant)

    def delete_kb_entry_variant(self, content_id: str, locale: str) -> None:
        normalized = locale.strip().lower()
        if normalized == CANONICAL_EDITORIAL_LOCALE:
            raise ValueError("Cannot delete the canonical Romanian variant in isolation.")
        records = self._read_store()
        _, meta = _resolve_meta_key(records, content_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key)
        variant_key, variant = _resolve_variant_key(
            records,
            content_id,
            normalized,
            CONTENT_TYPE_KB_ENTRY,
            make_kb_variant_key,
            make_kb_meta_key,
        )
        if meta is None or variant is None or variant_key is None:
            raise KeyError(content_id)
        records.pop(variant_key, None)
        self._write_store(records)

    def delete_kb_entry(self, content_id: str) -> None:
        records = self._read_store()
        if not _meta_exists(records, content_id, CONTENT_TYPE_KB_ENTRY, make_kb_meta_key):
            raise KeyError(content_id)

        keys_to_delete = self._collect_content_keys_for_deletion(
            records,
            content_id,
            CONTENT_TYPE_KB_ENTRY,
            f"CONTENT#kb_entry#{content_id}|",
        )
        order_keys = [
            key
            for key, value in records.items()
            if key.startswith("INDEX#kb|ORDER#") and value.get("contentId") == content_id
        ]
        for key in [*keys_to_delete, *order_keys]:
            records.pop(key, None)
        self._write_store(records)

    def purge_kb_entries_if_present(self, content_ids: list[str]) -> list[str]:
        removed: list[str] = []
        for content_id in content_ids:
            meta = self.get_kb_entry_meta(content_id)
            if not meta:
                continue
            self.delete_kb_entry(content_id)
            removed.append(content_id)
        return removed

    def write_kb_snapshot(self, locale: str, document: dict[str, Any]) -> str:
        snapshot_key = f"published/knowledge-base/{locale}/entries.json"
        snapshot_path = self._root / snapshot_key
        atomic_write_json(snapshot_path, document)
        return snapshot_key

    def read_kb_snapshot(self, locale: str) -> dict[str, Any] | None:
        snapshot_path = self._root / f"published/knowledge-base/{locale}/entries.json"
        if not snapshot_path.exists():
            return None
        with snapshot_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def delete_admin_kb_snapshot(self, locale: str) -> None:
        snapshot_path = self._root / f"published/knowledge-base/{locale}/entries.json"
        if snapshot_path.exists():
            snapshot_path.unlink()

    def save_kb_image(self, filename: str, data: bytes) -> str:
        images_dir = self._root / "knowledge-base" / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        image_path = images_dir / filename
        image_path.write_bytes(data)
        return f"/api/content/knowledge-base/images/{filename}"

    def get_kb_image_path(self, filename: str) -> Path | None:
        image_path = self._root / "knowledge-base" / "images" / filename
        return image_path if image_path.is_file() else None

    def write_legacy_kb_document(self, locale: str, document: dict[str, Any]) -> str:
        snapshot_key = f"legacy/knowledge-base/{locale}/entries.json"
        snapshot_path = self._root / snapshot_key
        atomic_write_json(snapshot_path, document)
        return snapshot_key

    def read_legacy_kb_document(self, locale: str) -> dict[str, Any] | None:
        snapshot_path = self._root / f"legacy/knowledge-base/{locale}/entries.json"
        if not snapshot_path.exists():
            return None
        with snapshot_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def list_website_page_ids(self) -> list[str]:
        return self.list_website_page_ids_from_store(self._read_store())

    def get_website_page_meta(self, page_key: str) -> dict[str, Any] | None:
        return self.get_website_page_meta_from_store(self._read_store(), page_key)

    def get_website_variant(self, page_key: str, locale: str) -> dict[str, Any] | None:
        return self.get_website_variant_from_store(self._read_store(), page_key, locale)

    def save_website_variant(
        self,
        page_key: str,
        locale: str,
        body: dict[str, Any],
        *,
        generation_metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if page_key not in WEBSITE_PAGE_KEYS:
            raise KeyError(page_key)

        page = website_page_definition(page_key)
        if body.get("pageKind") != page["pageKind"]:
            raise ValueError("Website draft body pageKind does not match page metadata.")

        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key
        )
        if meta is None:
            raise KeyError(page_key)

        now = utc_now()
        _, existing = _resolve_variant_key(
            records,
            page_key,
            locale,
            CONTENT_TYPE_WEBSITE_PAGE,
            make_website_variant_key,
            make_website_meta_key,
        )
        metadata_fields = (
            generation_metadata
            if generation_metadata is not None
            else apply_translation_metadata_on_save(
                locale=locale,
                new_body=body,
                existing=existing,
                module="website",
            )
        )
        variant = {
            "pk": f"CONTENT#{page_key}",
            "sk": f"VARIANT#{locale}",
            "contentId": page_key,
            "locale": locale,
            "status": existing["status"] if existing else "draft",
            "draftBody": body,
            "updatedAt": isoformat(now),
            "publishedAt": existing.get("publishedAt") if existing else None,
            "snapshotKey": existing.get("snapshotKey") if existing else None,
            **metadata_fields,
        }
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key, meta
        )
        self._persist_typed_variant(
            records,
            page_key,
            locale,
            CONTENT_TYPE_WEBSITE_PAGE,
            make_website_variant_key,
            make_website_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE
        )
        self._write_store(records)
        return deepcopy(variant)

    def publish_website_variant(self, page_key: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key
        )
        _, variant = _resolve_variant_key(
            records,
            page_key,
            locale,
            CONTENT_TYPE_WEBSITE_PAGE,
            make_website_variant_key,
            make_website_meta_key,
        )
        if meta is None or variant is None:
            raise KeyError(page_key)
        now = utc_now()
        variant["status"] = "published"
        variant["publishedAt"] = isoformat(now)
        variant["updatedAt"] = isoformat(now)
        variant["snapshotKey"] = f"published/website/{locale}/pages.json"
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key, meta
        )
        self._persist_typed_variant(
            records,
            page_key,
            locale,
            CONTENT_TYPE_WEBSITE_PAGE,
            make_website_variant_key,
            make_website_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE
        )
        self._write_store(records)
        return deepcopy(variant)

    def unpublish_website_variant(self, page_key: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key
        )
        _, variant = _resolve_variant_key(
            records,
            page_key,
            locale,
            CONTENT_TYPE_WEBSITE_PAGE,
            make_website_variant_key,
            make_website_meta_key,
        )
        if meta is None or variant is None:
            raise KeyError(page_key)
        now = utc_now()
        variant["status"] = "draft"
        variant["updatedAt"] = isoformat(now)
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key, meta
        )
        self._persist_typed_variant(
            records,
            page_key,
            locale,
            CONTENT_TYPE_WEBSITE_PAGE,
            make_website_variant_key,
            make_website_meta_key,
            variant,
        )
        self._finalize_typed_record_migration(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE
        )
        self._write_store(records)
        return deepcopy(variant)

    def delete_website_page_variant(self, page_key: str, locale: str) -> None:
        normalized = locale.strip().lower()
        if normalized == CANONICAL_EDITORIAL_LOCALE:
            raise ValueError("Cannot delete the canonical Romanian variant in isolation.")
        records = self._read_store()
        _, meta = _resolve_meta_key(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key
        )
        variant_key, variant = _resolve_variant_key(
            records,
            page_key,
            locale,
            CONTENT_TYPE_WEBSITE_PAGE,
            make_website_variant_key,
            make_website_meta_key,
        )
        if meta is None or variant is None or variant_key is None:
            raise KeyError(page_key)
        now = utc_now()
        records.pop(variant_key, None)
        meta["updatedAt"] = isoformat(now)
        self._persist_typed_meta(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE, make_website_meta_key, meta
        )
        self._finalize_typed_record_migration(
            records, page_key, CONTENT_TYPE_WEBSITE_PAGE
        )
        self._write_store(records)

    def write_website_snapshot(self, locale: str, document: dict[str, Any]) -> str:
        snapshot_key = f"published/website/{locale}/pages.json"
        snapshot_path = self._root / snapshot_key
        atomic_write_json(snapshot_path, document)
        return snapshot_key

    def read_website_snapshot(self, locale: str) -> dict[str, Any] | None:
        snapshot_path = self._root / f"published/website/{locale}/pages.json"
        if not snapshot_path.exists():
            return None
        with snapshot_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def save_website_image(self, filename: str, data: bytes) -> str:
        images_dir = self._root / "website" / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        image_path = images_dir / filename
        image_path.write_bytes(data)
        return f"/api/content/website/images/{filename}"

    def get_website_image_path(self, filename: str) -> Path | None:
        image_path = self._root / "website" / "images" / filename
        return image_path if image_path.is_file() else None
