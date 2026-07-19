from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query

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
    locale: str = "ro",
    publishedOnly: bool = Query(False),
    _: dict = Depends(require_administrator),
    service: ReferenceSearchService = Depends(get_reference_search_service),
) -> list[EditorialReferenceOption]:
    try:
        return service.search_references(q, locale, published_only=publishedOnly)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def reset_repository_cache() -> None:
    get_repository.cache_clear()
