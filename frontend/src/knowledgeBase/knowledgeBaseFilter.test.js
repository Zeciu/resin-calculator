import { describe, expect, it } from "vitest";
import { KNOWLEDGE_BASE_ENTRIES } from "./knowledgeBaseContent.js";
import {
  filterKnowledgeBaseEntries,
  getFirstFilteredKnowledgeBaseEntry,
  getKnowledgeBaseEntryElementId,
} from "./knowledgeBaseFilter.js";

describe("knowledgeBaseFilter", () => {
  it("filters entries by title and troubleshooting section text", () => {
    const filtered = filterKnowledgeBaseEntries(KNOWLEDGE_BASE_ENTRIES, "sticky");
    expect(filtered.some((entry) => entry.id === "sticky-resin-after-cure")).toBe(true);

    const symptomMatch = filterKnowledgeBaseEntries(KNOWLEDGE_BASE_ENTRIES, "fish-eyes");
    expect(symptomMatch.some((entry) => entry.id === "fish-eyes-in-finish")).toBe(true);
  });

  it("matches entries by search keywords without exposing category or difficulty", () => {
    const entries = [
      {
        id: "hidden-keyword-entry",
        title: "Surface defect",
        category: "Finishing",
        difficulty: "Professional",
        problemSummary: "",
        symptoms: [],
        possibleCauses: [],
        solution: [],
        prevention: [],
        tips: [],
        warnings: [],
        searchKeywords: ["fish-eyes"],
      },
    ];

    expect(filterKnowledgeBaseEntries(entries, "fish-eyes")).toHaveLength(1);
    expect(filterKnowledgeBaseEntries(entries, "Professional")).toHaveLength(0);
    expect(filterKnowledgeBaseEntries(entries, "Finishing")).toHaveLength(0);
  });

  it("does not match category or difficulty metadata", () => {
    expect(filterKnowledgeBaseEntries(KNOWLEDGE_BASE_ENTRIES, "Professional")).toHaveLength(0);
    expect(filterKnowledgeBaseEntries(KNOWLEDGE_BASE_ENTRIES, "Intermediate")).toHaveLength(0);
  });

  it("includes category and difficulty on every content entry", () => {
    for (const entry of KNOWLEDGE_BASE_ENTRIES) {
      expect(entry.category).toBeTruthy();
      expect(entry.difficulty).toBeTruthy();
    }
  });

  it("returns stable entry element ids", () => {
    expect(getKnowledgeBaseEntryElementId("bubbles-after-curing")).toBe(
      "knowledge-base-entry-bubbles-after-curing",
    );
  });

  it("returns the first filtered entry with title matches prioritized", () => {
    expect(getFirstFilteredKnowledgeBaseEntry(KNOWLEDGE_BASE_ENTRIES, "cloudy")?.id).toBe(
      "cloudy-epoxy",
    );

    const bodyOnlyMatch = getFirstFilteredKnowledgeBaseEntry(
      KNOWLEDGE_BASE_ENTRIES,
      "too hot to hold",
    );
    expect(bodyOnlyMatch?.id).toBe("pour-overheating");
  });
});
