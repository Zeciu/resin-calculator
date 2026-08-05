import { buildAuthHeaders } from "../auth/authHeaders.js";

const API_BASE_URL = "";

export async function fetchPublishedManual(locale = "en") {
  const response = await fetch(
    `${API_BASE_URL}/api/content/manual?locale=${encodeURIComponent(locale)}`,
    { headers: await buildAuthHeaders({ includeJsonContentType: false }) },
  );
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}
