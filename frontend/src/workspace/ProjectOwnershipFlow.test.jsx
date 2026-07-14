import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPersistedV2OpenEnvelope } from "../project/canonicalProjectV2.test.js";
import {
  PROJECT_OWNERSHIP_MODE,
  PROJECT_READ_ONLY_NOTICE_MESSAGE,
  PROJECT_WRITE_FORBIDDEN_MESSAGE,
} from "../project/projectOwnership.js";
import {
  buildV2ProjectFileJsonForOwner,
  VALID_CALCULATOR_SNAPSHOT,
} from "../project/projectFileTestFixtures.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { ROUTES } from "./routes.js";
import {
  buildRecentProjectEntry,
  loadRecentProjects,
  upsertRecentProject,
} from "./recentProjectsIndex.js";
import { parseProjectFileText } from "./projectFileParse.js";
import { canUpdateCurrentProjectInPlace, createOpenedCurrentProject } from "./currentProject.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const saveProjectFileMock = vi.fn();
const updateProjectFileMock = vi.fn();
const getRecentProjectHandleMock = vi.fn();
const storeRecentProjectHandleMock = vi.fn(async () => {});

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
    storeRecentProjectHandle: (...args) => storeRecentProjectHandleMock(...args),
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

function seedAuthenticatedSession(userOverrides = {}) {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        id: "stub-user",
        email: "user@example.com",
        username: "user",
        role: "user",
        ...userOverrides,
      },
    }),
  );
}

describe("Project ownership flow", () => {
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
    storeRecentProjectHandleMock.mockReset();
    getRecentProjectHandleMock.mockResolvedValue(fileHandle);
    updateProjectFileMock.mockResolvedValue({
      payload: buildPersistedV2OpenEnvelope({
        snapshot: VALID_CALCULATOR_SNAPSHOT,
        identity: { ownerId: "stub-user" },
      }),
      persistedLifecycle: parseProjectFileText(
        buildV2ProjectFileJsonForOwner("stub-user", { snapshot: VALID_CALCULATOR_SNAPSHOT }),
      ).persistedLifecycle,
      fileHandle,
      fileName: "river-table.hfzproject",
    });

    recentEntry = upsertRecentProject(
      buildRecentProjectEntry(
        buildPersistedV2OpenEnvelope({
          snapshot: VALID_CALCULATOR_SNAPSHOT,
          identity: { ownerId: "stub-user" },
        }),
        { fileName: "river-table.hfzproject" },
      ),
    )[0];
  });

  afterEach(() => {
    restoreImage();
    vi.restoreAllMocks();
  });

  async function openProjectWithOwner(router, ownerId, userOverrides = {}) {
    if (Object.keys(userOverrides).length > 0) {
      seedAuthenticatedSession(userOverrides);
    }

    const parsed = parseProjectFileText(
      buildV2ProjectFileJsonForOwner(ownerId, { snapshot: VALID_CALCULATOR_SNAPSHOT }),
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

    return parsed;
  }

  it("keeps owned projects editable and able to update in place", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    await openProjectWithOwner(router, "stub-user");
    expect(screen.queryByText(PROJECT_READ_ONLY_NOTICE_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Project" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save Project" }));

    await waitFor(() => {
      expect(updateProjectFileMock).toHaveBeenCalledTimes(1);
    });
    expect(updateProjectFileMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        ownershipMode: PROJECT_OWNERSHIP_MODE.OWNED,
      }),
    );
  });

  it("opens foreign-owned projects for inspection with a read-only notice", async () => {
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    await openProjectWithOwner(router, "other-owner");

    expect(screen.getByText(PROJECT_READ_ONLY_NOTICE_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Project" })).not.toBeInTheDocument();
  });

  it("does not mark a foreign-owned project dirty immediately after open", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    await openProjectWithOwner(router, "other-owner");
    await user.click(screen.getByRole("link", { name: "Home" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(screen.queryByRole("dialog", { name: /You have unsaved changes/i })).not.toBeInTheDocument();
  });

  it("blocks save attempts for foreign-owned projects without opening the save dialog", async () => {
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    await openProjectWithOwner(router, "other-owner");

    expect(screen.queryByRole("dialog", { name: "Save Project" })).not.toBeInTheDocument();
    expect(updateProjectFileMock).not.toHaveBeenCalled();
    expect(saveProjectFileMock).not.toHaveBeenCalled();
  });

  it("allows session-only zoom without creating dirty state", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    await openProjectWithOwner(router, "other-owner");
    await user.click(screen.getByRole("button", { name: "Zoom In" }));
    await user.click(screen.getByRole("link", { name: "Home" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(screen.queryByRole("dialog", { name: /You have unsaved changes/i })).not.toBeInTheDocument();
  });

  it("keeps project notes read-only for foreign-owned projects", async () => {
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    await openProjectWithOwner(router, "other-owner");

    await waitFor(() => {
      expect(document.querySelector(".container--read-only")).not.toBeNull();
    });
  });

  it("does not treat administrators as automatic owners", async () => {
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    await openProjectWithOwner(router, "other-owner", {
      id: "admin-user",
      role: "administrator",
    });

    expect(screen.getByText(PROJECT_READ_ONLY_NOTICE_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Project" })).not.toBeInTheDocument();
  });

  it("does not touch an existing recent entry when reopening a foreign-owned project", async () => {
    const user = userEvent.setup();

    const foreignParsed = parseProjectFileText(
      buildV2ProjectFileJsonForOwner("other-owner", { snapshot: VALID_CALCULATOR_SNAPSHOT }),
    );
    const foreignFile = new File(
      [buildV2ProjectFileJsonForOwner("other-owner", { snapshot: VALID_CALCULATOR_SNAPSHOT })],
      "foreign-table.hfzproject",
      { type: "application/json" },
    );
    const foreignEntry = upsertRecentProject(
      buildRecentProjectEntry(foreignParsed.envelope, {
        fileName: "foreign-table.hfzproject",
      }),
    )[0];
    const originalLastOpenedAt = foreignEntry.lastOpenedAt;

    getRecentProjectHandleMock.mockResolvedValue({
      getFile: vi.fn(async () => foreignFile),
      queryPermission: vi.fn(async () => "granted"),
      requestPermission: vi.fn(async () => "granted"),
    });

    const { router } = renderWorkspace(ROUTES.PROJECTS);

    await user.click(
      screen.getByRole("button", {
        name: /foreign-table\.hfzproject/i,
      }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/new-project");
      expect(screen.getByText(PROJECT_READ_ONLY_NOTICE_MESSAGE)).toBeInTheDocument();
    });

    const storedEntry = loadRecentProjects().find((entry) => entry.id === foreignEntry.id);
    expect(storedEntry?.lastOpenedAt).toBe(originalLastOpenedAt);
    expect(storeRecentProjectHandleMock).not.toHaveBeenCalled();
  });
});

describe("currentProject ownership helpers", () => {
  it("blocks in-place updates for foreign read-only projects", () => {
    const project = createOpenedCurrentProject({
      recentEntryId: "entry-1",
      projectName: "River Table",
      fileHandle: { createWritable: vi.fn() },
      ownershipMode: PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY,
    });

    expect(canUpdateCurrentProjectInPlace(project)).toBe(false);
  });
});
