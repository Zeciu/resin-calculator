/**
 * Glossary search input.
 */

import { forwardRef } from "react";

/**
 * @param {{
 *   value: string;
 *   onChange: (value: string) => void;
 *   onSubmit?: (value: string) => void;
 * }} props
 */
const GlossarySearch = forwardRef(function GlossarySearch({ value, onChange, onSubmit }, ref) {
  return (
    <label className="glossary-toolbar__search-label">
      <span className="glossary-toolbar__search-caption">Search glossary</span>
      <input
        ref={ref}
        type="search"
        className="glossary-toolbar__search-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit?.(event.currentTarget.value);
          }
        }}
        placeholder="Search terms and definitions"
        aria-label="Search glossary"
      />
    </label>
  );
});

export default GlossarySearch;
