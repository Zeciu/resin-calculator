import { forwardRef } from "react";
import GlossaryAlphabetNav from "./GlossaryAlphabetNav.jsx";
import GlossarySearch from "./GlossarySearch.jsx";

/**
 * Sticky glossary toolbar with search and A–Z navigation.
 */

/**
 * @param {{
 *   searchQuery: string;
 *   onSearchChange: (value: string) => void;
 *   onSearchSubmit: (value: string) => void;
 *   activeLetters: string[];
 *   onSelectLetter: (letter: string) => void;
 * }} props
 */
const GlossaryToolbar = forwardRef(function GlossaryToolbar(
  { searchQuery, onSearchChange, onSearchSubmit, activeLetters, onSelectLetter },
  ref,
) {
  return (
    <div className="glossary-toolbar">
      <GlossarySearch
        ref={ref}
        value={searchQuery}
        onChange={onSearchChange}
        onSubmit={onSearchSubmit}
      />
      <GlossaryAlphabetNav letters={activeLetters} onSelectLetter={onSelectLetter} />
    </div>
  );
});

export default GlossaryToolbar;
