import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import GlossaryEntryList from "../glossary/GlossaryEntryList.jsx";
import GlossaryToolbar from "../glossary/GlossaryToolbar.jsx";
import { GLOSSARY_ENTRIES } from "../glossary/glossaryContent.js";
import {
  filterGlossaryEntries,
  getActiveGlossaryLetters,
  getFirstFilteredGlossaryEntry,
  getGlossaryEntryElementId,
  getGlossaryLetterSectionId,
  groupGlossaryEntriesByLetter,
} from "../glossary/glossaryFilter.js";

export default function GlossaryPage() {
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState(null);

  const filteredGroups = useMemo(() => {
    const filtered = filterGlossaryEntries(GLOSSARY_ENTRIES, searchQuery);
    return groupGlossaryEntriesByLetter(filtered);
  }, [searchQuery]);

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

      const groups = groupGlossaryEntriesByLetter(
        filterGlossaryEntries(GLOSSARY_ENTRIES, query),
      );
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
    [searchQuery],
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
        />
      </div>
    </section>
  );
}
