import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import ResinCalculator from "./ResinCalculator.jsx";
import { VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";
import { TestProviders } from "../test/TestProviders.jsx";
import { FREE_CAPABILITIES } from "../capabilities/capabilityDefaults.js";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { DEVICE_PREFERENCES_STORAGE_KEY } from "../preferences/devicePreferencesStorage.js";

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

const WOOD_RESULT = {
  calculationType: "wood",
  volumeLiters: 2.5,
  recommendedVolumeLiters: 2.75,
  safetyMarginPercent: 10,
  moldAreaCm2: 100,
  woodAreaCm2: 20,
  woodIslandCount: 1,
  mainResinAreaCm2: 80,
  mainVolumeLiters: 2,
  cavityAreaCm2: 4,
  mainPourDepthMm: 10,
  useImageBorderAsMold: false,
};

const MOLD = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];
const WOOD = [
  { x: 10, y: 10 },
  { x: 40, y: 10 },
  { x: 40, y: 40 },
  { x: 10, y: 40 },
];
const CAVITY = [
  { x: 60, y: 60 },
  { x: 90, y: 60 },
  { x: 90, y: 90 },
  { x: 60, y: 90 },
];

function buildCompletedSnapshot(overrides = {}) {
  const {
    ui: uiOverrides = {},
    woodBoundaryMode: woodOverrides = {},
    calibration: calibrationOverrides,
    result = WOOD_RESULT,
    ...rest
  } = overrides;

  return {
    ...VALID_CALCULATOR_SNAPSHOT,
    ...rest,
    calibration: calibrationOverrides ?? {
      referenceMeasurements: [
        {
          knownLengthCm: 10,
          calibrationPoints: [
            { x: 5, y: 50 },
            { x: 5, y: 80 },
          ],
        },
        {
          knownLengthCm: 12,
          calibrationPoints: [
            { x: 70, y: 5 },
            { x: 95, y: 5 },
          ],
        },
      ],
    },
    ui: {
      calculationMode: "wood",
      selectedMode: "edit",
      rotationDeg: 0,
      zoomFactor: 1,
      selectedShape: null,
      measurementsComplete: true,
      cavitiesComplete: true,
      ...uiOverrides,
    },
    woodBoundaryMode: {
      ...VALID_CALCULATOR_SNAPSHOT.woodBoundaryMode,
      useImageBorderAsMold: false,
      moldBoundaryPoints: MOLD,
      woodBoundaryPolygons: [WOOD],
      currentWoodBoundaryPoints: [],
      cavities: [
        {
          name: "Cavity 1",
          points: CAVITY,
          depthMm: "12",
        },
      ],
      cavityDepthsMm: ["12"],
      currentCavityPoints: [],
      mainResinDepthMm: "20",
      ...woodOverrides,
    },
    result,
  };
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

function renderCalculator(ui) {
  return render(<TestProviders>{ui}</TestProviders>);
}

async function restoreSnapshot(ref, snapshot) {
  await act(async () => {
    ref.current.restoreProjectSnapshot(snapshot);
  });
  await waitFor(() => {
    expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
  });
}

function clickCanvasAt(x, y) {
  const canvas = document.querySelector("canvas");
  expect(canvas).toBeTruthy();
  canvas.width = 200;
  canvas.height = 200;
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 200,
    height: 200,
    right: 200,
    bottom: 200,
    x: 0,
    y: 0,
    toJSON() {},
  });
  fireEvent.click(canvas, { clientX: x, clientY: y, bubbles: true });
}

function mouseCanvas(type, x, y) {
  const canvas = document.querySelector("canvas");
  canvas.width = 200;
  canvas.height = 200;
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 200,
    height: 200,
    right: 200,
    bottom: 200,
    x: 0,
    y: 0,
    toJSON() {},
  });
  fireEvent.mouseDown(canvas, { clientX: x, clientY: y, bubbles: true });
  if (type === "drag") {
    fireEvent.mouseMove(canvas, { clientX: x + 8, clientY: y + 6, bubbles: true });
    fireEvent.mouseUp(canvas, { clientX: x + 8, clientY: y + 6, bubbles: true });
  }
}

describe("ResinCalculator interaction modes", () => {
  let restoreImage;
  let restoreClientSize;

  beforeEach(() => {
    restoreImage = installImageMock();
    seedDevicePreferences({ lengthUnit: "cm" });
    const widthDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
    const heightDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 200;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return 200;
      },
    });
    restoreClientSize = () => {
      if (widthDesc) Object.defineProperty(HTMLElement.prototype, "clientWidth", widthDesc);
      if (heightDesc) Object.defineProperty(HTMLElement.prototype, "clientHeight", heightDesc);
    };
  });

  afterEach(() => {
    restoreImage();
    restoreClientSize();
    localStorage.removeItem(DEVICE_PREFERENCES_STORAGE_KEY);
  });

  it("keeps Done with Wood advancing to Cavities in guided build mode", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    const snapshot = buildCompletedSnapshot({
      result: null,
      ui: {
        selectedMode: "wood",
        cavitiesComplete: false,
      },
      woodBoundaryMode: {
        woodBoundaryPolygons: [WOOD],
        currentWoodBoundaryPoints: [],
        cavities: [],
        cavityDepthsMm: [],
      },
    });
    // Force a mid-wood guided state via restore flags: measurements+mold complete, wood not.
    snapshot.ui.measurementsComplete = true;
    snapshot.woodBoundaryMode.moldBoundaryPoints = MOLD;

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, snapshot);

    // Restore infers wood complete from polygons. Re-open the wood stage like build.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Add Wood Island/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Add Wood Island/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Done with Wood/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Done with Wood/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Finish Cavities/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/Modifică acest proiect|Modify this project/i)).not.toBeInTheDocument();
  });

  it("does not mutate geometry when entering Modify Project", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    const snapshot = buildCompletedSnapshot();
    await restoreSnapshot(ref, snapshot);
    const before = ref.current.getProjectSnapshot();

    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));

    const after = ref.current.getProjectSnapshot();
    expect(after.woodBoundaryMode.woodBoundaryPolygons).toEqual(
      before.woodBoundaryMode.woodBoundaryPolygons,
    );
    expect(after.calibration.referenceMeasurements).toEqual(
      before.calibration.referenceMeasurements,
    );
    expect(after.woodBoundaryMode.moldBoundaryPoints).toEqual(
      before.woodBoundaryMode.moldBoundaryPoints,
    );
    expect(screen.getByText(/Modify this project/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Done with Wood/i })).not.toBeInTheDocument();
  });

  it("keeps Complete Current Island in Modify Mode instead of advancing to Cavities", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));
    await user.click(screen.getByRole("button", { name: /Add Wood Island/i }));

    clickCanvasAt(12, 70);
    clickCanvasAt(28, 70);
    clickCanvasAt(28, 88);
    await user.click(screen.getByRole("button", { name: /Complete Current Island/i }));

    expect(screen.queryByRole("button", { name: /Done with Wood/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Finish Cavities/i })).not.toBeInTheDocument();
    expect(ref.current.getProjectSnapshot().woodBoundaryMode.woodBoundaryPolygons).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Add Wood Island/i }).length).toBeGreaterThan(0);
  });

  it("finishes a cavity in Modify Mode without leaving modify controls", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));
    await user.click(screen.getByRole("button", { name: /Add Resin Cavity/i }));
    clickCanvasAt(70, 20);
    clickCanvasAt(90, 20);
    clickCanvasAt(90, 35);
    await user.click(screen.getByRole("button", { name: /Finish Cavity/i }));

    expect(ref.current.getProjectSnapshot().woodBoundaryMode.cavities).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Finish Cavities/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Resin Cavity/i })).toBeInTheDocument();
  });

  it("edits formwork in Modify Mode without reopening the wizard", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));
    await user.click(screen.getByRole("button", { name: /Edit Mold Boundary/i }));

    expect(screen.queryByRole("button", { name: /Finish Mold/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Wood Island/i })).toBeInTheDocument();
  });

  it("lets the user delete one reference and add another without clearing the set", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));

    await user.click(screen.getByText(/Reference 1/i));
    await user.click(
      screen.getByRole("button", { name: /Delete Selected Reference Measurement/i }),
    );

    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements).toHaveLength(1);
    expect(screen.getByText(/Reference 1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Reference Measurement/i })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /Add Reference Measurement/i }));
    clickCanvasAt(48, 48);
    clickCanvasAt(62, 48);
    const lengthInput = screen.getByLabelText(/Reference length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, "8");
    await user.click(screen.getByRole("button", { name: /Save Reference Measurement/i }));

    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements).toHaveLength(2);
    expect(ref.current.getProjectSnapshot().result).toEqual(WOOD_RESULT);
    expect(screen.getByText(/Results need recalculation/i)).toBeInTheDocument();
  });

  it("edits a selected reference length and invalidates results", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));
    await user.click(screen.getByText(/Reference 2/i));

    const lengthInput = screen.getByLabelText(/Reference length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, "15");

    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements[1].knownLengthCm).toBe(
      15,
    );
    expect(ref.current.getProjectSnapshot().result).toEqual(WOOD_RESULT);
    expect(screen.getByText(/Results need recalculation/i)).toBeInTheDocument();
  });

  it("selects cavity, wood, mold, and reference geometry from the canvas", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));

    clickCanvasAt(75, 75);
    expect(ref.current.getProjectSnapshot().ui.selectedShape).toEqual({
      type: "cavity",
      index: 0,
    });

    clickCanvasAt(25, 25);
    expect(ref.current.getProjectSnapshot().ui.selectedShape).toEqual({
      type: "wood",
      index: 0,
    });

    clickCanvasAt(50, 50);
    expect(ref.current.getProjectSnapshot().ui.selectedShape).toEqual({ type: "mold" });

    clickCanvasAt(5, 65);
    expect(ref.current.getProjectSnapshot().ui.selectedShape).toEqual({
      type: "reference",
      index: 0,
    });

    clickCanvasAt(10, 10);
    expect(ref.current.getProjectSnapshot().ui.selectedShape).toEqual({
      type: "wood",
      index: 0,
    });

    clickCanvasAt(25, 10);
    expect(ref.current.getProjectSnapshot().ui.selectedShape).toEqual({
      type: "wood",
      index: 0,
    });
  });

  it("keeps an in-progress wood draft drawing instead of selecting existing geometry", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));
    await user.click(screen.getByRole("button", { name: /Add Wood Island/i }));

    clickCanvasAt(25, 25);
    expect(ref.current.getProjectSnapshot().woodBoundaryMode.currentWoodBoundaryPoints).toEqual([
      expect.objectContaining({ x: 25, y: 25 }),
    ]);
    expect(ref.current.getProjectSnapshot().ui.selectedShape).toBeNull();
  });

  it("drags a directly selected wood vertex without changing other geometry", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));

    mouseCanvas("drag", 10, 10);
    const snapshot = ref.current.getProjectSnapshot();
    expect(snapshot.woodBoundaryMode.woodBoundaryPolygons[0][0]).toEqual({ x: 18, y: 16 });
    expect(snapshot.woodBoundaryMode.moldBoundaryPoints[0]).toEqual({ x: 0, y: 0 });
    expect(snapshot.woodBoundaryMode.cavities[0].points[0]).toEqual({ x: 60, y: 60 });
    expect(screen.getByText(/Results need recalculation/i)).toBeInTheDocument();
  });

  it("reopens a calculated zero-cavity project without forcing cavity construction", async () => {
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        ui: { cavitiesComplete: undefined, selectedMode: "edit" },
        woodBoundaryMode: { cavities: [], cavityDepthsMm: [] },
        result: { ...WOOD_RESULT, cavityAreaCm2: 0 },
      }),
    );

    expect(screen.queryByRole("button", { name: /Finish Cavities/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Modify this project$/i })).toBeInTheDocument();
    expect(ref.current.getProjectSnapshot().ui.cavitiesComplete).toBe(true);
  });

  it("still enforces free-tier polygon point limits in Modify Mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (String(url).includes("/api/me/capabilities")) {
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
        return { ok: true, json: async () => ({}) };
      }),
    );
    sessionStorage.setItem(
      "hfzwood.mockAuth",
      JSON.stringify({
        user: { id: "stub-user", email: "user@example.com", username: "user", role: "user" },
      }),
    );

    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        enforceAccountCapabilities
      />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));
    await user.click(screen.getByRole("button", { name: /Add Wood Island/i }));
    clickCanvasAt(12, 70);
    clickCanvasAt(22, 70);
    clickCanvasAt(22, 80);
    clickCanvasAt(12, 80);
    clickCanvasAt(16, 75);

    await waitFor(() => {
      expect(screen.getByText(/wood island is limited to 4 points/i)).toBeInTheDocument();
    });
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });
});
