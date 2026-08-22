import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import GlossaryEntry from "../glossary/GlossaryEntry.jsx";
import {
  getGlossaryEntryElementId,
  getGlossaryLetterSectionId,
  groupGlossaryEntriesByLetter,
  parseGlossaryEntryIdFromHash,
} from "../glossary/glossaryFilter.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import PreviewAvailableBadge from "./PreviewAvailableBadge.jsx";
import PreviewBackLink from "./PreviewBackLink.jsx";
import PreviewEmptyState from "./PreviewEmptyState.jsx";
import PreviewLockedItem from "./PreviewLockedItem.jsx";
import PreviewLockedPanel from "./PreviewLockedPanel.jsx";
import PreviewSearch from "./PreviewSearch.jsx";
import { rewritePreviewHref } from "./previewLinks.js";
import { filterPreviewItems } from "./previewSearch.js";
import { useInitialUnlockedContentReveal } from "./useInitialUnlockedContentReveal.js";
import { usePreviewSelection } from "./usePreviewSelection.js";
import { usePublicPreview } from "./usePublicPreview.js";

export default function GlossaryPreviewPage() {
  const location = useLocation();
  const { t } = useI18n();
  const { payload, loadState } = usePublicPreview("glossary");
  const entries = payload?.entries ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const publishedEntryIds = useMemo(
    () => new Set(entries.map((entry) => entry.id)),
    [entries],
  );
  const filteredEntries = useMemo(
    () => filterPreviewItems(entries, searchQuery, (entry) => entry.term),
    [entries, searchQuery],
  );
  const filteredGroups = useMemo(
    () => groupGlossaryEntriesByLetter(filteredEntries),
    [filteredEntries],
  );
  const hashId = parseGlossaryEntryIdFromHash(location.hash);
  const [selectedId, setSelectedId] = usePreviewSelection(filteredEntries, loadState, hashId);

  const selectEntry = useCallback((entryId) => {
    if (!entryId) {
      return;
    }
    setSearchQuery("");
    setSelectedId(entryId);
  }, [setSelectedId]);

  const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? null;
  const selectedUnlocked = selectedEntry?.locked === false;
  useInitialUnlockedContentReveal(
    selectedUnlocked ? getGlossaryEntryElementId(selectedId) : "",
    loadState === "ready" && selectedUnlocked,
  );

  const showEmpty =
    loadState === "unavailable" ||
    loadState === "error" ||
    (loadState === "ready" && entries.length === 0);

  return (
    <section className="glossary-module knowledge-preview-module" aria-label={t("content.glossaryTitle")}>
      <PreviewBackLink />
      <header className="glossary-module__header">
        <h1 className="glossary-module__title">{t("content.glossaryTitle")}</h1>
        <p className="knowledge-preview-module__context">{t("preview.glossaryContext")}</p>
      </header>

      <div className="glossary-module__scroll">
        {loadState === "loading" ? (
          <p className="glossary-module__status" role="status">
            {t("content.loadingGlossary")}
          </p>
        ) : null}
        {showEmpty ? <PreviewEmptyState /> : null}
        {loadState === "ready" && entries.length > 0 ? (
          <>
            <div className="glossary-toolbar">
              <PreviewSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholderKey="preview.searchPlaceholderTerm"
              />
            </div>
            {filteredGroups.length === 0 ? (
              <p className="knowledge-preview-module__no-matches">{t("preview.noSearchMatches")}</p>
            ) : (
              <div className="glossary-module__groups">
                {filteredGroups.map((group) => (
                  <section
                    key={group.letter}
                    id={getGlossaryLetterSectionId(group.letter)}
                    className="glossary-module__letter-group"
                    aria-labelledby={`preview-glossary-letter-${group.letter}-heading`}
                  >
                    <h2
                      className="glossary-module__letter-heading"
                      id={`preview-glossary-letter-${group.letter}-heading`}
                    >
                      {group.letter}
                    </h2>
                    <div className="glossary-module__entries">
                      {group.entries.map((entry) =>
                        entry.locked ? (
                          <PreviewLockedItem
                            key={entry.id}
                            id={entry.id}
                            label={entry.term}
                            selected={selectedId === entry.id}
                            onSelect={selectEntry}
                            headingLevel={3}
                          >
                            <PreviewLockedPanel copyKey="preview.lockedGlossary" headingLevel={3} />
                          </PreviewLockedItem>
                        ) : (
                          <div
                            key={entry.id}
                            className={
                              selectedId === entry.id
                                ? "knowledge-preview-available knowledge-preview-available--selected"
                                : "knowledge-preview-available"
                            }
                            data-preview-unlocked-content={selectedId === entry.id ? "" : undefined}
                          >
                            <GlossaryEntry
                              entry={entry}
                              isExpanded={selectedId === entry.id}
                              onToggle={(entryId) =>
                                setSelectedId((current) => (current === entryId ? null : entryId))
                              }
                              onNavigateToEntry={selectEntry}
                              publishedEntryIds={publishedEntryIds}
                              rewriteExternalHref={rewritePreviewHref}
                              endAdornment={<PreviewAvailableBadge />}
                            />
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
