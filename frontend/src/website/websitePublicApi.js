const API_BASE_URL = "";

/**
 * Fetch a published Website page snapshot for a public locale.
 *
 * @param {string} pageKey
 * @param {string} [locale]
 */
export async function fetchPublishedWebsitePage(pageKey, locale = "en") {
  const response = await fetch(
    `${API_BASE_URL}/api/content/website/${encodeURIComponent(pageKey)}?locale=${encodeURIComponent(locale)}`,
  );

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}
