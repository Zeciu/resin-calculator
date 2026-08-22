import { describe, expect, it } from "vitest";
import { rewritePreviewHref } from "./previewLinks.js";
import {
  filterPreviewItems,
  firstUnlockedPreviewId,
  resolvePreviewSelection,
} from "./previewSearch.js";

describe("preview link rewriting", () => {
  it("keeps related educational links inside the public preview", () => {
    expect(rewritePreviewHref("/glossary#glossary-entry-pot-life")).toBe(
      "/knowledge-preview/glossary#glossary-entry-pot-life",
    );
    expect(rewritePreviewHref("/manual#prima-turnare")).toBe("/knowledge-preview/manual#prima-turnare");
    expect(rewritePreviewHref("/knowledge-base#knowledge-base-entry-a")).toBe(
      "/knowledge-preview/knowledge-base#knowledge-base-entry-a",
    );
    expect(rewritePreviewHref("/knowledge-preview/manual#already")).toBe(
      "/knowledge-preview/manual#already",
    );
    expect(rewritePreviewHref("https://example.com")).toBe("https://example.com");
  });
});

describe("preview title/term search", () => {
  it("filters only the supplied label field", () => {
    const items = [
      { id: "a", title: "Prima turnare", secret: "hidden body" },
      { id: "b", title: "Capitol blocat", secret: "prima" },
    ];
    expect(filterPreviewItems(items, "prima", (item) => item.title).map((item) => item.id)).toEqual([
      "a",
    ]);
  });
});

describe("preview unlocked selection", () => {
  it("picks the first API item with locked === false", () => {
    expect(
      firstUnlockedPreviewId([
        { id: "locked", locked: true },
        { id: "open-a", locked: false },
        { id: "open-b", locked: false },
      ]),
    ).toBe("open-a");
  });

  it("does not fabricate a selection when every item is locked", () => {
    expect(firstUnlockedPreviewId([{ id: "locked", locked: true }])).toBeNull();
    expect(resolvePreviewSelection([{ id: "locked", locked: true }], null, "")).toBeNull();
  });

  it("keeps the current visible item, otherwise falls back to the first visible unlocked item", () => {
    const items = [
      { id: "locked", locked: true },
      { id: "open-a", locked: false },
      { id: "open-b", locked: false },
    ];
    expect(resolvePreviewSelection(items, "open-b", "")).toBe("open-b");
    expect(resolvePreviewSelection(items, "gone", "")).toBe("open-a");
    expect(resolvePreviewSelection([{ id: "locked", locked: true }], "open-a", "")).toBeNull();
  });
});

