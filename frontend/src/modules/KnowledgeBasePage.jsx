import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import KnowledgeBaseEntryList from "../knowledgeBase/KnowledgeBaseEntryList.jsx";
import KnowledgeBaseToolbar from "../knowledgeBase/KnowledgeBaseToolbar.jsx";
import { KNOWLEDGE_BASE_ENTRIES } from "../knowledgeBase/knowledgeBaseContent.js";
import {
  filterKnowledgeBaseEntries,
  getFirstFilteredKnowledgeBaseEntry,
  getKnowledgeBaseEntryElementId,
} from "../knowledgeBase/knowledgeBaseFilter.js";

export default function KnowledgeBasePage() {
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState(null);

  const filteredEntries = useMemo(
    () => filterKnowledgeBaseEntries(KNOWLEDGE_BASE_ENTRIES, searchQuery),
    [searchQuery],
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

      const firstEntry = getFirstFilteredKnowledgeBaseEntry(KNOWLEDGE_BASE_ENTRIES, query);
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
    [searchQuery],
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
        />
      </div>
    </section>
  );
}
