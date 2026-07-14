import { describe, expect, it, vi } from "vitest";
import { TINY_PNG } from "./canonicalProjectV2.test.js";
import { createEmptyCanonicalLifecycle } from "./canonicalProjectLifecycle.js";
import { ensureCanonicalProjectIdentity } from "./ensureCanonicalProjectIdentity.js";
import { hasCanonicalProjectIdentity } from "./projectCreationThreshold.js";

const VALID_REFERENCE = {
  knownLengthCm: 10,
  calibrationPoints: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
};

const THRESHOLD_INPUTS = {
  imageDataUrl: TINY_PNG,
  referenceMeasurements: [VALID_REFERENCE],
};

function buildParams(overrides = {}) {
  return {
    lifecycle: createEmptyCanonicalLifecycle(),
    inputs: THRESHOLD_INPUTS,
    ownerId: "owner-1",
    isOperationCurrent: () => true,
    generateProjectId: () => "project-1",
    now: () => "2026-01-01T00:00:00.000Z",
    computeHash: async () => "hash-1",
    ...overrides,
  };
}

describe("ensureCanonicalProjectIdentity", () => {
  it("establishes all four required fields when the threshold is met", async () => {
    const result = await ensureCanonicalProjectIdentity(buildParams());

    expect(result.adopted).toBe(true);
    expect(result.lifecycle.projectMetadata).toEqual({
      projectId: "project-1",
      ownerId: "owner-1",
      primaryImageHash: "hash-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      versionId: null,
      parentVersionId: null,
      ancestorVersionIds: [],
      lastModifiedAt: null,
      metadataModifiedAt: null,
      structuralCapabilitySnapshot: null,
    });
  });

  it("does not create identity when owner id is missing", async () => {
    const result = await ensureCanonicalProjectIdentity(
      buildParams({ ownerId: null }),
    );

    expect(result.adopted).toBe(false);
    expect(result.missingOwner).toBe(true);
    expect(result.identityError).toMatch(/Authenticated user identity/i);
    expect(hasCanonicalProjectIdentity(result.lifecycle)).toBe(false);
  });

  it("discards stale hash results when the operation is no longer current", async () => {
    let resolveHash;
    let isCurrent = true;
    const computeHash = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveHash = () => resolve("stale-hash");
        }),
    );

    const promise = ensureCanonicalProjectIdentity(
      buildParams({
        computeHash,
        isOperationCurrent: () => isCurrent,
      }),
    );

    isCurrent = false;
    resolveHash();
    const result = await promise;

    expect(result.adopted).toBe(false);
    expect(result.stale).toBe(true);
    expect(hasCanonicalProjectIdentity(result.lifecycle)).toBe(false);
  });

  it("does not start adoption when the operation is already stale", async () => {
    const computeHash = vi.fn(async () => "hash-1");
    const result = await ensureCanonicalProjectIdentity(
      buildParams({
        computeHash,
        isOperationCurrent: () => false,
      }),
    );

    expect(result.adopted).toBe(false);
    expect(result.stale).toBe(true);
    expect(computeHash).not.toHaveBeenCalled();
  });

  it("does not create version or persistence metadata", async () => {
    const result = await ensureCanonicalProjectIdentity(buildParams());

    expect(result.lifecycle.projectMetadata.versionId).toBeNull();
    expect(result.lifecycle.persistence).toEqual({ status: "never-persisted" });
  });
});
