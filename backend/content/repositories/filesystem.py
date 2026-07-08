import json
import os
import re
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CONTENT_TYPE_MANUAL_CHAPTER = "manual_chapter"
CONTENT_TYPE_GLOSSARY_ENTRY = "glossary_entry"
DEFAULT_SECTION_ID = "main"
DEFAULT_LOCALE = "en"


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


def make_meta_key(content_id: str) -> str:
    return f"CONTENT#{content_id}|META"


def make_variant_key(content_id: str, locale: str) -> str:
    return f"CONTENT#{content_id}|VARIANT#{locale}"


def make_order_key(sort_order: int) -> str:
    return f"INDEX#manual|ORDER#{sort_order:06d}"


def make_glossary_order_key(sort_order: int) -> str:
    return f"INDEX#glossary|ORDER#{sort_order:06d}"


class FilesystemContentRepository:
    def __init__(self, data_dir: Path | None = None) -> None:
        root = data_dir or Path(os.environ.get("CONTENT_DATA_DIR", Path(__file__).resolve().parents[2] / "data"))
        self._root = root
        self._editorial_dir = self._root / "editorial"
        self._published_dir = self._root / "published"
        self._store_path = self._editorial_dir / "content-store.json"
        self._editorial_dir.mkdir(parents=True, exist_ok=True)
        self._published_dir.mkdir(parents=True, exist_ok=True)
        if not self._store_path.exists():
            self._write_store({})

    def _read_store(self) -> dict[str, Any]:
        if not self._store_path.exists():
            return {}
        with self._store_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        return payload.get("records", {})

    def _write_store(self, records: dict[str, Any]) -> None:
        self._editorial_dir.mkdir(parents=True, exist_ok=True)
        with self._store_path.open("w", encoding="utf-8") as handle:
            json.dump({"records": records}, handle, indent=2, sort_keys=True)

    def _get_record(self, records: dict[str, Any], key: str) -> dict[str, Any] | None:
        record = records.get(key)
        return deepcopy(record) if record is not None else None

    def _set_record(self, records: dict[str, Any], key: str, value: dict[str, Any] | None) -> None:
        if value is None:
            records.pop(key, None)
        else:
            records[key] = value

    def list_manual_chapter_ids(self) -> list[str]:
        records = self._read_store()
        ordered: list[tuple[int, str]] = []
        for key, value in records.items():
            if not key.startswith("INDEX#manual|ORDER#"):
                continue
            sort_order = int(key.rsplit("#", 1)[-1])
            ordered.append((sort_order, value["contentId"]))
        ordered.sort(key=lambda item: item[0])
        return [content_id for _, content_id in ordered]

    def get_manual_chapter_meta(self, content_id: str) -> dict[str, Any] | None:
        records = self._read_store()
        return self._get_record(records, make_meta_key(content_id))

    def get_manual_variant(self, content_id: str, locale: str) -> dict[str, Any] | None:
        records = self._read_store()
        return self._get_record(records, make_variant_key(content_id, locale))

    def create_manual_chapter(self, title: str, content_id: str | None = None) -> dict[str, Any]:
        records = self._read_store()
        chapter_id = content_id or self._allocate_content_id(records, title)
        if make_meta_key(chapter_id) in records:
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
            "sk": f"VARIANT#{DEFAULT_LOCALE}",
            "contentId": chapter_id,
            "locale": DEFAULT_LOCALE,
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
        }
        order = {
            "pk": "INDEX#manual",
            "sk": f"ORDER#{sort_order:06d}",
            "contentId": chapter_id,
        }

        records[make_meta_key(chapter_id)] = meta
        records[make_variant_key(chapter_id, DEFAULT_LOCALE)] = variant
        records[make_order_key(sort_order)] = order
        self._write_store(records)
        return deepcopy(meta)

    def save_manual_variant(self, content_id: str, locale: str, body: dict[str, Any]) -> dict[str, Any]:
        records = self._read_store()
        meta_key = make_meta_key(content_id)
        variant_key = make_variant_key(content_id, locale)
        if meta_key not in records:
            raise KeyError(content_id)

        now = utc_now()
        existing = records.get(variant_key)
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
        }
        records[variant_key] = variant
        records[meta_key]["updatedAt"] = isoformat(now)
        self._write_store(records)
        return deepcopy(variant)

    def publish_manual_variant(self, content_id: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        variant_key = make_variant_key(content_id, locale)
        if variant_key not in records:
            raise KeyError(content_id)
        now = utc_now()
        variant = records[variant_key]
        variant["status"] = "published"
        variant["publishedAt"] = isoformat(now)
        variant["updatedAt"] = isoformat(now)
        variant["snapshotKey"] = f"published/manual/{locale}/document.json"
        records[variant_key] = variant
        records[make_meta_key(content_id)]["updatedAt"] = isoformat(now)
        self._write_store(records)
        return deepcopy(variant)

    def unpublish_manual_variant(self, content_id: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        variant_key = make_variant_key(content_id, locale)
        if variant_key not in records:
            raise KeyError(content_id)
        now = utc_now()
        variant = records[variant_key]
        variant["status"] = "draft"
        variant["updatedAt"] = isoformat(now)
        records[variant_key] = variant
        records[make_meta_key(content_id)]["updatedAt"] = isoformat(now)
        self._write_store(records)
        return deepcopy(variant)

    def delete_manual_chapter(self, content_id: str) -> None:
        records = self._read_store()
        meta_key = make_meta_key(content_id)
        if meta_key not in records:
            raise KeyError(content_id)

        keys_to_delete = [key for key in records if key.startswith(f"CONTENT#{content_id}|")]
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
        for content_id in content_ids:
            if make_meta_key(content_id) not in self._read_store():
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
            meta_key = make_meta_key(content_id)
            records[meta_key]["sortOrder"] = sort_order
            records[meta_key]["updatedAt"] = isoformat(now)
        self._write_store(records)

    def write_manual_snapshot(self, locale: str, document: dict[str, Any]) -> str:
        snapshot_key = f"published/manual/{locale}/document.json"
        snapshot_path = self._root / snapshot_key
        snapshot_path.parent.mkdir(parents=True, exist_ok=True)
        with snapshot_path.open("w", encoding="utf-8") as handle:
            json.dump(document, handle, indent=2, sort_keys=True)
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
        snapshot_path.parent.mkdir(parents=True, exist_ok=True)
        with snapshot_path.open("w", encoding="utf-8") as handle:
            json.dump(document, handle, indent=2, sort_keys=True)
        return snapshot_key

    def read_legacy_manual_document(self, locale: str) -> dict[str, Any] | None:
        snapshot_path = self._root / f"legacy/manual/{locale}/document.json"
        if not snapshot_path.exists():
            return None
        with snapshot_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _allocate_content_id(self, records: dict[str, Any], title: str) -> str:
        stem = slugify_title(title)
        if make_meta_key(stem) not in records:
            return stem
        index = 2
        while make_meta_key(f"{stem}-{index}") in records:
            index += 1
        return f"{stem}-{index}"

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

    def list_glossary_entry_ids(self) -> list[str]:
        records = self._read_store()
        ordered: list[tuple[int, str]] = []
        for key, value in records.items():
            if not key.startswith("INDEX#glossary|ORDER#"):
                continue
            sort_order = int(key.rsplit("#", 1)[-1])
            ordered.append((sort_order, value["contentId"]))
        ordered.sort(key=lambda item: item[0])
        return [content_id for _, content_id in ordered]

    def get_glossary_entry_meta(self, content_id: str) -> dict[str, Any] | None:
        records = self._read_store()
        return self._get_record(records, make_meta_key(content_id))

    def get_glossary_variant(self, content_id: str, locale: str) -> dict[str, Any] | None:
        records = self._read_store()
        meta = self._get_record(records, make_meta_key(content_id))
        if not meta or meta.get("contentType") != CONTENT_TYPE_GLOSSARY_ENTRY:
            return None
        return self._get_record(records, make_variant_key(content_id, locale))

    def create_glossary_entry(self, term: str, content_id: str | None = None) -> dict[str, Any]:
        records = self._read_store()
        entry_id = content_id or self._allocate_content_id(records, term)
        if make_meta_key(entry_id) in records:
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
        }
        order = {
            "pk": "INDEX#glossary",
            "sk": f"ORDER#{sort_order:06d}",
            "contentId": entry_id,
        }

        records[make_meta_key(entry_id)] = meta
        records[make_variant_key(entry_id, DEFAULT_LOCALE)] = variant
        records[make_glossary_order_key(sort_order)] = order
        self._write_store(records)
        return deepcopy(meta)

    def save_glossary_variant(self, content_id: str, locale: str, body: dict[str, Any]) -> dict[str, Any]:
        records = self._read_store()
        meta_key = make_meta_key(content_id)
        if meta_key not in records or records[meta_key].get("contentType") != CONTENT_TYPE_GLOSSARY_ENTRY:
            raise KeyError(content_id)

        now = utc_now()
        variant_key = make_variant_key(content_id, locale)
        existing = records.get(variant_key)
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
        }
        records[variant_key] = variant
        records[meta_key]["updatedAt"] = isoformat(now)
        self._write_store(records)
        return deepcopy(variant)

    def publish_glossary_variant(self, content_id: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        variant_key = make_variant_key(content_id, locale)
        if variant_key not in records:
            raise KeyError(content_id)
        now = utc_now()
        variant = records[variant_key]
        variant["status"] = "published"
        variant["publishedAt"] = isoformat(now)
        variant["updatedAt"] = isoformat(now)
        variant["snapshotKey"] = f"published/glossary/{locale}/entries.json"
        records[variant_key] = variant
        records[make_meta_key(content_id)]["updatedAt"] = isoformat(now)
        self._write_store(records)
        return deepcopy(variant)

    def unpublish_glossary_variant(self, content_id: str, locale: str) -> dict[str, Any]:
        records = self._read_store()
        variant_key = make_variant_key(content_id, locale)
        if variant_key not in records:
            raise KeyError(content_id)
        now = utc_now()
        variant = records[variant_key]
        variant["status"] = "draft"
        variant["updatedAt"] = isoformat(now)
        records[variant_key] = variant
        records[make_meta_key(content_id)]["updatedAt"] = isoformat(now)
        self._write_store(records)
        return deepcopy(variant)

    def delete_glossary_entry(self, content_id: str) -> None:
        records = self._read_store()
        meta_key = make_meta_key(content_id)
        if meta_key not in records or records[meta_key].get("contentType") != CONTENT_TYPE_GLOSSARY_ENTRY:
            raise KeyError(content_id)

        keys_to_delete = [key for key in records if key.startswith(f"CONTENT#{content_id}|")]
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
        for content_id in content_ids:
            meta = self._get_record(self._read_store(), make_meta_key(content_id))
            if not meta or meta.get("contentType") != CONTENT_TYPE_GLOSSARY_ENTRY:
                continue
            self.delete_glossary_entry(content_id)
            removed.append(content_id)
        return removed

    def write_glossary_snapshot(self, locale: str, document: dict[str, Any]) -> str:
        snapshot_key = f"published/glossary/{locale}/entries.json"
        snapshot_path = self._root / snapshot_key
        snapshot_path.parent.mkdir(parents=True, exist_ok=True)
        with snapshot_path.open("w", encoding="utf-8") as handle:
            json.dump(document, handle, indent=2, sort_keys=True)
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
        snapshot_path.parent.mkdir(parents=True, exist_ok=True)
        with snapshot_path.open("w", encoding="utf-8") as handle:
            json.dump(document, handle, indent=2, sort_keys=True)
        return snapshot_key

    def read_legacy_glossary_document(self, locale: str) -> dict[str, Any] | None:
        snapshot_path = self._root / f"legacy/glossary/{locale}/entries.json"
        if not snapshot_path.exists():
            return None
        with snapshot_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
