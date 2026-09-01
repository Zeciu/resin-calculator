from .editorial_identity import (
    chapter_identity_title_from_store,
    entry_identity_term_from_store,
    entry_identity_title_from_store,
)


class CrossReferenceValidator:
    def __init__(self, repository) -> None:
        self._repository = repository

    def _records(self, records):
        return records if records is not None else self._repository.read_editorial_records()

    def require_published_manual_chapter(
        self, target_id: str, locale: str, *, records=None
    ) -> None:
        store = self._records(records)
        if not self._repository.get_manual_chapter_meta_from_store(store, target_id):
            raise ValueError(f"Unknown manual chapter: {target_id}")
        variant = self._repository.get_manual_variant_from_store(store, target_id, locale)
        if not variant or variant["status"] != "published":
            display = chapter_identity_title_from_store(self._repository, store, target_id) or target_id
            raise ValueError(f"Published manual chapter required: {display}")

    def require_published_glossary_entry(
        self, target_id: str, locale: str, label: str = "glossary entry", *, records=None
    ) -> None:
        store = self._records(records)
        if not self._repository.get_glossary_entry_meta_from_store(store, target_id):
            raise ValueError(f"Unknown {label}: {target_id}")
        variant = self._repository.get_glossary_variant_from_store(store, target_id, locale)
        if not variant or variant["status"] != "published":
            display = entry_identity_term_from_store(self._repository, store, target_id) or target_id
            raise ValueError(f"Published {label} required: {display}")

    def require_glossary_entry_locale_content(
        self, target_id: str, locale: str, label: str = "glossary entry", *, records=None
    ) -> None:
        """Require a same-locale glossary variant with a term (draft or published)."""
        store = self._records(records)
        if not self._repository.get_glossary_entry_meta_from_store(store, target_id):
            raise ValueError(f"Unknown {label}: {target_id}")
        variant = self._repository.get_glossary_variant_from_store(store, target_id, locale)
        term = ""
        if variant:
            term = str((variant.get("draftBody") or {}).get("term") or "").strip()
        if not variant or not term:
            display = entry_identity_term_from_store(self._repository, store, target_id) or target_id
            raise ValueError(f"{label.capitalize()} required in {locale}: {display}")

    def require_published_kb_entry(
        self,
        target_id: str,
        locale: str,
        label: str = "Knowledge Base article",
        *,
        records=None,
        allowed_ids: set[str] | frozenset[str] | None = None,
    ) -> None:
        store = self._records(records)
        if not self._repository.get_kb_entry_meta_from_store(store, target_id):
            raise ValueError(f"Unknown {label}: {target_id}")
        if allowed_ids is not None and target_id in allowed_ids:
            return
        variant = self._repository.get_kb_variant_from_store(store, target_id, locale)
        if not variant or variant["status"] != "published":
            display = entry_identity_title_from_store(self._repository, store, target_id) or target_id
            raise ValueError(f"Published {label} required: {display}")
