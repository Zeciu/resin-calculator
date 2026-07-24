import { describe, expect, it } from "vitest";
import { splitPlainTextParagraphs } from "./websitePlainText.js";

describe("splitPlainTextParagraphs", () => {
  it("returns an empty list for blank input", () => {
    expect(splitPlainTextParagraphs("")).toEqual([]);
    expect(splitPlainTextParagraphs("   \n\n  ")).toEqual([]);
  });

  it("keeps a single paragraph intact", () => {
    expect(splitPlainTextParagraphs("One paragraph only.")).toEqual(["One paragraph only."]);
  });

  it("splits on blank lines into separate paragraphs", () => {
    expect(
      splitPlainTextParagraphs("First paragraph.\n\nSecond paragraph.\n\n\nThird."),
    ).toEqual(["First paragraph.", "Second paragraph.", "Third."]);
  });

  it("collapses single newlines within a paragraph", () => {
    expect(splitPlainTextParagraphs("Line one.\nLine two.\n\nNext block.")).toEqual([
      "Line one. Line two.",
      "Next block.",
    ]);
  });
});
