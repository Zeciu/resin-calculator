from content.repositories.filesystem import EDITORIAL_LOCALES


def chapter_identity_title(repository, content_id: str) -> str:
    for variant_locale in EDITORIAL_LOCALES:
        variant = repository.get_manual_variant(content_id, variant_locale)
        if not variant:
            continue
        title = variant.get("draftBody", {}).get("title", "").strip()
        if title:
            return title
    return ""


def entry_identity_term(repository, content_id: str) -> str:
    for variant_locale in EDITORIAL_LOCALES:
        variant = repository.get_glossary_variant(content_id, variant_locale)
        if not variant:
            continue
        term = variant.get("draftBody", {}).get("term", "").strip()
        if term:
            return term
    return ""


def entry_identity_title(repository, content_id: str) -> str:
    for variant_locale in EDITORIAL_LOCALES:
        variant = repository.get_kb_variant(content_id, variant_locale)
        if not variant:
            continue
        title = variant.get("draftBody", {}).get("title", "").strip()
        if title:
            return title
    return ""
