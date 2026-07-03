/**
 * Pure glossary filter, sort, and grouping helpers.
 */

/**
 * @param {string} term
 * @returns {string}
 */
export function getGlossaryLetter(term) {
  const first = term.trim().charAt(0).toUpperCase();
  if (first >= "A" && first <= "Z") {
    return first;
  }
  return "#";
}

/**
 * @param {string} letter
 * @returns {string}
 */
export function getGlossaryLetterSectionId(letter) {
  return letter === "#" ? "glossary-letter-other" : `glossary-letter-${letter.toLowerCase()}`;
}

/**
 * @param {import("./glossaryContent.js").GlossaryEntry[]} entries
 * @returns {import("./glossaryContent.js").GlossaryEntry[]}
 */
export function sortGlossaryEntries(entries) {
  return [...entries].sort((left, right) => left.term.localeCompare(right.term, "en"));
}

/**
 * @param {import("./glossaryContent.js").GlossaryEntry[]} entries
 * @param {string} query
 * @returns {import("./glossaryContent.js").GlossaryEntry[]}
 */
export function filterGlossaryEntries(entries, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return entries;
  }

  return entries.filter((entry) => {
    if (entry.term.toLowerCase().includes(normalized)) {
      return true;
    }

    return entry.definition.some((paragraph) => paragraph.toLowerCase().includes(normalized));
  });
}

/**
 * @param {import("./glossaryContent.js").GlossaryEntry[]} entries
 * @returns {{ letter: string, entries: import("./glossaryContent.js").GlossaryEntry[] }[]}
 */
export function groupGlossaryEntriesByLetter(entries) {
  const sorted = sortGlossaryEntries(entries);
  /** @type {Map<string, import("./glossaryContent.js").GlossaryEntry[]>} */
  const groups = new Map();

  for (const entry of sorted) {
    const letter = getGlossaryLetter(entry.term);
    const bucket = groups.get(letter) ?? [];
    bucket.push(entry);
    groups.set(letter, bucket);
  }

  return Array.from(groups.entries()).map(([letter, letterEntries]) => ({
    letter,
    entries: letterEntries,
  }));
}

/**
 * @param {{ letter: string, entries: import("./glossaryContent.js").GlossaryEntry[] }[]} groups
 * @returns {string[]}
 */
export function getActiveGlossaryLetters(groups) {
  return groups.map((group) => group.letter);
}

/**
 * @param {string} entryId
 * @returns {string}
 */
export function getGlossaryEntryElementId(entryId) {
  return `glossary-entry-${entryId}`;
}

/**
 * @param {{ letter: string, entries: import("./glossaryContent.js").GlossaryEntry[] }[]} groups
 * @param {string} query
 * @returns {import("./glossaryContent.js").GlossaryEntry | null}
 */
export function getFirstFilteredGlossaryEntry(groups, query) {
  const normalized = query.trim().toLowerCase();
  const entries = groups.flatMap((group) => group.entries);
  if (entries.length === 0) {
    return null;
  }

  const termMatches = entries.filter((entry) => entry.term.toLowerCase().includes(normalized));
  const pool = termMatches.length > 0 ? termMatches : entries;
  return sortGlossaryEntries(pool)[0] ?? null;
}
