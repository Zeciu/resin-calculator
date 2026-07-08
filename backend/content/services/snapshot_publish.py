from collections.abc import Callable


def rebuild_locale_snapshot(
    document: dict,
    *,
    has_content: Callable[[dict], bool],
    write_snapshot: Callable[[dict], str],
    delete_snapshot: Callable[[], None],
) -> str | None:
    if has_content(document):
        return write_snapshot(document)
    delete_snapshot()
    return None
