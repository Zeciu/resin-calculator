import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

const DEFAULT_LOCALE = "en";

export default function GlossaryPage() {
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadState, setLoadState] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadGlossary() {
      setLoadState("loading");
      try {
        const payload = await fetchPublishedGlossary(DEFAULT_LOCALE);
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

    loadGlossary();
    return () => {
      cancelled = true;
    };
  }, []);

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
        <h1 className="glossary-module__title">Glossary</h1>
        <p className="glossary-module__lede">
          A technical dictionary of woodworking, epoxy resin, and HFZWood terminology for quick
          reference while you work.
        </p>
      </header>

      <div className="glossary-module__scroll" ref={scrollContainerRef}>
        {loadState === "loading" ? (
          <p className="glossary-module__status" role="status">
            Loading glossary...
          </p>
        ) : null}
        {loadState === "error" ? (
          <p className="glossary-module__status glossary-module__status--error" role="alert">
            Glossary content is not available right now.
          </p>
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
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
