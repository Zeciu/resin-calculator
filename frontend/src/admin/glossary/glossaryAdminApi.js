import { createEditorialAdminClient } from "../../editorial/editorialAdminApi.js";

const client = createEditorialAdminClient("/api/admin/glossary/entries");

export function listGlossaryEntries(locale = "en") {
  return client.request(`?locale=${encodeURIComponent(locale)}`);
}

export function createGlossaryEntry(term) {
  return client.request("", {
    method: "POST",
    body: JSON.stringify({ term }),
  });
}

export function getGlossaryVariant(contentId, locale) {
  return client.request(`/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}`);
}

export function saveGlossaryVariant(contentId, locale, body) {
  return client.request(`/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}`, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
}

export function publishGlossaryVariant(contentId, locale) {
  return client.request(
    `/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}/publish`,
    { method: "POST" },
  );
}

export function deleteGlossaryEntry(contentId) {
  return client.request(`/${encodeURIComponent(contentId)}`, { method: "DELETE" });
}

export function uploadGlossaryImage(file) {
  return client.uploadImage(file);
}
