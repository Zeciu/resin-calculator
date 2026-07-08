/**
 * Pure glossary filter, sort, and grouping helpers.
 */

/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

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
 * @param {string} [locale]
 * @returns {import("./glossaryContent.js").GlossaryEntry[]}
 */
export function sortGlossaryEntries(entries, locale = "en") {
  return [...entries].sort((left, right) => left.term.localeCompare(right.term, locale, { sensitivity: "base" }));
}

/**
 * @param {import("./glossaryContent.js").GlossaryEntry} entry
 * @returns {string[]}
 */
function entrySearchTerms(entry) {
  const terms = [entry.term, ...(entry.synonyms?.map((item) => item.term) ?? [])];
  return terms.filter(Boolean);
}

/**
 * @param {import("./glossaryContent.js").GlossaryEntry} entry
 * @returns {string}
 */
function entrySearchableText(entry) {
  const definitionText = (entry.definition ?? []).join(" ");
  const synonymText = (entry.synonyms ?? []).map((item) => item.term).join(" ");
  return `${entry.term} ${definitionText} ${synonymText}`;
}

/**
 * @param {import("./glossaryContent.js").GlossaryEntry[]} entries
 * @param {string} query
 * @returns {import("./glossaryContent.js").GlossaryEntry[]}
 */
export function filterGlossaryEntries(entries, query) {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return entries;
  }

  return entries.filter((entry) => {
    if (entrySearchTerms(entry).some((term) => normalizeSearchText(term).includes(normalized))) {
      return true;
    }
    return normalizeSearchText(entrySearchableText(entry)).includes(normalized);
  });
}

/**
 * @param {import("./glossaryContent.js").GlossaryEntry[]} entries
 * @param {string} [locale]
 * @returns {{ letter: string, entries: import("./glossaryContent.js").GlossaryEntry[] }[]}
 */
export function groupGlossaryEntriesByLetter(entries, locale = "en") {
  const sorted = sortGlossaryEntries(entries, locale);
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
 * @param {string} [locale]
 * @returns {import("./glossaryContent.js").GlossaryEntry | null}
 */
export function getFirstFilteredGlossaryEntry(groups, query, locale = "en") {
  const normalized = normalizeSearchText(query);
  const entries = groups.flatMap((group) => group.entries);
  if (entries.length === 0) {
    return null;
  }

  const termMatches = entries.filter((entry) =>
    entrySearchTerms(entry).some((term) => normalizeSearchText(term).includes(normalized)),
  );
  const pool = termMatches.length > 0 ? termMatches : entries;
  return sortGlossaryEntries(pool, locale)[0] ?? null;
}
