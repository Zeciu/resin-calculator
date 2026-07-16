from __future__ import annotations

from typing import Any

# Stripe subscription statuses that continue to entitle subscriber access.
# past_due keeps access until Stripe confirms loss (canceled/unpaid/deleted).
SUBSCRIBER_STRIPE_STATUSES = frozenset({"active", "trialing", "past_due"})

COMMERCIAL_STATUS_BY_STRIPE = {
    "active": "active",
    "trialing": "active",
    "past_due": "past_due",
    "canceled": "canceled",
    "unpaid": "canceled",
    "incomplete": "incomplete",
    "incomplete_expired": "canceled",
    "paused": "canceled",
}


def map_stripe_subscription_to_entitlement(
    subscription: dict[str, Any],
    *,
    previous_access_tier: str = "free",
) -> dict[str, Any]:
    """Map authoritative Stripe subscription fields to durable entitlement fields.

    Product modules must only consume the resulting accessTier via CapabilityResolver.
    """
    status = str(subscription.get("status") or "").strip().lower()
    cancel_at_period_end = bool(subscription.get("cancel_at_period_end", False))
    current_period_end = subscription.get("current_period_end")
    period_end: int | None
    if isinstance(current_period_end, (int, float)) and current_period_end >= 0:
        period_end = int(current_period_end)
    else:
        period_end = None

    price_id = None
    items = subscription.get("items") or {}
    data = items.get("data") if isinstance(items, dict) else None
    if isinstance(data, list) and data:
        first = data[0] if isinstance(data[0], dict) else {}
        price = first.get("price") if isinstance(first, dict) else None
        if isinstance(price, dict):
            raw_price_id = price.get("id")
            if isinstance(raw_price_id, str) and raw_price_id.strip():
                price_id = raw_price_id.strip()
        elif isinstance(price, str) and price.strip():
            price_id = price.strip()

    commercial_status = COMMERCIAL_STATUS_BY_STRIPE.get(status, "incomplete")
    if status in SUBSCRIBER_STRIPE_STATUSES:
        access_tier = "subscriber"
    elif status in {"incomplete"} and previous_access_tier == "subscriber":
        # Incomplete after an already-active entitlement: do not revoke on ambiguity.
        access_tier = "subscriber"
        commercial_status = "incomplete"
    else:
        access_tier = "free"

    customer_id = subscription.get("customer")
    if isinstance(customer_id, dict):
        customer_id = customer_id.get("id")
    if not isinstance(customer_id, str) or not customer_id.strip():
        customer_id = None
    else:
        customer_id = customer_id.strip()

    subscription_id = subscription.get("id")
    if not isinstance(subscription_id, str) or not subscription_id.strip():
        subscription_id = None
    else:
        subscription_id = subscription_id.strip()

    return {
        "accessTier": access_tier,
        "stripeCustomerId": customer_id,
        "stripeSubscriptionId": subscription_id,
        "stripePriceId": price_id,
        "commercialStatus": commercial_status,
        "currentPeriodEnd": period_end,
        "cancelAtPeriodEnd": cancel_at_period_end,
    }


def public_billing_status(record: dict[str, Any], *, access_tier: str, role: str) -> dict[str, Any]:
    """User-facing commercial status only — no Stripe IDs or secrets."""
    if role == "administrator":
        return {
            "plan": "administrator",
            "status": "unlimited",
            "cancelAtPeriodEnd": False,
            "currentPeriodEnd": None,
            "canCheckout": False,
            "canManage": False,
        }

    commercial_status = record.get("commercialStatus") or "none"
    cancel_at_period_end = bool(record.get("cancelAtPeriodEnd", False))
    return {
        "plan": access_tier if access_tier in {"free", "subscriber"} else "free",
        "status": commercial_status,
        "cancelAtPeriodEnd": cancel_at_period_end,
        "currentPeriodEnd": record.get("currentPeriodEnd"),
        "canCheckout": access_tier != "subscriber" or commercial_status in {"none", "canceled"},
        "canManage": bool(record.get("stripeCustomerId")),
    }
