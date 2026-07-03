import KnowledgeBaseEntry from "./KnowledgeBaseEntry.jsx";

/**
 * @param {{
 *   entries: import("./knowledgeBaseContent.js").KnowledgeBaseEntry[];
 *   expandedEntryId: string | null;
 *   onToggleEntry: (entryId: string) => void;
 * }} props
 */
export default function KnowledgeBaseEntryList({ entries, expandedEntryId, onToggleEntry }) {
  if (entries.length === 0) {
    return (
      <div className="knowledge-base-module__empty-state">
        <p className="knowledge-base-module__empty-state-title">No matching articles found.</p>
        <p className="knowledge-base-module__empty-state-hint">Try different keywords.</p>
      </div>
    );
  }

  return (
    <div className="knowledge-base-module__entries">
      {entries.map((entry) => (
        <KnowledgeBaseEntry
          key={entry.id}
          entry={entry}
          isExpanded={expandedEntryId === entry.id}
          onToggle={onToggleEntry}
        />
      ))}
    </div>
  );
}
