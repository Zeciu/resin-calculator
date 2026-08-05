import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { RECENT_PROJECTS_STORAGE_KEY } from "./recentProjectsIndex.js";
import {
  ProjectFileSaveCancelledError,
  ProjectFileSaveError,
} from "./projectFileSave.js";
import { openRestoredProjectWithWork } from "./workspaceProjectTestHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUV0WQl3MBPQ8EAAAABJRU5ErkJggg==";

const saveProjectFileMock = vi.fn();

vi.mock("./projectFileSave.js", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    saveProjectFile: (...args) => saveProjectFileMock(...args),
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

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = vi.fn();

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

async function seedProjectWithWork(router) {
  await openRestoredProjectWithWork(router, { projectName: "Imported" });
}

function getSaveProjectDialog() {
  return screen.getByRole("dialog", { name: "Save Project" });
}

describe("Save Project flow", () => {
  let restoreImage;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    seedAuthenticatedSession();
    restoreImage = installPersistentImageMock();
    saveProjectFileMock.mockReset();
    saveProjectFileMock.mockResolvedValue({
      payload: {
        format: "hfzwood-project",
        formatVersion: 2,
        descriptiveMetadata: { projectName: "River Table" },
        projectMetadata: { lastModifiedAt: "2026-01-01T12:00:00.000Z" },
        technicalContent: { image: { dataUrl: TINY_PNG } },
        derivedData: {},
      },
      fileHandle: null,
      fileName: "river-table.hfzproject",
    });
  });

  afterEach(() => {
    restoreImage();
    vi.restoreAllMocks();
  });

  it("opens SaveProjectDialog from the workspace Save Project action", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    await seedProjectWithWork(router);
    await user.click(screen.getByRole("button", { name: "Save Project" }));

    expect(getSaveProjectDialog()).toBeInTheDocument();
    expect(screen.getByLabelText(/Project name/i)).toBeInTheDocument();
  });

  it("opens the same SaveProjectDialog from unsaved changes", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    await seedProjectWithWork(router);
    await user.click(screen.getByRole("link", { name: "Home" }));

    const unsavedDialog = screen.getByRole("dialog", {
      name: /You have unsaved changes/i,
    });
    await user.click(
      within(unsavedDialog).getByRole("button", { name: "Save Project" }),
    );

    expect(getSaveProjectDialog()).toBeInTheDocument();
  });

  it("rejects an empty project name", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    await seedProjectWithWork(router);
    await user.click(screen.getByRole("button", { name: "Save Project" }));
    await user.click(within(getSaveProjectDialog()).getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Project name is required/i);
    expect(saveProjectFileMock).not.toHaveBeenCalled();
  });

  it("saves a complete project file and navigates Home", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    await seedProjectWithWork(router);
    await user.click(screen.getByRole("button", { name: "Save Project" }));

    const saveDialog = getSaveProjectDialog();
    await user.type(within(saveDialog).getByLabelText(/Project name/i), "River Table");
    await user.click(within(saveDialog).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });

    expect(saveProjectFileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectName: "River Table",
        user: expect.objectContaining({ id: "stub-user" }),
        snapshot: expect.objectContaining({
          image: expect.objectContaining({
            dataUrl: TINY_PNG,
          }),
        }),
      }),
    );

    const recentStore = localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY);
    expect(recentStore).toContain("River Table");
    expect(recentStore).not.toContain(TINY_PNG);
  });

  it("keeps the workspace open when save fails", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    saveProjectFileMock.mockRejectedValue(
      new ProjectFileSaveError("Could not save project file."),
    );

    await seedProjectWithWork(router);
    await user.click(screen.getByRole("button", { name: "Save Project" }));

    const saveDialog = getSaveProjectDialog();
    await user.type(within(saveDialog).getByLabelText(/Project name/i), "River Table");
    await user.click(within(saveDialog).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Could not save project file/i);
    });

    expect(router.state.location.pathname).toBe("/new-project");
    expect(getSaveProjectDialog()).toBeInTheDocument();
  });

  it("keeps the workspace open when the native save picker is cancelled", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    saveProjectFileMock.mockRejectedValue(new ProjectFileSaveCancelledError());

    await seedProjectWithWork(router);
    await user.click(screen.getByRole("button", { name: "Save Project" }));

    const saveDialog = getSaveProjectDialog();
    await user.type(within(saveDialog).getByLabelText(/Project name/i), "River Table");
    await user.click(within(saveDialog).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(saveProjectFileMock).toHaveBeenCalled();
    });

    expect(router.state.location.pathname).toBe("/new-project");
    expect(getSaveProjectDialog()).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
