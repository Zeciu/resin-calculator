import { vi } from "vitest";
import { MANUAL_SECTIONS } from "./manualContent.js";

export function buildPublishedManualResponse(sections = MANUAL_SECTIONS) {
  return {
    locale: "en",
    requestedLocale: "en",
    available: true,
    englishAvailable: true,
    documentTitle: "Manual & Tutorials",
    lede:
      "A continuous guide to the HFZWood resin estimation workflow, with embedded demonstrations where visual explanation helps.",
    sections,
  };
}

export function mockPublishedManualFetch(sections = MANUAL_SECTIONS) {
  const fetchMock = vi.fn(async (url) => {
    const requestUrl = String(url);
    if (requestUrl.includes("/api/content/manual")) {
      return {
        ok: true,
        json: async () => buildPublishedManualResponse(sections),
      };
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({}),
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
