import { describe, expect, it } from "vitest";
import { TINY_PNG } from "./canonicalProjectV2.test.js";
import { createEmptyCanonicalLifecycle } from "./canonicalProjectLifecycle.js";
import {
  hasCanonicalProjectIdentity,
  isCompletedReferenceMeasurement,
  isProjectCreationThresholdMet,
  isValidCalibrationPoint,
  resolveAuthenticatedOwnerId,
} from "./projectCreationThreshold.js";

const VALID_REFERENCE = {
  knownLengthCm: 10,
  calibrationPoints: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
};

describe("projectCreationThreshold", () => {
  it("does not satisfy the threshold with image alone", () => {
    expect(
      isProjectCreationThresholdMet({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [],
      }),
    ).toBe(false);
  });

  it("does not satisfy the threshold with a completed reference but no image", () => {
    expect(
      isProjectCreationThresholdMet({
        imageDataUrl: "",
        referenceMeasurements: [VALID_REFERENCE],
      }),
    ).toBe(false);
  });

  it("does not satisfy the threshold with draft reference data", () => {
    expect(
      isProjectCreationThresholdMet({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [
          {
            knownLengthCm: 10,
            calibrationPoints: [{ x: 0, y: 0 }],
          },
        ],
      }),
    ).toBe(false);

    expect(
      isProjectCreationThresholdMet({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [
          {
            knownLengthCm: 0,
            calibrationPoints: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
            ],
          },
        ],
      }),
    ).toBe(false);
  });

  it("satisfies the threshold with image plus one valid completed reference", () => {
    expect(
      isProjectCreationThresholdMet({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      }),
    ).toBe(true);
  });

  it("validates calibration points and completed references", () => {
    expect(isValidCalibrationPoint({ x: 1, y: 2 })).toBe(true);
    expect(isValidCalibrationPoint({ x: "bad", y: 2 })).toBe(false);
    expect(isCompletedReferenceMeasurement(VALID_REFERENCE)).toBe(true);
  });

  it("detects canonical project identity from persisted lifecycle metadata", () => {
    expect(hasCanonicalProjectIdentity(createEmptyCanonicalLifecycle())).toBe(false);
    expect(
      hasCanonicalProjectIdentity({
        projectMetadata: { projectId: "project-1" },
        persistence: { status: "persisted" },
      }),
    ).toBe(true);
  });

  it("returns null owner id when authenticated user id is missing", () => {
    expect(resolveAuthenticatedOwnerId(null)).toBeNull();
    expect(resolveAuthenticatedOwnerId({ id: "" })).toBeNull();
    expect(resolveAuthenticatedOwnerId({ id: "   " })).toBeNull();
    expect(resolveAuthenticatedOwnerId({ id: "user-123" })).toBe("user-123");
  });
});
