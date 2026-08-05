"""Production public-image and DynamoDB wiring tests."""

from __future__ import annotations

import json
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[3]
APP_STACK = REPO_ROOT / "deployment" / "cdk" / "lib" / "app-stack.ts"
DOCKERFILE = REPO_ROOT / "Dockerfile"
CDK_OUT_APP_STACK = REPO_ROOT / "deployment" / "cdk" / "cdk.out" / "AppStack.template.json"


def _app_stack_source() -> str:
    return APP_STACK.read_text(encoding="utf-8")


class TestProductionDataWiringSource:
    def test_app_stack_has_no_editorial_filesystem_configuration(self):
        source = _app_stack_source()
        assert "PACKAGED_EDITORIAL_CONTENT_DIR" not in source
        assert "CONTENT_DATA_DIR:" not in source
        assert "EDITORIAL_CONTENT_MODE" not in source
        assert "REQUIRE_CONTENT_DATA_DIR" not in source

    def test_app_stack_points_commercial_user_state_at_dynamodb(self):
        source = _app_stack_source()
        assert "tableName: 'hfzwood-entitlements'" in source
        assert "ENTITLEMENTS_TABLE_NAME: entitlementsTable.tableName" in source
        assert "stripeCustomerId-index" in source
        assert "aws-efs" not in source
        assert "aws-backup" not in source
        assert "COMMERCIAL_DATA_DIR" not in source

    def test_dockerfile_packages_public_runtime_without_editorial_build_stages(self):
        dockerfile = DOCKERFILE.read_text(encoding="utf-8")
        assert "COPY backend/public ./public" in dockerfile
        assert "COPY backend/content ./content" not in dockerfile
        assert "COPY backend/data" not in dockerfile
        assert "editorial-seed-build" not in dockerfile
        assert "/app/content" not in dockerfile


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
        assert "CONTENT_DATA_DIR" not in env
        assert "EDITORIAL_CONTENT_MODE" not in env
        assert "REQUIRE_CONTENT_DATA_DIR" not in env
        assert "COMMERCIAL_DATA_DIR" not in env
        assert "ENTITLEMENTS_TABLE_NAME" in env
        assert "MountPoints" not in container or container["MountPoints"] == []
        assert "Volumes" not in task_defs[0]["Properties"] or task_defs[0]["Properties"]["Volumes"] == []

    def test_dynamodb_tables_synthesized(self):
        template = json.loads(CDK_OUT_APP_STACK.read_text(encoding="utf-8"))
        tables = [
            resource
            for resource in template.get("Resources", {}).values()
            if resource.get("Type") == "AWS::DynamoDB::Table"
        ]
        assert {table["Properties"]["TableName"] for table in tables} == {"hfzwood-entitlements"}
        for table in tables:
            assert table["Properties"]["BillingMode"] == "PAY_PER_REQUEST"
            assert table["DeletionPolicy"] == "Retain"

        efs_or_backup_resources = [
            resource
            for resource in template.get("Resources", {}).values()
            if resource.get("Type", "").startswith("AWS::EFS::")
            or resource.get("Type", "").startswith("AWS::Backup::")
        ]
        assert efs_or_backup_resources == []
