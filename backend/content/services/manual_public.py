from ..repositories.filesystem import FilesystemContentRepository
from ..schemas.manual import PublicManualResponse, parse_locale

MANUAL_DOCUMENT_TITLE = "Manual & Tutorials"
MANUAL_DOCUMENT_LEDE = (
    "A continuous guide to the HFZWood resin estimation workflow, with embedded "
    "demonstrations where visual explanation helps."
)


def sections_from_admin_snapshot(snapshot: dict | None) -> list[dict]:
    if not snapshot:
        return []

    chapters = snapshot.get("chapters", [])
    if not chapters:
        return []

    sections = []
    for chapter in sorted(chapters, key=lambda item: item.get("sortOrder", 0)):
        body_sections = chapter.get("sections", [])
        main_section = next((section for section in body_sections if section.get("id") == "main"), None)
        if main_section is None and body_sections:
            main_section = body_sections[0]

        sections.append(
            {
                "id": chapter["contentId"],
                "title": chapter.get("title", ""),
                "blocks": main_section.get("blocks", []) if main_section else [],
            }
        )
    return sections


def sections_from_legacy_document(document: dict | None) -> list[dict]:
    if not document:
        return []
    return document.get("sections", [])


class ManualPublicService:
    def __init__(self, repository: FilesystemContentRepository):
        self._repository = repository

    def _resolve_locale_sections(self, locale: str) -> list[dict]:
        admin_sections = sections_from_admin_snapshot(self._repository.read_manual_snapshot(locale))
        if admin_sections:
            return admin_sections
        return sections_from_legacy_document(self._repository.read_legacy_manual_document(locale))

    def _locale_has_content(self, locale: str) -> bool:
        return bool(self._resolve_locale_sections(locale))

    def get_published_manual(self, locale: str) -> PublicManualResponse:
        requested_locale = parse_locale(locale)
        english_available = self._locale_has_content("en")
        sections = self._resolve_locale_sections(requested_locale)

        return PublicManualResponse(
            locale=requested_locale,
            requestedLocale=requested_locale,
            available=bool(sections),
            englishAvailable=english_available,
            documentTitle=MANUAL_DOCUMENT_TITLE,
            lede=MANUAL_DOCUMENT_LEDE,
            sections=sections,
        )
