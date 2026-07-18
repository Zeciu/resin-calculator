from ..repositories.filesystem import DEFAULT_LOCALE
from ..schemas.editorial import EditorialReferenceOption
from ..schemas.glossary import parse_admin_locale
from .editorial_identity import (
    chapter_identity_title,
    entry_identity_term,
    entry_identity_title,
)


class ReferenceSearchService:
    def __init__(self, repository) -> None:
        self._repository = repository

    def search_references(self, query: str = "", locale: str = DEFAULT_LOCALE) -> list[EditorialReferenceOption]:
        parse_admin_locale(locale)
        normalized = query.strip().lower()
        options: list[EditorialReferenceOption] = []

        for content_id in self._repository.list_manual_chapter_ids():
            title = chapter_identity_title(self._repository, content_id)
            if normalized and normalized not in title.lower() and normalized not in content_id.lower():
                continue
            options.append(
                EditorialReferenceOption(
                    contentId=content_id,
                    contentType="manual_chapter",
                    label=title or content_id,
                    detail="Manual chapter",
                )
            )

        for content_id in self._repository.list_glossary_entry_ids():
            term = entry_identity_term(self._repository, content_id)
            if normalized and normalized not in term.lower() and normalized not in content_id.lower():
                continue
            options.append(
                EditorialReferenceOption(
                    contentId=content_id,
                    contentType="glossary_entry",
                    label=term or content_id,
                    detail="Glossary entry",
                )
            )

        for content_id in self._repository.list_kb_entry_ids():
            title = entry_identity_title(self._repository, content_id)
            if normalized and normalized not in title.lower() and normalized not in content_id.lower():
                continue
            options.append(
                EditorialReferenceOption(
                    contentId=content_id,
                    contentType="kb_entry",
                    label=title or content_id,
                    detail="Knowledge Base article",
                )
            )

        return sorted(options, key=lambda item: item.label.lower())
