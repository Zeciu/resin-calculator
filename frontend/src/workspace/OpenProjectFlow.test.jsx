import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { ROUTES } from "./routes.js";
import { RECENT_PROJECTS_STORAGE_KEY } from "./recentProjectsIndex.js";

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
};

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

describe("Open Project flow", () => {
  let restoreImage;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    seedAuthenticatedSession();
    restoreImage = installPersistentImageMock();
  });

  afterEach(() => {
    restoreImage();
    vi.restoreAllMocks();
  });

  it("uses dedicated module layout on the Projects Hub", () => {
    renderWorkspace(ROUTES.PROJECTS);

    expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Project" })).toBeInTheDocument();
  });

  it("restores a project into the Application Workspace after Open Project", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/projects");

    const input = document.querySelector("input[type='file']");
    const file = new File([JSON.stringify(PROJECT_PAYLOAD)], "river-table.hfzproject", {
      type: "application/json",
    });

    await user.upload(input, file);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/new-project");
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY)).toContain("River Table");
    expect(localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY)).not.toContain(TINY_PNG);
  });
});
