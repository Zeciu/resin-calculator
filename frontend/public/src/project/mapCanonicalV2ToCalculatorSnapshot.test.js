import { describe, expect, it } from "vitest";
import {
  buildPersistedV2OpenEnvelope,
  SAMPLE_CALCULATOR_SNAPSHOT,
  TINY_PNG,
} from "./canonicalProjectV2.test.js";
import { mapCalculatorSnapshotToCanonicalV2 } from "./mapSnapshotToCanonicalV2.js";
import { mapCanonicalV2ToCalculatorSnapshot } from "./mapCanonicalV2ToCalculatorSnapshot.js";

describe("mapCanonicalV2ToCalculatorSnapshot", () => {
  it("maps canonical v2 sections back to the calculator snapshot contract", () => {
    const envelope = buildPersistedV2OpenEnvelope();
    const snapshot = mapCanonicalV2ToCalculatorSnapshot(envelope);

    expect(snapshot.image).toEqual(SAMPLE_CALCULATOR_SNAPSHOT.image);
    expect(snapshot.calibration).toEqual(SAMPLE_CALCULATOR_SNAPSHOT.calibration);
    expect(snapshot.standardResinArea).toEqual(SAMPLE_CALCULATOR_SNAPSHOT.standardResinArea);
    expect(snapshot.woodBoundaryMode).toEqual(SAMPLE_CALCULATOR_SNAPSHOT.woodBoundaryMode);
    expect(snapshot.projectNotes).toBe("Notes");
    expect(snapshot.result).toEqual({ totalVolumeLiters: 1.2 });
    expect(snapshot.ui).toEqual({
      calculationMode: "wood",
      selectedMode: "wood",
      selectedShape: { type: "wood", index: 0 },
      rotationDeg: 90,
    });
    expect(snapshot.ui).not.toHaveProperty("zoomFactor");
  });

  it("does not restore session-only zoom from persisted workflow data", () => {
    const envelope = mapCalculatorSnapshotToCanonicalV2(
      {
        ...SAMPLE_CALCULATOR_SNAPSHOT,
        ui: {
          ...SAMPLE_CALCULATOR_SNAPSHOT.ui,
          zoomFactor: 2.5,
        },
      },
      { projectName: "River Table" },
    );

    expect(mapCanonicalV2ToCalculatorSnapshot(envelope).ui).not.toHaveProperty("zoomFactor");
  });

  it("round-trips notes and workspace rotation", () => {
    const envelope = buildPersistedV2OpenEnvelope({
      snapshot: {
        ...SAMPLE_CALCULATOR_SNAPSHOT,
        projectNotes: "Round-trip notes",
        ui: {
          ...SAMPLE_CALCULATOR_SNAPSHOT.ui,
          rotationDeg: 45,
        },
      },
    });

    const snapshot = mapCanonicalV2ToCalculatorSnapshot(envelope);
    expect(snapshot.projectNotes).toBe("Round-trip notes");
    expect(snapshot.ui.rotationDeg).toBe(45);
  });

  it("round-trips reference measurements and primary image", () => {
    const referenceMeasurements = [
      {
        knownLengthCm: 10,
        calibrationPoints: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      },
    ];
    const envelope = buildPersistedV2OpenEnvelope({
      snapshot: {
        ...SAMPLE_CALCULATOR_SNAPSHOT,
        calibration: { referenceMeasurements },
      },
    });

    const snapshot = mapCanonicalV2ToCalculatorSnapshot(envelope);
    expect(snapshot.image.dataUrl).toBe(TINY_PNG);
    expect(snapshot.calibration.referenceMeasurements).toEqual(referenceMeasurements);
  });
});
