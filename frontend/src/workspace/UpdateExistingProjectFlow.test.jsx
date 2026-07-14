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

import { buildPersistedV2OpenEnvelope } from "../project/canonicalProjectV2.test.js";
import { buildV2ProjectFileJson, VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";
import { parseProjectFileText } from "./projectFileParse.js";

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
        format: "hfzwood-project",
        formatVersion: 2,
        descriptiveMetadata: { projectName: "River Table" },
        projectMetadata: { lastModifiedAt: "2026-02-01T12:00:00.000Z" },
        technicalContent: { image: { dataUrl: TINY_PNG } },
        derivedData: {},
      },
      persistedLifecycle: {
        projectMetadata: {
          projectId: "project-1",
          ownerId: "stub-user",
          versionId: "version-1",
          lastModifiedAt: "2026-02-01T12:00:00.000Z",
        },
        persistence: { status: "persisted" },
      },
      fileHandle,
      fileName: "river-table.hfzproject",
    });

    recentEntry = upsertRecentProject(
      buildRecentProjectEntry(
        buildPersistedV2OpenEnvelope({ snapshot: VALID_CALCULATOR_SNAPSHOT }),
        {
          fileName: "river-table.hfzproject",
        },
      ),
    )[0];
  });

  afterEach(() => {
    restoreImage();
    vi.restoreAllMocks();
  });

  async function openRestoredProject(router) {
    const parsed = parseProjectFileText(
      buildV2ProjectFileJson({ snapshot: VALID_CALCULATOR_SNAPSHOT }),
    );

    await router.navigate(ROUTES.NEW_PROJECT, {
      state: {
        pendingProjectRestore: parsed.snapshot,
        openContext: {
          recentEntryId: recentEntry.id,
          projectName: recentEntry.projectName,
          lastKnownFileName: recentEntry.lastKnownFileName,
          persistedLifecycle: parsed.persistedLifecycle,
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
