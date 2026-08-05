/**
 * Pure Knowledge Base filter and lookup helpers.
 */

/**
 * @param {import("./knowledgeBaseContent.js").KnowledgeBaseEntry} entry
 * @returns {string[]}
 */
function getSearchableTextValues(entry) {
  return [
    entry.title,
    entry.problemSummary,
    ...(entry.symptoms ?? []),
    ...(entry.possibleCauses ?? []),
    ...(entry.solution ?? []),
    ...(entry.prevention ?? []),
    ...(entry.tips ?? []),
    ...(entry.warnings ?? []),
    ...(entry.searchKeywords ?? []),
  ];
}

/**
 * @param {import("./knowledgeBaseContent.js").KnowledgeBaseEntry[]} entries
 * @param {string} query
 * @returns {import("./knowledgeBaseContent.js").KnowledgeBaseEntry[]}
 */
export function filterKnowledgeBaseEntries(entries, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return entries;
  }

  return entries.filter((entry) =>
    getSearchableTextValues(entry).some((value) => value.toLowerCase().includes(normalized)),
  );
}

/**
 * @param {string} entryId
 * @returns {string}
 */
export function getKnowledgeBaseEntryElementId(entryId) {
  return `knowledge-base-entry-${entryId}`;
}

/**
 * @param {import("./knowledgeBaseContent.js").KnowledgeBaseEntry[]} entries
 * @param {string} query
 * @returns {import("./knowledgeBaseContent.js").KnowledgeBaseEntry | null}
 */
export function getFirstFilteredKnowledgeBaseEntry(entries, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const filtered = filterKnowledgeBaseEntries(entries, query);
  if (filtered.length === 0) {
    return null;
  }

  const titleMatches = filtered.filter((entry) => entry.title.toLowerCase().includes(normalized));
  const pool = titleMatches.length > 0 ? titleMatches : filtered;
  const order = new Map(entries.map((entry, index) => [entry.id, index]));

  return [...pool].sort((left, right) => order.get(left.id) - order.get(right.id))[0] ?? null;
}
