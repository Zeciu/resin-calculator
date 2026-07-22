import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import GlossaryEntryList from "../glossary/GlossaryEntryList.jsx";
import GlossaryToolbar from "../glossary/GlossaryToolbar.jsx";
import { fetchPublishedGlossary } from "../glossary/glossaryApi.js";
import {
  filterGlossaryEntries,
  getActiveGlossaryLetters,
  getFirstFilteredGlossaryEntry,
  getGlossaryEntryElementId,
  getGlossaryLetterSectionId,
  groupGlossaryEntriesByLetter,
} from "../glossary/glossaryFilter.js";
import ContentUnavailableMessage from "../content/ContentUnavailableMessage.jsx";
import { usePublishedContent } from "../content/usePublishedContent.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export default function GlossaryPage() {
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const { payload, loadState, viewEnglishVersion } = usePublishedContent(fetchPublishedGlossary);
  const entries = payload?.entries ?? [];

  const publishedEntryIds = useMemo(
    () => new Set(entries.map((entry) => entry.id)),
    [entries],
  );

  const filteredGroups = useMemo(() => {
    const filtered = filterGlossaryEntries(entries, searchQuery);
    return groupGlossaryEntriesByLetter(filtered);
  }, [entries, searchQuery]);

  const activeLetters = useMemo(
    () => getActiveGlossaryLetters(filteredGroups),
    [filteredGroups],
  );

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setExpandedEntryId(null);
  }, []);

  const scrollToEntry = useCallback((entryId) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const target = container.querySelector(`#${CSS.escape(getGlossaryEntryElementId(entryId))}`);
    if (!target) {
      return;
    }

    if (typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, []);

  const handleToggleEntry = useCallback((entryId) => {
    setExpandedEntryId((current) => (current === entryId ? null : entryId));
  }, []);

  const handleNavigateToEntry = useCallback((entryId) => {
    if (!entryId) {
      return;
    }
    // Clear search so the target entry is visible in the current locale list.
    setSearchQuery("");
    setExpandedEntryId(entryId);
    requestAnimationFrame(() => {
      scrollToEntry(entryId);
    });
  }, [scrollToEntry]);

  useLayoutEffect(() => {
    if (!expandedEntryId) {
      return;
    }

    let cancelled = false;
    let outerFrame = 0;
    let innerFrame = 0;

    outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        if (!cancelled) {
          scrollToEntry(expandedEntryId);
        }
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [expandedEntryId, scrollToEntry]);

  const handleSearchSubmit = useCallback(
    (queryOverride) => {
      const query = (queryOverride ?? searchQuery).trim();
      if (!query) {
        return;
      }

      const groups = groupGlossaryEntriesByLetter(filterGlossaryEntries(entries, query));
      const firstEntry = getFirstFilteredGlossaryEntry(groups, query);
      if (!firstEntry) {
        return;
      }

      if (queryOverride !== undefined) {
        setSearchQuery(queryOverride);
      }

      setExpandedEntryId(firstEntry.id);
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    },
    [entries, searchQuery],
  );

  const scrollToLetter = useCallback((letter) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const target = container.querySelector(`#${CSS.escape(getGlossaryLetterSectionId(letter))}`);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "auto", block: "start" });
  }, []);

  return (
    <section className="glossary-module" aria-label="Glossary">
      <header className="glossary-module__header">
        <h1 className="glossary-module__title">{t("content.glossaryTitle")}</h1>
      </header>

      <div className="glossary-module__scroll" ref={scrollContainerRef}>
        {loadState === "loading" ? (
          <p className="glossary-module__status" role="status">
            {t("content.loadingGlossary")}
          </p>
        ) : null}
        {loadState === "unavailable" || loadState === "error" ? (
          <ContentUnavailableMessage
            unavailableKey="content.unavailableGlossary"
            englishAvailable={Boolean(payload?.englishAvailable)}
            onViewEnglish={viewEnglishVersion}
          />
        ) : null}
        {loadState === "ready" ? (
          <>
            <GlossaryToolbar
              ref={searchInputRef}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
              activeLetters={activeLetters}
              onSelectLetter={scrollToLetter}
            />
            <GlossaryEntryList
              groups={filteredGroups}
              expandedEntryId={expandedEntryId}
              onToggleEntry={handleToggleEntry}
              onNavigateToEntry={handleNavigateToEntry}
              publishedEntryIds={publishedEntryIds}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
