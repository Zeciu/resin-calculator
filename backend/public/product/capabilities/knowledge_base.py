"""Entitlement-aware limits for Knowledge Base responses."""

from typing import TypeVar


Entry = TypeVar("Entry")


def limit_knowledge_base_entries(entries: list[Entry], max_articles: object) -> list[Entry]:
    """Return the entries permitted by a resolved Knowledge Base capability."""
    if not isinstance(max_articles, int) or isinstance(max_articles, bool):
        return entries
    return entries[: max(0, max_articles)]
