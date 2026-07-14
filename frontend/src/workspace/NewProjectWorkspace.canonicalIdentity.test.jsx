import { render, screen, waitFor } from "@testing-library/react";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { TestProviders } from "../test/TestProviders.jsx";
import { TINY_PNG } from "../project/canonicalProjectV2.test.js";
import { computePrimaryImageHash } from "../project/primaryImageHash.js";
import NewProjectWorkspace from "./NewProjectWorkspace.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const VALID_REFERENCE = {
  knownLengthCm: 10,
  calibrationPoints: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
};

const OTHER_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const thresholdCallbacks = [];

vi.mock("../calculator/ResinCalculator.jsx", () => ({
  default: forwardRef(function MockResinCalculator(
    { onCreationThresholdInputsChange },
    ref,
  ) {
    useEffect(() => {
      if (onCreationThresholdInputsChange) {
        thresholdCallbacks.push(onCreationThresholdInputsChange);
      }
    }, [onCreationThresholdInputsChange]);

    useImperativeHandle(ref, () => ({
      getProjectSnapshot: () => ({}),
      restoreProjectSnapshot: () => {},
      getCreationThresholdInputs: () => ({
        imageDataUrl: "",
        referenceMeasurements: [],
      }),
    }));

    return <div>Mock calculator</div>;
  }),
}));

vi.mock("../project/primaryImageHash.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    computePrimaryImageHash: vi.fn(actual.computePrimaryImageHash),
  };
});

function seedAuthenticatedSession(user = { id: "user-123", email: "user@example.com" }) {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        ...user,
        username: user.username ?? "user",
      },
    }),
  );
}

function renderNewProjectWorkspace() {
  thresholdCallbacks.length = 0;

  const router = createMemoryRouter(
    [{ path: "/*", element: <NewProjectWorkspace /> }],
    { initialEntries: ["/new-project"] },
  );

  return render(
    <TestProviders>
      <RouterProvider router={router} />
    </TestProviders>,
  );
}

function getLifecycleElement() {
  return screen.getByTestId("canonical-project-lifecycle");
}

function latestThresholdCallback() {
  return thresholdCallbacks.at(-1);
}

describe("NewProjectWorkspace canonical identity", () => {
  beforeEach(() => {
    sessionStorage.clear();
    thresholdCallbacks.length = 0;
    vi.mocked(computePrimaryImageHash).mockImplementation(
      async (imageDataUrl) => {
        const actual = await vi.importActual("../project/primaryImageHash.js");
        return actual.computePrimaryImageHash(imageDataUrl);
      },
    );
  });

  it("creates canonical identity when threshold inputs cross through workspace wiring", async () => {
    seedAuthenticatedSession();
    renderNewProjectWorkspace();

    await waitFor(() => {
      expect(latestThresholdCallback()).toBeTypeOf("function");
    });

    latestThresholdCallback()({
      imageDataUrl: TINY_PNG,
      referenceMeasurements: [],
    });

    expect(getLifecycleElement()).toHaveAttribute("data-has-identity", "false");

    latestThresholdCallback()({
      imageDataUrl: TINY_PNG,
      referenceMeasurements: [VALID_REFERENCE],
    });

    const expectedHash = await computePrimaryImageHash(TINY_PNG);

    await waitFor(() => {
      const lifecycle = getLifecycleElement();
      expect(lifecycle).toHaveAttribute("data-has-identity", "true");
      expect(lifecycle.getAttribute("data-project-id")).toBeTruthy();
      expect(lifecycle).toHaveAttribute("data-owner-id", "user-123");
      expect(lifecycle).toHaveAttribute("data-primary-image-hash", expectedHash);
      expect(lifecycle.getAttribute("data-created-at")).toBeTruthy();
      expect(lifecycle).toHaveAttribute("data-version-id", "");
    });
  });

  it("does not create identity without authenticated user id", async () => {
    renderNewProjectWorkspace();

    await waitFor(() => {
      expect(latestThresholdCallback()).toBeTypeOf("function");
    });

    latestThresholdCallback()({
      imageDataUrl: TINY_PNG,
      referenceMeasurements: [VALID_REFERENCE],
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Authenticated user identity is required/i),
      ).toBeInTheDocument();
      expect(getLifecycleElement()).toHaveAttribute("data-has-identity", "false");
    });
  });

  it("resets lifecycle identity when the primary image is replaced", async () => {
    seedAuthenticatedSession();
    renderNewProjectWorkspace();

    await waitFor(() => {
      expect(latestThresholdCallback()).toBeTypeOf("function");
    });

    latestThresholdCallback()({
      imageDataUrl: TINY_PNG,
      referenceMeasurements: [VALID_REFERENCE],
    });

    await waitFor(() => {
      expect(getLifecycleElement()).toHaveAttribute("data-has-identity", "true");
    });

    const firstProjectId = getLifecycleElement().getAttribute("data-project-id");

    latestThresholdCallback()({
      imageDataUrl: OTHER_PNG,
      referenceMeasurements: [],
    });

    await waitFor(() => {
      expect(getLifecycleElement()).toHaveAttribute("data-has-identity", "false");
    });

    latestThresholdCallback()({
      imageDataUrl: OTHER_PNG,
      referenceMeasurements: [VALID_REFERENCE],
    });

    const expectedHash = await computePrimaryImageHash(OTHER_PNG);

    await waitFor(() => {
      const lifecycle = getLifecycleElement();
      expect(lifecycle).toHaveAttribute("data-has-identity", "true");
      expect(lifecycle.getAttribute("data-project-id")).not.toBe(firstProjectId);
      expect(lifecycle).toHaveAttribute("data-primary-image-hash", expectedHash);
    });
  });
});
