import { useI18n } from "../i18n/I18nContext.jsx";
import KnowledgeBaseEntry from "./KnowledgeBaseEntry.jsx";

/**
 * @param {{
 *   entries: import("./knowledgeBaseContent.js").KnowledgeBaseEntry[];
 *   expandedEntryId: string | null;
 *   onToggleEntry: (entryId: string) => void;
 *   onNavigateToEntry?: (entryId: string) => void;
 * }} props
 */
export default function KnowledgeBaseEntryList({
  entries,
  expandedEntryId,
  onToggleEntry,
  onNavigateToEntry,
}) {
  const { t } = useI18n();
  if (entries.length === 0) {
    return (
      <div className="module-empty-state">
        <p className="module-empty-state__title">{t("knowledgeBase.emptyTitle")}</p>
        <p className="module-empty-state__hint">{t("knowledgeBase.emptyHint")}</p>
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
          onNavigateToEntry={onNavigateToEntry}
        />
      ))}
    </div>
  );
}
