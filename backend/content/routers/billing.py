from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse

from auth.dependencies import get_current_user
from content.repositories.entitlements import EntitlementsRepository, FilesystemEntitlementsRepository
from product.billing.config import load_billing_config
from product.billing.mapping import public_billing_status
from product.billing.service import BillingConfigurationError, BillingService
from product.billing.stripe_gateway import StripeApiGateway
from product.capabilities.resolver import CapabilityResolver

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])


def get_entitlements_repository() -> EntitlementsRepository:
    return FilesystemEntitlementsRepository()


def get_billing_service(
    entitlements_repository: EntitlementsRepository = Depends(get_entitlements_repository),
) -> BillingService:
    config = load_billing_config()
    return BillingService(
        config=config,
        entitlements=entitlements_repository,
        stripe=StripeApiGateway(config),
    )


def get_capability_resolver(
    entitlements_repository: EntitlementsRepository = Depends(get_entitlements_repository),
) -> CapabilityResolver:
    return CapabilityResolver(entitlements_repository)


@router.post("/checkout-session")
def create_checkout_session(
    user: dict = Depends(get_current_user),
    billing: BillingService = Depends(get_billing_service),
) -> dict:
    if user.get("role") == "administrator":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators do not use commercial checkout.",
        )
    try:
        # Email is never authoritative for identity; optional Stripe receipt convenience only.
        return billing.create_checkout_session(user_id=user["id"], email=None)
    except BillingConfigurationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing is not configured.",
        ) from None
    except Exception:
        logger.exception("Checkout session creation failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to start checkout.",
        ) from None


@router.post("/portal-session")
def create_portal_session(
    user: dict = Depends(get_current_user),
    billing: BillingService = Depends(get_billing_service),
) -> dict:
    if user.get("role") == "administrator":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators do not use the billing portal.",
        )
    try:
        return billing.create_portal_session(user_id=user["id"])
    except BillingConfigurationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing is not configured.",
        ) from None
    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No subscription customer is available for this account.",
        ) from None
    except Exception:
        logger.exception("Portal session creation failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to open subscription management.",
        ) from None


@router.get("/status")
def get_billing_status(
    user: dict = Depends(get_current_user),
    entitlements_repository: EntitlementsRepository = Depends(get_entitlements_repository),
    resolver: CapabilityResolver = Depends(get_capability_resolver),
) -> dict:
    capabilities = resolver.resolve(user["id"], user["role"], mock_access_tier=None)
    record = entitlements_repository.get_record(user["id"])
    return public_billing_status(
        record,
        access_tier=capabilities.accessTier,
        role=user["role"],
    )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    billing: BillingService = Depends(get_billing_service),
) -> JSONResponse:
    signature = request.headers.get("stripe-signature", "")
    payload = await request.body()
    try:
        result = billing.process_webhook(payload=payload, signature=signature)
    except BillingConfigurationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing is not configured.",
        ) from None
    except ValueError as exc:
        # Signature / payload validation failures.
        logger.warning("Stripe webhook rejected: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook.",
        ) from None
    except Exception as exc:
        # stripe.error.SignatureVerificationError and similar.
        message = str(exc)
        if "Signature" in type(exc).__name__ or "signature" in message.lower():
            logger.warning("Stripe webhook signature verification failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature.",
            ) from None
        logger.exception("Stripe webhook processing failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook processing failed.",
        ) from None
    return JSONResponse(content=result)
