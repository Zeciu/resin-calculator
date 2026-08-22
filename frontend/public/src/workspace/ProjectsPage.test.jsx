import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProjectsPage from "../modules/ProjectsPage.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { ROUTES } from "./routes.js";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("./projectFileOpen.js", () => ({
  HFZ_PROJECT_IMPORT_ACCEPT: ".hfzproject,.json",
  supportsNativeProjectOpenPicker: vi.fn(() => false),
  pickProjectFileWithHandle: vi.fn(async () => null),
  loadProjectFromFile: vi.fn(),
  loadProjectIntoRecentEntry: vi.fn(),
  loadRecentProject: vi.fn(),
  RecentProjectUnavailableError: class RecentProjectUnavailableError extends Error {
    constructor(entry, message) {
      super(message);
      this.entry = entry;
    }
  },
  RecentProjectRebindMismatchError: class RecentProjectRebindMismatchError extends Error {
    constructor(entry, message) {
      super(message);
      this.entry = entry;
    }
  },
}));

import {
  loadProjectFromFile,
  loadProjectIntoRecentEntry,
  loadRecentProject,
  pickProjectFileWithHandle,
  RecentProjectRebindMismatchError,
  RecentProjectUnavailableError,
  supportsNativeProjectOpenPicker,
} from "./projectFileOpen.js";
import {
  markRecentProjectUnavailable,
  upsertRecentProject,
  buildRecentProjectEntry,
  loadRecentProjects,
} from "./recentProjectsIndex.js";
import * as recentProjectHandles from "./recentProjectHandles.js";
import * as projectFileParse from "./projectFileParse.js";

import { buildPersistedV2OpenEnvelope } from "../project/canonicalProjectV2.test.js";
import { TINY_PNG } from "../project/canonicalProjectV2.test.js";

function renderProjectsPage() {
  return render(
    <MemoryRouter>
      <TestProviders>
        <ProjectsPage />
      </TestProviders>
    </MemoryRouter>,
  );
}

function seedRecentProject({
  projectId = "project-1",
  projectName = "River Table",
  fileName = "river-table.hfzproject",
} = {}) {
  return upsertRecentProject(
    buildRecentProjectEntry(
      buildPersistedV2OpenEnvelope({
        projectName,
        identity: { projectId },
      }),
      { fileName },
    ),
  )[0];
}

function getCardDeleteButton(projectName) {
  const openButton = screen.getByRole("button", { name: new RegExp(projectName, "i") });
  const card = openButton.closest(".projects-hub__recent-card");
  return within(card).getByRole("button", { name: "Delete" });
}

describe("ProjectsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.setItem(
      "hfzwood.mockAuth",
      JSON.stringify({
        user: { id: "stub-user", email: "user@example.com", username: "user", role: "user" },
      }),
    );
    navigateMock.mockReset();
    loadProjectFromFile.mockReset();
    loadProjectIntoRecentEntry.mockReset();
    loadRecentProject.mockReset();
    supportsNativeProjectOpenPicker.mockReturnValue(false);
    pickProjectFileWithHandle.mockResolvedValue(null);
    vi.spyOn(projectFileParse, "parseProjectFile");
    vi.spyOn(recentProjectHandles, "deleteRecentProjectHandle");
    vi.spyOn(window, "confirm");
  });

  afterEach(() => {
    projectFileParse.parseProjectFile.mockRestore();
    recentProjectHandles.deleteRecentProjectHandle.mockRestore();
    window.confirm.mockRestore();
  });

  it("renders Open Project and the empty state", () => {
    renderProjectsPage();

    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Project" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "New Project" })).not.toBeInTheDocument();
    expect(screen.getByText(/No recent projects yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent on this device only/i)).toBeInTheDocument();
  });

  it("does not open a fallback file picker when the native picker is cancelled", async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");

    supportsNativeProjectOpenPicker.mockReturnValue(true);
    pickProjectFileWithHandle.mockResolvedValue(null);

    renderProjectsPage();
    await user.click(screen.getByRole("button", { name: "Open Project" }));

    expect(pickProjectFileWithHandle).toHaveBeenCalledTimes(1);
    expect(clickSpy).not.toHaveBeenCalled();
    expect(loadProjectFromFile).not.toHaveBeenCalled();

    clickSpy.mockRestore();
  });

  it("opens a selected project in the Application Workspace", async () => {
    const user = userEvent.setup();
    loadProjectFromFile.mockResolvedValue({
      snapshot: { image: { dataUrl: TINY_PNG } },
      persistedLifecycle: {
        projectMetadata: { projectId: "project-1", versionId: "version-1" },
        persistence: { status: "persisted" },
      },
      envelope: buildPersistedV2OpenEnvelope(),
      entry: {
        id: "recent-1",
        projectName: "River Table",
        lastKnownFileName: "river-table.hfzproject",
        lastOpenedAt: "2026-01-01T12:00:00.000Z",
      },
    });

    renderProjectsPage();
    const input = document.querySelector("input[type='file']");
    const file = new File([JSON.stringify({ projectName: "River Table", image: { dataUrl: TINY_PNG } })], "river-table.hfzproject", {
      type: "application/json",
    });

    await user.upload(input, file);

    expect(loadProjectFromFile).toHaveBeenCalledWith(
      expect.any(File),
      null,
      expect.objectContaining({ user: expect.objectContaining({ id: expect.any(String) }) }),
    );
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.NEW_PROJECT, {
      state: {
        pendingProjectRestore: expect.objectContaining({
          image: expect.objectContaining({ dataUrl: TINY_PNG }),
        }),
        openContext: expect.objectContaining({
          recentEntryId: "recent-1",
          projectName: "River Table",
          persistedLifecycle: expect.objectContaining({
            projectMetadata: expect.objectContaining({ projectId: "project-1" }),
          }),
        }),
      },
    });
  });

  it("shows a locate action when a recent project is unavailable", async () => {
    const user = userEvent.setup();
    const entry = upsertRecentProject(
      buildRecentProjectEntry(buildPersistedV2OpenEnvelope(), {
        fileName: "river-table.hfzproject",
      }),
    )[0];

    loadRecentProject.mockRejectedValue(
      new RecentProjectUnavailableError(entry, "Please locate the project file manually."),
    );

    renderProjectsPage();
    await user.click(screen.getByRole("button", { name: /River Table/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/locate the project file manually/i);
    expect(screen.getByRole("button", { name: "Locate Project File" })).toBeInTheDocument();
  });

  it("rebinds the unavailable recent entry when locating the project file", async () => {
    const user = userEvent.setup();
    const entry = upsertRecentProject(
      buildRecentProjectEntry(buildPersistedV2OpenEnvelope(), {
        fileName: "river-table.hfzproject",
      }),
    )[0];

    loadRecentProject.mockRejectedValue(
      new RecentProjectUnavailableError(entry, "Please locate the project file manually."),
    );
    supportsNativeProjectOpenPicker.mockReturnValue(true);
    pickProjectFileWithHandle.mockResolvedValue({
      file: new File(
        [JSON.stringify({ projectName: "River Table", image: { dataUrl: TINY_PNG } })],
        "river-table.hfzproject",
        { type: "application/json" },
      ),
      handle: { getFile: vi.fn() },
    });
    loadProjectIntoRecentEntry.mockResolvedValue({
      snapshot: { image: { dataUrl: TINY_PNG } },
      persistedLifecycle: {
        projectMetadata: { projectId: "project-1" },
        persistence: { status: "persisted" },
      },
      envelope: buildPersistedV2OpenEnvelope(),
      entry,
    });

    renderProjectsPage();
    await user.click(screen.getByRole("button", { name: /River Table/i }));
    await user.click(screen.getByRole("button", { name: "Locate Project File" }));

    expect(loadProjectIntoRecentEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: entry.id }),
      expect.any(File),
      expect.objectContaining({ getFile: expect.any(Function) }),
    );
    expect(loadProjectFromFile).not.toHaveBeenCalled();
  });

  it("shows unavailable state on recent cards when the local file is marked unavailable", () => {
    const entry = upsertRecentProject(
      buildRecentProjectEntry(buildPersistedV2OpenEnvelope(), {
        fileName: "river-table.hfzproject",
      }),
    )[0];
    markRecentProjectUnavailable(entry.id);

    renderProjectsPage();

    expect(screen.getByText(/Local file unavailable or moved/i)).toBeInTheDocument();
  });

  it("shows a mismatch message when locating the wrong project file", async () => {
    const user = userEvent.setup();
    const entry = markRecentProjectUnavailable(
      upsertRecentProject(
        buildRecentProjectEntry(buildPersistedV2OpenEnvelope(), {
          fileName: "river-table.hfzproject",
        }),
      )[0].id,
    )[0];

    loadRecentProject.mockRejectedValue(
      new RecentProjectUnavailableError(entry, "Please locate the project file manually."),
    );
    supportsNativeProjectOpenPicker.mockReturnValue(true);
    pickProjectFileWithHandle.mockResolvedValue({
      file: new File(["{}"], "other-table.hfzproject", { type: "application/json" }),
      handle: { getFile: vi.fn() },
    });
    loadProjectIntoRecentEntry.mockRejectedValue(
      new RecentProjectRebindMismatchError(
        entry,
        "The selected file belongs to a different project.",
      ),
    );

    renderProjectsPage();
    await user.click(screen.getByRole("button", { name: /River Table/i }));
    await user.click(screen.getByRole("button", { name: "Locate Project File" }));

    expect(loadProjectIntoRecentEntry).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/different project/i);
    expect(screen.getByText(/Local file unavailable or moved/i)).toBeInTheDocument();
  });

  it("exposes Delete on every listed recent project", () => {
    seedRecentProject({ projectId: "project-a", projectName: "River Table" });
    seedRecentProject({
      projectId: "project-b",
      projectName: "Coffee Table",
      fileName: "coffee-table.hfzproject",
    });

    renderProjectsPage();

    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
    expect(document.querySelector("button button")).toBeNull();
  });

  it("does not open the project when Delete is clicked", async () => {
    const user = userEvent.setup();
    seedRecentProject();

    renderProjectsPage();
    await user.click(getCardDeleteButton("River Table"));

    expect(loadRecentProject).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Delete project?" })).toBeInTheDocument();
  });

  it("shows the project name in the delete confirmation dialog", async () => {
    const user = userEvent.setup();
    seedRecentProject({ projectName: "River Table" });

    renderProjectsPage();
    await user.click(getCardDeleteButton("River Table"));

    const dialog = screen.getByRole("dialog", { name: "Delete project?" });
    expect(dialog).toHaveTextContent("River Table");
    expect(dialog).toHaveTextContent(
      "Remove “River Table” from Recent Projects on this device? The saved .hfzproject file on your disk will not be deleted.",
    );
  });

  it("leaves the list unchanged and does not open the project when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const entry = seedRecentProject();

    renderProjectsPage();
    await user.click(getCardDeleteButton("River Table"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /River Table/i })).toBeInTheDocument();
    expect(loadRecentProjects()).toHaveLength(1);
    expect(loadRecentProjects()[0].id).toBe(entry.id);
    expect(loadRecentProject).not.toHaveBeenCalled();
    expect(recentProjectHandles.deleteRecentProjectHandle).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("removes the recent row on confirm without opening or parsing the project file", async () => {
    const user = userEvent.setup();
    const entry = seedRecentProject();

    renderProjectsPage();
    await user.click(getCardDeleteButton("River Table"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /River Table/i })).not.toBeInTheDocument();
    });
    expect(screen.getByText(/No recent projects yet/i)).toBeInTheDocument();
    expect(loadRecentProjects()).toEqual([]);
    expect(loadRecentProject).not.toHaveBeenCalled();
    expect(projectFileParse.parseProjectFile).not.toHaveBeenCalled();
    expect(recentProjectHandles.deleteRecentProjectHandle).toHaveBeenCalledWith(entry.id);
    expect(navigateMock).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("still removes the recent row when IndexedDB handle cleanup fails", async () => {
    const user = userEvent.setup();
    const entry = seedRecentProject();
    recentProjectHandles.deleteRecentProjectHandle.mockRejectedValueOnce(
      new Error("IndexedDB failed"),
    );

    renderProjectsPage();
    await user.click(getCardDeleteButton("River Table"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /River Table/i })).not.toBeInTheDocument();
    });
    expect(loadRecentProjects().find((item) => item.id === entry.id)).toBeUndefined();
    expect(loadRecentProject).not.toHaveBeenCalled();
  });

  it("lets an unavailable or unopenable project be deleted without opening it", async () => {
    const user = userEvent.setup();
    const entry = seedRecentProject();
    markRecentProjectUnavailable(entry.id);

    renderProjectsPage();

    expect(screen.getByText(/Local file unavailable or moved/i)).toBeInTheDocument();
    expect(getCardDeleteButton("River Table")).toBeInTheDocument();

    await user.click(getCardDeleteButton("River Table"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /River Table/i })).not.toBeInTheDocument();
    });
    expect(loadRecentProject).not.toHaveBeenCalled();
    expect(projectFileParse.parseProjectFile).not.toHaveBeenCalled();
    expect(recentProjectHandles.deleteRecentProjectHandle).toHaveBeenCalledWith(entry.id);
  });

  it("keeps remaining project cards openable after another project is deleted", async () => {
    const user = userEvent.setup();
    seedRecentProject({ projectId: "project-a", projectName: "River Table" });
    const coffee = seedRecentProject({
      projectId: "project-b",
      projectName: "Coffee Table",
      fileName: "coffee-table.hfzproject",
    });
    loadRecentProject.mockResolvedValue({
      snapshot: { image: { dataUrl: TINY_PNG } },
      persistedLifecycle: {
        projectMetadata: { projectId: "project-b" },
        persistence: { status: "persisted" },
      },
      envelope: buildPersistedV2OpenEnvelope({
        projectName: "Coffee Table",
        identity: { projectId: "project-b" },
      }),
      entry: coffee,
    });

    renderProjectsPage();
    await user.click(getCardDeleteButton("River Table"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /River Table/i })).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Coffee Table/i }));

    expect(loadRecentProject).toHaveBeenCalledTimes(1);
    expect(loadRecentProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: coffee.id, projectName: "Coffee Table" }),
      expect.objectContaining({ user: expect.objectContaining({ id: expect.any(String) }) }),
    );
    expect(navigateMock).toHaveBeenCalledWith(
      ROUTES.NEW_PROJECT,
      expect.objectContaining({
        state: expect.objectContaining({
          openContext: expect.objectContaining({ recentEntryId: coffee.id }),
        }),
      }),
    );
  });

  it("does not attempt to delete the saved project file from disk", async () => {
    const user = userEvent.setup();
    seedRecentProject();
    const handleRemove = vi.fn();

    renderProjectsPage();
    await user.click(getCardDeleteButton("River Table"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /River Table/i })).not.toBeInTheDocument();
    });
    expect(handleRemove).not.toHaveBeenCalled();
    expect(window.showSaveFilePicker).toBeUndefined();
    expect(loadRecentProject).not.toHaveBeenCalled();
    expect(projectFileParse.parseProjectFile).not.toHaveBeenCalled();
  });
});
