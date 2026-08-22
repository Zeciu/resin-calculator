import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DemoWorkspace from "./DemoWorkspace.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { buildPersistedV2OpenEnvelope } from "../project/canonicalProjectV2.test.js";
import { VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";
import { CANONICAL_DEMO_PROJECT_URL } from "../demo/demoConstants.js";
import { RECENT_PROJECTS_STORAGE_KEY } from "./recentProjectsIndex.js";
import * as recentProjectsIndex from "./recentProjectsIndex.js";
import * as recentProjectHandles from "./recentProjectHandles.js";
import * as projectFileOpen from "./projectFileOpen.js";

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  setLineDash: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  fillText: vi.fn(),
}));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = vi.fn();

const COMPLETED_SNAPSHOT = {
  ...VALID_CALCULATOR_SNAPSHOT,
  ui: {
    calculationMode: "wood",
    selectedMode: "edit",
    rotationDeg: 0,
    measurementsComplete: true,
    cavitiesComplete: true,
  },
  woodBoundaryMode: {
    ...VALID_CALCULATOR_SNAPSHOT.woodBoundaryMode,
    useImageBorderAsMold: false,
    moldBoundaryPoints: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
    woodBoundaryPolygons: [
      [
        { x: 10, y: 10 },
        { x: 40, y: 10 },
        { x: 40, y: 40 },
        { x: 10, y: 40 },
      ],
    ],
    cavities: [
      {
        name: "Cavity 1",
        points: [
          { x: 60, y: 60 },
          { x: 90, y: 60 },
          { x: 90, y: 90 },
          { x: 60, y: 90 },
        ],
        depthMm: "12",
      },
    ],
    mainResinDepthMm: "20",
    firstFillThicknessMm: "",
    maxPourThicknessMm: "",
    firstFillVolumeLiters: null,
    pourPlanRows: [],
    recommendedLayerCount: null,
  },
  result: { calculationType: "wood", volumeLiters: 2.5, recommendedVolumeLiters: 2.75 },
};

const SEEDED_RECENTS = JSON.stringify({
  version: 1,
  items: [
    {
      id: "existing-recent",
      projectId: "existing-project",
      projectName: "Existing Table",
      lastOpenedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
});

function demoEnvelope() {
  return buildPersistedV2OpenEnvelope({
    snapshot: COMPLETED_SNAPSHOT,
    projectName: "Demo River Table",
    identity: { projectId: "hfzwood-public-demo-project", ownerId: "hfzwood-public-demo" },
  });
}

function installImageMock() {
  const OriginalImage = global.Image;
  global.Image = class MockImage {
    constructor() {
      this.width = 200;
      this.height = 200;
    }
    set src(_value) {
      this.onload?.();
    }
  };
  return () => {
    global.Image = OriginalImage;
  };
}

function mockDemoFetch(handler) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/api/me/capabilities")) {
        return { ok: true, json: async () => ({ role: "user", accessTier: "free", capabilities: {} }) };
      }
      return handler(requestUrl);
    }),
  );
}

function renderDemoWorkspace() {
  return render(
    <MemoryRouter>
      <TestProviders>
        <DemoWorkspace />
      </TestProviders>
    </MemoryRouter>,
  );
}

describe("DemoWorkspace", () => {
  let restoreImage;

  beforeEach(() => {
    restoreImage = installImageMock();
    localStorage.clear();
    localStorage.setItem(RECENT_PROJECTS_STORAGE_KEY, SEEDED_RECENTS);
    vi.spyOn(recentProjectsIndex, "upsertRecentProject");
    vi.spyOn(recentProjectHandles, "storeRecentProjectHandle");
    vi.spyOn(projectFileOpen, "loadRecentProject");
  });

  afterEach(() => {
    restoreImage();
    vi.restoreAllMocks();
  });

  it("loads the canonical demo, enters Modify Mode, and does not persist", async () => {
    mockDemoFetch(async (requestUrl) => {
      if (requestUrl.includes(CANONICAL_DEMO_PROJECT_URL)) {
        return { ok: true, text: async () => JSON.stringify(demoEnvelope()) };
      }
      return { ok: false, status: 404, json: async () => ({ detail: "Not found" }) };
    });

    renderDemoWorkspace();

    await waitFor(() => {
      expect(document.querySelector(".modify-mode-badge")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /^Modify Project$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset demo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create a free account to start your own project/i })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(projectFileOpen.loadRecentProject).not.toHaveBeenCalled();
    expect(recentProjectsIndex.upsertRecentProject).not.toHaveBeenCalled();
    expect(recentProjectHandles.storeRecentProjectHandle).not.toHaveBeenCalled();
    expect(localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY)).toBe(SEEDED_RECENTS);
    expect(document.querySelector("input[type='file']")).toBeNull();
    expect(screen.queryByRole("button", { name: /Save Project/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save As/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Update Existing/i })).not.toBeInTheDocument();
  });

  it("restores the pristine snapshot on Reset demo", async () => {
    const user = userEvent.setup();
    mockDemoFetch(async (requestUrl) => {
      if (requestUrl.includes(CANONICAL_DEMO_PROJECT_URL)) {
        return { ok: true, text: async () => JSON.stringify(demoEnvelope()) };
      }
      return { ok: false, status: 404, json: async () => ({ detail: "Not found" }) };
    });

    renderDemoWorkspace();
    await waitFor(() => {
      expect(document.querySelector(".modify-mode-badge")).toBeInTheDocument();
    });

    const depthInput = screen.getByRole("spinbutton", { name: /Main resin depth/i });
    await user.clear(depthInput);
    await user.type(depthInput, "55");
    expect(depthInput).toHaveValue(55);

    const firstFillInput = screen.getByRole("spinbutton", { name: /First Fill Seal Coat Thickness/i });
    await user.clear(firstFillInput);
    await user.type(firstFillInput, "3");
    expect(firstFillInput).toHaveValue(3);

    const maxPourInput = screen.getByRole("spinbutton", { name: /Maximum Pour Thickness Per Layer/i });
    await user.clear(maxPourInput);
    await user.type(maxPourInput, "5");
    expect(maxPourInput).toHaveValue(5);

    await user.click(screen.getByRole("button", { name: "Reset demo" }));

    await waitFor(() => {
      expect(screen.getByRole("spinbutton", { name: /Main resin depth/i })).toHaveValue(20);
    });
    expect(screen.getByRole("spinbutton", { name: /First Fill Seal Coat Thickness/i })).toHaveValue(null);
    expect(screen.getByRole("spinbutton", { name: /Maximum Pour Thickness Per Layer/i })).toHaveValue(
      null,
    );
    expect(document.querySelector(".modify-mode-badge")).toBeInTheDocument();
    expect(recentProjectsIndex.upsertRecentProject).not.toHaveBeenCalled();
    expect(localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY)).toBe(SEEDED_RECENTS);

    await user.click(screen.getByRole("button", { name: "Reset demo" }));
    await waitFor(() => {
      expect(screen.getByRole("spinbutton", { name: /Main resin depth/i })).toHaveValue(20);
    });
    expect(document.querySelector(".modify-mode-badge")).toBeInTheDocument();
  });

  it("shows a retryable error when the demo asset cannot be fetched", async () => {
    const user = userEvent.setup();
    mockDemoFetch(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ detail: "Not found" }),
      text: async () => "",
    }));

    renderDemoWorkspace();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Could not load the demo project/i);
    });
    expect(document.querySelector(".modify-mode-badge")).not.toBeInTheDocument();

    mockDemoFetch(async (requestUrl) => {
      if (requestUrl.includes(CANONICAL_DEMO_PROJECT_URL)) {
        return { ok: true, text: async () => JSON.stringify(demoEnvelope()) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => {
      expect(document.querySelector(".modify-mode-badge")).toBeInTheDocument();
    });
  });

  it("shows a retryable error when the demo asset cannot be parsed", async () => {
    mockDemoFetch(async (requestUrl) => {
      if (requestUrl.includes(CANONICAL_DEMO_PROJECT_URL)) {
        return { ok: true, text: async () => "{not-json" };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    renderDemoWorkspace();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Invalid project file/i);
    });
  });
});
