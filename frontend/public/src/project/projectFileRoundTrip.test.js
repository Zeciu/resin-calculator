import { describe, expect, it } from "vitest";
import { buildPersistableCanonicalV2 } from "./buildPersistableCanonicalV2.js";
import {
  assertRoundTripSnapshotIntegrity,
  parseSavedEnvelope,
  roundTripSnapshotThroughV2File,
  VALID_CALCULATOR_SNAPSHOT,
} from "./projectFileTestFixtures.js";

describe("canonical v2 save/open round-trip", () => {
  it("preserves calculator snapshot fields through save envelope and open parse", async () => {
    const saved = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_CALCULATOR_SNAPSHOT,
      user: { id: "stub-user" },
      generateProjectId: () => "project-round-trip",
      generateVersionId: () => "version-round-trip",
      computeHash: async () => "hash-round-trip",
      now: () => "2026-04-01T12:00:00.000Z",
    });

    const opened = parseSavedEnvelope(saved.envelope);
    assertRoundTripSnapshotIntegrity(VALID_CALCULATOR_SNAPSHOT, opened.snapshot);
    expect(opened.persistedLifecycle.projectMetadata.projectId).toBe("project-round-trip");
    expect(opened.persistedLifecycle.projectMetadata.versionId).toBe("version-round-trip");
  });

  it("preserves stable identity fields through update mapping", async () => {
    const firstSave = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_CALCULATOR_SNAPSHOT,
      user: { id: "stub-user" },
      generateProjectId: () => "project-round-trip",
      generateVersionId: () => "version-round-trip",
      computeHash: async () => "hash-round-trip",
      now: () => "2026-04-01T12:00:00.000Z",
    });

    const opened = parseSavedEnvelope(firstSave.envelope);

    const updated = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: {
        ...VALID_CALCULATOR_SNAPSHOT,
        projectNotes: "Updated notes",
      },
      user: { id: "stub-user" },
      persistedLifecycle: opened.persistedLifecycle,
      now: () => "2026-05-01T12:00:00.000Z",
    });

    const reopened = parseSavedEnvelope(updated.envelope);
    const metadata = reopened.persistedLifecycle.projectMetadata;

    expect(metadata.projectId).toBe("project-round-trip");
    expect(metadata.ownerId).toBe("stub-user");
    expect(metadata.primaryImageHash).toBe("hash-round-trip");
    expect(metadata.createdAt).toBe("2026-04-01T12:00:00.000Z");
    expect(metadata.versionId).toBe("version-round-trip");
    expect(metadata.lastModifiedAt).toBe("2026-05-01T12:00:00.000Z");
    expect(reopened.snapshot.projectNotes).toBe("Updated notes");
  });

  it("does not generate new identity during open parse", () => {
    const { parsed, mappedBack } = roundTripSnapshotThroughV2File(VALID_CALCULATOR_SNAPSHOT);

    expect(parsed.persistedLifecycle.projectMetadata.projectId).toBe("project-1");
    expect(parsed.persistedLifecycle.projectMetadata.versionId).toBe("version-1");
    assertRoundTripSnapshotIntegrity(VALID_CALCULATOR_SNAPSHOT, mappedBack);
  });
});
