from fastapi import APIRouter, Depends, Header

from auth.dependencies import get_current_user
from content.repositories.entitlements import EntitlementsRepository, FilesystemEntitlementsRepository
from product.capabilities.resolver import CapabilityResolver
from product.capabilities.schema import CapabilitiesResponse

router = APIRouter(prefix="/me", tags=["me"])


def get_entitlements_repository() -> EntitlementsRepository:
    return FilesystemEntitlementsRepository()


def get_capability_resolver(
    entitlements_repository: EntitlementsRepository = Depends(get_entitlements_repository),
) -> CapabilityResolver:
    return CapabilityResolver(entitlements_repository)


@router.get("/capabilities", response_model=CapabilitiesResponse)
def get_my_capabilities(
    user: dict = Depends(get_current_user),
    resolver: CapabilityResolver = Depends(get_capability_resolver),
    x_mock_access_tier: str | None = Header(default=None, alias="X-Mock-Access-Tier"),
) -> CapabilitiesResponse:
    return resolver.resolve(user["id"], user["role"], mock_access_tier=x_mock_access_tier)
