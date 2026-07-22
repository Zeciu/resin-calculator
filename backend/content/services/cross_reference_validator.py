from .editorial_identity import (
    chapter_identity_title,
    entry_identity_term,
    entry_identity_title,
)


class CrossReferenceValidator:
    def __init__(self, repository) -> None:
        self._repository = repository

    def require_published_manual_chapter(self, target_id: str, locale: str) -> None:
        if not self._repository.get_manual_chapter_meta(target_id):
            raise ValueError(f"Unknown manual chapter: {target_id}")
        variant = self._repository.get_manual_variant(target_id, locale)
        if not variant or variant["status"] != "published":
            display = chapter_identity_title(self._repository, target_id) or target_id
            raise ValueError(f"Published manual chapter required: {display}")

    def require_published_glossary_entry(self, target_id: str, locale: str, label: str = "glossary entry") -> None:
        if not self._repository.get_glossary_entry_meta(target_id):
            raise ValueError(f"Unknown {label}: {target_id}")
        variant = self._repository.get_glossary_variant(target_id, locale)
        if not variant or variant["status"] != "published":
            display = entry_identity_term(self._repository, target_id) or target_id
            raise ValueError(f"Published {label} required: {display}")

    def require_glossary_entry_locale_content(
        self, target_id: str, locale: str, label: str = "glossary entry"
    ) -> None:
        """Require a same-locale glossary variant with a term (draft or published)."""
        if not self._repository.get_glossary_entry_meta(target_id):
            raise ValueError(f"Unknown {label}: {target_id}")
        variant = self._repository.get_glossary_variant(target_id, locale)
        term = ""
        if variant:
            term = str((variant.get("draftBody") or {}).get("term") or "").strip()
        if not variant or not term:
            display = entry_identity_term(self._repository, target_id) or target_id
            raise ValueError(f"{label.capitalize()} required in {locale}: {display}")

    def require_published_kb_entry(self, target_id: str, locale: str, label: str = "Knowledge Base article") -> None:
        if not self._repository.get_kb_entry_meta(target_id):
            raise ValueError(f"Unknown {label}: {target_id}")
        variant = self._repository.get_kb_variant(target_id, locale)
        if not variant or variant["status"] != "published":
            display = entry_identity_title(self._repository, target_id) or target_id
            raise ValueError(f"Published {label} required: {display}")
