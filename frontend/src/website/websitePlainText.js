/**
 * Split plain CMS text into paragraph blocks on blank lines.
 * Safe text-only rendering — no HTML interpretation.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
export function splitPlainTextParagraphs(value) {
  const normalized = String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
