import { describe, expect, it } from "vitest";
import {
  createEmptyCanonicalProjectV2,
  createEmptyProjectMetadata,
  isCanonicalProjectV2Envelope,
} from "./canonicalProjectV2.js";
import { createEmptyCanonicalLifecycle } from "./canonicalProjectLifecycle.js";
import { mapCalculatorSnapshotToCanonicalV2 } from "./mapSnapshotToCanonicalV2.js";
import {
  HFZ_PROJECT_CANONICAL_FORMAT_VERSION,
  HFZ_PROJECT_FORMAT,
} from "../projectFileTypes.js";

export const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUV0WQl3MBPQ8EAAAABJRU5ErkJggg==";

export const SAMPLE_CALCULATOR_SNAPSHOT = {
  appVersion: "1.0",
  savedAt: "2026-01-01T00:00:00.000Z",
  image: {
    dataUrl: TINY_PNG,
    width: 100,
    height: 80,
  },
  ui: {
    calculationMode: "wood",
    selectedMode: "wood",
    rotationDeg: 90,
    zoomFactor: 1.5,
    selectedShape: { type: "wood", index: 0 },
  },
  calibration: {
    referenceMeasurements: [{ knownLengthCm: 10, calibrationPoints: [] }],
  },
  standardResinArea: {
    polygonPoints: [],
    resinDepthMm: "12",
  },
  woodBoundaryMode: {
    woodBoundaryPolygons: [],
    cavities: [],
    resinMixRatio: "2:1",
  },
  projectNotes: "Notes",
  result: { totalVolumeLiters: 1.2 },
};

/**
 * @param {Record<string, unknown>} [overrides]
 */
export function buildCanonicalV2TestFixture(overrides = {}) {
  const envelope = createEmptyCanonicalProjectV2();

  return {
    ...envelope,
    ...overrides,
    projectMetadata: {
      ...envelope.projectMetadata,
      ...(overrides.projectMetadata ?? {}),
    },
    technicalContent: {
      ...envelope.technicalContent,
      ...(overrides.technicalContent ?? {}),
    },
    descriptiveMetadata: {
      ...envelope.descriptiveMetadata,
      ...(overrides.descriptiveMetadata ?? {}),
    },
    derivedData: {
      ...envelope.derivedData,
      ...(overrides.derivedData ?? {}),
    },
  };
}

describe("canonicalProjectV2", () => {
  it("creates an empty canonical v2 envelope", () => {
    const envelope = createEmptyCanonicalProjectV2();

    expect(envelope).toEqual({
      format: HFZ_PROJECT_FORMAT,
      formatVersion: HFZ_PROJECT_CANONICAL_FORMAT_VERSION,
      projectMetadata: createEmptyProjectMetadata(),
      technicalContent: {},
      descriptiveMetadata: {},
      derivedData: {},
    });
  });

  it("creates nullable lifecycle metadata defaults", () => {
    expect(createEmptyProjectMetadata()).toEqual({
      projectId: null,
      ownerId: null,
      primaryImageHash: null,
      createdAt: null,
      versionId: null,
      parentVersionId: null,
      ancestorVersionIds: [],
      lastModifiedAt: null,
      metadataModifiedAt: null,
      structuralCapabilitySnapshot: null,
    });
  });

  it("accepts a structurally valid canonical envelope", () => {
    expect(isCanonicalProjectV2Envelope(createEmptyCanonicalProjectV2())).toBe(true);
    expect(isCanonicalProjectV2Envelope(buildCanonicalV2TestFixture())).toBe(true);
  });

  it("rejects invalid canonical envelope shapes", () => {
    expect(isCanonicalProjectV2Envelope(null)).toBe(false);
    expect(isCanonicalProjectV2Envelope({})).toBe(false);
    expect(
      isCanonicalProjectV2Envelope({
        format: HFZ_PROJECT_FORMAT,
        formatVersion: 1,
        projectMetadata: createEmptyProjectMetadata(),
        technicalContent: {},
        descriptiveMetadata: {},
        derivedData: {},
      }),
    ).toBe(false);
    expect(
      isCanonicalProjectV2Envelope({
        format: HFZ_PROJECT_FORMAT,
        formatVersion: HFZ_PROJECT_CANONICAL_FORMAT_VERSION,
        projectMetadata: { ancestorVersionIds: "not-an-array" },
        technicalContent: {},
        descriptiveMetadata: {},
        derivedData: {},
      }),
    ).toBe(false);
  });
});

describe("canonicalProjectLifecycle", () => {
  it("creates the approved empty lifecycle record", () => {
    expect(createEmptyCanonicalLifecycle()).toEqual({
      projectMetadata: createEmptyProjectMetadata(),
      persistence: { status: "never-persisted" },
    });
  });
});

describe("mapCalculatorSnapshotToCanonicalV2", () => {
  it("maps calculator snapshot fields into canonical sections", () => {
    const mapped = mapCalculatorSnapshotToCanonicalV2(SAMPLE_CALCULATOR_SNAPSHOT, {
      projectName: "River Table",
    });

    expect(mapped.format).toBe(HFZ_PROJECT_FORMAT);
    expect(mapped.formatVersion).toBe(HFZ_PROJECT_CANONICAL_FORMAT_VERSION);
    expect(mapped.projectMetadata).toEqual(createEmptyProjectMetadata());
    expect(mapped.technicalContent).toEqual({
      appVersion: "1.0",
      image: SAMPLE_CALCULATOR_SNAPSHOT.image,
      calibration: SAMPLE_CALCULATOR_SNAPSHOT.calibration,
      standardResinArea: SAMPLE_CALCULATOR_SNAPSHOT.standardResinArea,
      woodBoundaryMode: SAMPLE_CALCULATOR_SNAPSHOT.woodBoundaryMode,
      ui: {
        workflow: {
          calculationMode: "wood",
          selectedMode: "wood",
          selectedShape: { type: "wood", index: 0 },
        },
      },
    });
    expect(mapped.descriptiveMetadata).toEqual({
      projectName: "River Table",
      notes: "Notes",
      workspaceView: { rotation: 90 },
    });
    expect(mapped.derivedData).toEqual({
      result: { totalVolumeLiters: 1.2 },
    });
    expect(mapped.technicalContent).not.toHaveProperty("zoomFactor");
    expect(mapped).not.toHaveProperty("savedAt");
  });

  it("merges lifecycle metadata without mutating the input snapshot", () => {
    const snapshot = structuredClone(SAMPLE_CALCULATOR_SNAPSHOT);
    const lifecycle = createEmptyCanonicalLifecycle();
    lifecycle.projectMetadata.projectId = "project-123";

    const mapped = mapCalculatorSnapshotToCanonicalV2(snapshot, { lifecycle });

    expect(mapped.projectMetadata.projectId).toBe("project-123");
    expect(snapshot.savedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(lifecycle.projectMetadata.projectId).toBe("project-123");
  });

  it("preserves woodBoundaryMode blob content", () => {
    const mapped = mapCalculatorSnapshotToCanonicalV2(SAMPLE_CALCULATOR_SNAPSHOT);

    expect(mapped.technicalContent.woodBoundaryMode).toEqual(
      SAMPLE_CALCULATOR_SNAPSHOT.woodBoundaryMode,
    );
  });
});
