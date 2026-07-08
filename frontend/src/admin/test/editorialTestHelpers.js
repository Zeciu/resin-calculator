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

export function handleGlobalReferenceSearch(url) {
  const parsed = new URL(url, "http://localhost");
  if (parsed.pathname === "/api/admin/references/search") {
    return Promise.resolve({ ok: true, status: 200, json: async () => [] });
  }
  return null;
}
