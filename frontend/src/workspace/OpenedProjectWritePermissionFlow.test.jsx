import { screen, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { ROUTES } from "./routes.js";
import {
  buildRecentProjectEntry,
  loadRecentProjects,
  upsertRecentProject,
} from "./recentProjectsIndex.js";
import { PROJECT_FILE_WRITE_PERMISSION_DENIED_MESSAGE } from "./projectFileSave.js";
import { buildPersistedV2OpenEnvelope } from "../project/canonicalProjectV2.test.js";
import {
  buildV2ProjectFileJsonForOwner,
  VALID_CALCULATOR_SNAPSHOT,
} from "../project/projectFileTestFixtures.js";
import { parseProjectFileText } from "./projectFileParse.js";

const OPENED_PROJECT_SNAPSHOT = {
  ...VALID_CALCULATOR_SNAPSHOT,
  result: {
    calculationType: "wood",
    volumeLiters: 3.4,
    recommendedVolumeLiters: 3.74,
    safetyMarginPercent: 10,
  },
};

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

const getRecentProjectHandleMock = vi.fn();

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

function createFileHandleWithPermissions({
  queryResult = "prompt",
  requestResult = "granted",
} = {}) {
  const write = vi.fn();
  const close = vi.fn();
  const createWritable = vi.fn(async () => ({ write, close }));
  const queryPermission = vi.fn(async ({ mode }) => {
    expect(mode).toBe("readwrite");
    return queryResult;
  });
  const requestPermission = vi.fn(async ({ mode }) => {
    expect(mode).toBe("readwrite");
    return requestResult;
  });

  return {
    handle: {
      getFile: vi.fn(),
      createWritable,
      queryPermission,
      requestPermission,
    },
    createWritable,
    queryPermission,
    requestPermission,
  };
}

describe("Opened project write permission flow", () => {
  let restoreImage;
  let recentEntry;
  let fileHandleBundle;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    seedAuthenticatedSession();
    restoreImage = installPersistentImageMock();
    getRecentProjectHandleMock.mockReset();
    fileHandleBundle = createFileHandleWithPermissions();
    getRecentProjectHandleMock.mockResolvedValue(fileHandleBundle.handle);

    recentEntry = upsertRecentProject(
      buildRecentProjectEntry(
        buildPersistedV2OpenEnvelope({
          snapshot: OPENED_PROJECT_SNAPSHOT,
          identity: { ownerId: "stub-user" },
        }),
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

  async function openExistingOwnedProject(router) {
    const parsed = parseProjectFileText(
      buildV2ProjectFileJsonForOwner("stub-user", { snapshot: OPENED_PROJECT_SNAPSHOT }),
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

  async function makeProjectDirty(user) {
    const notes = await screen.findByPlaceholderText(/Client requests black pigment/i);
    await user.clear(notes);
    await user.type(notes, "Updated PO QA notes");
  }

  it("updates via Project Actions Save after readwrite permission is granted", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);
    const originalLastSavedAt = recentEntry.lastSavedAt;

    await openExistingOwnedProject(router);
    await makeProjectDirty(user);
    await user.click(screen.getByRole("button", { name: "Save Project" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });

    expect(fileHandleBundle.queryPermission).toHaveBeenCalledWith({ mode: "readwrite" });
    expect(fileHandleBundle.requestPermission).toHaveBeenCalledWith({ mode: "readwrite" });
    expect(fileHandleBundle.createWritable).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: /You have unsaved changes/i })).not.toBeInTheDocument();

    const recentProjects = loadRecentProjects();
    expect(recentProjects).toHaveLength(1);
    expect(recentProjects[0].id).toBe(recentEntry.id);
    expect(recentProjects[0].lastSavedAt).not.toBe(originalLastSavedAt);

    await openExistingOwnedProject(router);
    await user.click(screen.getByRole("link", { name: "Home" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(screen.queryByRole("dialog", { name: /You have unsaved changes/i })).not.toBeInTheDocument();
  });

  it("updates via unsaved-changes Save and proceeds to Home when readwrite permission is granted", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);

    await openExistingOwnedProject(router);
    await makeProjectDirty(user);
    await user.click(screen.getByRole("link", { name: "Home" }));

    const unsavedDialog = screen.getByRole("dialog", { name: /You have unsaved changes/i });
    await user.click(within(unsavedDialog).getByRole("button", { name: "Save Project" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });

    expect(fileHandleBundle.queryPermission).toHaveBeenCalledWith({ mode: "readwrite" });
    expect(fileHandleBundle.requestPermission).toHaveBeenCalledWith({ mode: "readwrite" });
    expect(fileHandleBundle.createWritable).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: /You have unsaved changes/i })).not.toBeInTheDocument();
  });

  it("does not write or mutate recent projects when readwrite permission is denied", async () => {
    fileHandleBundle = createFileHandleWithPermissions({
      queryResult: "prompt",
      requestResult: "denied",
    });
    getRecentProjectHandleMock.mockResolvedValue(fileHandleBundle.handle);

    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);
    const originalLastSavedAt = recentEntry.lastSavedAt;

    await openExistingOwnedProject(router);
    await makeProjectDirty(user);
    await user.click(screen.getByRole("button", { name: "Save Project" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        PROJECT_FILE_WRITE_PERMISSION_DENIED_MESSAGE,
      );
    });

    expect(router.state.location.pathname).toBe("/new-project");
    expect(fileHandleBundle.createWritable).not.toHaveBeenCalled();

    const recentProjects = loadRecentProjects();
    expect(recentProjects[0].lastSavedAt).toBe(originalLastSavedAt);

    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.getByRole("dialog", { name: /You have unsaved changes/i })).toBeInTheDocument();
  });
});
