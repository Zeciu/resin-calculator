from datetime import datetime

from ..schemas.common import ContentStatus
from ..schemas.editorial import EditorialVisibility


def compute_editorial_visibility(
    *,
    exists: bool,
    status: ContentStatus,
    updated_at: datetime | None,
    published_at: datetime | None,
) -> EditorialVisibility:
    if not exists:
        return EditorialVisibility.EMPTY
    if status == ContentStatus.DRAFT or published_at is None:
        return EditorialVisibility.DRAFT
    if updated_at and published_at and updated_at > published_at:
        return EditorialVisibility.STALE
    return EditorialVisibility.LIVE
