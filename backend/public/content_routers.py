from fastapi import Depends

from public.product.entitlements import EntitlementsRepository, get_entitlements_repository
from public.product.capabilities.resolver import CapabilityResolver


def get_capability_resolver(
    entitlements_repository: EntitlementsRepository = Depends(get_entitlements_repository),
) -> CapabilityResolver:
    return CapabilityResolver(entitlements_repository)
