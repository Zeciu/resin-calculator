from fastapi import APIRouter, Depends

from public.auth.dependencies import get_current_user
from public.product.entitlements import EntitlementsRepository, get_entitlements_repository as _get_entitlements_repository
from public.product.capabilities.resolver import (
    CapabilityResolver,
    capability_resolver_with_promo_grants,
)
from public.product.capabilities.schema import CapabilitiesResponse

router = APIRouter(prefix="/me", tags=["me"])


def get_entitlements_repository() -> EntitlementsRepository:
    return _get_entitlements_repository()


def get_capability_resolver(
    entitlements_repository: EntitlementsRepository = Depends(get_entitlements_repository),
) -> CapabilityResolver:
    return capability_resolver_with_promo_grants(entitlements_repository)


@router.get("/capabilities", response_model=CapabilitiesResponse)
def get_my_capabilities(
    user: dict = Depends(get_current_user),
    resolver: CapabilityResolver = Depends(get_capability_resolver),
) -> CapabilitiesResponse:
    return resolver.resolve(user["id"], username=user.get("username"))
