/**
 * Knowledge Base search input.
 */

import { forwardRef } from "react";

/**
 * @param {{
 *   value: string;
 *   onChange: (value: string) => void;
 *   onSubmit?: (value: string) => void;
 * }} props
 */
const KnowledgeBaseSearch = forwardRef(function KnowledgeBaseSearch(
  { value, onChange, onSubmit },
  ref,
) {
  return (
    <label className="knowledge-base-toolbar__search-label">
      <span className="knowledge-base-toolbar__search-caption">Search knowledge base</span>
      <input
        ref={ref}
        type="search"
        className="knowledge-base-toolbar__search-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit?.(event.currentTarget.value);
          }
        }}
        placeholder="Search problems, symptoms, and solutions"
        aria-label="Search knowledge base"
      />
    </label>
  );
});

export default KnowledgeBaseSearch;
