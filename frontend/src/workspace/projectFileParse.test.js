import { describe, expect, it } from "vitest";
import {
  HFZ_PROJECT_CANONICAL_FORMAT_VERSION,
  HFZ_PROJECT_FORMAT,
} from "../projectFileTypes.js";
import { buildPersistedV2OpenEnvelope, TINY_PNG } from "../project/canonicalProjectV2.test.js";
import { mapCanonicalV2ToCalculatorSnapshot } from "../project/mapCanonicalV2ToCalculatorSnapshot.js";
import {
  getProjectDisplayName,
  parseProjectFileText,
  ProjectFileParseError,
} from "./projectFileParse.js";

const V1_PROJECT = {
  format: HFZ_PROJECT_FORMAT,
  formatVersion: 1,
  projectName: "River Table",
  savedAt: "2026-01-01T12:00:00.000Z",
  image: { dataUrl: TINY_PNG },
  calibration: { referenceMeasurements: [] },
};

describe("projectFileParse", () => {
  it("parses a valid canonical v2 project file", () => {
    const envelope = buildPersistedV2OpenEnvelope();
    const parsed = parseProjectFileText(JSON.stringify(envelope));

    expect(parsed.envelope.formatVersion).toBe(HFZ_PROJECT_CANONICAL_FORMAT_VERSION);
    expect(parsed.snapshot.image.dataUrl).toBe(TINY_PNG);
    expect(parsed.persistedLifecycle.projectMetadata.projectId).toBe("project-1");
    expect(parsed.persistedLifecycle.persistence).toEqual({ status: "persisted" });
  });

  it("rejects v1 project files", () => {
    expect(() => parseProjectFileText(JSON.stringify(V1_PROJECT))).toThrow(
      /unsupported format version/i,
    );
  });

  it("rejects v1 flat project payloads without envelope sections", () => {
    expect(() =>
      parseProjectFileText(
        JSON.stringify({
          projectName: "River Table",
          image: { dataUrl: TINY_PNG },
        }),
      ),
    ).toThrow(/unsupported format version/i);
  });

  it("rejects the wrong format identifier", () => {
    const envelope = buildPersistedV2OpenEnvelope();
    envelope.format = "other-format";

    expect(() => parseProjectFileText(JSON.stringify(envelope))).toThrow(ProjectFileParseError);
  });

  it("rejects the wrong format version", () => {
    const envelope = buildPersistedV2OpenEnvelope();
    envelope.formatVersion = 99;

    expect(() => parseProjectFileText(JSON.stringify(envelope))).toThrow(
      /unsupported format version/i,
    );
  });

  it("rejects missing canonical root sections", () => {
    const envelope = buildPersistedV2OpenEnvelope();
    delete envelope.derivedData;

    expect(() => parseProjectFileText(JSON.stringify(envelope))).toThrow(ProjectFileParseError);
  });

  it("rejects missing required identity fields", () => {
    const envelope = buildPersistedV2OpenEnvelope();
    envelope.projectMetadata.projectId = "";

    expect(() => parseProjectFileText(JSON.stringify(envelope))).toThrow(/missing projectId/i);
  });

  it("rejects missing primary image data", () => {
    const envelope = buildPersistedV2OpenEnvelope();
    envelope.technicalContent.image = { dataUrl: "" };

    expect(() => parseProjectFileText(JSON.stringify(envelope))).toThrow(/missing image data/i);
  });

  it("maps v2 envelope content to calculator snapshot on parse", () => {
    const envelope = buildPersistedV2OpenEnvelope({
      snapshot: {
        appVersion: "1.0",
        image: { dataUrl: TINY_PNG, width: 10, height: 10 },
        calibration: {
          referenceMeasurements: [
            {
              knownLengthCm: 10,
              calibrationPoints: [
                { x: 0, y: 0 },
                { x: 10, y: 0 },
              ],
            },
          ],
        },
        ui: { calculationMode: "wood", selectedMode: "wood", rotationDeg: 15 },
        woodBoundaryMode: { woodBoundaryPolygons: [] },
        projectNotes: "Notes",
        result: { totalVolumeLiters: 2 },
      },
    });

    const parsed = parseProjectFileText(JSON.stringify(envelope));
    expect(parsed.snapshot.projectNotes).toBe("Notes");
    expect(parsed.snapshot.ui.rotationDeg).toBe(15);
    expect(parsed.snapshot.result).toEqual({ totalVolumeLiters: 2 });
    expect(mapCanonicalV2ToCalculatorSnapshot(parsed.envelope)).toEqual(parsed.snapshot);
  });

  it("derives display name from canonical descriptive metadata", () => {
    const envelope = buildPersistedV2OpenEnvelope({ projectName: "River Table" });

    expect(getProjectDisplayName(envelope, "fallback.hfzproject")).toBe("River Table");
  });
});
