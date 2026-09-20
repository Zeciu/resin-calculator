from datetime import datetime, timezone

import pytest
from botocore.exceptions import ClientError

from public.product.capabilities.catalog import CAPABILITY_CATALOG
from public.product.capabilities.resolver import CapabilityResolver
from public.product.promo_grant import (
    CognitoAdminUserDirectory,
    PromoGrantService,
    add_calendar_months,
    load_promo_activation_timestamp,
    parse_promo_activation_timestamp,
    promotional_grant_expires_at,
)
from tests.support.in_memory_entitlements_repository import InMemoryEntitlementsRepository

UTC = timezone.utc


def _dt(year, month, day, hour=0, minute=0, second=0):
    return datetime(year, month, day, hour, minute, second, tzinfo=UTC)


class FakeCognitoUserDirectory:
    def __init__(self, created_at_by_user_id=None, *, error=None):
        self.created_at_by_user_id = created_at_by_user_id or {}
        self.error = error
        self.calls = []

    def get_user_create_date(self, user_id, *, username=None):
        self.calls.append({"user_id": user_id, "username": username})
        if self.error is not None:
            if isinstance(self.error, Exception):
                raise self.error
            return None
        return self.created_at_by_user_id.get(user_id)


class TestAddCalendarMonths:
    def test_same_day_three_months_later(self):
        assert add_calendar_months(_dt(2026, 9, 20), 3) == _dt(2026, 12, 20)

    def test_january_31_clamps_to_april_30(self):
        assert add_calendar_months(_dt(2026, 1, 31, 15, 30, 12), 3) == _dt(2026, 4, 30, 15, 30, 12)

    def test_november_30_non_leap_february(self):
        assert add_calendar_months(_dt(2026, 11, 30), 3) == _dt(2027, 2, 28)

    def test_november_30_leap_february(self):
        assert add_calendar_months(_dt(2027, 11, 30), 3) == _dt(2028, 2, 29)

    def test_leap_day_preserves_day_when_target_allows(self):
        assert add_calendar_months(_dt(2024, 2, 29), 3) == _dt(2024, 5, 29)


class TestPromoActivationConfig:
    def test_parses_zulu_iso(self):
        parsed = parse_promo_activation_timestamp("2026-09-20T12:00:00Z")
        assert parsed == _dt(2026, 9, 20, 12)

    def test_rejects_missing_and_blank(self):
        assert parse_promo_activation_timestamp(None) is None
        assert parse_promo_activation_timestamp("  ") is None

    def test_rejects_naive_datetime(self):
        assert parse_promo_activation_timestamp("2026-09-20T12:00:00") is None
        assert parse_promo_activation_timestamp("2026-09-20") is None

    def test_rejects_invalid(self):
        assert parse_promo_activation_timestamp("not-a-date") is None
        assert parse_promo_activation_timestamp("2026-13-40T00:00:00Z") is None

    def test_load_from_env(self, monkeypatch):
        monkeypatch.setenv("HFZWOOD_PROMO_ACTIVATED_AT", "2026-09-20T00:00:00Z")
        assert load_promo_activation_timestamp() == _dt(2026, 9, 20)

    def test_load_missing_env_is_none(self):
        assert load_promo_activation_timestamp() is None


class TestPromotionalGrantExpiry:
    def test_new_user_uses_create_date(self):
        expiry = promotional_grant_expires_at(_dt(2026, 9, 20), _dt(2026, 9, 1))
        assert expiry == _dt(2026, 12, 20)

    def test_pre_activation_user_uses_activation(self):
        expiry = promotional_grant_expires_at(_dt(2026, 1, 10), _dt(2026, 9, 20))
        assert expiry == _dt(2026, 12, 20)

    def test_created_exactly_at_activation_uses_create_date(self):
        activation = _dt(2026, 9, 20, 12)
        expiry = promotional_grant_expires_at(activation, activation)
        assert expiry == _dt(2026, 12, 20, 12)


class TestPromoGrantService:
    ACTIVATION = _dt(2026, 9, 20)

    def _service(self, repository, directory, activation=ACTIVATION):
        return PromoGrantService(
            repository,
            user_directory=directory,
            activation=activation,
        )

    def test_new_user_writes_create_date_plus_three_months(self):
        repository = InMemoryEntitlementsRepository()
        directory = FakeCognitoUserDirectory({"user-a": _dt(2026, 9, 25, 8, 15)})
        self._service(repository, directory).ensure_for_user("user-a")
        expected = int(_dt(2026, 12, 25, 8, 15).timestamp())
        assert repository.get_record("user-a")["grantExpiresAt"] == expected
        assert directory.calls == [{"user_id": "user-a", "username": None}]

    def test_pre_activation_user_writes_activation_plus_three_months(self):
        repository = InMemoryEntitlementsRepository()
        directory = FakeCognitoUserDirectory({"user-a": _dt(2026, 1, 2)})
        self._service(repository, directory).ensure_for_user("user-a")
        assert repository.get_record("user-a")["grantExpiresAt"] == int(
            _dt(2026, 12, 20).timestamp()
        )

    def test_created_exactly_at_activation_uses_create_date(self):
        repository = InMemoryEntitlementsRepository()
        created = _dt(2026, 9, 20, 12, 0, 1)
        directory = FakeCognitoUserDirectory({"user-a": created})
        self._service(repository, directory).ensure_for_user("user-a")
        assert repository.get_record("user-a")["grantExpiresAt"] == int(
            add_calendar_months(created, 3).timestamp()
        )

    def test_first_login_days_after_signup_does_not_shift_expiry(self):
        repository = InMemoryEntitlementsRepository()
        created = _dt(2026, 9, 20)
        directory = FakeCognitoUserDirectory({"user-a": created})
        self._service(repository, directory).ensure_for_user("user-a")
        assert repository.get_record("user-a")["grantExpiresAt"] == int(
            _dt(2026, 12, 20).timestamp()
        )
        assert repository.get_record("user-a")["grantExpiresAt"] != int(
            _dt(2026, 12, 25).timestamp()
        )

    def test_existing_grant_skips_cognito_and_write(self):
        repository = InMemoryEntitlementsRepository()
        repository.set_grant_expires_at_if_absent("user-a", 1_111_111_111)
        directory = FakeCognitoUserDirectory({"user-a": _dt(2026, 9, 25)})
        self._service(repository, directory).ensure_for_user("user-a")
        assert directory.calls == []
        assert repository.get_record("user-a")["grantExpiresAt"] == 1_111_111_111

    def test_manually_modified_grant_is_not_changed(self):
        repository = InMemoryEntitlementsRepository()
        repository.save_record("user-a", {"accessTier": "free"})
        repository.set_grant_expires_at_if_absent("user-a", 1_222_222_222)
        directory = FakeCognitoUserDirectory({"user-a": _dt(2026, 9, 25)})
        self._service(repository, directory).ensure_for_user("user-a")
        assert directory.calls == []
        assert repository.get_record("user-a")["grantExpiresAt"] == 1_222_222_222

    def test_missing_activation_does_not_grant(self):
        repository = InMemoryEntitlementsRepository()
        directory = FakeCognitoUserDirectory({"user-a": _dt(2026, 9, 25)})
        PromoGrantService(
            repository, user_directory=directory, activation=None
        ).ensure_for_user("user-a")
        assert directory.calls == []
        assert repository.get_record("user-a")["grantExpiresAt"] is None

    def test_invalid_activation_env_does_not_grant(self, monkeypatch):
        monkeypatch.setenv("HFZWOOD_PROMO_ACTIVATED_AT", "not-a-timestamp")
        repository = InMemoryEntitlementsRepository()
        directory = FakeCognitoUserDirectory({"user-a": _dt(2026, 9, 25)})
        PromoGrantService(repository, user_directory=directory).ensure_for_user("user-a")
        assert directory.calls == []
        assert repository.get_record("user-a")["grantExpiresAt"] is None

    def test_admin_get_user_failure_writes_nothing_and_can_retry(self):
        repository = InMemoryEntitlementsRepository()
        directory = FakeCognitoUserDirectory(error=True)
        service = self._service(repository, directory)
        service.ensure_for_user("user-a")
        assert repository.get_record("user-a")["grantExpiresAt"] is None
        directory.error = None
        directory.created_at_by_user_id = {"user-a": _dt(2026, 9, 25)}
        service.ensure_for_user("user-a")
        assert repository.get_record("user-a")["grantExpiresAt"] == int(
            _dt(2026, 12, 25).timestamp()
        )

    def test_conditional_write_keeps_existing_grant(self):
        repository = InMemoryEntitlementsRepository()
        assert repository.set_grant_expires_at_if_absent("user-a", 1_850_000_000) is True
        assert repository.set_grant_expires_at_if_absent("user-a", 1_999_000_000) is False
        assert repository.get_record("user-a")["grantExpiresAt"] == 1_850_000_000

    def test_grant_write_does_not_change_stripe_fields(self):
        repository = InMemoryEntitlementsRepository()
        repository.save_record(
            "user-a",
            {
                "accessTier": "subscriber",
                "stripeCustomerId": "cus_1",
                "stripeSubscriptionId": "sub_1",
                "stripePriceId": "price_1",
                "commercialStatus": "active",
                "currentPeriodEnd": 1_800_000_000,
                "cancelAtPeriodEnd": True,
            },
        )
        directory = FakeCognitoUserDirectory({"user-a": _dt(2026, 9, 25)})
        self._service(repository, directory).ensure_for_user("user-a")
        loaded = repository.get_record("user-a")
        assert loaded["accessTier"] == "subscriber"
        assert loaded["stripeCustomerId"] == "cus_1"
        assert loaded["stripeSubscriptionId"] == "sub_1"
        assert loaded["stripePriceId"] == "price_1"
        assert loaded["commercialStatus"] == "active"
        assert loaded["currentPeriodEnd"] == 1_800_000_000
        assert loaded["cancelAtPeriodEnd"] is True
        assert loaded["grantExpiresAt"] == int(_dt(2026, 12, 25).timestamp())

    def test_stale_commercial_save_cannot_erase_grant_written_after_read(self):
        repository = InMemoryEntitlementsRepository()
        stripe_view = repository.get_record("user-a")
        assert stripe_view["grantExpiresAt"] is None
        repository.set_grant_expires_at_if_absent("user-a", 1_850_000_000)
        stripe_view["accessTier"] = "subscriber"
        stripe_view["stripeCustomerId"] = "cus_race"
        stripe_view["commercialStatus"] = "active"
        stripe_view["grantExpiresAt"] = None
        repository.save_record("user-a", stripe_view)
        loaded = repository.get_record("user-a")
        assert loaded["grantExpiresAt"] == 1_850_000_000
        assert loaded["accessTier"] == "subscriber"
        assert loaded["stripeCustomerId"] == "cus_race"

    def test_grant_write_after_commercial_save_keeps_both(self):
        repository = InMemoryEntitlementsRepository()
        repository.save_record(
            "user-a",
            {
                "accessTier": "subscriber",
                "stripeCustomerId": "cus_first",
                "commercialStatus": "active",
                "currentPeriodEnd": 1_800_000_000,
            },
        )
        repository.set_grant_expires_at_if_absent("user-a", 1_850_000_000)
        loaded = repository.get_record("user-a")
        assert loaded["grantExpiresAt"] == 1_850_000_000
        assert loaded["accessTier"] == "subscriber"
        assert loaded["stripeCustomerId"] == "cus_first"
        assert loaded["currentPeriodEnd"] == 1_800_000_000

    def test_resolver_uses_grant_for_subscriber_catalog(self):
        repository = InMemoryEntitlementsRepository()
        directory = FakeCognitoUserDirectory({"user-a": _dt(2026, 9, 25)})
        resolver = CapabilityResolver(
            repository,
            now=lambda: int(_dt(2026, 10, 1).timestamp()),
            promo_grants=self._service(repository, directory),
        )
        payload = resolver.resolve("user-a")
        assert payload.accessTier == "subscriber"
        assert payload.capabilities == CAPABILITY_CATALOG["subscriber"]


class TestCognitoAdminUserDirectory:
    def test_uses_sub_and_returns_create_date(self):
        created = _dt(2026, 9, 20, 9)

        class Client:
            def admin_get_user(self, UserPoolId, Username):
                assert UserPoolId == "eu-central-1_testpool"
                assert Username == "user-a"
                return {"UserCreateDate": created}

        directory = CognitoAdminUserDirectory(
            user_pool_id="eu-central-1_testpool",
            region="eu-central-1",
            client_factory=Client,
        )
        assert directory.get_user_create_date("user-a") == created

    def test_tries_username_then_sub(self):
        created = _dt(2026, 9, 20)
        calls = []

        class Client:
            def admin_get_user(self, UserPoolId, Username):
                calls.append(Username)
                if Username == "user-a":
                    return {"UserCreateDate": created}
                error = ClientError(
                    {"Error": {"Code": "UserNotFoundException", "Message": "missing"}},
                    "AdminGetUser",
                )
                raise error

        directory = CognitoAdminUserDirectory(
            user_pool_id="pool",
            client_factory=Client,
        )
        assert directory.get_user_create_date("user-a", username="alias@example.com") == created
        assert calls == ["alias@example.com", "user-a"]

    def test_access_denied_does_not_raise(self):
        class Client:
            def admin_get_user(self, UserPoolId, Username):
                raise ClientError(
                    {"Error": {"Code": "AccessDeniedException", "Message": "denied"}},
                    "AdminGetUser",
                )

        directory = CognitoAdminUserDirectory(
            user_pool_id="pool",
            client_factory=Client,
        )
        assert directory.get_user_create_date("user-a") is None
