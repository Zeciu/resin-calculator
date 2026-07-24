from content.repositories.filesystem import EDITORIAL_LOCALES


def chapter_identity_title(repository, content_id: str) -> str:
    records = repository.read_editorial_records()
    return chapter_identity_title_from_store(repository, records, content_id)


def chapter_identity_title_from_store(repository, records, content_id: str) -> str:
    """Resolve Manual identity title from an already-loaded store."""
    for variant_locale in EDITORIAL_LOCALES:
        variant = repository.get_manual_variant_from_store(records, content_id, variant_locale)
        if not variant:
            continue
        title = variant.get("draftBody", {}).get("title", "").strip()
        if title:
            return title
    return ""


def entry_identity_term(repository, content_id: str) -> str:
    records = repository.read_editorial_records()
    return entry_identity_term_from_store(repository, records, content_id)


def entry_identity_term_from_store(repository, records, content_id: str) -> str:
    """Resolve identity term from an already-loaded store (one-operation scope)."""
    for variant_locale in EDITORIAL_LOCALES:
        variant = repository.get_glossary_variant_from_store(records, content_id, variant_locale)
        if not variant:
            continue
        term = variant.get("draftBody", {}).get("term", "").strip()
        if term:
            return term
    return ""


def entry_identity_title(repository, content_id: str) -> str:
    records = repository.read_editorial_records()
    return entry_identity_title_from_store(repository, records, content_id)


def entry_identity_title_from_store(repository, records, content_id: str) -> str:
    """Resolve Knowledge Base identity title from an already-loaded store."""
    for variant_locale in EDITORIAL_LOCALES:
        variant = repository.get_kb_variant_from_store(records, content_id, variant_locale)
        if not variant:
            continue
        title = variant.get("draftBody", {}).get("title", "").strip()
        if title:
            return title
    return ""
