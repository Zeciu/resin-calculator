from collections.abc import Callable


def rebuild_locale_snapshot(
    document: dict,
    *,
    write_snapshot: Callable[[dict], str],
) -> str | None:
    """
    Persist the admin published snapshot for a locale.

    Always writes the assembled document (including an empty corpus). Deleting the
    snapshot file would make public APIs fall back to Phase 6 legacy seed and
    silently resurrect old test content after authors clear or replace publishes.
    """
    return write_snapshot(document)
