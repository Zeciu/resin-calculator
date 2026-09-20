from fastapi import Depends

from public.product.entitlements import EntitlementsRepository, get_entitlements_repository
from public.product.capabilities.resolver import (
    CapabilityResolver,
    capability_resolver_with_promo_grants,
)


def get_capability_resolver(
    entitlements_repository: EntitlementsRepository = Depends(get_entitlements_repository),
) -> CapabilityResolver:
    return capability_resolver_with_promo_grants(entitlements_repository)
