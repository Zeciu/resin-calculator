const API_BASE_URL = "";

const PREVIEW_MODULES = new Set(["manual", "knowledge-base", "glossary"]);

export async function fetchPublicPreview(module, locale = "en") {
  if (!PREVIEW_MODULES.has(module)) {
    throw new Error(`Unknown public preview module: ${module}`);
  }
  const response = await fetch(
    `${API_BASE_URL}/api/public-preview/${module}?locale=${encodeURIComponent(locale)}`,
  );
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}
