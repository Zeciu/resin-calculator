import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { fetchPublishedKnowledgeBase } from "../knowledgeBase/knowledgeBaseApi.js";
import KnowledgeBaseEntryList from "../knowledgeBase/KnowledgeBaseEntryList.jsx";
import KnowledgeBaseToolbar from "../knowledgeBase/KnowledgeBaseToolbar.jsx";
import {
  filterKnowledgeBaseEntries,
  getFirstFilteredKnowledgeBaseEntry,
  getKnowledgeBaseEntryElementId,
} from "../knowledgeBase/knowledgeBaseFilter.js";
import ContentUnavailableMessage from "../content/ContentUnavailableMessage.jsx";
import { usePublishedContent } from "../content/usePublishedContent.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useCapabilityLimit } from "../capabilities/CapabilitiesContext.jsx";
import { CAPABILITY_KEYS } from "../capabilities/capabilityKeys.js";
import { limitKnowledgeBaseEntries } from "../capabilities/knowledgeBaseCapabilityPolicy.js";

export default function KnowledgeBasePage() {
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const { payload, loadState, viewEnglishVersion } = usePublishedContent(fetchPublishedKnowledgeBase);
  const maxArticles = useCapabilityLimit(CAPABILITY_KEYS.KNOWLEDGE_BASE_MAX_ARTICLES);
  const entries = useMemo(
    () => limitKnowledgeBaseEntries(payload?.entries ?? [], maxArticles),
    [payload?.entries, maxArticles],
  );

  const filteredEntries = useMemo(
    () => filterKnowledgeBaseEntries(entries, searchQuery),
    [entries, searchQuery],
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

    const target = container.querySelector(
      `#${CSS.escape(getKnowledgeBaseEntryElementId(entryId))}`,
    );
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

      const firstEntry = getFirstFilteredKnowledgeBaseEntry(entries, query);
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

  return (
    <section className="knowledge-base-module" aria-label="Knowledge Base">
      <header className="knowledge-base-module__header">
        <h1 className="knowledge-base-module__title">{t("content.knowledgeBaseTitle")}</h1>
      </header>

      <div className="knowledge-base-module__scroll" ref={scrollContainerRef}>
        {loadState === "loading" ? (
          <p className="knowledge-base-module__status" role="status">
            {t("content.loadingKnowledgeBase")}
          </p>
        ) : null}
        {loadState === "unavailable" || loadState === "error" ? (
          <ContentUnavailableMessage
            unavailableKey="content.unavailableKnowledgeBase"
            englishAvailable={Boolean(payload?.englishAvailable)}
            onViewEnglish={viewEnglishVersion}
          />
        ) : null}
        {loadState === "ready" ? (
          <>
            <KnowledgeBaseToolbar
              ref={searchInputRef}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
            />
            <KnowledgeBaseEntryList
              entries={filteredEntries}
              expandedEntryId={expandedEntryId}
              onToggleEntry={handleToggleEntry}
              onNavigateToEntry={handleNavigateToEntry}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
