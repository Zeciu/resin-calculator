"""Task B5 — production editorial/commercial data wiring (CDK + release assumptions)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from content.editorial_content_mode import EDITORIAL_CONTENT_MODE_ENV
from content.repositories.filesystem import (
    commercial_data_root,
    default_content_root,
    validate_release_editorial_root,
)
from content.repositories.entitlements import FilesystemEntitlementsRepository
from content.repositories.preferences import FilesystemPreferencesRepository
from content.schemas.preferences import UserPreferences

REPO_ROOT = Path(__file__).resolve().parents[3]
APP_STACK = REPO_ROOT / "deployment" / "cdk" / "lib" / "app-stack.ts"
DOCKERFILE = REPO_ROOT / "Dockerfile"
CDK_OUT_APP_STACK = REPO_ROOT / "deployment" / "cdk" / "cdk.out" / "AppStack.template.json"


def _app_stack_source() -> str:
    return APP_STACK.read_text(encoding="utf-8")


class TestProductionDataWiringSource:
    def test_app_stack_points_editorial_at_packaged_content(self):
        source = _app_stack_source()
        assert "PACKAGED_EDITORIAL_CONTENT_DIR = '/app/content'" in source
        assert "CONTENT_DATA_DIR: PACKAGED_EDITORIAL_CONTENT_DIR" in source
        assert "EDITORIAL_CONTENT_MODE: 'release'" in source

    def test_app_stack_points_commercial_at_existing_efs_mount(self):
        source = _app_stack_source()
        assert "COMMERCIAL_DATA_MOUNT_PATH = '/mnt/hfzwood-content'" in source
        assert "COMMERCIAL_DATA_DIR: COMMERCIAL_DATA_MOUNT_PATH" in source
        assert "containerPath: COMMERCIAL_DATA_MOUNT_PATH" in source
        assert "sourceVolume: 'commercial-data'" in source
        assert "readOnly: false" in source
        # Preserve existing EFS construct IDs (no filesystem replacement).
        assert "EditorialContentFilesystem" in source
        assert "EditorialContentAccessPoint" in source
        assert "path: '/hfzwood-content'" in source

    def test_app_stack_does_not_require_editorial_efs_seeding(self):
        source = _app_stack_source()
        assert "REQUIRE_CONTENT_DATA_DIR" not in source
        assert "CONTENT_DATA_DIR: COMMERCIAL_DATA_MOUNT_PATH" not in source
        assert "CONTENT_DATA_DIR: EDITORIAL_CONTENT_MOUNT_PATH" not in source
        # No path collision: editorial image path != commercial EFS mount.
        assert "'/app/content'" in source
        assert "'/mnt/hfzwood-content'" in source
        assert "/app/content" != "/mnt/hfzwood-content"

    def test_seed_export_path_retained_for_local_writable_mode(self):
        dockerfile = DOCKERFILE.read_text(encoding="utf-8")
        assert "editorial-seed-build" in dockerfile
        assert "COPY --from=editorial-seed-build /app/seed-data ./seed-data" in dockerfile
        assert "COPY backend/data/editorial/content-store.json /app/content/editorial/content-store.json" in dockerfile


class TestReleaseModeDoesNotNeedEfsForEditorial:
    def test_release_validation_uses_content_root_only(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ):
        editorial = tmp_path / "app-content"
        commercial = tmp_path / "mnt-hfzwood-content"
        editorial.mkdir()
        commercial.mkdir()

        # Minimal valid release corpus (no EFS involvement).
        (editorial / "editorial").mkdir()
        (editorial / "published" / "manual" / "en").mkdir(parents=True)
        (editorial / "published" / "glossary" / "en").mkdir(parents=True)
        (editorial / "published" / "knowledge-base" / "en").mkdir(parents=True)
        (editorial / "published" / "website" / "en").mkdir(parents=True)
        (editorial / "config").mkdir()
        (editorial / "editorial" / "content-store.json").write_text(
            json.dumps({"records": {}}), encoding="utf-8"
        )
        for relative, payload in (
            ("published/manual/en/document.json", {"locale": "en", "chapters": []}),
            ("published/glossary/en/entries.json", {"locale": "en", "entries": []}),
            ("published/knowledge-base/en/entries.json", {"locale": "en", "entries": []}),
            ("published/website/en/pages.json", {"locale": "en", "pages": {}}),
            ("config/public-languages.json", {"defaultPublicLocale": "en", "activePublicLocales": ["en"]}),
        ):
            (editorial / relative).write_text(json.dumps(payload), encoding="utf-8")

        monkeypatch.setenv(EDITORIAL_CONTENT_MODE_ENV, "release")
        monkeypatch.setenv("CONTENT_DATA_DIR", str(editorial))
        monkeypatch.setenv("COMMERCIAL_DATA_DIR", str(commercial))
        monkeypatch.delenv("REQUIRE_CONTENT_DATA_DIR", raising=False)

        validate_release_editorial_root(default_content_root())
        assert default_content_root() == editorial
        assert commercial_data_root() == commercial

        entitlements = FilesystemEntitlementsRepository()
        preferences = FilesystemPreferencesRepository()
        entitlements.save_access_tier("user-b5", "subscriber")
        preferences.save_preferences(
            "user-b5",
            UserPreferences(interfaceLanguage="en", lengthUnit="mm", volumeUnit="L"),
        )

        assert (commercial / "entitlements" / "user-b5.json").is_file()
        assert (commercial / "preferences" / "user-b5.json").is_file()
        assert not (editorial / "entitlements").exists()
        assert not (editorial / "preferences").exists()


@pytest.mark.skipif(not CDK_OUT_APP_STACK.is_file(), reason="Run cdk synth first to emit AppStack.template.json")
class TestSynthesizedTaskDefinition:
    def test_task_definition_environment_and_mount(self):
        template = json.loads(CDK_OUT_APP_STACK.read_text(encoding="utf-8"))
        task_defs = [
            resource
            for resource in template.get("Resources", {}).values()
            if resource.get("Type") == "AWS::ECS::TaskDefinition"
        ]
        assert len(task_defs) == 1
        container = task_defs[0]["Properties"]["ContainerDefinitions"][0]
        env = {item["Name"]: item["Value"] for item in container["Environment"]}
        assert env["CONTENT_DATA_DIR"] == "/app/content"
        assert env["EDITORIAL_CONTENT_MODE"] == "release"
        assert env["COMMERCIAL_DATA_DIR"] == "/mnt/hfzwood-content"
        assert "REQUIRE_CONTENT_DATA_DIR" not in env

        mounts = container["MountPoints"]
        assert len(mounts) == 1
        assert mounts[0]["ContainerPath"] == "/mnt/hfzwood-content"
        assert mounts[0]["SourceVolume"] == "commercial-data"
        assert mounts[0]["ReadOnly"] is False

        volumes = task_defs[0]["Properties"]["Volumes"]
        assert len(volumes) == 1
        assert volumes[0]["Name"] == "commercial-data"
        assert "EFSVolumeConfiguration" in volumes[0]
