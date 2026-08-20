import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
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
import { useCapabilities } from "../capabilities/CapabilitiesContext.jsx";
import { useI18n } from "../i18n/I18nContext.jsx";

const BACK_TO_TOP_THRESHOLD_PX = 600;

export default function KnowledgeBasePage() {
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const { t } = useI18n();
  const { capabilities } = useCapabilities();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { payload, loadState, viewEnglishVersion } = usePublishedContent(fetchPublishedKnowledgeBase);
  const entries = payload?.entries ?? [];

  const filteredEntries = useMemo(
    () => filterKnowledgeBaseEntries(entries, searchQuery),
    [entries, searchQuery],
  );

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  useEffect(() => {
    if (!expandedEntryId) {
      return;
    }

    const expandedEntryStillVisible = filteredEntries.some((entry) => entry.id === expandedEntryId);
    if (!expandedEntryStillVisible) {
      setExpandedEntryId(null);
    }
  }, [expandedEntryId, filteredEntries]);

  useEffect(() => {
    const updateVisibility = () => {
      setShowBackToTop(window.scrollY > BACK_TO_TOP_THRESHOLD_PX);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const handleBackToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            {capabilities.accessTier === "free" ? (
              <p className="content-preview-notice" role="status">
                {t("content.freePreviewKnowledgeBase")}
              </p>
            ) : null}
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
      {showBackToTop ? (
        <button
          type="button"
          className="knowledge-base-module__back-to-top"
          aria-label={t("knowledgeBase.backToTop")}
          title={t("knowledgeBase.backToTop")}
          onClick={handleBackToTop}
        >
          <ChevronUp aria-hidden="true" size={20} strokeWidth={2.25} />
        </button>
      ) : null}
    </section>
  );
}
