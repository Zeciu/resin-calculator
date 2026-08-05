/**
 * @param {Array<unknown>} entries
 * @param {number | null | undefined} maxArticles
 * @returns {Array<unknown>}
 */
export function limitKnowledgeBaseEntries(entries, maxArticles) {
  if (!Array.isArray(entries)) {
    return [];
  }
  if (maxArticles == null || maxArticles === undefined) {
    return entries;
  }
  return entries.slice(0, Math.max(0, maxArticles));
}
