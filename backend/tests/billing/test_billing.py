from __future__ import annotations

from copy import deepcopy
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from content.repositories.entitlements import FilesystemEntitlementsRepository
from content.routers import billing as billing_router_module
from content.routers.billing import router as billing_router
from product.billing.config import BillingConfig
from product.billing.mapping import map_stripe_subscription_to_entitlement
from product.billing.service import BillingService
from product.capabilities.resolver import CapabilityResolver


class FakeStripeGateway:
    def __init__(self) -> None:
        self.customers: dict[str, dict[str, Any]] = {}
        self.subscriptions: dict[str, dict[str, Any]] = {}
        self.checkout_sessions: list[dict[str, Any]] = []
        self.portal_sessions: list[dict[str, Any]] = []
        self.webhook_secret = "whsec_test"
        self._customer_seq = 0
        self._subscription_seq = 0
        self.fail_signature = False

    def create_customer(self, *, user_id: str, email: str | None = None) -> dict[str, Any]:
        self._customer_seq += 1
        customer_id = f"cus_test_{self._customer_seq}"
        self.customers[customer_id] = {
            "id": customer_id,
            "email": email,
            "metadata": {"hfzwood_user_id": user_id},
        }
        return {"id": customer_id}

    def create_checkout_session(
        self,
        *,
        customer_id: str,
        user_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
    ) -> dict[str, Any]:
        assert price_id == "price_monthly_allowed"
        session = {
            "id": f"cs_test_{len(self.checkout_sessions) + 1}",
            "url": f"https://checkout.stripe.test/{customer_id}",
            "customer": customer_id,
            "client_reference_id": user_id,
            "metadata": {"hfzwood_user_id": user_id},
            "success_url": success_url,
            "cancel_url": cancel_url,
            "price_id": price_id,
        }
        self.checkout_sessions.append(session)
        return {"id": session["id"], "url": session["url"]}

    def create_portal_session(self, *, customer_id: str, return_url: str) -> dict[str, Any]:
        session = {
            "id": f"bps_test_{len(self.portal_sessions) + 1}",
            "url": f"https://portal.stripe.test/{customer_id}",
            "customer": customer_id,
            "return_url": return_url,
        }
        self.portal_sessions.append(session)
        return {"id": session["id"], "url": session["url"]}

    def construct_webhook_event(self, payload: bytes, signature: str) -> dict[str, Any]:
        if self.fail_signature or signature != "sig_valid":
            raise ValueError("Invalid signature")
        import json

        return json.loads(payload.decode("utf-8"))

    def retrieve_subscription(self, subscription_id: str) -> dict[str, Any]:
        if subscription_id not in self.subscriptions:
            raise LookupError(f"Unknown subscription {subscription_id}")
        return deepcopy(self.subscriptions[subscription_id])

    def seed_subscription(
        self,
        *,
        user_id: str,
        status: str = "active",
        customer_id: str = "cus_existing",
        subscription_id: str = "sub_existing",
        cancel_at_period_end: bool = False,
        current_period_end: int = 1_800_000_000,
        price_id: str = "price_monthly_allowed",
    ) -> dict[str, Any]:
        subscription = {
            "id": subscription_id,
            "status": status,
            "customer": customer_id,
            "cancel_at_period_end": cancel_at_period_end,
            "current_period_end": current_period_end,
            "metadata": {"hfzwood_user_id": user_id},
            "items": {"data": [{"price": {"id": price_id}}]},
        }
        self.subscriptions[subscription_id] = subscription
        return subscription


@pytest.fixture
def billing_config() -> BillingConfig:
    return BillingConfig(
        stripe_secret_key="sk_test_x",
        stripe_webhook_secret="whsec_test",
        stripe_price_id="price_monthly_allowed",
        checkout_success_url="https://hfzwood.com/account?billing=success",
        checkout_cancel_url="https://hfzwood.com/account?billing=cancel",
        portal_return_url="https://hfzwood.com/account",
    )


@pytest.fixture
def entitlements_repo(tmp_path) -> FilesystemEntitlementsRepository:
    return FilesystemEntitlementsRepository(tmp_path)


@pytest.fixture
def fake_stripe() -> FakeStripeGateway:
    return FakeStripeGateway()


@pytest.fixture
def billing_service(billing_config, entitlements_repo, fake_stripe) -> BillingService:
    return BillingService(
        config=billing_config,
        entitlements=entitlements_repo,
        stripe=fake_stripe,
    )


@pytest.fixture
def billing_client(tmp_path, monkeypatch, billing_config, fake_stripe):
    monkeypatch.setenv("AUTH_MODE", "mock")
    monkeypatch.setenv("CONTENT_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("STRIPE_SECRET_KEY", billing_config.stripe_secret_key)
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", billing_config.stripe_webhook_secret)
    monkeypatch.setenv("STRIPE_PRICE_ID", billing_config.stripe_price_id)
    monkeypatch.setenv("STRIPE_CHECKOUT_SUCCESS_URL", billing_config.checkout_success_url)
    monkeypatch.setenv("STRIPE_CHECKOUT_CANCEL_URL", billing_config.checkout_cancel_url)
    monkeypatch.setenv("STRIPE_PORTAL_RETURN_URL", billing_config.portal_return_url)
    monkeypatch.delenv("CAPABILITY_DEV_ACCESS_TIER", raising=False)

    repository = FilesystemEntitlementsRepository(tmp_path)
    service = BillingService(
        config=billing_config,
        entitlements=repository,
        stripe=fake_stripe,
    )
    resolver = CapabilityResolver(repository)

    app = FastAPI()
    app.include_router(billing_router, prefix="/api")
    app.dependency_overrides[billing_router_module.get_entitlements_repository] = lambda: repository
    app.dependency_overrides[billing_router_module.get_billing_service] = lambda: service
    app.dependency_overrides[billing_router_module.get_capability_resolver] = lambda: resolver

    with TestClient(app) as client:
        yield client, repository, fake_stripe, resolver


def auth_headers(user_id: str = "user-a", role: str = "user") -> dict[str, str]:
    return {"X-Mock-User-Id": user_id, "X-Mock-Role": role}


class TestCommercialMapping:
    def test_active_maps_to_subscriber(self):
        mapped = map_stripe_subscription_to_entitlement(
            {
                "id": "sub_1",
                "status": "active",
                "customer": "cus_1",
                "cancel_at_period_end": True,
                "current_period_end": 100,
                "items": {"data": [{"price": {"id": "price_monthly_allowed"}}]},
            }
        )
        assert mapped["accessTier"] == "subscriber"
        assert mapped["commercialStatus"] == "active"
        assert mapped["cancelAtPeriodEnd"] is True

    def test_canceled_maps_to_free(self):
        mapped = map_stripe_subscription_to_entitlement(
            {
                "id": "sub_1",
                "status": "canceled",
                "customer": "cus_1",
                "items": {"data": [{"price": {"id": "price_monthly_allowed"}}]},
            },
            previous_access_tier="subscriber",
        )
        assert mapped["accessTier"] == "free"
        assert mapped["commercialStatus"] == "canceled"

    def test_past_due_keeps_subscriber(self):
        mapped = map_stripe_subscription_to_entitlement(
            {
                "id": "sub_1",
                "status": "past_due",
                "customer": "cus_1",
                "items": {"data": [{"price": {"id": "price_monthly_allowed"}}]},
            },
            previous_access_tier="subscriber",
        )
        assert mapped["accessTier"] == "subscriber"
        assert mapped["commercialStatus"] == "past_due"


class TestBillingService:
    def test_checkout_reuses_existing_customer(self, billing_service, entitlements_repo, fake_stripe):
        entitlements_repo.save_record(
            "user-a",
            {
                "accessTier": "free",
                "stripeCustomerId": "cus_existing",
            },
        )
        result = billing_service.create_checkout_session(user_id="user-a")
        assert result["url"].startswith("https://checkout.stripe.test/")
        assert len(fake_stripe.customers) == 0
        assert fake_stripe.checkout_sessions[0]["customer"] == "cus_existing"

    def test_checkout_creates_customer_when_missing(self, billing_service, entitlements_repo, fake_stripe):
        result = billing_service.create_checkout_session(user_id="user-a")
        assert result["url"]
        record = entitlements_repo.get_record("user-a")
        assert record["stripeCustomerId"] == "cus_test_1"
        assert fake_stripe.customers["cus_test_1"]["metadata"]["hfzwood_user_id"] == "user-a"

    def test_portal_requires_customer(self, billing_service):
        with pytest.raises(LookupError):
            billing_service.create_portal_session(user_id="user-a")

    def test_checkout_completed_retrieves_subscription_before_grant(
        self, billing_service, entitlements_repo, fake_stripe
    ):
        fake_stripe.seed_subscription(user_id="user-a")
        event = {
            "id": "evt_checkout_1",
            "type": "checkout.session.completed",
            "created": 1000,
            "data": {
                "object": {
                    "customer": "cus_existing",
                    "subscription": "sub_existing",
                    "metadata": {"hfzwood_user_id": "user-a"},
                    "client_reference_id": "user-a",
                }
            },
        }
        import json

        result = billing_service.process_webhook(
            payload=json.dumps(event).encode("utf-8"),
            signature="sig_valid",
        )
        assert result["status"] == "applied"
        record = entitlements_repo.get_record("user-a")
        assert record["accessTier"] == "subscriber"
        assert record["stripeSubscriptionId"] == "sub_existing"
        assert record["lastStripeEventId"] == "evt_checkout_1"

    def test_duplicate_event_is_idempotent(self, billing_service, entitlements_repo, fake_stripe):
        fake_stripe.seed_subscription(user_id="user-a")
        event = {
            "id": "evt_dup",
            "type": "customer.subscription.updated",
            "created": 2000,
            "data": {"object": fake_stripe.subscriptions["sub_existing"]},
        }
        import json

        payload = json.dumps(event).encode("utf-8")
        first = billing_service.process_webhook(payload=payload, signature="sig_valid")
        second = billing_service.process_webhook(payload=payload, signature="sig_valid")
        assert first["status"] == "applied"
        assert second["status"] == "duplicate"
        assert entitlements_repo.get_record("user-a")["accessTier"] == "subscriber"

    def test_out_of_order_event_does_not_corrupt_state(
        self, billing_service, entitlements_repo, fake_stripe
    ):
        fake_stripe.seed_subscription(user_id="user-a", status="active")
        import json

        newer = {
            "id": "evt_new",
            "type": "customer.subscription.updated",
            "created": 3000,
            "data": {"object": fake_stripe.subscriptions["sub_existing"]},
        }
        billing_service.process_webhook(
            payload=json.dumps(newer).encode("utf-8"),
            signature="sig_valid",
        )
        after_new = entitlements_repo.get_record("user-a")
        assert after_new["accessTier"] == "subscriber"
        assert after_new["lastStripeEventId"] == "evt_new"
        assert after_new["lastStripeEventCreated"] == 3000

        fake_stripe.subscriptions["sub_existing"]["status"] = "canceled"
        older = {
            "id": "evt_old",
            "type": "customer.subscription.updated",
            "created": 1000,
            "data": {"object": fake_stripe.subscriptions["sub_existing"]},
        }
        result = billing_service.process_webhook(
            payload=json.dumps(older).encode("utf-8"),
            signature="sig_valid",
        )
        assert result["status"] == "stale"
        after_stale = entitlements_repo.get_record("user-a")
        assert after_stale["accessTier"] == "subscriber"
        assert after_stale["stripeSubscriptionId"] == "sub_existing"
        assert after_stale["lastStripeEventId"] == "evt_new"
        assert after_stale["lastStripeEventCreated"] == 3000
        assert "evt_old" in after_stale["processedEventIds"]

    def test_older_deleted_for_prior_subscription_does_not_regress_newer(
        self, billing_service, entitlements_repo, fake_stripe
    ):
        import json

        fake_stripe.seed_subscription(
            user_id="user-a",
            status="active",
            customer_id="cus_existing",
            subscription_id="sub_a",
        )
        billing_service.process_webhook(
            payload=json.dumps(
                {
                    "id": "evt_a_active",
                    "type": "customer.subscription.updated",
                    "created": 1000,
                    "data": {"object": fake_stripe.subscriptions["sub_a"]},
                }
            ).encode("utf-8"),
            signature="sig_valid",
        )

        fake_stripe.seed_subscription(
            user_id="user-a",
            status="active",
            customer_id="cus_existing",
            subscription_id="sub_b",
        )
        billing_service.process_webhook(
            payload=json.dumps(
                {
                    "id": "evt_b_active",
                    "type": "customer.subscription.updated",
                    "created": 3000,
                    "data": {"object": fake_stripe.subscriptions["sub_b"]},
                }
            ).encode("utf-8"),
            signature="sig_valid",
        )
        after_b = entitlements_repo.get_record("user-a")
        assert after_b["accessTier"] == "subscriber"
        assert after_b["stripeSubscriptionId"] == "sub_b"
        assert after_b["lastStripeEventCreated"] == 3000

        fake_stripe.subscriptions["sub_a"]["status"] = "canceled"
        result = billing_service.process_webhook(
            payload=json.dumps(
                {
                    "id": "evt_a_deleted_late",
                    "type": "customer.subscription.deleted",
                    "created": 1500,
                    "data": {"object": fake_stripe.subscriptions["sub_a"]},
                }
            ).encode("utf-8"),
            signature="sig_valid",
        )
        assert result["status"] == "stale"
        final = entitlements_repo.get_record("user-a")
        assert final["accessTier"] == "subscriber"
        assert final["stripeSubscriptionId"] == "sub_b"
        assert final["commercialStatus"] == "active"
        assert final["lastStripeEventId"] == "evt_b_active"
        assert final["lastStripeEventCreated"] == 3000
        assert "evt_a_deleted_late" in final["processedEventIds"]

    def test_older_updated_for_prior_subscription_does_not_regress_newer(
        self, billing_service, entitlements_repo, fake_stripe
    ):
        import json

        fake_stripe.seed_subscription(
            user_id="user-a",
            status="active",
            subscription_id="sub_a",
        )
        billing_service.process_webhook(
            payload=json.dumps(
                {
                    "id": "evt_a",
                    "type": "customer.subscription.updated",
                    "created": 1000,
                    "data": {"object": fake_stripe.subscriptions["sub_a"]},
                }
            ).encode("utf-8"),
            signature="sig_valid",
        )
        fake_stripe.seed_subscription(
            user_id="user-a",
            status="active",
            subscription_id="sub_b",
        )
        billing_service.process_webhook(
            payload=json.dumps(
                {
                    "id": "evt_b",
                    "type": "customer.subscription.updated",
                    "created": 3000,
                    "data": {"object": fake_stripe.subscriptions["sub_b"]},
                }
            ).encode("utf-8"),
            signature="sig_valid",
        )

        fake_stripe.subscriptions["sub_a"]["status"] = "canceled"
        result = billing_service.process_webhook(
            payload=json.dumps(
                {
                    "id": "evt_a_old_update",
                    "type": "customer.subscription.updated",
                    "created": 1200,
                    "data": {"object": fake_stripe.subscriptions["sub_a"]},
                }
            ).encode("utf-8"),
            signature="sig_valid",
        )
        assert result["status"] == "stale"
        final = entitlements_repo.get_record("user-a")
        assert final["accessTier"] == "subscriber"
        assert final["stripeSubscriptionId"] == "sub_b"
        assert final["lastStripeEventCreated"] == 3000

    def test_duplicate_stale_prior_subscription_event_is_idempotent(
        self, billing_service, entitlements_repo, fake_stripe
    ):
        import json

        fake_stripe.seed_subscription(user_id="user-a", subscription_id="sub_a")
        billing_service.process_webhook(
            payload=json.dumps(
                {
                    "id": "evt_a",
                    "type": "customer.subscription.updated",
                    "created": 1000,
                    "data": {"object": fake_stripe.subscriptions["sub_a"]},
                }
            ).encode("utf-8"),
            signature="sig_valid",
        )
        fake_stripe.seed_subscription(user_id="user-a", subscription_id="sub_b")
        billing_service.process_webhook(
            payload=json.dumps(
                {
                    "id": "evt_b",
                    "type": "customer.subscription.updated",
                    "created": 3000,
                    "data": {"object": fake_stripe.subscriptions["sub_b"]},
                }
            ).encode("utf-8"),
            signature="sig_valid",
        )

        fake_stripe.subscriptions["sub_a"]["status"] = "canceled"
        stale = {
            "id": "evt_a_stale",
            "type": "customer.subscription.deleted",
            "created": 1500,
            "data": {"object": fake_stripe.subscriptions["sub_a"]},
        }
        payload = json.dumps(stale).encode("utf-8")
        first = billing_service.process_webhook(payload=payload, signature="sig_valid")
        second = billing_service.process_webhook(payload=payload, signature="sig_valid")
        assert first["status"] == "stale"
        assert second["status"] == "duplicate"
        final = entitlements_repo.get_record("user-a")
        assert final["accessTier"] == "subscriber"
        assert final["stripeSubscriptionId"] == "sub_b"
        assert final["lastStripeEventCreated"] == 3000

    def test_retry_of_newer_subscription_event_remains_duplicate(
        self, billing_service, entitlements_repo, fake_stripe
    ):
        import json

        fake_stripe.seed_subscription(user_id="user-a", subscription_id="sub_b")
        event_b = {
            "id": "evt_b_retry",
            "type": "customer.subscription.updated",
            "created": 3000,
            "data": {"object": fake_stripe.subscriptions["sub_b"]},
        }
        payload = json.dumps(event_b).encode("utf-8")
        first = billing_service.process_webhook(payload=payload, signature="sig_valid")
        second = billing_service.process_webhook(payload=payload, signature="sig_valid")
        assert first["status"] == "applied"
        assert second["status"] == "duplicate"
        assert entitlements_repo.get_record("user-a")["accessTier"] == "subscriber"

    def test_processed_event_ids_remain_bounded_including_stale(
        self, billing_service, entitlements_repo, fake_stripe
    ):
        import json
        from content.repositories.entitlements import PROCESSED_EVENT_ID_LIMIT

        fake_stripe.seed_subscription(user_id="user-a", subscription_id="sub_b")
        billing_service.process_webhook(
            payload=json.dumps(
                {
                    "id": "evt_anchor",
                    "type": "customer.subscription.updated",
                    "created": 10_000,
                    "data": {"object": fake_stripe.subscriptions["sub_b"]},
                }
            ).encode("utf-8"),
            signature="sig_valid",
        )
        fake_stripe.seed_subscription(user_id="user-a", subscription_id="sub_old")
        fake_stripe.subscriptions["sub_old"]["status"] = "canceled"
        for index in range(PROCESSED_EVENT_ID_LIMIT + 25):
            billing_service.process_webhook(
                payload=json.dumps(
                    {
                        "id": f"evt_stale_{index}",
                        "type": "customer.subscription.deleted",
                        "created": index,
                        "data": {"object": fake_stripe.subscriptions["sub_old"]},
                    }
                ).encode("utf-8"),
                signature="sig_valid",
            )
        record = entitlements_repo.get_record("user-a")
        assert len(record["processedEventIds"]) <= PROCESSED_EVENT_ID_LIMIT
        assert record["accessTier"] == "subscriber"
        assert record["stripeSubscriptionId"] == "sub_b"
        assert record["lastStripeEventCreated"] == 10_000
        assert record["lastStripeEventId"] == "evt_anchor"

    def test_subscription_deleted_downgrades(self, billing_service, entitlements_repo, fake_stripe):
        entitlements_repo.save_record(
            "user-a",
            {
                "accessTier": "subscriber",
                "stripeCustomerId": "cus_existing",
                "stripeSubscriptionId": "sub_existing",
                "commercialStatus": "active",
            },
        )
        fake_stripe.seed_subscription(user_id="user-a", status="canceled")
        event = {
            "id": "evt_del",
            "type": "customer.subscription.deleted",
            "created": 4000,
            "data": {"object": fake_stripe.subscriptions["sub_existing"]},
        }
        import json

        result = billing_service.process_webhook(
            payload=json.dumps(event).encode("utf-8"),
            signature="sig_valid",
        )
        assert result["status"] == "applied"
        assert entitlements_repo.get_record("user-a")["accessTier"] == "free"


class TestBillingApi:
    def test_checkout_requires_auth_identity(self, billing_client):
        client, _repository, fake_stripe, _resolver = billing_client
        response = client.post(
            "/api/billing/checkout-session",
            headers=auth_headers("user-checkout"),
        )
        assert response.status_code == 200
        assert response.json()["url"].startswith("https://checkout.stripe.test/")
        assert fake_stripe.checkout_sessions[0]["client_reference_id"] == "user-checkout"

    def test_portal_authenticated(self, billing_client):
        client, repository, fake_stripe, _resolver = billing_client
        repository.save_record(
            "user-a",
            {"accessTier": "subscriber", "stripeCustomerId": "cus_portal"},
        )
        response = client.post("/api/billing/portal-session", headers=auth_headers("user-a"))
        assert response.status_code == 200
        assert response.json()["url"].startswith("https://portal.stripe.test/")
        assert fake_stripe.portal_sessions[0]["customer"] == "cus_portal"

    def test_webhook_rejects_invalid_signature(self, billing_client):
        client, _repository, fake_stripe, _resolver = billing_client
        fake_stripe.fail_signature = True
        response = client.post(
            "/api/billing/webhook",
            content=b'{"id":"evt_x","type":"customer.subscription.updated","created":1,"data":{"object":{}}}',
            headers={"stripe-signature": "bad"},
        )
        assert response.status_code == 400

    def test_webhook_activates_entitlement_and_capabilities(self, billing_client):
        client, repository, fake_stripe, resolver = billing_client
        fake_stripe.seed_subscription(user_id="user-a")
        event = {
            "id": "evt_api_1",
            "type": "checkout.session.completed",
            "created": 5000,
            "data": {
                "object": {
                    "customer": "cus_existing",
                    "subscription": "sub_existing",
                    "client_reference_id": "user-a",
                    "metadata": {"hfzwood_user_id": "user-a"},
                }
            },
        }
        import json

        response = client.post(
            "/api/billing/webhook",
            content=json.dumps(event).encode("utf-8"),
            headers={"stripe-signature": "sig_valid"},
        )
        assert response.status_code == 200
        assert repository.get_record("user-a")["accessTier"] == "subscriber"
        capabilities = resolver.resolve("user-a", "user")
        assert capabilities.accessTier == "subscriber"
        assert capabilities.capabilities["calculator.pdfExport"] is True

    def test_administrator_unlimited_unchanged(self, billing_client):
        client, repository, _fake_stripe, resolver = billing_client
        repository.save_access_tier("admin-user", "free")
        capabilities = resolver.resolve("admin-user", "administrator")
        assert capabilities.accessTier == "administrator_unlimited"
        status = client.get("/api/billing/status", headers=auth_headers("admin-user", "administrator"))
        assert status.status_code == 200
        assert status.json()["plan"] == "administrator"
        assert status.json()["canCheckout"] is False

    def test_status_endpoint_hides_stripe_ids(self, billing_client):
        client, repository, _fake_stripe, _resolver = billing_client
        repository.save_record(
            "user-a",
            {
                "accessTier": "subscriber",
                "stripeCustomerId": "cus_secret",
                "stripeSubscriptionId": "sub_secret",
                "commercialStatus": "active",
                "cancelAtPeriodEnd": True,
                "currentPeriodEnd": 1_900_000_000,
            },
        )
        response = client.get("/api/billing/status", headers=auth_headers("user-a"))
        assert response.status_code == 200
        payload = response.json()
        assert payload["plan"] == "subscriber"
        assert "cus_secret" not in str(payload)
        assert "sub_secret" not in str(payload)
        assert payload["cancelAtPeriodEnd"] is True


class TestMockAccessTierGating:
    def test_mock_header_ignored_outside_mock_mode(self, tmp_path, monkeypatch):
        monkeypatch.setenv("AUTH_MODE", "cognito")
        monkeypatch.delenv("CAPABILITY_DEV_ACCESS_TIER", raising=False)
        repository = FilesystemEntitlementsRepository(tmp_path)
        repository.save_access_tier("user-a", "free")
        resolver = CapabilityResolver(repository)
        result = resolver.resolve("user-a", "user", mock_access_tier="subscriber")
        assert result.accessTier == "free"

    def test_mock_header_honored_in_mock_mode(self, tmp_path, monkeypatch):
        monkeypatch.setenv("AUTH_MODE", "mock")
        monkeypatch.delenv("CAPABILITY_DEV_ACCESS_TIER", raising=False)
        repository = FilesystemEntitlementsRepository(tmp_path)
        repository.save_access_tier("user-a", "free")
        resolver = CapabilityResolver(repository)
        result = resolver.resolve("user-a", "user", mock_access_tier="subscriber")
        assert result.accessTier == "subscriber"


class TestEntitlementAtomicPersistence:
    def test_save_record_writes_atomic_json(self, entitlements_repo):
        saved = entitlements_repo.save_record(
            "user-a",
            {
                "accessTier": "subscriber",
                "stripeCustomerId": "cus_1",
                "commercialStatus": "active",
            },
        )
        assert saved["accessTier"] == "subscriber"
        loaded = entitlements_repo.get_record("user-a")
        assert loaded["stripeCustomerId"] == "cus_1"
        assert entitlements_repo.find_user_id_by_stripe_customer_id("cus_1") == "user-a"
