import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProjectsPage from "../modules/ProjectsPage.jsx";
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
  pickProjectFileWithHandle: vi.fn(async () => null),
  loadProjectFromFile: vi.fn(),
  loadRecentProject: vi.fn(),
  RecentProjectUnavailableError: class RecentProjectUnavailableError extends Error {
    constructor(entry, message) {
      super(message);
      this.entry = entry;
    }
  },
}));

import {
  loadProjectFromFile,
  loadRecentProject,
  RecentProjectUnavailableError,
} from "./projectFileOpen.js";
import { upsertRecentProject, buildRecentProjectEntry } from "./recentProjectsIndex.js";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUV0WQl3MBPQ8EAAAABJRU5ErkJggg==";

function renderProjectsPage() {
  return render(
    <MemoryRouter>
      <ProjectsPage />
    </MemoryRouter>,
  );
}

describe("ProjectsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockReset();
    loadProjectFromFile.mockReset();
    loadRecentProject.mockReset();
  });

  it("renders Open Project, New Project, and the empty state", () => {
    renderProjectsPage();

    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Project" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New Project" })).toHaveAttribute(
      "href",
      ROUTES.NEW_PROJECT,
    );
    expect(screen.getByText(/No recent projects yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent on this device only/i)).toBeInTheDocument();
  });

  it("opens a selected project in the Application Workspace", async () => {
    const user = userEvent.setup();
    loadProjectFromFile.mockResolvedValue({
      project: {
        projectName: "River Table",
        image: { dataUrl: TINY_PNG },
      },
      entry: { id: "recent-1" },
    });

    renderProjectsPage();
    const input = document.querySelector("input[type='file']");
    const file = new File([JSON.stringify({ projectName: "River Table", image: { dataUrl: TINY_PNG } })], "river-table.hfzproject", {
      type: "application/json",
    });

    await user.upload(input, file);

    expect(loadProjectFromFile).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.NEW_PROJECT, {
      state: {
        pendingProjectRestore: expect.objectContaining({
          projectName: "River Table",
        }),
      },
    });
  });

  it("shows a locate action when a recent project is unavailable", async () => {
    const user = userEvent.setup();
    const entry = upsertRecentProject(
      buildRecentProjectEntry(
        { projectName: "River Table", image: { dataUrl: TINY_PNG } },
        { fileName: "river-table.hfzproject" },
      ),
    )[0];

    loadRecentProject.mockRejectedValue(
      new RecentProjectUnavailableError(entry, "Please locate the project file manually."),
    );

    renderProjectsPage();
    await user.click(screen.getByRole("button", { name: /River Table/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/locate the project file manually/i);
    expect(screen.getByRole("button", { name: "Locate Project File" })).toBeInTheDocument();
  });
});
