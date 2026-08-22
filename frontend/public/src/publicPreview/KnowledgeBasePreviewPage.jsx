import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import KnowledgeBaseEntry from "../knowledgeBase/KnowledgeBaseEntry.jsx";
import { getKnowledgeBaseEntryElementId } from "../knowledgeBase/knowledgeBaseFilter.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import PreviewAvailableBadge from "./PreviewAvailableBadge.jsx";
import PreviewBackLink from "./PreviewBackLink.jsx";
import PreviewEmptyState from "./PreviewEmptyState.jsx";
import PreviewLockedItem from "./PreviewLockedItem.jsx";
import PreviewLockedPanel from "./PreviewLockedPanel.jsx";
import PreviewSearch from "./PreviewSearch.jsx";
import { parseHashId, previewGlossaryHref, previewManualHref } from "./previewLinks.js";
import { filterPreviewItems } from "./previewSearch.js";
import { useInitialUnlockedContentReveal } from "./useInitialUnlockedContentReveal.js";
import { usePreviewSelection } from "./usePreviewSelection.js";
import { usePublicPreview } from "./usePublicPreview.js";

export default function KnowledgeBasePreviewPage() {
  const location = useLocation();
  const { t } = useI18n();
  const { payload, loadState } = usePublicPreview("knowledge-base");
  const entries = payload?.entries ?? [];
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(
    () => filterPreviewItems(entries, searchQuery, (entry) => entry.title),
    [entries, searchQuery],
  );
  const hashId = parseHashId(location.hash, "knowledge-base-entry-");
  const [selectedId, setSelectedId] = usePreviewSelection(filteredEntries, loadState, hashId);

  const selectEntry = useCallback((entryId) => {
    setSelectedId(entryId);
  }, [setSelectedId]);

  const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? null;
  const selectedUnlocked = selectedEntry?.locked === false;
  useInitialUnlockedContentReveal(
    selectedUnlocked ? getKnowledgeBaseEntryElementId(selectedId) : "",
    loadState === "ready" && selectedUnlocked,
  );
  const showEmpty =
    loadState === "unavailable" ||
    loadState === "error" ||
    (loadState === "ready" && entries.length === 0);

  return (
    <section className="knowledge-base-module knowledge-preview-module" aria-label={t("content.knowledgeBaseTitle")}>
      <PreviewBackLink />
      <header className="knowledge-base-module__header">
        <h1 className="knowledge-base-module__title">{t("content.knowledgeBaseTitle")}</h1>
        <p className="knowledge-preview-module__context">{t("preview.kbContext")}</p>
      </header>

      <div className="knowledge-base-module__scroll">
        {loadState === "loading" ? (
          <p className="knowledge-base-module__status" role="status">
            {t("content.loadingKnowledgeBase")}
          </p>
        ) : null}
        {showEmpty ? <PreviewEmptyState /> : null}
        {loadState === "ready" && entries.length > 0 ? (
          <>
            <div className="knowledge-base-toolbar">
              <PreviewSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholderKey="preview.searchPlaceholderTitle"
              />
            </div>
            {filteredEntries.length === 0 ? (
              <p className="knowledge-preview-module__no-matches">{t("preview.noSearchMatches")}</p>
            ) : (
              <div className="knowledge-base-module__entries">
                {filteredEntries.map((entry) =>
                  entry.locked ? (
                    <PreviewLockedItem
                      key={entry.id}
                      id={entry.id}
                      label={entry.title}
                      selected={selectedId === entry.id}
                      onSelect={selectEntry}
                    >
                      <PreviewLockedPanel copyKey="preview.lockedKnowledgeBase" headingLevel={3} />
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
                      <KnowledgeBaseEntry
                        entry={entry}
                        isExpanded={selectedId === entry.id}
                        onToggle={(entryId) =>
                          setSelectedId((current) => (current === entryId ? null : entryId))
                        }
                        onNavigateToEntry={selectEntry}
                        relatedGlossaryTo={previewGlossaryHref}
                        relatedManualTo={previewManualHref}
                        endAdornment={<PreviewAvailableBadge />}
                      />
                    </div>
                  ),
                )}
              </div>
            )}
          </>
        ) : null}
        {loadState === "ready" &&
        selectedEntry?.locked === true &&
        !filteredEntries.some((entry) => entry.id === selectedId) ? (
          <PreviewLockedPanel copyKey="preview.lockedKnowledgeBase" />
        ) : null}
      </div>
    </section>
  );
}
