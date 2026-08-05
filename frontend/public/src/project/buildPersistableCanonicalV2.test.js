import { describe, expect, it, vi } from "vitest";
import { HFZ_PROJECT_CANONICAL_FORMAT_VERSION } from "../projectFileTypes.js";
import { createEmptyCanonicalLifecycle } from "./canonicalProjectLifecycle.js";
import { TINY_PNG } from "./canonicalProjectV2.test.js";
import {
  buildPersistableCanonicalV2,
  getRecentIndexFieldsFromSavedPayload,
  getSnapshotCreationThresholdInputs,
} from "./buildPersistableCanonicalV2.js";
import { isCanonicalProjectV2Envelope } from "./canonicalProjectV2.js";

const VALID_REFERENCE = {
  knownLengthCm: 10,
  calibrationPoints: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
};

const VALID_SNAPSHOT = {
  appVersion: "1.0",
  image: { dataUrl: TINY_PNG, width: 100, height: 80 },
  calibration: {
    referenceMeasurements: [VALID_REFERENCE],
  },
  ui: { calculationMode: "wood", selectedMode: "wood" },
  woodBoundaryMode: { woodBoundaryPolygons: [], cavities: [] },
  projectNotes: "Notes",
  result: { totalVolumeLiters: 1.2 },
};

const STUB_USER = { id: "owner-1" };

function buildExistingLifecycle(overrides = {}) {
  return {
    projectMetadata: {
      projectId: "project-1",
      ownerId: "owner-1",
      primaryImageHash: "hash-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      versionId: "version-1",
      parentVersionId: null,
      ancestorVersionIds: [],
      lastModifiedAt: "2026-01-01T00:00:00.000Z",
      metadataModifiedAt: null,
      structuralCapabilitySnapshot: null,
      ...overrides,
    },
    persistence: { status: "persisted" },
  };
}

describe("buildPersistableCanonicalV2", () => {
  it("rejects save when the creation threshold is not met", async () => {
    await expect(
      buildPersistableCanonicalV2({
        projectName: "River Table",
        snapshot: {
          ...VALID_SNAPSHOT,
          calibration: { referenceMeasurements: [] },
        },
        user: STUB_USER,
      }),
    ).rejects.toThrow(/reference measurement/i);
  });

  it("creates canonical identity fields on first successful save", async () => {
    const result = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      generateProjectId: () => "project-1",
      generateVersionId: () => "version-1",
      computeHash: async () => "hash-1",
      now: () => "2026-02-01T12:00:00.000Z",
    });

    const metadata = result.envelope.projectMetadata;
    expect(metadata.projectId).toBe("project-1");
    expect(metadata.ownerId).toBe("owner-1");
    expect(metadata.createdAt).toBe("2026-02-01T12:00:00.000Z");
    expect(metadata.primaryImageHash).toBe("hash-1");
    expect(metadata.versionId).toBe("version-1");
    expect(metadata.lastModifiedAt).toBe("2026-02-01T12:00:00.000Z");
    expect(result.persistedLifecycle.persistence).toEqual({ status: "persisted" });
  });

  it("writes canonical format version 2", async () => {
    const result = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      computeHash: async () => "hash-1",
    });

    expect(result.envelope.formatVersion).toBe(HFZ_PROJECT_CANONICAL_FORMAT_VERSION);
    expect(isCanonicalProjectV2Envelope(result.envelope)).toBe(true);
    expect(result.envelope.descriptiveMetadata.projectName).toBe("River Table");
    expect(result.envelope.technicalContent.image).toEqual(VALID_SNAPSHOT.image);
  });

  it("preserves stable identity fields on update", async () => {
    const existingLifecycle = buildExistingLifecycle();
    const result = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      persistedLifecycle: existingLifecycle,
      now: () => "2026-03-01T12:00:00.000Z",
    });

    const metadata = result.envelope.projectMetadata;
    expect(metadata.projectId).toBe("project-1");
    expect(metadata.ownerId).toBe("owner-1");
    expect(metadata.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(metadata.primaryImageHash).toBe("hash-1");
    expect(metadata.versionId).toBe("version-1");
  });

  it("updates lastModifiedAt on successful update", async () => {
    const result = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      persistedLifecycle: buildExistingLifecycle(),
      now: () => "2026-03-01T12:00:00.000Z",
    });

    expect(result.envelope.projectMetadata.lastModifiedAt).toBe("2026-03-01T12:00:00.000Z");
  });

  it("keeps minimum version metadata placeholders on first save and update", async () => {
    const firstSave = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      computeHash: async () => "hash-1",
    });

    expect(firstSave.envelope.projectMetadata.parentVersionId).toBeNull();
    expect(firstSave.envelope.projectMetadata.ancestorVersionIds).toEqual([]);
    expect(firstSave.envelope.projectMetadata.metadataModifiedAt).toBeNull();

    const update = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      persistedLifecycle: firstSave.persistedLifecycle,
    });

    expect(update.envelope.projectMetadata.parentVersionId).toBeNull();
    expect(update.envelope.projectMetadata.ancestorVersionIds).toEqual([]);
    expect(update.envelope.projectMetadata.metadataModifiedAt).toBeNull();
  });

  it("does not recompute identity fields during update", async () => {
    const computeHash = vi.fn(async () => "new-hash");
    const generateProjectId = vi.fn(() => "new-project");
    const generateVersionId = vi.fn(() => "new-version");

    await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      persistedLifecycle: buildExistingLifecycle(),
      computeHash,
      generateProjectId,
      generateVersionId,
    });

    expect(computeHash).not.toHaveBeenCalled();
    expect(generateProjectId).not.toHaveBeenCalled();
    expect(generateVersionId).not.toHaveBeenCalled();
  });

  it("requires authenticated owner id on first save", async () => {
    await expect(
      buildPersistableCanonicalV2({
        projectName: "River Table",
        snapshot: VALID_SNAPSHOT,
        user: null,
        computeHash: async () => "hash-1",
      }),
    ).rejects.toThrow(/Authenticated user identity/i);
  });

  it("extracts recent index fields from canonical v2 payload", async () => {
    const result = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      computeHash: async () => "hash-1",
      now: () => "2026-02-01T12:00:00.000Z",
    });

    expect(getRecentIndexFieldsFromSavedPayload(result.envelope)).toEqual({
      projectName: "River Table",
      savedAt: "2026-02-01T12:00:00.000Z",
    });
  });

  it("derives threshold inputs from calculator snapshot", () => {
    expect(getSnapshotCreationThresholdInputs(VALID_SNAPSHOT)).toEqual({
      imageDataUrl: TINY_PNG,
      referenceMeasurements: [VALID_REFERENCE],
    });
  });

  it("does not introduce advanced versioning behavior", async () => {
    const firstSave = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      computeHash: async () => "hash-1",
      generateVersionId: () => "version-1",
    });

    const update = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      persistedLifecycle: firstSave.persistedLifecycle,
      generateVersionId: () => "version-2",
    });

    expect(update.envelope.projectMetadata.versionId).toBe("version-1");
    expect(update.envelope.projectMetadata.parentVersionId).toBeNull();
    expect(update.envelope.projectMetadata.ancestorVersionIds).toEqual([]);
  });

  it("rejects empty project names", async () => {
    await expect(
      buildPersistableCanonicalV2({
        projectName: "   ",
        snapshot: VALID_SNAPSHOT,
        user: STUB_USER,
      }),
    ).rejects.toThrow(/Project name is required/i);
  });

  it("treats lifecycle without project id as first save", async () => {
    const emptyLifecycle = createEmptyCanonicalLifecycle();
    const result = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_SNAPSHOT,
      user: STUB_USER,
      persistedLifecycle: emptyLifecycle,
      generateProjectId: () => "project-new",
      computeHash: async () => "hash-new",
    });

    expect(result.envelope.projectMetadata.projectId).toBe("project-new");
  });
});
