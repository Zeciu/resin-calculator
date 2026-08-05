import { createEditorialAdminClient } from "../../editorial/editorialAdminApi.js";

const client = createEditorialAdminClient("/api/admin/manual/chapters");

export function listManualChapters(locale = "ro") {
  return client.request(`?locale=${encodeURIComponent(locale)}`);
}

export function createManualChapter(title, locale = "ro") {
  return client.request("", {
    method: "POST",
    body: JSON.stringify({ title, locale }),
  });
}

export function getManualVariant(contentId, locale) {
  return client.request(`/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}`);
}

export function saveManualVariant(contentId, locale, body) {
  return client.request(`/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}`, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
}

export function publishManualVariant(contentId, locale) {
  return client.request(
    `/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}/publish`,
    { method: "POST" },
  );
}

export function publishAllManualDrafts(locale) {
  return client.request(`/variants/${encodeURIComponent(locale)}/publish-drafts`, {
    method: "POST",
  });
}

export function deleteManualChapter(contentId) {
  return client.request(`/${encodeURIComponent(contentId)}`, { method: "DELETE" });
}

export function deleteManualChapterVariant(contentId, locale) {
  return client.request(
    `/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}`,
    { method: "DELETE" },
  );
}

export function generateManualTranslation(contentId, locale, confirmOverwrite = false) {
  return client.request(
    `/${encodeURIComponent(contentId)}/variants/${encodeURIComponent(locale)}/generate-translation`,
    {
      method: "POST",
      body: JSON.stringify({ confirmOverwrite }),
    },
  );
}

export function uploadManualImage(file) {
  return client.uploadImage(file);
}
