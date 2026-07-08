import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { fetchPublishedKnowledgeBase } from "../knowledgeBase/knowledgeBaseApi.js";
import KnowledgeBaseEntryList from "../knowledgeBase/KnowledgeBaseEntryList.jsx";
import KnowledgeBaseToolbar from "../knowledgeBase/KnowledgeBaseToolbar.jsx";
import {
  filterKnowledgeBaseEntries,
  getFirstFilteredKnowledgeBaseEntry,
  getKnowledgeBaseEntryElementId,
} from "../knowledgeBase/knowledgeBaseFilter.js";

const DEFAULT_LOCALE = "en";

export default function KnowledgeBasePage() {
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadState, setLoadState] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadKnowledgeBase() {
      setLoadState("loading");
      try {
        const payload = await fetchPublishedKnowledgeBase(DEFAULT_LOCALE);
        if (cancelled) {
          return;
        }
        if (!payload.available) {
          setEntries([]);
          setLoadState("error");
          return;
        }
        setEntries(payload.entries);
        setLoadState("ready");
      } catch {
        if (!cancelled) {
          setEntries([]);
          setLoadState("error");
        }
      }
    }

    loadKnowledgeBase();
    return () => {
      cancelled = true;
    };
  }, []);

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
        <h1 className="knowledge-base-module__title">Knowledge Base</h1>
        <p className="knowledge-base-module__lede">
          Practical troubleshooting for woodworking, epoxy resin, and HFZWood workflow problems.
          Find a symptom, review the likely causes, and follow the recommended solution.
        </p>
      </header>

      <div className="knowledge-base-module__scroll" ref={scrollContainerRef}>
        {loadState === "loading" ? (
          <p className="knowledge-base-module__status" role="status">
            Loading knowledge base...
          </p>
        ) : null}
        {loadState === "error" ? (
          <p className="knowledge-base-module__status knowledge-base-module__status--error" role="alert">
            Knowledge Base content is not available right now.
          </p>
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
