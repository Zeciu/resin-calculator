import { vi } from "vitest";
import { GLOSSARY_ENTRIES } from "./glossaryContent.js";
import { buildPublishedManualResponse } from "../manual/manualTestHelpers.js";

export function buildPublishedGlossaryResponse(entries = GLOSSARY_ENTRIES) {
  return {
    locale: "en",
    requestedLocale: "en",
    available: true,
    englishAvailable: true,
    documentTitle: "Glossary",
    lede:
      "A technical dictionary of woodworking, epoxy resin, and HFZWood terminology for quick reference while you work.",
    entries: entries.map((entry) => ({
      id: entry.id,
      term: entry.term,
      definition: entry.definition,
      media: entry.media ?? [],
      relatedTerms: entry.relatedTerms ?? [],
      synonyms: entry.synonyms ?? [],
      seeAlso: entry.seeAlso ?? [],
    })),
  };
}

export function mockPublishedGlossaryFetch(entries = GLOSSARY_ENTRIES) {
  const fetchMock = vi.fn(async (url) => {
    const requestUrl = String(url);
    if (requestUrl.includes("/api/content/public-languages")) {
      return {
        ok: true,
        json: async () => ({
          defaultPublicLocale: "en",
          activePublicLocales: ["en", "ro"],
        }),
      };
    }
    if (requestUrl.includes("/api/content/glossary")) {
      return {
        ok: true,
        json: async () => buildPublishedGlossaryResponse(entries),
      };
    }
    if (requestUrl.includes("/api/preferences")) {
      return {
        ok: true,
        json: async () => ({
          interfaceLanguage: "en",
          lengthUnit: "mm",
          volumeUnit: "L",
          exists: true,
        }),
      };
    }
    if (requestUrl.includes("/api/content/manual")) {
      return {
        ok: true,
        json: async () => buildPublishedManualResponse(),
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
