import { describe, expect, it } from "vitest";
import { GLOSSARY_ENTRIES } from "./glossaryContent.js";
import {
  filterGlossaryEntries,
  getActiveGlossaryLetters,
  getFirstFilteredGlossaryEntry,
  getGlossaryLetter,
  getGlossaryLetterSectionId,
  groupGlossaryEntriesByLetter,
  normalizeSearchText,
} from "./glossaryFilter.js";

describe("glossaryFilter", () => {
  it("normalizes spaces, hyphens, and underscores for search matching", () => {
    expect(normalizeSearchText("pot life")).toBe("potlife");
    expect(normalizeSearchText("pot-life")).toBe("potlife");
    expect(normalizeSearchText("pot_life")).toBe("potlife");
  });
  it("filters by synonym terms", () => {
    const filtered = filterGlossaryEntries(
      [
        {
          id: "a",
          term: "Pot life",
          definition: ["Working time."],
          synonyms: [{ id: "b", term: "Open time" }],
        },
      ],
      "open time",
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("a");
  });

  it("groups entries alphabetically with a hash bucket for non-letter terms", () => {
    const groups = groupGlossaryEntriesByLetter([
      { id: "b", term: "Bubble removal", definition: ["One"] },
      { id: "a", term: "Epoxy resin", definition: ["One"] },
      { id: "hash", term: "2-part mix", definition: ["One"] },
    ]);

    expect(groups.map((group) => group.letter)).toEqual(["#", "B", "E"]);
    expect(getGlossaryLetter("2-part mix")).toBe("#");
    expect(getGlossaryLetterSectionId("#")).toBe("glossary-letter-other");
  });

  it("filters by term and definition using case-insensitive substring matching", () => {
    const filtered = filterGlossaryEntries(GLOSSARY_ENTRIES, "hardener");
    expect(filtered.some((entry) => entry.id === "hardener")).toBe(true);

    const definitionMatch = filterGlossaryEntries(GLOSSARY_ENTRIES, "exothermic");
    expect(definitionMatch.some((entry) => entry.id === "pot-life")).toBe(true);
  });

  it("returns active letters only for visible groups", () => {
    const groups = groupGlossaryEntriesByLetter(filterGlossaryEntries(GLOSSARY_ENTRIES, "resin"));
    const letters = getActiveGlossaryLetters(groups);
    expect(letters.length).toBeGreaterThan(0);
    expect(letters).not.toContain("Z");
  });

  it("returns the first filtered entry in alphabetical order", () => {
    const groups = groupGlossaryEntriesByLetter(
      filterGlossaryEntries(GLOSSARY_ENTRIES, "epoxy"),
    );
    expect(getFirstFilteredGlossaryEntry(groups, "epoxy")?.id).toBe("epoxy-resin");
  });
});
