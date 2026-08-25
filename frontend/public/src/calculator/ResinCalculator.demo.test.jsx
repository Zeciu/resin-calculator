import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResinCalculator from "./ResinCalculator.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";
import {
  DEMO_CALCULATE_FIRST_FILL_PATH,
  DEMO_CALCULATE_POUR_LAYERS_PATH,
  DEMO_CALCULATE_WOOD_PATH,
} from "../demo/demoConstants.js";

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

function buildCompletedSnapshot() {
  return {
    ...VALID_CALCULATOR_SNAPSHOT,
    calibration: {
      referenceMeasurements: [
        {
          knownLengthCm: 10,
          calibrationPoints: [
            { x: 5, y: 50 },
            { x: 5, y: 80 },
          ],
        },
      ],
    },
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
      moldBoundaryPoints: MOLD,
      woodBoundaryPolygons: [WOOD],
      cavities: [{ name: "Cavity 1", points: CAVITY, depthMm: "12" }],
      cavityDepthsMm: ["12"],
      mainResinDepthMm: "20",
    },
    result: WOOD_RESULT,
    projectNotes:
      "Public HFZWood demo project. Geometry can be edited in this session: Reset Demo restores the original.",
  };
}

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
    expect(document.querySelector("canvas")).toBeTruthy();
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

const FIRST_FILL_RESPONSE = { volumeLiters: 0.048 };
const POUR_LAYERS_RESPONSE = {
  layerCount: 3,
  rows: [
    {
      label: "Pour 1 — First Fill Seal Coat",
      type: "firstFill",
      thicknessMm: 3,
      volumeLiters: 0.048,
      recommendedVolumeLiters: 0.0528,
    },
    {
      label: "Pour 2",
      type: "mainPour",
      thicknessMm: 8.5,
      volumeLiters: 0.136,
      recommendedVolumeLiters: 0.1496,
    },
    {
      label: "Pour 3",
      type: "mainPour",
      thicknessMm: 8.5,
      volumeLiters: 0.136,
      recommendedVolumeLiters: 0.1496,
    },
  ],
};

function suffixFor(input) {
  return input.closest(".length-unit-input")?.querySelector("[data-testid='length-unit-suffix']");
}

const WOOD_CALC_RESPONSE = {
  calculationType: "wood",
  volumeLiters: 4.2,
  recommendedVolumeLiters: 4.62,
  safetyMarginPercent: 10,
  moldAreaCm2: 200,
  woodAreaCm2: 40,
  woodIslandCount: 2,
  mainResinAreaCm2: 160,
  mainVolumeLiters: 3.2,
  cavityAreaCm2: 8,
  mainPourDepthMm: 20,
  useImageBorderAsMold: false,
};

describe("ResinCalculator demoMode", () => {
  let restoreImage;

  beforeEach(() => {
    restoreImage = installImageMock();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        const requestUrl = String(url);
        if (
          requestUrl.includes(DEMO_CALCULATE_WOOD_PATH) ||
          requestUrl.endsWith("/calculate-wood")
        ) {
          return {
            ok: true,
            json: async () => WOOD_CALC_RESPONSE,
          };
        }
        if (
          requestUrl.includes(DEMO_CALCULATE_FIRST_FILL_PATH) ||
          requestUrl.endsWith("/calculate-first-fill")
        ) {
          return {
            ok: true,
            json: async () => FIRST_FILL_RESPONSE,
          };
        }
        if (
          requestUrl.includes(DEMO_CALCULATE_POUR_LAYERS_PATH) ||
          requestUrl.endsWith("/calculate-pour-layers")
        ) {
          return {
            ok: true,
            json: async () => POUR_LAYERS_RESPONSE,
          };
        }
        return { ok: false, status: 404, json: async () => ({ detail: "Not found" }) };
      }),
    );
  });

  afterEach(() => {
    restoreImage();
    vi.unstubAllGlobals();
  });

  it("starts in Modify Mode and keeps persistence restrictions while showing calculator planning tools", async () => {
    const ref = createRef();
    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        demoMode
        initialInteractionMode="modify"
        enforceAccountCapabilities={false}
      />,
    );

    await restoreSnapshot(ref, buildCompletedSnapshot());

    await waitFor(() => {
      expect(document.querySelector(".modify-mode-badge")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /^Modify this project$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Choose file|Photo uploaded/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save Project/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save As/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Update Existing/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export PDF/i })).toBeDisabled();
    expect(screen.getByLabelText(/Optional Pour Planning Tools/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "First Fill Seal Coat Calculator", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pour Layer Planning", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Detailed Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Advanced Details")).toBeInTheDocument();
    expect(document.querySelector("input[type='file']")).toBeNull();
  });

  it("overlays a localized demo project note instead of snapshot developer copy", async () => {
    const ref = createRef();
    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        demoMode
        demoProjectNote="This is an HFZWood demo project. You can modify the geometry."
        initialInteractionMode="modify"
        enforceAccountCapabilities={false}
      />,
    );

    await restoreSnapshot(ref, buildCompletedSnapshot());

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("This is an HFZWood demo project. You can modify the geometry."),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByDisplayValue(/Public HFZWood demo project\. Geometry can be edited/i),
    ).not.toBeInTheDocument();
  });

  it("selects reference, formwork, wood, and cavity geometry in demo Modify Mode", async () => {
    const ref = createRef();
    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        demoMode
        initialInteractionMode="modify"
        enforceAccountCapabilities={false}
      />,
    );

    await restoreSnapshot(ref, buildCompletedSnapshot());

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
  });

  it("sends wood calculation to the public demo endpoint without auth headers", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        demoMode
        initialInteractionMode="modify"
      />,
    );

    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /Calculate Resin Volume/i }));

    expect(fetch).toHaveBeenCalledWith(
      DEMO_CALCULATE_WOOD_PATH,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(fetch).not.toHaveBeenCalledWith("/calculate-wood", expect.anything());
  });

  it("keeps authenticated calculator endpoints in normal calculator mode", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );

    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));
    await user.click(screen.getByRole("button", { name: /Calculate Resin Volume/i }));

    const firstFillInput = screen.getByRole("spinbutton", { name: /First Fill Seal Coat Thickness/i });
    await user.clear(firstFillInput);
    await user.type(firstFillInput, "3");
    await user.click(screen.getByRole("button", { name: /Calculate First Fill Volume/i }));

    const maxPourInput = screen.getByRole("spinbutton", { name: /Maximum Pour Thickness Per Layer/i });
    await user.clear(maxPourInput);
    await user.type(maxPourInput, "5");
    await user.click(screen.getByRole("button", { name: /Calculate Pour Plan/i }));

    expect(fetch).toHaveBeenCalledWith("/calculate-wood", expect.objectContaining({ method: "POST" }));
    expect(fetch).toHaveBeenCalledWith(
      "/calculate-first-fill",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/calculate-pour-layers",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetch).not.toHaveBeenCalledWith(DEMO_CALCULATE_WOOD_PATH, expect.anything());
    expect(fetch).not.toHaveBeenCalledWith(DEMO_CALCULATE_FIRST_FILL_PATH, expect.anything());
    expect(fetch).not.toHaveBeenCalledWith(DEMO_CALCULATE_POUR_LAYERS_PATH, expect.anything());
  });

  it("calculates First Fill through the public demo endpoint and renders the result", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        demoMode
        initialInteractionMode="modify"
      />,
    );

    await restoreSnapshot(ref, buildCompletedSnapshot());
    const firstFillInput = screen.getByRole("spinbutton", { name: /First Fill Seal Coat Thickness/i });
    expect(suffixFor(firstFillInput)).toHaveTextContent("mm");
    await user.clear(firstFillInput);
    await user.type(firstFillInput, "3");
    await user.click(screen.getByRole("button", { name: /Calculate First Fill Volume/i }));

    expect(fetch).toHaveBeenCalledWith(
      DEMO_CALCULATE_FIRST_FILL_PATH,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(fetch).not.toHaveBeenCalledWith("/calculate-first-fill", expect.anything());
    expect(screen.getByText(/First Fill Seal Coat Volume:/i)).toBeInTheDocument();
    expect(screen.getByText(/0.048 L/)).toBeInTheDocument();
  });

  it("calculates Pour Planning through the public demo endpoint and renders layer results", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        demoMode
        initialInteractionMode="modify"
      />,
    );

    await restoreSnapshot(ref, buildCompletedSnapshot());
    const maxPourInput = screen.getByRole("spinbutton", { name: /Maximum Pour Thickness Per Layer/i });
    expect(suffixFor(maxPourInput)).toHaveTextContent("mm");
    await user.clear(maxPourInput);
    await user.type(maxPourInput, "5");
    await user.click(screen.getByRole("button", { name: /Calculate Pour Plan/i }));

    expect(fetch).toHaveBeenCalledWith(
      DEMO_CALCULATE_POUR_LAYERS_PATH,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(fetch).not.toHaveBeenCalledWith("/calculate-pour-layers", expect.anything());
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Pour 1 — First Fill Seal Coat")).toBeInTheDocument();
    expect(screen.getByText("Pour 2")).toBeInTheDocument();
    expect(screen.getByText("Pour 3")).toBeInTheDocument();
    expect(screen.getAllByText("0.136 L").length).toBeGreaterThan(0);
  });
});
