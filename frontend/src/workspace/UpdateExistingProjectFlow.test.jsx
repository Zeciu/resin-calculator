import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { ROUTES } from "./routes.js";
import {
  buildRecentProjectEntry,
  loadRecentProjects,
  RECENT_PROJECTS_STORAGE_KEY,
  upsertRecentProject,
} from "./recentProjectsIndex.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUV0WQl3MBPQ8EAAAABJRU5ErkJggg==";

const PROJECT_PAYLOAD = {
  projectName: "River Table",
  savedAt: "2026-01-01T12:00:00.000Z",
  image: { dataUrl: TINY_PNG },
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
  ui: { calculationMode: "wood", selectedMode: "wood" },
  woodBoundaryMode: { woodBoundaryPolygons: [] },
  projectNotes: "Original notes",
};

const saveProjectFileMock = vi.fn();
const updateProjectFileMock = vi.fn();
const getRecentProjectHandleMock = vi.fn();

vi.mock("./projectFileSave.js", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    saveProjectFile: (...args) => saveProjectFileMock(...args),
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

describe("Update existing project flow", () => {
  let restoreImage;
  let recentEntry;
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
    saveProjectFileMock.mockReset();
    updateProjectFileMock.mockReset();
    getRecentProjectHandleMock.mockReset();
    getRecentProjectHandleMock.mockResolvedValue(fileHandle);
    updateProjectFileMock.mockResolvedValue({
      payload: {
        projectName: "River Table",
        savedAt: "2026-02-01T12:00:00.000Z",
        image: { dataUrl: TINY_PNG },
      },
      fileHandle,
      fileName: "river-table.hfzproject",
    });

    recentEntry = upsertRecentProject(
      buildRecentProjectEntry(PROJECT_PAYLOAD, {
        fileName: "river-table.hfzproject",
      }),
    )[0];
  });

  afterEach(() => {
    restoreImage();
    vi.restoreAllMocks();
  });

  async function openRestoredProject(router) {
    await router.navigate(ROUTES.NEW_PROJECT, {
      state: {
        pendingProjectRestore: PROJECT_PAYLOAD,
        openContext: {
          recentEntryId: recentEntry.id,
          projectName: recentEntry.projectName,
          lastKnownFileName: recentEntry.lastKnownFileName,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("keeps a reopened project clean until the user edits it", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    await openRestoredProject(router);
    await user.click(screen.getByRole("link", { name: "Home" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(screen.queryByRole("dialog", { name: /You have unsaved changes/i })).not.toBeInTheDocument();
  });

  it("silently updates the opened project and recent entry without dialogs", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    await openRestoredProject(router);
    await user.click(screen.getByRole("button", { name: "Save Project" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });

    expect(screen.queryByRole("dialog", { name: "Save Project" })).not.toBeInTheDocument();
    expect(updateProjectFileMock).toHaveBeenCalledTimes(1);
    expect(saveProjectFileMock).not.toHaveBeenCalled();

    const recentProjects = loadRecentProjects();
    expect(recentProjects).toHaveLength(1);
    expect(recentProjects[0].id).toBe(recentEntry.id);
    expect(recentProjects[0].lastSavedAt).toBe("2026-02-01T12:00:00.000Z");
    expect(localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY)).not.toContain(TINY_PNG);
  });
});
