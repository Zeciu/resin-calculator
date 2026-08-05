"""Task B5 / DynamoDB migration — production editorial/commercial data wiring (CDK + release assumptions)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from content.editorial_content_mode import EDITORIAL_CONTENT_MODE_ENV
from content.repositories.filesystem import (
    default_content_root,
    validate_release_editorial_root,
)

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

    def test_app_stack_points_commercial_user_state_at_dynamodb(self):
        source = _app_stack_source()
        assert "tableName: 'hfzwood-entitlements'" in source
        assert "ENTITLEMENTS_TABLE_NAME: entitlementsTable.tableName" in source
        assert "stripeCustomerId-index" in source
        # EFS was fully removed as the commercial/user persistence layer.
        assert "aws-efs" not in source
        assert "aws-backup" not in source
        assert "COMMERCIAL_DATA_DIR" not in source

    def test_app_stack_does_not_require_editorial_efs_seeding(self):
        source = _app_stack_source()
        assert "REQUIRE_CONTENT_DATA_DIR" not in source
        assert "'/app/content'" in source

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
        editorial.mkdir()

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
        monkeypatch.delenv("REQUIRE_CONTENT_DATA_DIR", raising=False)

        validate_release_editorial_root(default_content_root())
        assert default_content_root() == editorial


@pytest.mark.skipif(not CDK_OUT_APP_STACK.is_file(), reason="Run cdk synth first to emit AppStack.template.json")
class TestSynthesizedTaskDefinition:
    def test_task_definition_environment(self):
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
        assert "REQUIRE_CONTENT_DATA_DIR" not in env
        assert "COMMERCIAL_DATA_DIR" not in env
        assert "ENTITLEMENTS_TABLE_NAME" in env

        # No EFS volume/mount remains on the task definition.
        assert "MountPoints" not in container or container["MountPoints"] == []
        assert "Volumes" not in task_defs[0]["Properties"] or task_defs[0]["Properties"]["Volumes"] == []

    def test_dynamodb_tables_synthesized(self):
        template = json.loads(CDK_OUT_APP_STACK.read_text(encoding="utf-8"))
        tables = [
            resource
            for resource in template.get("Resources", {}).values()
            if resource.get("Type") == "AWS::DynamoDB::Table"
        ]
        table_names = {table["Properties"]["TableName"] for table in tables}
        assert table_names == {"hfzwood-entitlements"}
        for table in tables:
            assert table["Properties"]["BillingMode"] == "PAY_PER_REQUEST"
            assert table["DeletionPolicy"] == "Retain"

        efs_resources = [
            resource
            for resource in template.get("Resources", {}).values()
            if resource.get("Type", "").startswith("AWS::EFS::")
            or resource.get("Type", "").startswith("AWS::Backup::")
        ]
        assert efs_resources == []
