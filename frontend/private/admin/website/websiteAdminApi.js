import { adminHeaders, parseAdminError } from "../../editorial/editorialAdminApi.js";
import { createEditorialAdminClient } from "../../editorial/editorialAdminApi.js";

const client = createEditorialAdminClient("/api/admin/website/pages");
const API_BASE_URL = "";

export function listWebsitePages(locale = "ro") {
  return client.request(`?locale=${encodeURIComponent(locale)}`);
}

export function getWebsiteVariant(pageKey, locale) {
  return client.request(`/${encodeURIComponent(pageKey)}/variants/${encodeURIComponent(locale)}`);
}

export function saveWebsiteVariant(pageKey, locale, body) {
  return client.request(`/${encodeURIComponent(pageKey)}/variants/${encodeURIComponent(locale)}`, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
}

export function publishWebsiteVariant(pageKey, locale) {
  return client.request(
    `/${encodeURIComponent(pageKey)}/variants/${encodeURIComponent(locale)}/publish`,
    { method: "POST" },
  );
}

export function unpublishWebsiteVariant(pageKey, locale) {
  return client.request(
    `/${encodeURIComponent(pageKey)}/variants/${encodeURIComponent(locale)}/unpublish`,
    { method: "POST" },
  );
}

export function generateWebsiteTranslation(pageKey, locale, confirmOverwrite = false) {
  return client.request(
    `/${encodeURIComponent(pageKey)}/variants/${encodeURIComponent(locale)}/generate-translation`,
    {
      method: "POST",
      body: JSON.stringify({ confirmOverwrite }),
    },
  );
}

export async function uploadWebsiteImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/admin/website/pages/images`, {
    method: "POST",
    headers: await adminHeaders(false),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseAdminError(response));
  }

  return response.json();
}
