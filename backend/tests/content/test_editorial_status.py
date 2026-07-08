from datetime import datetime, timezone

import pytest

from content.schemas.common import ContentStatus
from content.schemas.editorial import EditorialVisibility
from content.services.editorial_status import compute_editorial_visibility


def test_empty_visibility_when_variant_missing():
    assert (
        compute_editorial_visibility(
            exists=False,
            status=ContentStatus.DRAFT,
            updated_at=None,
            published_at=None,
        )
        == EditorialVisibility.EMPTY
    )


def test_draft_visibility_for_unpublished_variant():
    now = datetime.now(timezone.utc)
    assert (
        compute_editorial_visibility(
            exists=True,
            status=ContentStatus.DRAFT,
            updated_at=now,
            published_at=None,
        )
        == EditorialVisibility.DRAFT
    )


def test_live_visibility_when_draft_matches_public_snapshot():
    now = datetime.now(timezone.utc)
    assert (
        compute_editorial_visibility(
            exists=True,
            status=ContentStatus.PUBLISHED,
            updated_at=now,
            published_at=now,
        )
        == EditorialVisibility.LIVE
    )


def test_stale_visibility_when_draft_saved_after_publish():
    published_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
    updated_at = datetime(2026, 1, 2, tzinfo=timezone.utc)
    assert (
        compute_editorial_visibility(
            exists=True,
            status=ContentStatus.PUBLISHED,
            updated_at=updated_at,
            published_at=published_at,
        )
        == EditorialVisibility.STALE
    )
