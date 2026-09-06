import { vi } from "vitest";
import { isPackagedContentImageRequest } from "../content/authenticatedContentImageSrc.js";
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

export function mockPublishedManualFetch(sections = MANUAL_SECTIONS, options = {}) {
  const available = options.available ?? true;
  const englishAvailable = options.englishAvailable ?? true;
  const locale = options.locale ?? "en";
  const fetchMock = vi.fn(async (url) => {
    const requestUrl = String(url);
    if (requestUrl.includes("/api/content/public-languages")) {
      return {
        ok: true,
        json: async () => ({
          defaultPublicLocale: "en",
          activePublicLocales: options.activePublicLocales ?? ["en", "ro", "fr"],
        }),
      };
    }
    if (isPackagedContentImageRequest(requestUrl)) {
      return {
        ok: true,
        blob: async () => new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }),
      };
    }
    if (requestUrl.includes("/api/content/manual")) {
      return {
        ok: true,
        json: async () => ({
          ...buildPublishedManualResponse(available ? sections : []),
          locale,
          requestedLocale: locale,
          available,
          englishAvailable,
        }),
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
