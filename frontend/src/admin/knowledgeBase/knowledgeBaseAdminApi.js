import { createEditorialAdminClient } from "../../editorial/editorialAdminApi.js";

const client = createEditorialAdminClient("/api/admin/knowledge-base/entries");

export function listKnowledgeBaseEntries(locale = "ro") {
  return client.request(`?locale=${encodeURIComponent(locale)}`);
}

export function createKnowledgeBaseEntry(title, category, difficulty) {
  return client.request("", {
    method: "POST",
    body: JSON.stringify({ title, category, difficulty }),
  });
}

export function getKnowledgeBaseVariant(contentId, locale) {
  return client.request(`/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}`);
}

export function saveKnowledgeBaseVariant(contentId, locale, category, difficulty, body) {
  return client.request(`/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}`, {
    method: "PUT",
    body: JSON.stringify({ category, difficulty, body }),
  });
}

export function publishKnowledgeBaseVariant(contentId, locale) {
  return client.request(
    `/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}/publish`,
    { method: "POST" },
  );
}

export function deleteKnowledgeBaseEntry(contentId) {
  return client.request(`/${encodeURIComponent(contentId)}`, { method: "DELETE" });
}

export function deleteKnowledgeBaseEntryVariant(contentId, locale) {
  return client.request(
    `/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}`,
    { method: "DELETE" },
  );
}

export function generateKnowledgeBaseTranslation(contentId, locale, confirmOverwrite = false) {
  return client.request(
    `/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}/generate-translation`,
    {
      method: "POST",
      body: JSON.stringify({ confirmOverwrite }),
    },
  );
}

export function uploadKnowledgeBaseImage(file) {
  return client.uploadImage(file);
}
