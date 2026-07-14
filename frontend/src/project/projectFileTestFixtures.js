import { expect } from "vitest";
import { buildPersistableCanonicalV2 } from "./buildPersistableCanonicalV2.js";
import { buildPersistedV2OpenEnvelope, SAMPLE_CALCULATOR_SNAPSHOT, TINY_PNG } from "./canonicalProjectV2.test.js";
import { mapCanonicalV2ToCalculatorSnapshot } from "./mapCanonicalV2ToCalculatorSnapshot.js";
import { parseProjectFileText } from "../workspace/projectFileParse.js";

export const VALID_REFERENCE = {
  knownLengthCm: 10,
  calibrationPoints: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
};

export const VALID_CALCULATOR_SNAPSHOT = {
  ...SAMPLE_CALCULATOR_SNAPSHOT,
  calibration: {
    referenceMeasurements: [VALID_REFERENCE],
  },
  projectNotes: "Round-trip notes",
  ui: {
    calculationMode: "wood",
    selectedMode: "wood",
    rotationDeg: 45,
    zoomFactor: 2,
    selectedShape: { type: "wood", index: 0 },
  },
  woodBoundaryMode: {
    ...SAMPLE_CALCULATOR_SNAPSHOT.woodBoundaryMode,
    woodBoundaryPolygons: [[[0, 0], [10, 0], [10, 10]]],
    resinMixRatio: "2:1",
  },
  result: { totalVolumeLiters: 3.4 },
};

export function buildV2ProjectFileJson(options = {}) {
  return JSON.stringify(buildPersistedV2OpenEnvelope(options));
}

export async function buildSavedV2EnvelopeFromSnapshot(
  snapshot,
  user = { id: "stub-user" },
  identityOverrides = {},
) {
  const result = await buildPersistableCanonicalV2({
    projectName: "River Table",
    snapshot,
    user,
    generateProjectId: () => identityOverrides.projectId ?? "project-round-trip",
    generateVersionId: () => identityOverrides.versionId ?? "version-round-trip",
    computeHash: async () => identityOverrides.primaryImageHash ?? "hash-round-trip",
    now: () => identityOverrides.lastModifiedAt ?? "2026-04-01T12:00:00.000Z",
  });

  return result;
}

export function assertRoundTripSnapshotIntegrity(originalSnapshot, restoredSnapshot) {
  expect(restoredSnapshot.image.dataUrl).toBe(originalSnapshot.image.dataUrl);
  expect(restoredSnapshot.projectNotes).toBe(originalSnapshot.projectNotes);
  expect(restoredSnapshot.calibration).toEqual(originalSnapshot.calibration);
  expect(restoredSnapshot.woodBoundaryMode).toEqual(originalSnapshot.woodBoundaryMode);
  expect(restoredSnapshot.result).toEqual(originalSnapshot.result);
  expect(restoredSnapshot.ui?.rotationDeg).toBe(originalSnapshot.ui?.rotationDeg);
  expect(restoredSnapshot.ui).not.toHaveProperty("zoomFactor");
}

export function parseSavedEnvelope(envelope) {
  return parseProjectFileText(JSON.stringify(envelope));
}

export function roundTripSnapshotThroughV2File(snapshot, projectName = "River Table") {
  const envelope = buildPersistedV2OpenEnvelope({ snapshot, projectName });
  const parsed = parseProjectFileText(JSON.stringify(envelope));
  const mappedBack = mapCanonicalV2ToCalculatorSnapshot(parsed.envelope);

  return { envelope, parsed, mappedBack };
}

export { TINY_PNG };
