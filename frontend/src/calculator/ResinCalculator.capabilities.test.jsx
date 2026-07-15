import { render, screen, waitFor, act } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import ResinCalculator from "./ResinCalculator.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { FREE_CAPABILITIES } from "../capabilities/capabilityDefaults.js";
import { VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";

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

const SUBSCRIBER_CAPABILITIES = {
  ...FREE_CAPABILITIES,
  "calculator.maxPolygonPoints": null,
  "calculator.pdfExport": true,
  "calculator.layerCalculation": true,
  "calculator.formworkMode": "advanced",
  "calculator.advancedReports": true,
  "calculator.exportFormat": "pdf_and_csv",
};

function fourPoints() {
  return [
    { x: 10, y: 10 },
    { x: 20, y: 10 },
    { x: 20, y: 20 },
    { x: 10, y: 20 },
  ];
}

function threePoints() {
  return [
    { x: 10, y: 10 },
    { x: 20, y: 10 },
    { x: 20, y: 20 },
  ];
}

function buildWoodWorkflowSnapshot(overrides = {}) {
  const {
    ui: uiOverrides = {},
    woodBoundaryMode: woodOverrides = {},
    result = null,
    ...restOverrides
  } = overrides;

  return {
    ...VALID_CALCULATOR_SNAPSHOT,
    ...restOverrides,
    ui: {
      calculationMode: "wood",
      selectedMode: "mold",
      measurementsComplete: true,
      rotationDeg: 0,
      zoomFactor: 1,
      selectedShape: null,
      ...uiOverrides,
    },
    woodBoundaryMode: {
      ...VALID_CALCULATOR_SNAPSHOT.woodBoundaryMode,
      useImageBorderAsMold: false,
      moldBoundaryPoints: [],
      woodBoundaryPolygons: [],
      currentWoodBoundaryPoints: [],
      cavityPolygons: [],
      currentCavityPoints: [],
      mainResinDepthMm: "10",
      ...woodOverrides,
    },
    result,
    calibration: VALID_CALCULATOR_SNAPSHOT.calibration,
  };
}

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

function mockCapabilitiesFetch(capabilities) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/api/me/capabilities")) {
        return {
          ok: true,
          json: async () => ({
            role: "user",
            accessTier: "free",
            catalogVersion: 1,
            capabilities,
          }),
        };
      }
      if (requestUrl.includes("/api/preferences")) {
        return {
          ok: true,
          json: async () => ({
            interfaceLanguage: "en",
            lengthUnit: "mm",
            volumeUnit: "L",
            exists: true,
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({}),
      };
    }),
  );
}

function renderCalculator(ui) {
  return render(<TestProviders>{ui}</TestProviders>);
}

async function restoreSnapshot(ref, snapshot) {
  await act(async () => {
    ref.current.restoreProjectSnapshot(snapshot);
  });
}

async function restoreWoodWorkflow(ref, snapshot) {
  await restoreSnapshot(ref, snapshot);
  await waitFor(() => {
    expect(
      screen.queryByRole("button", { name: "Done with Measurements" }),
    ).not.toBeInTheDocument();
  });
}

async function clickCanvas(times = 1) {
  const canvas = document.querySelector("canvas");
  expect(canvas).toBeTruthy();
  for (let index = 0; index < times; index += 1) {
    await act(async () => {
      canvas.dispatchEvent(
        new MouseEvent("click", { clientX: 50, clientY: 50, bubbles: true }),
      );
    });
  }
}

describe("ResinCalculator capability enforcement", () => {
  let restoreImageMock;

  beforeEach(() => {
    vi.restoreAllMocks();
    restoreImageMock = installPersistentImageMock();
    sessionStorage.setItem(
      "hfzwood.mockAuth",
      JSON.stringify({
        user: { id: "stub-user", email: "user@example.com", username: "user", role: "user" },
      }),
    );
  });

  afterEach(() => {
    restoreImageMock?.();
    sessionStorage.clear();
  });

  it("initializes new free projects in the wood boundary workflow", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );

    await waitFor(() => {
      expect(ref.current.getProjectSnapshot().ui.calculationMode).toBe("wood");
    });
    expect(screen.getByText("Mold")).toBeInTheDocument();
    expect(screen.getByText("Wood")).toBeInTheDocument();
    expect(screen.getByText("Cavities")).toBeInTheDocument();
  });

  it("blocks a fifth mold point for new free projects", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();
    const snapshot = buildWoodWorkflowSnapshot({
      ui: { selectedMode: "mold" },
      woodBoundaryMode: {
        moldBoundaryPoints: [
          { x: 10, y: 10 },
          { x: 20, y: 10 },
        ],
      },
    });

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );
    await restoreWoodWorkflow(ref, snapshot);
    await clickCanvas(3);

    await waitFor(() => {
      expect(screen.getByText(/mold boundary is limited to 4 points/i)).toBeInTheDocument();
    });
  });

  it("opens the wood workflow once the mold has at least three points", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();
    const snapshot = buildWoodWorkflowSnapshot({
      ui: { selectedMode: "mold" },
      woodBoundaryMode: { moldBoundaryPoints: threePoints() },
    });

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );
    await restoreWoodWorkflow(ref, snapshot);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Add Wood Island/i })).toBeInTheDocument();
    });
  });

  it("keeps Finish Mold inactive until the mold has three points", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();
    const snapshot = buildWoodWorkflowSnapshot({
      ui: { selectedMode: "mold" },
      woodBoundaryMode: {
        moldBoundaryPoints: [
          { x: 10, y: 10 },
          { x: 20, y: 10 },
        ],
      },
    });

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );
    await restoreWoodWorkflow(ref, snapshot);

    await act(async () => {
      screen.getByRole("button", { name: "Finish Mold" }).click();
    });

    expect(screen.getByText(/Draw the mold boundary before continuing/i)).toBeInTheDocument();
  });

  it("finishes an in-progress mold and opens the wood workflow", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();
    const snapshot = buildWoodWorkflowSnapshot({
      ui: { selectedMode: "mold" },
      woodBoundaryMode: {
        moldBoundaryPoints: [
          { x: 10, y: 10 },
          { x: 20, y: 10 },
        ],
      },
    });

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );
    await restoreWoodWorkflow(ref, snapshot);

    await clickCanvas();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Finish Mold" })).toBeEnabled();
    });

    await act(async () => {
      screen.getByRole("button", { name: "Finish Mold" }).click();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Add Wood Island/i })).toBeInTheDocument();
    });
  });

  it("blocks a fifth point on the active wood island", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();
    const snapshot = buildWoodWorkflowSnapshot({
      ui: { selectedMode: "wood" },
      woodBoundaryMode: {
        moldBoundaryPoints: fourPoints(),
        currentWoodBoundaryPoints: [
          { x: 10, y: 10 },
          { x: 20, y: 10 },
        ],
      },
    });

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );
    await restoreWoodWorkflow(ref, snapshot);
    await clickCanvas(3);

    await waitFor(() => {
      expect(screen.getByText(/wood island is limited to 4 points/i)).toBeInTheDocument();
    });
  });

  it("applies an independent four-point allowance to each wood island", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();
    const snapshot = buildWoodWorkflowSnapshot({
      ui: { selectedMode: "wood" },
      woodBoundaryMode: {
        moldBoundaryPoints: fourPoints(),
        woodBoundaryPolygons: [],
        currentWoodBoundaryPoints: threePoints(),
      },
    });

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );
    await restoreWoodWorkflow(ref, snapshot);

    await act(async () => {
      screen.getByRole("button", { name: "Complete Current Island" }).click();
    });

    expect(ref.current.getProjectSnapshot().woodBoundaryMode.woodBoundaryPolygons).toHaveLength(1);

    await clickCanvas(4);
    await clickCanvas();

    await waitFor(() => {
      expect(screen.getByText(/wood island is limited to 4 points/i)).toBeInTheDocument();
    });
  });

  it("blocks a fifth point on the active cavity", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();
    const snapshot = buildWoodWorkflowSnapshot({
      ui: { selectedMode: "cavity" },
      woodBoundaryMode: {
        moldBoundaryPoints: fourPoints(),
        woodBoundaryPolygons: [threePoints()],
        currentCavityPoints: [
          { x: 10, y: 10 },
          { x: 20, y: 10 },
        ],
      },
    });

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );
    await restoreWoodWorkflow(ref, snapshot);
    await clickCanvas(3);

    await waitFor(() => {
      expect(screen.getByText(/cavity is limited to 4 points/i)).toBeInTheDocument();
    });
  });

  it("allows a new free project to reach calculate after mold, wood, and cavities", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const calculateWoodMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        calculationType: "wood",
        volumeLiters: 2.5,
        recommendedVolumeLiters: 2.75,
        safetyMarginPercent: 10,
        moldAreaCm2: 100,
        woodAreaCm2: 20,
        woodIslandCount: 1,
        mainResinAreaCm2: 80,
        mainVolumeLiters: 2,
        cavityAreaCm2: 0,
        mainPourDepthMm: 10,
        useImageBorderAsMold: false,
      }),
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, options = {}) => {
        const requestUrl = String(url);
        if (requestUrl.includes("/api/me/capabilities")) {
          return {
            ok: true,
            json: async () => ({
              role: "user",
              accessTier: "free",
              catalogVersion: 1,
              capabilities: FREE_CAPABILITIES,
            }),
          };
        }
        if (requestUrl.includes("/api/preferences")) {
          return {
            ok: true,
            json: async () => ({
              interfaceLanguage: "en",
              lengthUnit: "mm",
              volumeUnit: "L",
              exists: true,
            }),
          };
        }
        if (requestUrl.includes("/calculate-wood")) {
          return calculateWoodMock(url, options);
        }
        return { ok: true, json: async () => ({}) };
      }),
    );

    const ref = createRef();
    const snapshot = buildWoodWorkflowSnapshot({
      ui: { selectedMode: "edit" },
      woodBoundaryMode: {
        moldBoundaryPoints: fourPoints(),
        woodBoundaryPolygons: [fourPoints()],
        cavities: [
          {
            name: "Cavity 1",
            points: threePoints(),
            depthMm: "5",
          },
        ],
        mainResinDepthMm: "10",
      },
    });

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );
    await restoreWoodWorkflow(ref, snapshot);

    await act(async () => {
      screen.getByRole("button", { name: "Calculate Resin Volume" }).click();
    });

    await waitFor(() => {
      expect(calculateWoodMock).toHaveBeenCalled();
    });
  });

  it("restricts premium planning tools for new free wood projects", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();
    const snapshot = buildWoodWorkflowSnapshot({
      ui: { selectedMode: "wood" },
      woodBoundaryMode: {
        moldBoundaryPoints: fourPoints(),
        woodBoundaryPolygons: [fourPoints()],
        mainResinDepthMm: "10",
      },
      result: {
        calculationType: "wood",
        volumeLiters: 2.5,
        recommendedVolumeLiters: 2.75,
        safetyMarginPercent: 10,
        moldAreaCm2: 100,
        woodAreaCm2: 20,
        woodIslandCount: 1,
        mainResinAreaCm2: 80,
        mainVolumeLiters: 2,
        cavityAreaCm2: 0,
        mainPourDepthMm: 10,
        useImageBorderAsMold: false,
      },
    });

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );
    await restoreWoodWorkflow(ref, snapshot);

    expect(screen.queryByText(/First Fill Seal Coat Calculator/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export PDF/i })).toBeDisabled();
  });

  it("initializes new subscriber projects in wood mode without polygon limits", async () => {
    mockCapabilitiesFetch(SUBSCRIBER_CAPABILITIES);
    const ref = createRef();
    const snapshot = buildWoodWorkflowSnapshot({
      ui: { selectedMode: "mold" },
      woodBoundaryMode: { moldBoundaryPoints: fourPoints() },
    });

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities />,
    );
    await restoreWoodWorkflow(ref, snapshot);
    await clickCanvas();

    expect(screen.queryByText(/limited to 4 points/i)).not.toBeInTheDocument();
  });

  it("preserves persisted wood mode for established sessions", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities={false} />,
    );

    await restoreSnapshot(ref, VALID_CALCULATOR_SNAPSHOT);

    await waitFor(() => {
      expect(ref.current.getProjectSnapshot().ui.calculationMode).toBe("wood");
    });
  });

  it("keeps premium planning tools available for established wood projects on free accounts", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const ref = createRef();
    const snapshot = {
      ...VALID_CALCULATOR_SNAPSHOT,
      result: {
        calculationType: "wood",
        volumeLiters: 2.5,
        recommendedVolumeLiters: 2.75,
        safetyMarginPercent: 10,
        moldAreaCm2: 100,
        woodAreaCm2: 20,
        woodIslandCount: 1,
        mainResinAreaCm2: 80,
        mainVolumeLiters: 2,
        cavityAreaCm2: 0,
        mainPourDepthMm: 10,
        useImageBorderAsMold: false,
      },
    };

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities={false} />,
    );
    await restoreSnapshot(ref, snapshot);

    await waitFor(() => {
      expect(screen.getByText(/Optional Pour Planning Tools/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Export PDF/i })).not.toBeDisabled();
  });

  it("still supports opening and calculating existing standard-mode projects", async () => {
    mockCapabilitiesFetch(FREE_CAPABILITIES);
    const calculateMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        calculationType: "standard",
        areaCm2: 100,
        volumeLiters: 1.2,
        recommendedVolumeLiters: 1.32,
        safetyMarginPercent: 10,
      }),
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, options = {}) => {
        const requestUrl = String(url);
        if (requestUrl.includes("/api/me/capabilities")) {
          return {
            ok: true,
            json: async () => ({
              role: "user",
              accessTier: "free",
              catalogVersion: 1,
              capabilities: FREE_CAPABILITIES,
            }),
          };
        }
        if (requestUrl.includes("/api/preferences")) {
          return {
            ok: true,
            json: async () => ({
              interfaceLanguage: "en",
              lengthUnit: "mm",
              volumeUnit: "L",
              exists: true,
            }),
          };
        }
        if (requestUrl.includes("/calculate")) {
          return calculateMock(url, options);
        }
        return { ok: true, json: async () => ({}) };
      }),
    );

    const ref = createRef();
    const snapshot = {
      ...VALID_CALCULATOR_SNAPSHOT,
      ui: {
        calculationMode: "standard",
        selectedMode: "polygon",
        measurementsComplete: true,
        rotationDeg: 0,
        zoomFactor: 1,
        selectedShape: null,
      },
      standardResinArea: {
        polygonPoints: threePoints(),
        resinDepthMm: "10",
      },
      result: null,
      calibration: VALID_CALCULATOR_SNAPSHOT.calibration,
    };

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities={false} />,
    );
    await restoreSnapshot(ref, snapshot);

    expect(screen.getByRole("button", { name: "Polygon Mode" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish Area" })).not.toBeInTheDocument();

    await act(async () => {
      screen.getByRole("button", { name: "Calculate" }).click();
    });

    await waitFor(() => {
      expect(calculateMock).toHaveBeenCalled();
    });
  });
});
