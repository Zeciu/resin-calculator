import { describe, expect, it } from "vitest";
import { createPersistedLifecycleFromEnvelope } from "./canonicalProjectLifecycle.js";
import { buildPersistedV2OpenEnvelope } from "./canonicalProjectV2.test.js";
import {
  assertCurrentProjectWritable,
  assertProjectWritableByMode,
  isForeignReadOnlyOwnershipMode,
  PROJECT_OWNERSHIP_MODE,
  PROJECT_WRITE_FORBIDDEN_MESSAGE,
  resolveProjectOwnershipMode,
} from "./projectOwnership.js";
import { createOpenedCurrentProject } from "../workspace/currentProject.js";

describe("resolveProjectOwnershipMode", () => {
  it("resolves owned when user.id matches ownerId", () => {
    const lifecycle = createPersistedLifecycleFromEnvelope(
      buildPersistedV2OpenEnvelope({ identity: { ownerId: "user-a" } }),
    );

    expect(resolveProjectOwnershipMode({ id: "user-a" }, lifecycle)).toBe(
      PROJECT_OWNERSHIP_MODE.OWNED,
    );
  });

  it("resolves foreign read-only when user.id differs from ownerId", () => {
    const lifecycle = createPersistedLifecycleFromEnvelope(
      buildPersistedV2OpenEnvelope({ identity: { ownerId: "user-a" } }),
    );

    expect(resolveProjectOwnershipMode({ id: "user-b" }, lifecycle)).toBe(
      PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY,
    );
  });

  it("does not treat administrator role as ownership", () => {
    const lifecycle = createPersistedLifecycleFromEnvelope(
      buildPersistedV2OpenEnvelope({ identity: { ownerId: "user-a" } }),
    );

    expect(
      resolveProjectOwnershipMode({ id: "admin-user", role: "administrator" }, lifecycle),
    ).toBe(PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY);
  });

  it("treats missing user id as foreign read-only", () => {
    const lifecycle = createPersistedLifecycleFromEnvelope(
      buildPersistedV2OpenEnvelope({ identity: { ownerId: "user-a" } }),
    );

    expect(resolveProjectOwnershipMode(null, lifecycle)).toBe(
      PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY,
    );
  });
});

describe("project write guards", () => {
  it("allows owned mode writes", () => {
    expect(() => assertProjectWritableByMode(PROJECT_OWNERSHIP_MODE.OWNED)).not.toThrow();
  });

  it("blocks foreign read-only writes", () => {
    expect(() => assertProjectWritableByMode(PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY)).toThrow(
      PROJECT_WRITE_FORBIDDEN_MESSAGE,
    );
  });

  it("blocks writes for read-only current projects", () => {
    const project = createOpenedCurrentProject({
      recentEntryId: "entry-1",
      projectName: "River Table",
      ownershipMode: PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY,
    });

    expect(() => assertCurrentProjectWritable(project)).toThrow(PROJECT_WRITE_FORBIDDEN_MESSAGE);
  });

  it("identifies foreign read-only mode", () => {
    expect(isForeignReadOnlyOwnershipMode(PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY)).toBe(true);
    expect(isForeignReadOnlyOwnershipMode(PROJECT_OWNERSHIP_MODE.OWNED)).toBe(false);
  });
});
