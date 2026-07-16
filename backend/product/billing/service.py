from __future__ import annotations

from typing import Any, Protocol

from content.repositories.entitlements import (
    HFZWOOD_USER_METADATA_KEY,
    PROCESSED_EVENT_ID_LIMIT,
    EntitlementsRepository,
    normalize_entitlement_record,
)
from product.billing.config import BillingConfig
from product.billing.mapping import map_stripe_subscription_to_entitlement


class StripeGateway(Protocol):
    def create_customer(self, *, user_id: str, email: str | None = None) -> dict[str, Any]:
        ...

    def create_checkout_session(
        self,
        *,
        customer_id: str,
        user_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
    ) -> dict[str, Any]:
        ...

    def create_portal_session(self, *, customer_id: str, return_url: str) -> dict[str, Any]:
        ...

    def construct_webhook_event(self, payload: bytes, signature: str) -> dict[str, Any]:
        ...

    def retrieve_subscription(self, subscription_id: str) -> dict[str, Any]:
        ...


class BillingConfigurationError(RuntimeError):
    pass


class BillingService:
    def __init__(
        self,
        *,
        config: BillingConfig,
        entitlements: EntitlementsRepository,
        stripe: StripeGateway,
    ) -> None:
        self._config = config
        self._entitlements = entitlements
        self._stripe = stripe

    def require_configured(self) -> None:
        if not self._config.is_complete:
            raise BillingConfigurationError("Billing is not configured.")

    def create_checkout_session(self, *, user_id: str, email: str | None = None) -> dict[str, str]:
        self.require_configured()
        record = self._entitlements.get_record(user_id)
        customer_id = record.get("stripeCustomerId")
        if not customer_id:
            customer = self._stripe.create_customer(user_id=user_id, email=email)
            customer_id = customer["id"]
            record["stripeCustomerId"] = customer_id
            self._entitlements.save_record(user_id, record)

        session = self._stripe.create_checkout_session(
            customer_id=customer_id,
            user_id=user_id,
            price_id=self._config.stripe_price_id,
            success_url=self._config.checkout_success_url,
            cancel_url=self._config.checkout_cancel_url,
        )
        url = session.get("url")
        if not isinstance(url, str) or not url.strip():
            raise RuntimeError("Stripe Checkout session did not return a URL.")
        return {"url": url.strip()}

    def create_portal_session(self, *, user_id: str) -> dict[str, str]:
        self.require_configured()
        record = self._entitlements.get_record(user_id)
        customer_id = record.get("stripeCustomerId")
        if not customer_id:
            raise LookupError("No Stripe customer exists for this account.")
        session = self._stripe.create_portal_session(
            customer_id=customer_id,
            return_url=self._config.portal_return_url,
        )
        url = session.get("url")
        if not isinstance(url, str) or not url.strip():
            raise RuntimeError("Stripe Customer Portal session did not return a URL.")
        return {"url": url.strip()}

    def process_webhook(self, *, payload: bytes, signature: str) -> dict[str, str]:
        self.require_configured()
        event = self._stripe.construct_webhook_event(payload, signature)
        event_id = event.get("id")
        event_type = event.get("type")
        event_created = event.get("created")
        if not isinstance(event_id, str) or not event_id.strip():
            raise ValueError("Stripe event missing id.")
        if not isinstance(event_type, str) or not event_type.strip():
            raise ValueError("Stripe event missing type.")
        created = int(event_created) if isinstance(event_created, (int, float)) else 0

        data_object = (event.get("data") or {}).get("object") or {}
        if not isinstance(data_object, dict):
            data_object = {}

        if event_type == "checkout.session.completed":
            return self._handle_checkout_completed(event_id, created, data_object)
        if event_type == "customer.subscription.updated":
            return self._handle_subscription_event(event_id, created, data_object, deleted=False)
        if event_type == "customer.subscription.deleted":
            return self._handle_subscription_event(event_id, created, data_object, deleted=True)
        return {"status": "ignored", "eventType": event_type}

    def _handle_checkout_completed(
        self,
        event_id: str,
        event_created: int,
        session: dict[str, Any],
    ) -> dict[str, str]:
        user_id = self._resolve_user_id_from_checkout(session)
        if not user_id:
            raise ValueError("Checkout session missing HFZWood user identity.")

        record = self._entitlements.get_record(user_id)
        if self._already_processed(record, event_id):
            return {"status": "duplicate", "eventId": event_id}
        if self._is_stale_event(record, event_created):
            record = self._record_stale_event_suppression(record, event_id)
            self._entitlements.save_record(user_id, record)
            return {"status": "stale", "eventId": event_id}

        customer_id = session.get("customer")
        if isinstance(customer_id, dict):
            customer_id = customer_id.get("id")
        if isinstance(customer_id, str) and customer_id.strip():
            record["stripeCustomerId"] = customer_id.strip()

        subscription_id = session.get("subscription")
        if isinstance(subscription_id, dict):
            subscription_id = subscription_id.get("id")
        if not isinstance(subscription_id, str) or not subscription_id.strip():
            # Checkout without a subscription does not grant access.
            record = self._mark_event_processed(record, event_id, event_created)
            self._entitlements.save_record(user_id, record)
            return {"status": "ignored", "reason": "no_subscription"}

        subscription = self._stripe.retrieve_subscription(subscription_id.strip())
        mapped = map_stripe_subscription_to_entitlement(
            subscription,
            previous_access_tier=str(record.get("accessTier") or "free"),
        )
        record.update(mapped)
        record = self._mark_event_processed(record, event_id, event_created)
        self._entitlements.save_record(user_id, record)
        return {"status": "applied", "eventId": event_id}

    def _handle_subscription_event(
        self,
        event_id: str,
        event_created: int,
        subscription_object: dict[str, Any],
        *,
        deleted: bool,
    ) -> dict[str, str]:
        user_id = self._resolve_user_id_from_subscription(subscription_object)
        if not user_id:
            raise ValueError("Subscription event missing HFZWood user identity.")

        record = self._entitlements.get_record(user_id)
        if self._already_processed(record, event_id):
            return {"status": "duplicate", "eventId": event_id}
        if self._is_stale_event(record, event_created):
            record = self._record_stale_event_suppression(record, event_id)
            self._entitlements.save_record(user_id, record)
            return {"status": "stale", "eventId": event_id}

        subscription_id = subscription_object.get("id")
        if deleted:
            subscription = dict(subscription_object)
            subscription["status"] = "canceled"
            mapped = map_stripe_subscription_to_entitlement(
                subscription,
                previous_access_tier=str(record.get("accessTier") or "free"),
            )
        else:
            # Prefer live subscription retrieval for authoritative state.
            if isinstance(subscription_id, str) and subscription_id.strip():
                subscription = self._stripe.retrieve_subscription(subscription_id.strip())
            else:
                subscription = subscription_object
            mapped = map_stripe_subscription_to_entitlement(
                subscription,
                previous_access_tier=str(record.get("accessTier") or "free"),
            )

        record.update(mapped)
        record = self._mark_event_processed(record, event_id, event_created)
        self._entitlements.save_record(user_id, record)
        return {"status": "applied", "eventId": event_id}

    def _resolve_user_id_from_checkout(self, session: dict[str, Any]) -> str | None:
        metadata = session.get("metadata") if isinstance(session.get("metadata"), dict) else {}
        client_reference = session.get("client_reference_id")
        for candidate in (
            metadata.get(HFZWOOD_USER_METADATA_KEY),
            client_reference,
        ):
            if isinstance(candidate, str) and candidate.strip():
                return candidate.strip()

        customer_id = session.get("customer")
        if isinstance(customer_id, dict):
            customer_id = customer_id.get("id")
        if isinstance(customer_id, str) and customer_id.strip():
            return self._entitlements.find_user_id_by_stripe_customer_id(customer_id.strip())
        return None

    def _resolve_user_id_from_subscription(self, subscription: dict[str, Any]) -> str | None:
        metadata = (
            subscription.get("metadata") if isinstance(subscription.get("metadata"), dict) else {}
        )
        meta_user = metadata.get(HFZWOOD_USER_METADATA_KEY)
        if isinstance(meta_user, str) and meta_user.strip():
            return meta_user.strip()

        customer_id = subscription.get("customer")
        if isinstance(customer_id, dict):
            customer_id = customer_id.get("id")
        if isinstance(customer_id, str) and customer_id.strip():
            return self._entitlements.find_user_id_by_stripe_customer_id(customer_id.strip())
        return None

    @staticmethod
    def _already_processed(record: dict[str, Any], event_id: str) -> bool:
        processed = record.get("processedEventIds") or []
        return event_id == record.get("lastStripeEventId") or event_id in processed

    @staticmethod
    def _is_stale_event(record: dict[str, Any], event_created: int) -> bool:
        """Reject any event older than the last applied commercial state.

        Ordering is global per user record so cancel/resubscribe churn cannot
        let an older subscription event regress a newer one.
        """
        last_created = record.get("lastStripeEventCreated")
        if not isinstance(last_created, int):
            return False
        return event_created < last_created

    @staticmethod
    def _record_stale_event_suppression(
        record: dict[str, Any],
        event_id: str,
    ) -> dict[str, Any]:
        """Remember a stale event id without mutating commercial or ordering state."""
        normalized = normalize_entitlement_record(record)
        processed = list(normalized.get("processedEventIds") or [])
        if event_id not in processed:
            processed.append(event_id)
        normalized["processedEventIds"] = processed[-PROCESSED_EVENT_ID_LIMIT:]
        return normalized

    @staticmethod
    def _mark_event_processed(
        record: dict[str, Any],
        event_id: str,
        event_created: int,
    ) -> dict[str, Any]:
        normalized = normalize_entitlement_record(record)
        processed = list(normalized.get("processedEventIds") or [])
        if event_id not in processed:
            processed.append(event_id)
        normalized["processedEventIds"] = processed[-PROCESSED_EVENT_ID_LIMIT:]
        normalized["lastStripeEventId"] = event_id
        if event_created >= (normalized.get("lastStripeEventCreated") or 0):
            normalized["lastStripeEventCreated"] = event_created
        return normalized
