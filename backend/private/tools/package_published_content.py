"""Synchronize selected private published snapshots into the public package.

This is a local release-packaging helper. It copies already-published snapshot
JSON (and only the images those snapshots reference) from
``backend/private/content`` into ``backend/public/content``.

It does not publish drafts, generate translations, talk to AWS, or deploy.
Dry-run is the default; ``--apply`` is required to write.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Sequence

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from private.schemas.common import ADMIN_EDITORIAL_LOCALES, parse_admin_locale
from private.services.editorial_images import IMAGE_FILENAME_PATTERN

SUPPORTED_MODULES = ("manual", "knowledge-base")

_MODULE_SPECS = {
    "manual": {
        "snapshot_parts": ("published", "manual"),
        "snapshot_name": "document.json",
        "items_key": "chapters",
        "id_field": "contentId",
        "image_module": "manual",
        "images_parts": ("manual", "images"),
    },
    "knowledge-base": {
        "snapshot_parts": ("published", "knowledge-base"),
        "snapshot_name": "entries.json",
        "items_key": "entries",
        "id_field": "id",
        "image_module": "knowledge-base",
        "images_parts": ("knowledge-base", "images"),
    },
}

_IMAGE_SRC_RE = re.compile(
    r"^/api/content/(manual|knowledge-base)/images/"
    r"([a-f0-9-]{36}\.(?:jpg|png|gif|webp))$"
)


class PackageContentError(ValueError):
    """Validation or safety failure. No destination files should be written."""


def default_private_content_root() -> Path:
    return Path(__file__).resolve().parents[1] / "content"


def default_public_content_root() -> Path:
    return Path(__file__).resolve().parents[2] / "public" / "content"


def _resolve_under(root: Path, *parts: str) -> Path:
    root_resolved = root.resolve()
    candidate = (root_resolved.joinpath(*parts)).resolve()
    if not candidate.is_relative_to(root_resolved):
        raise PackageContentError("Resolved path escapes the approved content root.")
    return candidate


def _parse_module(value: str) -> str:
    module = value.strip().lower()
    if module not in _MODULE_SPECS:
        raise PackageContentError(
            f"Unsupported module: {value!r}. Supported modules: {', '.join(SUPPORTED_MODULES)}."
        )
    return module


def _parse_locale(value: str) -> str:
    try:
        return parse_admin_locale(value)
    except ValueError as exc:
        raise PackageContentError(
            f"Unsupported locale: {value!r}. "
            f"Supported locales: {', '.join(sorted(ADMIN_EDITORIAL_LOCALES))}."
        ) from exc


def _unique_pairs(modules: Sequence[str], locale: str) -> tuple[tuple[str, str], ...]:
    seen: set[tuple[str, str]] = set()
    pairs: list[tuple[str, str]] = []
    for module in modules:
        pair = (module, locale)
        if pair in seen:
            continue
        seen.add(pair)
        pairs.append(pair)
    return tuple(pairs)


def _load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise PackageContentError(f"Cannot read snapshot: {path}") from exc
    except json.JSONDecodeError as exc:
        raise PackageContentError(f"Malformed JSON in snapshot: {path}") from exc


def _item_ids(document: dict[str, Any], *, items_key: str, id_field: str) -> list[str]:
    items = document.get(items_key)
    if not isinstance(items, list):
        raise PackageContentError(
            f"Snapshot is missing a '{items_key}' array."
        )
    ids: list[str] = []
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise PackageContentError(f"Snapshot '{items_key}[{index}]' is not an object.")
        value = item.get(id_field)
        if not isinstance(value, str) or not value.strip():
            raise PackageContentError(
                f"Snapshot '{items_key}[{index}]' is missing a non-empty '{id_field}'."
            )
        ids.append(value)
    if len(ids) != len(set(ids)):
        duplicates = sorted({item_id for item_id in ids if ids.count(item_id) > 1})
        raise PackageContentError(f"Duplicate IDs in snapshot: {', '.join(duplicates)}.")
    return ids


def _collect_image_filenames(value: Any, *, expected_module: str) -> set[str]:
    filenames: set[str] = set()
    if isinstance(value, dict):
        src = value.get("src")
        if value.get("type") == "image" and isinstance(src, str):
            match = _IMAGE_SRC_RE.fullmatch(src.strip())
            if match is None:
                raise PackageContentError(
                    f"Unsupported image src in published snapshot: {src!r}."
                )
            module, filename = match.group(1), match.group(2)
            if module != expected_module:
                raise PackageContentError(
                    f"Snapshot for '{expected_module}' references {module} image {filename}."
                )
            if not IMAGE_FILENAME_PATTERN.fullmatch(filename):
                raise PackageContentError(f"Unsafe image filename: {filename!r}.")
            filenames.add(filename)
        for nested in value.values():
            filenames.update(_collect_image_filenames(nested, expected_module=expected_module))
    elif isinstance(value, list):
        for nested in value:
            filenames.update(_collect_image_filenames(nested, expected_module=expected_module))
    return filenames


def _file_digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _atomic_replace_bytes(destination: Path, data: bytes) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            "wb",
            dir=destination.parent,
            prefix=f".{destination.name}.tmp-",
            delete=False,
        ) as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
            temp_path = Path(handle.name)
        os.replace(temp_path, destination)
        temp_path = None
    finally:
        if temp_path is not None and temp_path.exists():
            temp_path.unlink()


@dataclass
class ImagePlan:
    filename: str
    source_path: Path
    destination_path: Path
    missing_source: bool
    missing_destination: bool
    different: bool

    @property
    def would_copy(self) -> bool:
        return not self.missing_source and (self.missing_destination or self.different)


@dataclass
class OperationPlan:
    module: str
    locale: str
    source_snapshot: Path
    destination_snapshot: Path
    source_count: int
    destination_count: int
    source_ids: tuple[str, ...]
    destination_ids: tuple[str, ...]
    added_ids: tuple[str, ...]
    removed_ids: tuple[str, ...]
    shared_ids: tuple[str, ...]
    json_would_change: bool
    images: tuple[ImagePlan, ...]
    destructive: bool

    @property
    def images_to_copy(self) -> tuple[ImagePlan, ...]:
        return tuple(image for image in self.images if image.would_copy)

    @property
    def missing_destination_images(self) -> tuple[str, ...]:
        return tuple(image.filename for image in self.images if image.missing_destination)


@dataclass
class SyncReport:
    dry_run: bool
    applied: bool
    operations: tuple[OperationPlan, ...] = field(default_factory=tuple)
    errors: tuple[str, ...] = field(default_factory=tuple)

    @property
    def ok(self) -> bool:
        return not self.errors


def plan_operation(
    module: str,
    locale: str,
    *,
    private_root: Path,
    public_root: Path,
) -> OperationPlan:
    spec = _MODULE_SPECS[module]
    source_snapshot = _resolve_under(
        private_root,
        *spec["snapshot_parts"],
        locale,
        spec["snapshot_name"],
    )
    destination_snapshot = _resolve_under(
        public_root,
        *spec["snapshot_parts"],
        locale,
        spec["snapshot_name"],
    )
    if not source_snapshot.is_file():
        raise PackageContentError(
            f"Source snapshot does not exist for {module}/{locale}: {source_snapshot}"
        )

    document = _load_json(source_snapshot)
    if not isinstance(document, dict):
        raise PackageContentError(f"Source snapshot must be a JSON object: {source_snapshot}")
    declared_locale = document.get("locale")
    if declared_locale is not None and declared_locale != locale:
        raise PackageContentError(
            f"Source snapshot locale {declared_locale!r} does not match requested {locale!r}."
        )

    source_ids = tuple(_item_ids(document, items_key=spec["items_key"], id_field=spec["id_field"]))
    referenced = _collect_image_filenames(document, expected_module=spec["image_module"])

    destination_ids: tuple[str, ...] = ()
    destination_count = 0
    if destination_snapshot.is_file():
        dest_document = _load_json(destination_snapshot)
        if isinstance(dest_document, dict):
            try:
                destination_ids = tuple(
                    _item_ids(
                        dest_document,
                        items_key=spec["items_key"],
                        id_field=spec["id_field"],
                    )
                )
            except PackageContentError:
                destination_ids = ()
        destination_count = len(destination_ids)

    source_set = set(source_ids)
    dest_set = set(destination_ids)
    added = tuple(item_id for item_id in source_ids if item_id not in dest_set)
    removed = tuple(item_id for item_id in destination_ids if item_id not in source_set)
    shared = tuple(item_id for item_id in source_ids if item_id in dest_set)

    source_bytes = source_snapshot.read_bytes()
    dest_bytes = destination_snapshot.read_bytes() if destination_snapshot.is_file() else None
    json_would_change = dest_bytes != source_bytes

    images: list[ImagePlan] = []
    for filename in sorted(referenced):
        source_image = _resolve_under(private_root, *spec["images_parts"], filename)
        dest_image = _resolve_under(public_root, *spec["images_parts"], filename)
        missing_source = not source_image.is_file()
        missing_destination = not dest_image.is_file()
        different = False
        if not missing_source and not missing_destination:
            different = _file_digest(source_image) != _file_digest(dest_image)
        images.append(
            ImagePlan(
                filename=filename,
                source_path=source_image,
                destination_path=dest_image,
                missing_source=missing_source,
                missing_destination=missing_destination,
                different=different,
            )
        )

    missing_source_images = [image.filename for image in images if image.missing_source]
    if missing_source_images:
        raise PackageContentError(
            f"Missing required source images for {module}/{locale}: "
            + ", ".join(missing_source_images)
        )

    destructive = bool(removed) or destination_count > len(source_ids)
    return OperationPlan(
        module=module,
        locale=locale,
        source_snapshot=source_snapshot,
        destination_snapshot=destination_snapshot,
        source_count=len(source_ids),
        destination_count=destination_count,
        source_ids=source_ids,
        destination_ids=destination_ids,
        added_ids=added,
        removed_ids=removed,
        shared_ids=shared,
        json_would_change=json_would_change,
        images=tuple(images),
        destructive=destructive,
    )


def plan_operations(
    modules: Sequence[str],
    locale: str,
    *,
    private_root: Path,
    public_root: Path,
) -> tuple[OperationPlan, ...]:
    parsed_modules = [_parse_module(module) for module in modules]
    parsed_locale = _parse_locale(locale)
    errors: list[str] = []
    plans: list[OperationPlan] = []
    for module, operation_locale in _unique_pairs(parsed_modules, parsed_locale):
        try:
            plans.append(
                plan_operation(
                    module,
                    operation_locale,
                    private_root=private_root,
                    public_root=public_root,
                )
            )
        except PackageContentError as exc:
            errors.append(str(exc))
    if errors:
        raise PackageContentError("\n".join(errors))
    return tuple(plans)


def apply_operations(operations: Sequence[OperationPlan]) -> None:
    for operation in operations:
        for image in operation.images_to_copy:
            _atomic_replace_bytes(image.destination_path, image.source_path.read_bytes())
        _atomic_replace_bytes(operation.destination_snapshot, operation.source_snapshot.read_bytes())
        written = operation.destination_snapshot.read_bytes()
        if written != operation.source_snapshot.read_bytes():
            raise PackageContentError(
                f"Destination snapshot did not match source after write: "
                f"{operation.destination_snapshot}"
            )


def format_report(report: SyncReport) -> str:
    lines: list[str] = []
    mode = "DRY-RUN (no files written)" if report.dry_run else "APPLY"
    lines.append(f"HFZWood published-content packaging - {mode}")
    if report.errors:
        lines.append("ERRORS:")
        for error in report.errors:
            lines.append(f"  - {error}")
        return "\n".join(lines)

    for operation in report.operations:
        lines.append("")
        lines.append(f"[{operation.module} / {operation.locale}]")
        lines.append(f"  source:      {operation.source_snapshot}")
        lines.append(f"  destination: {operation.destination_snapshot}")
        lines.append(f"  source count:      {operation.source_count}")
        lines.append(f"  destination count: {operation.destination_count}")
        lines.append(f"  added IDs ({len(operation.added_ids)}): {', '.join(operation.added_ids) or '(none)'}")
        lines.append(
            f"  removed IDs ({len(operation.removed_ids)}): "
            f"{', '.join(operation.removed_ids) or '(none)'}"
        )
        lines.append(f"  shared IDs ({len(operation.shared_ids)}): {len(operation.shared_ids)}")
        lines.append(f"  JSON would change: {operation.json_would_change}")
        missing_dest = operation.missing_destination_images
        lines.append(
            f"  missing destination images ({len(missing_dest)}): "
            f"{', '.join(missing_dest) or '(none)'}"
        )
        to_copy = [image.filename for image in operation.images_to_copy]
        lines.append(
            f"  images that would be copied ({len(to_copy)}): "
            f"{', '.join(to_copy) or '(none)'}"
        )
        if operation.destructive:
            lines.append(
                "  DESTRUCTIVE: destination IDs would be removed. "
                "Apply requires --allow-id-removal."
            )
    if report.applied:
        lines.append("")
        lines.append("Apply completed. Public packaged files were written.")
        lines.append("Git commit and deployment are still required to reach production.")
    elif report.dry_run:
        lines.append("")
        lines.append("No files were modified. Re-run with --apply to write.")
    return "\n".join(lines) + "\n"


def run_packaging(
    *,
    modules: Sequence[str],
    locale: str,
    apply: bool = False,
    allow_id_removal: bool = False,
    private_root: Path | None = None,
    public_root: Path | None = None,
) -> SyncReport:
    private = Path(private_root) if private_root is not None else default_private_content_root()
    public = Path(public_root) if public_root is not None else default_public_content_root()
    try:
        operations = plan_operations(modules, locale, private_root=private, public_root=public)
    except PackageContentError as exc:
        return SyncReport(dry_run=not apply, applied=False, errors=tuple(str(exc).split("\n")))

    destructive = [operation for operation in operations if operation.destructive]
    if apply and destructive and not allow_id_removal:
        messages = [
            "Apply refused because destination IDs would be removed. "
            "Re-run with --allow-id-removal to acknowledge the replacement."
        ]
        for operation in destructive:
            messages.append(
                f"{operation.module}/{operation.locale} would remove "
                f"{len(operation.removed_ids)} ID(s): "
                + (", ".join(operation.removed_ids) or "(count decrease)")
            )
        return SyncReport(
            dry_run=False,
            applied=False,
            operations=operations,
            errors=tuple(messages),
        )

    if apply:
        apply_operations(operations)
        return SyncReport(dry_run=False, applied=True, operations=operations)
    return SyncReport(dry_run=True, applied=False, operations=operations)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Copy selected private published Manual/Knowledge Base snapshots "
            "into the public production corpus. Dry-run is the default."
        )
    )
    parser.add_argument(
        "--module",
        dest="modules",
        action="append",
        required=True,
        metavar="MODULE",
        help="Module to package. Repeatable. Allowed: manual, knowledge-base.",
    )
    parser.add_argument(
        "--locale",
        required=True,
        help="Locale to package. Required. Does not default to all locales.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write destination files. Without this flag the command is a dry-run.",
    )
    parser.add_argument(
        "--allow-id-removal",
        action="store_true",
        help="Required when apply would remove IDs that already exist at the destination.",
    )
    parser.add_argument(
        "--private-root",
        type=Path,
        default=None,
        help="Private content root. Defaults to backend/private/content.",
    )
    parser.add_argument(
        "--public-root",
        type=Path,
        default=None,
        help="Public content root. Defaults to backend/public/content.",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    report = run_packaging(
        modules=args.modules,
        locale=args.locale,
        apply=args.apply,
        allow_id_removal=args.allow_id_removal,
        private_root=args.private_root,
        public_root=args.public_root,
    )
    sys.stdout.write(format_report(report))
    return 0 if report.ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
