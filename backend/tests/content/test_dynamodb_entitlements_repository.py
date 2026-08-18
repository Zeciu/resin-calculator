"""Tests for DynamoDbEntitlementsRepository and the env-gated repository factory."""

from __future__ import annotations

import boto3
import pytest

from public.product.entitlements import (
    DynamoDbEntitlementsRepository,
    ENTITLEMENTS_TABLE_NAME_ENV,
    EntitlementsServiceUnavailableError,
    HFZWOOD_AWS_PROFILE_ENV,
    HFZWOOD_TASK_ROLE_ARN_ENV,
    STRIPE_CUSTOMER_ID_INDEX_NAME,
    _create_dynamodb_resource,
    empty_entitlement_record,
    get_entitlements_repository,
)

TABLE_NAME = "test-hfzwood-entitlements"


@pytest.fixture
def dynamodb_table():
    # A session-wide moto mock_aws() is already active (see backend/conftest.py)
    # so AWS calls are mocked without re-entering mock_aws() here. moto's mocked
    # backends persist for the life of that outer context rather than resetting
    # per nested `with mock_aws():` block, so this fixture creates its own
    # table (distinct name from the session-wide entitlements table) and drops
    # it in teardown to keep each test isolated.
    resource = boto3.resource("dynamodb", region_name="eu-central-1")
    resource.create_table(
        TableName=TABLE_NAME,
        KeySchema=[{"AttributeName": "userId", "KeyType": "HASH"}],
        AttributeDefinitions=[
            {"AttributeName": "userId", "AttributeType": "S"},
            {"AttributeName": "stripeCustomerId", "AttributeType": "S"},
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": STRIPE_CUSTOMER_ID_INDEX_NAME,
                "KeySchema": [{"AttributeName": "stripeCustomerId", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "KEYS_ONLY"},
            }
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    try:
        yield resource
    finally:
        resource.Table(TABLE_NAME).delete()


class TestDynamoDbEntitlementsRepositoryRecords:
    def test_get_record_returns_empty_record_when_missing(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        record = repository.get_record("user-a")
        assert record["accessTier"] == "free"
        assert record["commercialStatus"] == "none"
        assert record["stripeCustomerId"] is None

    def test_save_then_get_round_trip(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        record = empty_entitlement_record()
        record["accessTier"] = "subscriber"
        record["stripeCustomerId"] = "cus_123"
        record["commercialStatus"] = "active"

        saved = repository.save_record("user-a", record)
        assert saved["accessTier"] == "subscriber"
        assert saved["stripeCustomerId"] == "cus_123"

        loaded = repository.get_record("user-a")
        assert loaded["accessTier"] == "subscriber"
        assert loaded["stripeCustomerId"] == "cus_123"
        assert loaded["commercialStatus"] == "active"

    def test_save_record_normalizes_invalid_access_tier_to_free(self, dynamodb_table):
        # normalize_entitlement_record silently coerces an unrecognized accessTier
        # to "free" before the tier is persisted.
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        record = empty_entitlement_record()
        record["accessTier"] = "enterprise"
        saved = repository.save_record("user-a", record)
        assert saved["accessTier"] == "free"

    def test_save_record_without_stripe_customer_id_omits_attribute(self, dynamodb_table):
        # DynamoDB GSI key attributes cannot be empty strings; verify the item is
        # still written and readable when stripeCustomerId is unset.
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        record = empty_entitlement_record()
        record["accessTier"] = "free"

        repository.save_record("user-a", record)
        loaded = repository.get_record("user-a")
        assert loaded["stripeCustomerId"] is None

    def test_records_isolated_per_user(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        record_a = empty_entitlement_record()
        record_a["accessTier"] = "subscriber"
        record_b = empty_entitlement_record()
        record_b["accessTier"] = "free"

        repository.save_record("user-a", record_a)
        repository.save_record("user-b", record_b)

        assert repository.get_record("user-a")["accessTier"] == "subscriber"
        assert repository.get_record("user-b")["accessTier"] == "free"

    def test_rejects_blank_table_name(self, dynamodb_table):
        with pytest.raises(ValueError, match="table_name"):
            DynamoDbEntitlementsRepository("   ", resource=dynamodb_table)

    def test_credential_failure_is_logged_and_never_normalized_to_free(self, caplog):
        from botocore.exceptions import ClientError

        class FailingTable:
            def get_item(self, **_kwargs):
                raise ClientError(
                    {"Error": {"Code": "ExpiredTokenException", "Message": "temporary token expired"}},
                    "GetItem",
                )

        class Resource:
            def Table(self, _table_name):
                return FailingTable()

        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=Resource())

        with pytest.raises(EntitlementsServiceUnavailableError):
            repository.get_access_tier("user-a")

        assert "entitlements_dynamodb_unavailable" in caplog.text
        assert "ExpiredTokenException" in caplog.text
        assert "temporary token expired" not in caplog.text


class TestDynamoDbEntitlementsRepositoryAccessTier:
    def test_get_access_tier_returns_none_when_missing(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        assert repository.get_access_tier("user-a") is None

    def test_save_and_get_access_tier(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        saved_tier = repository.save_access_tier("user-a", "subscriber")
        assert saved_tier == "subscriber"
        assert repository.get_access_tier("user-a") == "subscriber"

    def test_save_access_tier_rejects_invalid_value(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        with pytest.raises(ValueError, match="Unsupported access tier"):
            repository.save_access_tier("user-a", "enterprise")

    def test_save_access_tier_preserves_other_fields(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        record = empty_entitlement_record()
        record["accessTier"] = "free"
        record["stripeCustomerId"] = "cus_456"
        repository.save_record("user-a", record)

        repository.save_access_tier("user-a", "subscriber")

        loaded = repository.get_record("user-a")
        assert loaded["accessTier"] == "subscriber"
        assert loaded["stripeCustomerId"] == "cus_456"


class TestDynamoDbEntitlementsRepositoryStripeLookup:
    def test_find_user_id_by_stripe_customer_id_via_gsi(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        record = empty_entitlement_record()
        record["accessTier"] = "subscriber"
        record["stripeCustomerId"] = "cus_789"
        repository.save_record("user-a", record)

        found = repository.find_user_id_by_stripe_customer_id("cus_789")
        assert found == "user-a"

    def test_find_user_id_returns_none_when_not_found(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        assert repository.find_user_id_by_stripe_customer_id("cus_missing") is None

    def test_find_user_id_returns_none_for_blank_input(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        assert repository.find_user_id_by_stripe_customer_id("   ") is None
        assert repository.find_user_id_by_stripe_customer_id(None) is None

    def test_find_user_id_reflects_customer_id_change(self, dynamodb_table):
        repository = DynamoDbEntitlementsRepository(TABLE_NAME, resource=dynamodb_table)
        record = empty_entitlement_record()
        record["stripeCustomerId"] = "cus_old"
        repository.save_record("user-a", record)

        updated = repository.get_record("user-a")
        updated["stripeCustomerId"] = "cus_new"
        repository.save_record("user-a", updated)

        assert repository.find_user_id_by_stripe_customer_id("cus_new") == "user-a"


class TestEntitlementsRepositoryFactory:
    def test_raises_when_env_unset(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.delenv(ENTITLEMENTS_TABLE_NAME_ENV, raising=False)
        with pytest.raises(RuntimeError, match=ENTITLEMENTS_TABLE_NAME_ENV):
            get_entitlements_repository()

    def test_raises_when_env_blank(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv(ENTITLEMENTS_TABLE_NAME_ENV, "   ")
        with pytest.raises(RuntimeError, match=ENTITLEMENTS_TABLE_NAME_ENV):
            get_entitlements_repository()

    def test_returns_dynamodb_repository_when_env_set(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv(ENTITLEMENTS_TABLE_NAME_ENV, TABLE_NAME)
        repository = get_entitlements_repository()
        assert isinstance(repository, DynamoDbEntitlementsRepository)

    def test_local_resource_uses_deferred_refreshable_task_role_credentials(
        self, monkeypatch: pytest.MonkeyPatch
    ):
        import public.product.entitlements as entitlements

        source_credentials = object()
        resource = object()
        calls = {}

        class SourceBotocoreSession:
            def create_client(self, *args, **kwargs):
                return (args, kwargs)

        class SourceSession:
            region_name = "eu-central-1"
            _session = SourceBotocoreSession()

            def get_credentials(self):
                return source_credentials

        class TargetBotoSession:
            def resource(self, service_name, region_name=None):
                calls["resource"] = (service_name, region_name)
                return resource

        class Fetcher:
            def __init__(self, **kwargs):
                calls["fetcher"] = kwargs
                calls["fetcher_instance"] = self

            def fetch_credentials(self):
                return {"access_key": "refreshed"}

        class DeferredCredentials:
            def __init__(self, **kwargs):
                calls["deferred"] = kwargs

        class BotocoreSession:
            def set_config_variable(self, key, value):
                calls["config"] = (key, value)

        def session_factory(**kwargs):
            if "profile_name" in kwargs:
                calls["profile_name"] = kwargs["profile_name"]
                return SourceSession()
            calls["botocore_session"] = kwargs["botocore_session"]
            return TargetBotoSession()

        monkeypatch.setenv(HFZWOOD_AWS_PROFILE_ENV, "hfzwood")
        monkeypatch.setenv(HFZWOOD_TASK_ROLE_ARN_ENV, "arn:aws:iam::123456789012:role/task")
        monkeypatch.setenv("AWS_DEFAULT_REGION", "eu-central-1")
        monkeypatch.setattr(boto3, "Session", session_factory)
        monkeypatch.setattr(entitlements, "get_botocore_session", BotocoreSession)
        monkeypatch.setattr(entitlements, "AssumeRoleCredentialFetcher", Fetcher)
        monkeypatch.setattr(entitlements, "DeferredRefreshableCredentials", DeferredCredentials)

        assert _create_dynamodb_resource() is resource
        assert calls["profile_name"] == "hfzwood"
        assert calls["fetcher"]["source_credentials"] is source_credentials
        assert calls["fetcher"]["role_arn"].endswith(":role/task")
        assert calls["deferred"]["refresh_using"].__self__ is calls["fetcher_instance"]
        assert calls["deferred"]["method"] == "assume-role"
        assert calls["botocore_session"].__class__ is BotocoreSession
        assert calls["config"] == ("region", "eu-central-1")
        assert calls["resource"] == ("dynamodb", "eu-central-1")
