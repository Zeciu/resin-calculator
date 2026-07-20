import { adminHeaders, AdminApiError, parseAdminError } from "../editorial/editorialAdminApi.js";

const API_BASE_URL = "";

export async function fetchPublicLanguagesConfig() {
  const response = await fetch(`${API_BASE_URL}/api/content/public-languages`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

export async function fetchAdminPublicLanguages() {
  const response = await fetch(`${API_BASE_URL}/api/admin/public-languages`, {
    headers: await adminHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }
  return response.json();
}

export async function activatePublicLanguage(locale) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/public-languages/${encodeURIComponent(locale)}/activate`,
    {
      method: "POST",
      headers: await adminHeaders(),
    },
  );
  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }
  return response.json();
}

export async function deactivatePublicLanguage(locale) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/public-languages/${encodeURIComponent(locale)}/deactivate`,
    {
      method: "POST",
      headers: await adminHeaders(),
    },
  );
  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }
  return response.json();
}
