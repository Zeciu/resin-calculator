import { buildAuthHeaders } from "../auth/authHeaders.js";

const API_BASE_URL = "";

export async function fetchPublicLanguagesConfig() {
  const response = await fetch(`${API_BASE_URL}/api/content/public-languages`, {
    headers: await buildAuthHeaders({ includeJsonContentType: false }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

export function resolvePublicInterfaceLocale(
  requestedLocale,
  activePublicLocales = ["en"],
  defaultPublicLocale = "en",
) {
  const active = Array.isArray(activePublicLocales) ? activePublicLocales : ["en"];
  const fallback =
    typeof defaultPublicLocale === "string" && defaultPublicLocale
      ? defaultPublicLocale
      : "en";
  if (active.includes(requestedLocale)) {
    return requestedLocale;
  }
  if (active.includes(fallback)) {
    return fallback;
  }
  return active[0] ?? "en";
}
