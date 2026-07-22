import GlossaryEntry from "./GlossaryEntry.jsx";
import { getGlossaryLetterSectionId } from "./glossaryFilter.js";

/**
 * @param {{
 *   groups: { letter: string; entries: import("./glossaryContent.js").GlossaryEntry[] }[];
 *   expandedEntryId: string | null;
 *   onToggleEntry: (entryId: string) => void;
 *   onNavigateToEntry?: (entryId: string) => void;
 *   publishedEntryIds?: Set<string>;
 * }} props
 */
export default function GlossaryEntryList({
  groups,
  expandedEntryId,
  onToggleEntry,
  onNavigateToEntry,
  publishedEntryIds,
}) {
  if (groups.length === 0) {
    return (
      <div className="module-empty-state">
        <p className="module-empty-state__title">No glossary terms match your search.</p>
        <p className="module-empty-state__hint">Try different keywords.</p>
      </div>
    );
  }

  return (
    <div className="glossary-module__groups">
      {groups.map((group) => (
        <section
          key={group.letter}
          id={getGlossaryLetterSectionId(group.letter)}
          className="glossary-module__letter-group"
          aria-labelledby={`glossary-letter-${group.letter}-heading`}
        >
          <h2
            className="glossary-module__letter-heading"
            id={`glossary-letter-${group.letter}-heading`}
          >
            {group.letter}
          </h2>
          <div className="glossary-module__entries">
            {group.entries.map((entry) => (
              <GlossaryEntry
                key={entry.id}
                entry={entry}
                isExpanded={expandedEntryId === entry.id}
                onToggle={onToggleEntry}
                onNavigateToEntry={onNavigateToEntry}
                publishedEntryIds={publishedEntryIds}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
