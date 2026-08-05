import { sessionStorageTestAuthAdapter } from "../../../public/src/test/sessionStorageTestAuthAdapter.js";

export function computeMockEditorialVisibility({
  exists = true,
  status = "draft",
  updatedAt = null,
  publishedAt = null,
}) {
  if (!exists) {
    return "empty";
  }
  if (status !== "published" || !publishedAt) {
    return "draft";
  }
  if (updatedAt && publishedAt && new Date(updatedAt) > new Date(publishedAt)) {
    return "stale";
  }
  return "live";
}

export function withEditorialVisibility(variant) {
  const exists = variant?.exists !== false;
  return {
    ...variant,
    editorialVisibility: computeMockEditorialVisibility({
      exists,
      status: variant?.status,
      updatedAt: variant?.updatedAt ?? "2026-01-01T00:00:00+00:00",
      publishedAt: variant?.publishedAt ?? null,
    }),
  };
}

// Editorial routes require an authenticated user and nothing more: there is no
// administrator role and no entitlement gate. Mock editorial endpoints therefore
// answer 403 only when no test session is seeded at all.
export function isAuthenticatedEditorialRequest() {
  return sessionStorageTestAuthAdapter.restoreSession() !== null;
}

export function handleGlobalReferenceSearch(url) {
  const parsed = new URL(url, "http://localhost");
  if (parsed.pathname === "/api/content/public-languages") {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        defaultPublicLocale: "en",
        activePublicLocales: ["en", "ro"],
      }),
    });
  }
  if (parsed.pathname === "/api/admin/references/search") {
    return Promise.resolve({ ok: true, status: 200, json: async () => [] });
  }
  if (parsed.pathname === "/api/me/capabilities") {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        role: "user",
        accessTier: "free",
        catalogVersion: 1,
        capabilities: {},
      }),
    });
  }
  return null;
}
