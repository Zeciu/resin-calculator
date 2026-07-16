from __future__ import annotations

from typing import Any

import stripe

from content.repositories.entitlements import HFZWOOD_USER_METADATA_KEY
from product.billing.config import BillingConfig


class StripeApiGateway:
    """Thin Stripe SDK adapter. Product modules must not import this."""

    def __init__(self, config: BillingConfig) -> None:
        self._config = config
        stripe.api_key = config.stripe_secret_key

    def create_customer(self, *, user_id: str, email: str | None = None) -> dict[str, Any]:
        params: dict[str, Any] = {
            "metadata": {HFZWOOD_USER_METADATA_KEY: user_id},
        }
        if email:
            params["email"] = email
        customer = stripe.Customer.create(**params)
        return {"id": customer["id"]}

    def create_checkout_session(
        self,
        *,
        customer_id: str,
        user_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
    ) -> dict[str, Any]:
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=customer_id,
            client_reference_id=user_id,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={HFZWOOD_USER_METADATA_KEY: user_id},
            subscription_data={
                "metadata": {HFZWOOD_USER_METADATA_KEY: user_id},
            },
        )
        return {"id": session["id"], "url": session["url"]}

    def create_portal_session(self, *, customer_id: str, return_url: str) -> dict[str, Any]:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        return {"id": session["id"], "url": session["url"]}

    def construct_webhook_event(self, payload: bytes, signature: str) -> dict[str, Any]:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature,
            secret=self._config.stripe_webhook_secret,
        )
        return dict(event)

    def retrieve_subscription(self, subscription_id: str) -> dict[str, Any]:
        subscription = stripe.Subscription.retrieve(subscription_id)
        return dict(subscription)
