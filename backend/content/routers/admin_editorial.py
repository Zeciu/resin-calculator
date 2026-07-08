from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException

from auth.dependencies import require_administrator
from content.repositories.filesystem import FilesystemContentRepository
from content.schemas.editorial import EditorialReferenceOption
from content.services.reference_search import ReferenceSearchService

router = APIRouter(prefix="/admin/references", tags=["admin-editorial"])


@lru_cache
def get_repository() -> FilesystemContentRepository:
    return FilesystemContentRepository()


def get_reference_search_service() -> ReferenceSearchService:
    return ReferenceSearchService(get_repository())


@router.get("/search", response_model=list[EditorialReferenceOption])
def search_references(
    q: str = "",
    locale: str = "en",
    _: dict = Depends(require_administrator),
    service: ReferenceSearchService = Depends(get_reference_search_service),
) -> list[EditorialReferenceOption]:
    try:
        return service.search_references(q, locale)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
