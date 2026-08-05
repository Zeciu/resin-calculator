import { describe, expect, it } from "vitest";
import { areProjectSnapshotsEqual } from "./projectSnapshotCompare.js";

describe("areProjectSnapshotsEqual", () => {
  it("ignores savedAt differences", () => {
    const left = { savedAt: "2026-01-01T00:00:00.000Z", projectNotes: "A" };
    const right = { savedAt: "2026-01-02T00:00:00.000Z", projectNotes: "A" };

    expect(areProjectSnapshotsEqual(left, right)).toBe(true);
  });

  it("detects meaningful snapshot changes", () => {
    const baseline = { projectNotes: "A", calibration: { referenceMeasurements: [] } };
    const edited = { projectNotes: "B", calibration: { referenceMeasurements: [] } };

    expect(areProjectSnapshotsEqual(baseline, edited)).toBe(false);
  });

  it("ignores image dimension differences after restore layout", () => {
    const baseline = {
      image: { dataUrl: "data:image/png;base64,abc", width: null, height: null },
      projectNotes: "A",
    };
    const afterLayout = {
      image: { dataUrl: "data:image/png;base64,abc", width: 1200, height: 800 },
      projectNotes: "A",
    };

    expect(areProjectSnapshotsEqual(baseline, afterLayout)).toBe(true);
  });
});
