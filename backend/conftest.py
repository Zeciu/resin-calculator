import os
import sys
from pathlib import Path

import boto3
import pytest
from moto import mock_aws

# Editorial tests exercise the source-only local composition, available
# because backend/private is present on the local filesystem (it is excluded
# from the Docker build context, so production never mounts these routes).

# public.app requires complete Cognito configuration to import at all (no
# mock-auth fallback). Tests that import the app module (directly or via the
# app.py compatibility shim) need placeholder values; individual tests that
# exercise Cognito configuration failure paths override/unset these via
# monkeypatch.
os.environ.setdefault("COGNITO_USER_POOL_ID", "eu-central-1_testpool")
os.environ.setdefault("COGNITO_REGION", "eu-central-1")
os.environ.setdefault("COGNITO_CLIENT_ID", "test-client-id")

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# public.product.entitlements.get_entitlements_repository() requires
# ENTITLEMENTS_TABLE_NAME (DynamoDB) in every environment; there is no
# filesystem fallback. A session-wide moto-mocked table backs this env var so
# any test that reaches the entitlements repository gets a real, working
# (in-memory, isolated-per-test-run) DynamoDB table instead of crashing or
# making real AWS calls. Tests that need bespoke entitlements behavior still
# use public.product.entitlements.DynamoDbEntitlementsRepository or
# tests.support.in_memory_entitlements_repository.InMemoryEntitlementsRepository
# directly via dependency overrides.
ENTITLEMENTS_TEST_TABLE_NAME = "test-hfzwood-entitlements-shared"
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-central-1")
os.environ.setdefault("ENTITLEMENTS_TABLE_NAME", ENTITLEMENTS_TEST_TABLE_NAME)


@pytest.fixture(scope="session", autouse=True)
def _session_wide_entitlements_table():
    with mock_aws():
        resource = boto3.resource("dynamodb", region_name=os.environ["AWS_DEFAULT_REGION"])
        resource.create_table(
            TableName=ENTITLEMENTS_TEST_TABLE_NAME,
            KeySchema=[{"AttributeName": "userId", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "stripeCustomerId", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "stripeCustomerId-index",
                    "KeySchema": [{"AttributeName": "stripeCustomerId", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "KEYS_ONLY"},
                }
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield
