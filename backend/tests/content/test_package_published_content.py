"""Tests for the private→public published-content packaging tool.

All tests use temporary fixture trees. They must not modify the repository
corpus under backend/private/content or backend/public/content.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from private.tools.package_published_content import (
    PackageContentError,
    apply_operations,
    main,
    plan_operations,
    run_packaging,
)

IMAGE_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png"
IMAGE_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.jpg"


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def _manual_document(locale: str, chapter_ids: list[str], *, image: str | None = None) -> dict:
    chapters = []
    for chapter_id in chapter_ids:
        blocks = [{"type": "paragraph", "text": f"Body for {chapter_id}."}]
        if image:
            blocks.append(
                {
                    "type": "image",
                    "src": f"/api/content/manual/images/{image}",
                    "alt": "figure",
                }
            )
        chapters.append(
            {
                "contentId": chapter_id,
                "title": chapter_id,
                "sortOrder": 100,
                "sections": [{"id": "main", "title": "", "blocks": blocks}],
            }
        )
    return {"locale": locale, "chapters": chapters}


def _kb_document(locale: str, entry_ids: list[str], *, image: str | None = None) -> dict:
    entries = []
    for entry_id in entry_ids:
        media = []
        if image:
            media.append(
                {
                    "type": "image",
                    "src": f"/api/content/knowledge-base/images/{image}",
                    "alt": "figure",
                }
            )
        entries.append(
            {
                "id": entry_id,
                "title": entry_id,
                "problemSummary": "summary",
                "solution": ["do the thing"],
                "media": media,
            }
        )
    return {"locale": locale, "entries": entries}


def _layout(tmp_path: Path) -> tuple[Path, Path]:
    return tmp_path / "private", tmp_path / "public"


def _seed_manual(root: Path, locale: str, ids: list[str], *, image: str | None = None, image_bytes: bytes = b"manual-img") -> Path:
    snapshot = root / "published" / "manual" / locale / "document.json"
    _write_json(snapshot, _manual_document(locale, ids, image=image))
    if image:
        _write_bytes(root / "manual" / "images" / image, image_bytes)
    return snapshot


def _seed_kb(root: Path, locale: str, ids: list[str], *, image: str | None = None, image_bytes: bytes = b"kb-img") -> Path:
    snapshot = root / "published" / "knowledge-base" / locale / "entries.json"
    _write_json(snapshot, _kb_document(locale, ids, image=image))
    if image:
        _write_bytes(root / "knowledge-base" / "images" / image, image_bytes)
    return snapshot


class TestManualRoDryRun:
    def test_detects_source_destination_differences_without_writing(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        _seed_manual(private_root, "ro", [f"chapter-{index}" for index in range(18)])
        dest = _seed_manual(public_root, "ro", ["proba-de-astazi"])
        before = dest.read_bytes()

        report = run_packaging(
            modules=["manual"],
            locale="ro",
            private_root=private_root,
            public_root=public_root,
        )

        assert report.ok
        assert report.dry_run
        assert not report.applied
        operation = report.operations[0]
        assert operation.source_count == 18
        assert operation.destination_count == 1
        assert operation.removed_ids == ("proba-de-astazi",)
        assert len(operation.added_ids) == 18
        assert operation.json_would_change
        assert dest.read_bytes() == before


class TestKnowledgeBaseRoDryRun:
    def test_reports_added_ids_without_writing(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        private_ids = [f"article-{index}" for index in range(5)]
        public_ids = private_ids[:2]
        _seed_kb(private_root, "ro", private_ids)
        dest = _seed_kb(public_root, "ro", public_ids)
        before = dest.read_bytes()

        report = run_packaging(
            modules=["knowledge-base"],
            locale="ro",
            private_root=private_root,
            public_root=public_root,
        )

        assert report.ok
        operation = report.operations[0]
        assert operation.added_ids == ("article-2", "article-3", "article-4")
        assert operation.removed_ids == ()
        assert not operation.destructive
        assert dest.read_bytes() == before


class TestApplyFixture:
    def test_destination_becomes_identical_to_source(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        source = _seed_manual(private_root, "ro", ["alpha", "beta"])
        dest = _seed_manual(public_root, "ro", ["stale"])

        report = run_packaging(
            modules=["manual"],
            locale="ro",
            apply=True,
            allow_id_removal=True,
            private_root=private_root,
            public_root=public_root,
        )

        assert report.applied
        assert dest.read_bytes() == source.read_bytes()


class TestModuleIsolation:
    def test_syncing_manual_does_not_touch_knowledge_base(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        _seed_manual(private_root, "ro", ["new-chapter"])
        _seed_kb(private_root, "ro", ["new-article"])
        _seed_manual(public_root, "ro", ["old-chapter"])
        kb_dest = _seed_kb(public_root, "ro", ["old-article"])
        kb_before = kb_dest.read_bytes()

        run_packaging(
            modules=["manual"],
            locale="ro",
            apply=True,
            allow_id_removal=True,
            private_root=private_root,
            public_root=public_root,
        )

        assert kb_dest.read_bytes() == kb_before

    def test_syncing_knowledge_base_does_not_touch_manual(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        _seed_manual(private_root, "ro", ["new-chapter"])
        _seed_kb(private_root, "ro", ["new-article"])
        manual_dest = _seed_manual(public_root, "ro", ["old-chapter"])
        _seed_kb(public_root, "ro", ["old-article"])
        manual_before = manual_dest.read_bytes()

        run_packaging(
            modules=["knowledge-base"],
            locale="ro",
            apply=True,
            allow_id_removal=True,
            private_root=private_root,
            public_root=public_root,
        )

        assert manual_dest.read_bytes() == manual_before


class TestLocaleIsolation:
    def test_syncing_ro_does_not_touch_en(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        _seed_kb(private_root, "ro", ["ro-new"])
        _seed_kb(private_root, "en", ["en-private"])
        _seed_kb(public_root, "ro", ["ro-old"])
        en_dest = _seed_kb(public_root, "en", ["en-public-one", "en-public-two"])
        en_before = en_dest.read_bytes()

        run_packaging(
            modules=["knowledge-base"],
            locale="ro",
            apply=True,
            allow_id_removal=True,
            private_root=private_root,
            public_root=public_root,
        )

        assert en_dest.read_bytes() == en_before


class TestRejection:
    def test_unsupported_module(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        report = run_packaging(
            modules=["glossary"],
            locale="ro",
            private_root=private_root,
            public_root=public_root,
        )
        assert not report.ok
        assert any("Unsupported module" in error for error in report.errors)

    def test_unsupported_locale(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        report = run_packaging(
            modules=["manual"],
            locale="xx",
            private_root=private_root,
            public_root=public_root,
        )
        assert not report.ok
        assert any("Unsupported locale" in error for error in report.errors)

    def test_malformed_source_json(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        snapshot = private_root / "published" / "manual" / "ro" / "document.json"
        snapshot.parent.mkdir(parents=True, exist_ok=True)
        snapshot.write_text("{not-json", encoding="utf-8")
        report = run_packaging(
            modules=["manual"],
            locale="ro",
            private_root=private_root,
            public_root=public_root,
        )
        assert not report.ok
        assert any("Malformed JSON" in error for error in report.errors)

    def test_duplicate_ids(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        snapshot = private_root / "published" / "knowledge-base" / "ro" / "entries.json"
        _write_json(snapshot, _kb_document("ro", ["same", "same"]))
        report = run_packaging(
            modules=["knowledge-base"],
            locale="ro",
            private_root=private_root,
            public_root=public_root,
        )
        assert not report.ok
        assert any("Duplicate IDs" in error for error in report.errors)

    def test_missing_required_source_image(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        snapshot = private_root / "published" / "manual" / "ro" / "document.json"
        _write_json(snapshot, _manual_document("ro", ["chapter-one"], image=IMAGE_A))
        report = run_packaging(
            modules=["manual"],
            locale="ro",
            private_root=private_root,
            public_root=public_root,
        )
        assert not report.ok
        assert any("Missing required source images" in error for error in report.errors)

    def test_website_module_rejected(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        report = run_packaging(
            modules=["website"],
            locale="ro",
            private_root=private_root,
            public_root=public_root,
        )
        assert not report.ok
        assert any("Unsupported module" in error for error in report.errors)


class TestImages:
    def test_dry_run_reports_missing_public_image(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        _seed_kb(private_root, "ro", ["article-one"], image=IMAGE_A)
        _seed_kb(public_root, "ro", ["article-one"])

        report = run_packaging(
            modules=["knowledge-base"],
            locale="ro",
            private_root=private_root,
            public_root=public_root,
        )

        assert report.ok
        assert report.operations[0].missing_destination_images == (IMAGE_A,)
        assert not (public_root / "knowledge-base" / "images" / IMAGE_A).exists()

    def test_apply_copies_required_image(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        _seed_manual(private_root, "ro", ["chapter-one"], image=IMAGE_A, image_bytes=b"payload")
        _seed_manual(public_root, "ro", ["chapter-one"])

        run_packaging(
            modules=["manual"],
            locale="ro",
            apply=True,
            private_root=private_root,
            public_root=public_root,
        )

        dest_image = public_root / "manual" / "images" / IMAGE_A
        assert dest_image.read_bytes() == b"payload"

    def test_unrelated_destination_images_are_not_deleted(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        _seed_manual(private_root, "ro", ["chapter-one"], image=IMAGE_A, image_bytes=b"needed")
        _seed_manual(public_root, "ro", ["chapter-one"], image=IMAGE_A, image_bytes=b"needed")
        leftover = public_root / "manual" / "images" / IMAGE_B
        _write_bytes(leftover, b"keep-me")

        run_packaging(
            modules=["manual"],
            locale="ro",
            apply=True,
            private_root=private_root,
            public_root=public_root,
        )

        assert leftover.read_bytes() == b"keep-me"


class TestDestructiveIdRemoval:
    def test_dry_run_reports_removed_ids(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        _seed_kb(private_root, "en", ["only-one"])
        _seed_kb(public_root, "en", [f"sample-{index}" for index in range(12)])

        report = run_packaging(
            modules=["knowledge-base"],
            locale="en",
            private_root=private_root,
            public_root=public_root,
        )

        assert report.ok
        assert report.operations[0].destructive
        assert report.operations[0].destination_count == 12
        assert report.operations[0].source_count == 1
        assert len(report.operations[0].removed_ids) == 12

    def test_normal_apply_refuses_id_removal(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        _seed_kb(private_root, "en", ["only-one"])
        dest = _seed_kb(public_root, "en", [f"sample-{index}" for index in range(12)])
        before = dest.read_bytes()

        report = run_packaging(
            modules=["knowledge-base"],
            locale="en",
            apply=True,
            private_root=private_root,
            public_root=public_root,
        )

        assert not report.ok
        assert not report.applied
        assert any("Apply refused" in error for error in report.errors)
        assert dest.read_bytes() == before

    def test_allow_id_removal_applies_in_fixture(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        source = _seed_kb(private_root, "en", ["only-one"])
        dest = _seed_kb(public_root, "en", [f"sample-{index}" for index in range(12)])

        report = run_packaging(
            modules=["knowledge-base"],
            locale="en",
            apply=True,
            allow_id_removal=True,
            private_root=private_root,
            public_root=public_root,
        )

        assert report.applied
        assert dest.read_bytes() == source.read_bytes()


class TestAllValidateBeforeWrite:
    def test_one_invalid_operation_prevents_every_write(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        _seed_manual(private_root, "ro", ["chapter-one"])
        manual_dest = _seed_manual(public_root, "ro", ["old-chapter"])
        before = manual_dest.read_bytes()
        kb_dest = public_root / "published" / "knowledge-base" / "ro" / "entries.json"
        kb_dest.parent.mkdir(parents=True, exist_ok=True)
        kb_dest.write_text("{broken", encoding="utf-8")

        # KB source is malformed, so the whole request must fail before Manual writes.
        kb_source = private_root / "published" / "knowledge-base" / "ro" / "entries.json"
        kb_source.parent.mkdir(parents=True, exist_ok=True)
        kb_source.write_text("{broken", encoding="utf-8")

        report = run_packaging(
            modules=["manual", "knowledge-base"],
            locale="ro",
            apply=True,
            allow_id_removal=True,
            private_root=private_root,
            public_root=public_root,
        )

        assert not report.applied
        assert not report.ok
        assert manual_dest.read_bytes() == before


class TestPathSafety:
    def test_path_traversal_locale_is_rejected(self, tmp_path: Path):
        private_root, public_root = _layout(tmp_path)
        report = run_packaging(
            modules=["manual"],
            locale="../glossary",
            private_root=private_root,
            public_root=public_root,
        )
        assert not report.ok
        assert any("Unsupported locale" in error for error in report.errors)

    def test_plan_operations_rejects_arbitrary_module_path(self):
        with pytest.raises(PackageContentError, match="Unsupported module"):
            plan_operations(
                ["manual/../glossary"],
                "ro",
                private_root=Path("unused"),
                public_root=Path("unused"),
            )


class TestCli:
    def test_cli_dry_run_exit_zero(self, tmp_path: Path, capsys: pytest.CaptureFixture[str]):
        private_root, public_root = _layout(tmp_path)
        _seed_manual(private_root, "ro", ["one", "two"])
        _seed_manual(public_root, "ro", ["one"])

        exit_code = main(
            [
                "--module",
                "manual",
                "--locale",
                "ro",
                "--private-root",
                str(private_root),
                "--public-root",
                str(public_root),
            ]
        )

        captured = capsys.readouterr()
        assert exit_code == 0
        assert "DRY-RUN" in captured.out
        assert "source count:      2" in captured.out
        assert "No files were modified" in captured.out
