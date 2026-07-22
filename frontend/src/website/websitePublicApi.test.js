import { describe, expect, it, vi } from "vitest";
import { fetchPublishedWebsitePage } from "./websitePublicApi.js";

describe("websitePublicApi", () => {
  it("builds the correct request for a published Website page", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ available: true, page: null }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchPublishedWebsitePage("about", "ro");

    expect(fetchMock).toHaveBeenCalledWith("/api/content/website/about?locale=ro");
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
        json: async () => ({}),
      })),
    );

    await expect(fetchPublishedWebsitePage("pricing", "en")).rejects.toThrow("Request failed (503)");
  });
});
