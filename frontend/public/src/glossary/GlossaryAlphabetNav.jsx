/**
 * Discreet A–Z dictionary index.
 */

import { useI18n } from "../i18n/I18nContext.jsx";

/**
 * @param {{
 *   letters: string[];
 *   onSelectLetter: (letter: string) => void;
 * }} props
 */
export default function GlossaryAlphabetNav({ letters, onSelectLetter }) {
  const { t } = useI18n();
  if (letters.length === 0) {
    return null;
  }

  return (
    <nav className="glossary-toolbar__alphabet" aria-label={t("glossary.alphabetNav")}>
      <ol className="glossary-toolbar__alphabet-list">
        {letters.map((letter) => (
          <li key={letter} className="glossary-toolbar__alphabet-item">
            <button
              type="button"
              className="glossary-toolbar__alphabet-link"
              onClick={() => onSelectLetter(letter)}
            >
              {letter}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
