import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TINY_PNG } from "./canonicalProjectV2.test.js";
import { computePrimaryImageHash } from "./primaryImageHash.js";
import { useCanonicalProjectIdentity } from "./useCanonicalProjectIdentity.js";

const VALID_REFERENCE = {
  knownLengthCm: 10,
  calibrationPoints: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
};

const OTHER_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

vi.mock("./primaryImageHash.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    computePrimaryImageHash: vi.fn(actual.computePrimaryImageHash),
  };
});

describe("useCanonicalProjectIdentity", () => {
  beforeEach(() => {
    vi.mocked(computePrimaryImageHash).mockImplementation(
      async (imageDataUrl) => {
        const actual = await vi.importActual("./primaryImageHash.js");
        return actual.computePrimaryImageHash(imageDataUrl);
      },
    );
  });

  it("preserves identity across repeated threshold evaluations and edits", async () => {
    const { result } = renderHook(() =>
      useCanonicalProjectIdentity({ user: { id: "user-1" } }),
    );

    await act(async () => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      });
    });

    await waitFor(() => {
      expect(result.current.canonicalLifecycle.projectMetadata.projectId).toBeTruthy();
    });

    const firstIdentity = { ...result.current.canonicalLifecycle.projectMetadata };

    await act(async () => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [
          VALID_REFERENCE,
          {
            knownLengthCm: 20,
            calibrationPoints: [
              { x: 1, y: 1 },
              { x: 50, y: 1 },
            ],
          },
        ],
      });
    });

    await waitFor(() => {
      expect(result.current.canonicalLifecycle.projectMetadata.projectId).toBe(
        firstIdentity.projectId,
      );
    });

    expect(result.current.canonicalLifecycle.projectMetadata).toEqual(firstIdentity);
  });

  it("does not create identity when authenticated user id is missing", async () => {
    const { result } = renderHook(() =>
      useCanonicalProjectIdentity({ user: null }),
    );

    await act(async () => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      });
    });

    await waitFor(() => {
      expect(result.current.identityError).toMatch(/Authenticated user identity/i);
    });

    expect(result.current.canonicalLifecycle.projectMetadata.projectId).toBeNull();
  });

  it("resets lifecycle identity when the primary image is replaced", async () => {
    const { result } = renderHook(() =>
      useCanonicalProjectIdentity({ user: { id: "user-1" } }),
    );

    await act(async () => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      });
    });

    await waitFor(() => {
      expect(result.current.canonicalLifecycle.projectMetadata.projectId).toBeTruthy();
    });

    const firstProjectId =
      result.current.canonicalLifecycle.projectMetadata.projectId;

    await act(async () => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: OTHER_PNG,
        referenceMeasurements: [],
      });
    });

    await waitFor(() => {
      expect(result.current.canonicalLifecycle.projectMetadata.projectId).toBeNull();
    });

    await act(async () => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: OTHER_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      });
    });

    await waitFor(() => {
      expect(result.current.canonicalLifecycle.projectMetadata.projectId).toBeTruthy();
      expect(result.current.canonicalLifecycle.projectMetadata.projectId).not.toBe(
        firstProjectId,
      );
    });
  });

  it("discards in-flight identity work when the session becomes non-new", async () => {
    let resolveHash;
    vi.mocked(computePrimaryImageHash).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveHash = () => resolve("late-hash");
        }),
    );

    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useCanonicalProjectIdentity({ user: { id: "user-1" }, enabled }),
      { initialProps: { enabled: true } },
    );

    act(() => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      });
    });

    rerender({ enabled: false });

    await act(async () => {
      resolveHash();
    });

    await waitFor(() => {
      expect(result.current.canonicalLifecycle.projectMetadata.projectId).toBeNull();
      expect(result.current.canonicalLifecycle.projectMetadata.ownerId).toBeNull();
      expect(
        result.current.canonicalLifecycle.projectMetadata.primaryImageHash,
      ).toBeNull();
      expect(result.current.canonicalLifecycle.projectMetadata.createdAt).toBeNull();
      expect(result.current.identityError).toBe("");
    });
  });

  it("clears a prior identity error when the session becomes non-new", async () => {
    const { result, rerender } = renderHook(
      ({ enabled, user }) => useCanonicalProjectIdentity({ user, enabled }),
      { initialProps: { enabled: true, user: null } },
    );

    act(() => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      });
    });

    await waitFor(() => {
      expect(result.current.identityError).toMatch(/Authenticated user identity/i);
    });

    rerender({ enabled: false, user: null });

    await waitFor(() => {
      expect(result.current.identityError).toBe("");
    });
  });

  it("does not start identity creation when the session is already non-new", async () => {
    vi.mocked(computePrimaryImageHash).mockClear();

    const { result } = renderHook(() =>
      useCanonicalProjectIdentity({ user: { id: "user-1" }, enabled: false }),
    );

    act(() => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      });
    });

    expect(computePrimaryImageHash).not.toHaveBeenCalled();
    expect(result.current.canonicalLifecycle.projectMetadata.projectId).toBeNull();
    expect(result.current.identityError).toBe("");
  });

  it("invalidates pending identity work on unmount", async () => {
    let resolveHash;
    vi.mocked(computePrimaryImageHash).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveHash = () => resolve("late-hash");
        }),
    );

    const { result, unmount } = renderHook(() =>
      useCanonicalProjectIdentity({ user: { id: "user-1" } }),
    );

    act(() => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      });
    });

    unmount();

    await act(async () => {
      resolveHash();
    });
  });

  it("discards stale hash results from a replaced image", async () => {
    let resolveFirstHash;
    vi.mocked(computePrimaryImageHash).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirstHash = () => resolve("stale-first-image-hash");
        }),
    );

    const { result } = renderHook(() =>
      useCanonicalProjectIdentity({ user: { id: "user-1" } }),
    );

    await act(async () => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: TINY_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      });
    });

    await act(async () => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: OTHER_PNG,
        referenceMeasurements: [],
      });
    });

    await act(async () => {
      resolveFirstHash();
    });

    await waitFor(() => {
      expect(result.current.canonicalLifecycle.projectMetadata.projectId).toBeNull();
      expect(
        result.current.canonicalLifecycle.projectMetadata.primaryImageHash,
      ).toBeNull();
    });

    await act(async () => {
      result.current.handleCreationThresholdInputsChange({
        imageDataUrl: OTHER_PNG,
        referenceMeasurements: [VALID_REFERENCE],
      });
    });

    const expectedHash = await computePrimaryImageHash(OTHER_PNG);

    await waitFor(() => {
      expect(result.current.canonicalLifecycle.projectMetadata.primaryImageHash).toBe(
        expectedHash,
      );
      expect(
        result.current.canonicalLifecycle.projectMetadata.primaryImageHash,
      ).not.toBe("stale-first-image-hash");
    });
  });
});
