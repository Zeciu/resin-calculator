import { vi } from "vitest";
import { KNOWLEDGE_BASE_ENTRIES } from "./knowledgeBaseContent.js";
import { buildPublishedManualResponse } from "../manual/manualTestHelpers.js";
import { buildPublishedGlossaryResponse } from "../glossary/glossaryTestHelpers.js";
import { FREE_CAPABILITIES } from "../capabilities/capabilityDefaults.js";

export function buildPublishedKnowledgeBaseResponse(entries = KNOWLEDGE_BASE_ENTRIES) {
  return {
    locale: "en",
    requestedLocale: "en",
    available: true,
    englishAvailable: true,
    documentTitle: "Knowledge Base",
    lede:
      "Practical troubleshooting for woodworking, epoxy resin, and HFZWood workflow problems. Find a symptom, review the likely causes, and follow the recommended solution.",
    entries: entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      problemSummary: entry.problemSummary,
      symptoms: entry.symptoms,
      possibleCauses: entry.possibleCauses,
      solution: entry.solution,
      prevention: entry.prevention ?? [],
      tips: entry.tips,
      warnings: entry.warnings,
      searchKeywords: entry.searchKeywords ?? [],
      estimatedRepairTime: entry.estimatedRepairTime ?? null,
      requiredTools: entry.requiredTools ?? [],
      requiredMaterials: entry.requiredMaterials ?? [],
      media: entry.media ?? [],
      relatedKbArticles: entry.relatedKbArticles ?? [],
      relatedGlossaryTerms: entry.relatedGlossaryTerms ?? [],
      relatedManualChapters: entry.relatedManualChapters ?? [],
    })),
  };
}

export function mockPublishedKnowledgeBaseFetch(
  entries = KNOWLEDGE_BASE_ENTRIES,
  capabilities = null,
) {
  const fetchMock = vi.fn(async (url) => {
    const requestUrl = String(url);
    if (requestUrl.includes("/api/me/capabilities")) {
      return {
        ok: true,
        json: async () =>
          capabilities ?? {
            role: "user",
            accessTier: "free",
            catalogVersion: 1,
            capabilities: FREE_CAPABILITIES,
          },
      };
    }
    if (requestUrl.includes("/api/content/knowledge-base")) {
      return {
        ok: true,
        json: async () => buildPublishedKnowledgeBaseResponse(entries),
      };
    }
    if (requestUrl.includes("/api/content/glossary")) {
      return {
        ok: true,
        json: async () => buildPublishedGlossaryResponse(),
      };
    }
    if (requestUrl.includes("/api/content/manual")) {
      return {
        ok: true,
        json: async () => buildPublishedManualResponse(),
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
    return {
      ok: false,
      status: 404,
      json: async () => ({}),
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
