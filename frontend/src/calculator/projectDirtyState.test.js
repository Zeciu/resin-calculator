import { describe, expect, it } from "vitest";
import { computeProjectDirtyState } from "./projectDirtyState.js";

describe("computeProjectDirtyState", () => {
  it("returns false for an empty workflow", () => {
    expect(computeProjectDirtyState({})).toBe(false);
  });

  it("does not treat image-only state as dirty", () => {
    expect(computeProjectDirtyState({})).toBe(false);
  });

  it("returns true when reference measurements exist", () => {
    expect(
      computeProjectDirtyState({
        referenceMeasurements: [{ knownLengthCm: 10, calibrationPoints: [] }],
      }),
    ).toBe(true);
  });

  it("returns true when a reference draft has two points", () => {
    expect(
      computeProjectDirtyState({
        draftReferencePoints: [
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
      }),
    ).toBe(true);
  });

  it("returns true for polygon or boundary geometry", () => {
    expect(computeProjectDirtyState({ polygonPoints: [{ x: 0, y: 0 }] })).toBe(true);
    expect(computeProjectDirtyState({ moldBoundaryPoints: [{ x: 0, y: 0 }] })).toBe(
      true,
    );
    expect(
      computeProjectDirtyState({ woodBoundaryPolygons: [[{ x: 0, y: 0 }]] }),
    ).toBe(true);
    expect(computeProjectDirtyState({ cavityPolygons: [[{ x: 0, y: 0 }]] })).toBe(true);
  });

  it("returns true for meaningful workflow inputs", () => {
    expect(computeProjectDirtyState({ projectNotes: "Client wants black pigment." })).toBe(
      true,
    );
    expect(computeProjectDirtyState({ depthMm: "12" })).toBe(true);
    expect(computeProjectDirtyState({ measurementsComplete: true })).toBe(true);
  });

  it("returns true for imported project data", () => {
    expect(computeProjectDirtyState({ importedProject: true })).toBe(true);
  });
});
