import { describe, expect, it } from "vitest";
import {
  getProjectDisplayName,
  parseProjectFileText,
  ProjectFileParseError,
} from "./projectFileParse.js";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUV0WQl3MBPQ8EAAAABJRU5ErkJggg==";

const VALID_PROJECT = {
  format: "hfzwood-project",
  projectName: "River Table",
  savedAt: "2026-01-01T12:00:00.000Z",
  image: { dataUrl: TINY_PNG },
  calibration: { referenceMeasurements: [] },
};

describe("projectFileParse", () => {
  it("parses a valid project file payload", () => {
    const parsed = parseProjectFileText(JSON.stringify(VALID_PROJECT));

    expect(parsed.projectName).toBe("River Table");
    expect(parsed.image.dataUrl).toBe(TINY_PNG);
  });

  it("rejects payloads without image data", () => {
    expect(() =>
      parseProjectFileText(JSON.stringify({ ...VALID_PROJECT, image: { dataUrl: null } })),
    ).toThrow(ProjectFileParseError);
  });

  it("derives a display name from the file name when needed", () => {
    expect(getProjectDisplayName({ image: { dataUrl: TINY_PNG } }, "table.hfzproject")).toBe(
      "table",
    );
  });
});
