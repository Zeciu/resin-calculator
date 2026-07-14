import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { ROUTES } from "./routes.js";
import { ProjectFileSaveError } from "./projectFileSave.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUV0WQl3MBPQ8EAAAABJRU5ErkJggg==";

import { buildV2ProjectFileJsonForOwner, VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";
import { parseProjectFileText } from "./projectFileParse.js";

const OPEN_PARSED = parseProjectFileText(
  buildV2ProjectFileJsonForOwner("stub-user", { snapshot: VALID_CALCULATOR_SNAPSHOT }),
);

const EXISTING_LIFECYCLE = OPEN_PARSED.persistedLifecycle;

const updateProjectFileMock = vi.fn();
const getRecentProjectHandleMock = vi.fn();

vi.mock("./projectFileSave.js", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    updateProjectFile: (...args) => updateProjectFileMock(...args),
  };
});

vi.mock("./recentProjectHandles.js", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    getRecentProjectHandle: (...args) => getRecentProjectHandleMock(...args),
    storeRecentProjectHandle: vi.fn(async () => {}),
  };
});

HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: () => {},
  fillRect: () => {},
  drawImage: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  setLineDash: () => {},
  measureText: () => ({ width: 0 }),
  fillText: () => {},
});

function installPersistentImageMock() {
  const OriginalImage = global.Image;
  global.Image = class MockImage {
    set src(_value) {
      if (this.onload) {
        this.onload();
      }
    }
  };

  return () => {
    global.Image = OriginalImage;
  };
}

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = vi.fn();

function seedAuthenticatedSession() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        id: "stub-user",
        email: "user@example.com",
        username: "user",
      },
    }),
  );
}

describe("NewProjectWorkspace persisted lifecycle", () => {
  let restoreImage;
  const fileHandle = {
    getFile: vi.fn(),
    createWritable: vi.fn(async () => ({
      write: vi.fn(),
      close: vi.fn(),
    })),
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    seedAuthenticatedSession();
    restoreImage = installPersistentImageMock();
    updateProjectFileMock.mockReset();
    getRecentProjectHandleMock.mockReset();
    getRecentProjectHandleMock.mockResolvedValue(fileHandle);
  });

  afterEach(() => {
    restoreImage();
    vi.restoreAllMocks();
  });

  it("does not expose removed pre-save canonical lifecycle DOM attributes", () => {
    renderWorkspace(ROUTES.NEW_PROJECT);

    expect(screen.queryByTestId("canonical-project-lifecycle")).not.toBeInTheDocument();
  });

  it("passes persisted lifecycle to update and adopts only after successful write", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    updateProjectFileMock.mockResolvedValue({
      payload: {
        format: "hfzwood-project",
        formatVersion: 2,
        descriptiveMetadata: { projectName: "River Table" },
        projectMetadata: {
          projectId: "project-1",
          versionId: "version-1",
          lastModifiedAt: "2026-02-01T12:00:00.000Z",
        },
        technicalContent: {},
        derivedData: {},
      },
      persistedLifecycle: {
        projectMetadata: {
          projectId: "project-1",
          versionId: "version-1",
          lastModifiedAt: "2026-02-01T12:00:00.000Z",
        },
        persistence: { status: "persisted" },
      },
      fileHandle,
      fileName: "river-table.hfzproject",
    });

    await router.navigate(ROUTES.NEW_PROJECT, {
      state: {
        pendingProjectRestore: OPEN_PARSED.snapshot,
        openContext: {
          recentEntryId: "recent-1",
          projectName: "River Table",
          lastKnownFileName: "river-table.hfzproject",
          persistedLifecycle: EXISTING_LIFECYCLE,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Save Project" }));

    await waitFor(() => {
      expect(updateProjectFileMock).toHaveBeenCalledWith(
        expect.objectContaining({
          persistedLifecycle: EXISTING_LIFECYCLE,
          user: expect.objectContaining({ id: "stub-user" }),
        }),
      );
    });
  });

  it("does not navigate home when update fails", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    updateProjectFileMock.mockRejectedValue(
      new ProjectFileSaveError("Could not update project file."),
    );

    await router.navigate(ROUTES.NEW_PROJECT, {
      state: {
        pendingProjectRestore: OPEN_PARSED.snapshot,
        openContext: {
          recentEntryId: "recent-1",
          projectName: "River Table",
          lastKnownFileName: "river-table.hfzproject",
          persistedLifecycle: EXISTING_LIFECYCLE,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Save Project" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Could not update project file/i);
    });

    expect(router.state.location.pathname).toBe("/new-project");
  });
});
