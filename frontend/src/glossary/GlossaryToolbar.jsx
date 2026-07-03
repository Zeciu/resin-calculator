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
export default function GlossaryToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  activeLetters,
  onSelectLetter,
}) {
  return (
    <div className="glossary-toolbar">
      <GlossarySearch
        value={searchQuery}
        onChange={onSearchChange}
        onSubmit={onSearchSubmit}
      />
      <GlossaryAlphabetNav letters={activeLetters} onSelectLetter={onSelectLetter} />
    </div>
  );
}
