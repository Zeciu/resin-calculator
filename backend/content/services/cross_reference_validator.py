class CrossReferenceValidator:
    def __init__(self, repository) -> None:
        self._repository = repository

    def require_published_manual_chapter(self, target_id: str, locale: str) -> None:
        if not self._repository.get_manual_chapter_meta(target_id):
            raise ValueError(f"Unknown manual chapter: {target_id}")
        variant = self._repository.get_manual_variant(target_id, locale)
        if not variant or variant["status"] != "published":
            raise ValueError(f"Published manual chapter required: {target_id}")

    def require_published_glossary_entry(self, target_id: str, locale: str, label: str = "glossary entry") -> None:
        if not self._repository.get_glossary_entry_meta(target_id):
            raise ValueError(f"Unknown {label}: {target_id}")
        variant = self._repository.get_glossary_variant(target_id, locale)
        if not variant or variant["status"] != "published":
            raise ValueError(f"Published {label} required: {target_id}")

    def require_published_kb_entry(self, target_id: str, locale: str, label: str = "Knowledge Base article") -> None:
        if not self._repository.get_kb_entry_meta(target_id):
            raise ValueError(f"Unknown {label}: {target_id}")
        variant = self._repository.get_kb_variant(target_id, locale)
        if not variant or variant["status"] != "published":
            raise ValueError(f"Published {label} required: {target_id}")
