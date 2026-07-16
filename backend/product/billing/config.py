from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class BillingConfig:
    stripe_secret_key: str
    stripe_webhook_secret: str
    stripe_price_id: str
    checkout_success_url: str
    checkout_cancel_url: str
    portal_return_url: str

    @property
    def is_complete(self) -> bool:
        return all(
            (
                self.stripe_secret_key,
                self.stripe_webhook_secret,
                self.stripe_price_id,
                self.checkout_success_url,
                self.checkout_cancel_url,
                self.portal_return_url,
            )
        )


def load_billing_config() -> BillingConfig:
    return BillingConfig(
        stripe_secret_key=os.environ.get("STRIPE_SECRET_KEY", "").strip(),
        stripe_webhook_secret=os.environ.get("STRIPE_WEBHOOK_SECRET", "").strip(),
        stripe_price_id=os.environ.get("STRIPE_PRICE_ID", "").strip(),
        checkout_success_url=os.environ.get("STRIPE_CHECKOUT_SUCCESS_URL", "").strip(),
        checkout_cancel_url=os.environ.get("STRIPE_CHECKOUT_CANCEL_URL", "").strip(),
        portal_return_url=os.environ.get("STRIPE_PORTAL_RETURN_URL", "").strip(),
    )
