import { forwardRef } from "react";
import KnowledgeBaseSearch from "./KnowledgeBaseSearch.jsx";

/**
 * Sticky Knowledge Base toolbar with search.
 */

/**
 * @param {{
 *   searchQuery: string;
 *   onSearchChange: (value: string) => void;
 *   onSearchSubmit: (value: string) => void;
 * }} props
 */
const KnowledgeBaseToolbar = forwardRef(function KnowledgeBaseToolbar(
  { searchQuery, onSearchChange, onSearchSubmit },
  ref,
) {
  return (
    <div className="knowledge-base-toolbar">
      <KnowledgeBaseSearch
        ref={ref}
        value={searchQuery}
        onChange={onSearchChange}
        onSubmit={onSearchSubmit}
      />
    </div>
  );
});

export default KnowledgeBaseToolbar;
