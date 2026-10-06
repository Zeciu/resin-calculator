from datetime import datetime, timezone

from public.product.capabilities.catalog import CAPABILITY_CATALOG
from public.product.capabilities.resolver import CapabilityResolver
from public.product.promo_grant import PromoGrantService, add_calendar_months
from tests.support.in_memory_entitlements_repository import InMemoryEntitlementsRepository

UTC = timezone.utc


def _dt(year, month, day, hour=0, minute=0, second=0):
    return datetime(year, month, day, hour, minute, second, tzinfo=UTC)


class TestAddCalendarMonths:
    def test_same_day_three_months_later(self):
        assert add_calendar_months(_dt(2026, 9, 20), 3) == _dt(2026, 12, 20)

    def test_january_31_clamps_to_april_30(self):
        assert add_calendar_months(_dt(2026, 1, 31, 15, 30, 12), 3) == _dt(2026, 4, 30, 15, 30, 12)

    def test_november_30_non_leap_february(self):
        assert add_calendar_months(_dt(2026, 11, 30), 3) == _dt(2027, 2, 28)

    def test_november_30_leap_february(self):
        assert add_calendar_months(_dt(2027, 11, 30), 3) == _dt(2028, 2, 29)


class TestPromoGrantService:
    NOW = _dt(2026, 10, 6, 18, 30)

    def _service(self, repository):
        return PromoGrantService(repository, now=lambda: self.NOW)

    def test_user_without_record_gets_subscriber_for_three_months(self):
        repository = InMemoryEntitlementsRepository()
        self._service(repository).ensure_for_user("user-a")
        record = repository.get_record("user-a")
        assert record["accessTier"] == "subscriber"
        assert record["grantExpiresAt"] == int(_dt(2027, 1, 6, 18, 30).timestamp())

    def test_existing_record_is_never_modified(self):
        repository = InMemoryEntitlementsRepository()
        repository.save_access_tier("user-a", "free")
        self._service(repository).ensure_for_user("user-a")
        record = repository.get_record("user-a")
        assert record["accessTier"] == "free"
        assert record["grantExpiresAt"] is None

    def test_repeated_calls_keep_the_first_grant(self):
        repository = InMemoryEntitlementsRepository()
        self._service(repository).ensure_for_user("user-a")
        first = repository.get_record("user-a")["grantExpiresAt"]
        PromoGrantService(repository, now=lambda: _dt(2026, 12, 1)).ensure_for_user("user-a")
        assert repository.get_record("user-a")["grantExpiresAt"] == first

    def test_blank_user_id_is_ignored(self):
        repository = InMemoryEntitlementsRepository()
        self._service(repository).ensure_for_user("  ")
        assert repository.record_exists("  ") is False

    def test_resolver_gives_new_user_subscriber_catalog(self):
        repository = InMemoryEntitlementsRepository()
        resolver = CapabilityResolver(
            repository,
            now=lambda: int(self.NOW.timestamp()),
            promo_grants=self._service(repository),
        )
        payload = resolver.resolve("user-a")
        assert payload.accessTier == "subscriber"
        assert payload.capabilities == CAPABILITY_CATALOG["subscriber"]

    def test_resolver_returns_free_after_promo_expires(self):
        repository = InMemoryEntitlementsRepository()
        self._service(repository).ensure_for_user("user-a")
        expires_at = repository.get_record("user-a")["grantExpiresAt"]
        resolver = CapabilityResolver(
            repository,
            now=lambda: expires_at,
            promo_grants=self._service(repository),
        )
        assert resolver.resolve("user-a").accessTier == "free"
