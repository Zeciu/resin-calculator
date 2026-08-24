import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResinCalculator from "./ResinCalculator.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import {
  DEMO_CALCULATE_FIRST_FILL_PATH,
  DEMO_CALCULATE_POUR_LAYERS_PATH,
  DEMO_CALCULATE_WOOD_PATH,
} from "../demo/demoConstants.js";
import { mapCalculatorSnapshotToCanonicalV2 } from "../project/mapSnapshotToCanonicalV2.js";
import { mapCanonicalV2ToCalculatorSnapshot } from "../project/mapCanonicalV2ToCalculatorSnapshot.js";
import {
  volumeLitersFromAreaCm2AndThicknessMm,
  woodPlanningSurfaceAreaCm2,
} from "./planningResultState.js";

const pdfTexts = [];

vi.mock("jspdf", () => {
  class MockJsPDF {
    constructor() {
      this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    }
    setFont() {}
    setFontSize() {}
    addFileToVFS() {}
    addFont() {}
    text(value) {
      const lines = Array.isArray(value) ? value : [value];
      lines.forEach((line) => pdfTexts.push(String(line)));
    }
    splitTextToSize(text) {
      return [String(text)];
    }
    addImage() {}
    addPage() {}
    save() {}
  }
  return { jsPDF: MockJsPDF };
});

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
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,AAAA");

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = vi.fn();

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

const VERTICAL_REF = {
  knownLengthCm: 10,
  calibrationPoints: [
    { x: 5, y: 50 },
    { x: 5, y: 80 },
  ],
};
const HORIZONTAL_REF = {
  knownLengthCm: 12,
  calibrationPoints: [
    { x: 70, y: 5 },
    { x: 95, y: 5 },
  ],
};

const GENERATION_A = {
  calculationType: "wood",
  volumeLiters: 1.12,
  recommendedVolumeLiters: 1.232,
  safetyMarginPercent: 10,
  moldAreaCm2: 600,
  woodAreaCm2: 200,
  woodIslandCount: 1,
  mainResinAreaCm2: 400,
  mainVolumeLiters: 1,
  cavityAreaCm2: 100,
  cavities: [{ name: "Cavity 1", areaCm2: 100, depthMm: 12, volumeLiters: 0.12 }],
  mainPourDepthMm: 25,
  useImageBorderAsMold: false,
};

const ZERO_WOOD_RESULT = {
  calculationType: "wood",
  volumeLiters: 1.5,
  recommendedVolumeLiters: 1.65,
  safetyMarginPercent: 10,
  moldAreaCm2: 600,
  woodAreaCm2: 0,
  woodIslandCount: 0,
  mainResinAreaCm2: 600,
  mainVolumeLiters: 1.5,
  cavityAreaCm2: 0,
  cavities: [],
  mainPourDepthMm: 25,
  useImageBorderAsMold: false,
};

const FIRST_FILL_THICKNESS_MM = 3;
const GENERATION_A_FIRST_FILL = volumeLitersFromAreaCm2AndThicknessMm(
  woodPlanningSurfaceAreaCm2(GENERATION_A),
  FIRST_FILL_THICKNESS_MM,
);

function litersPattern(value) {
  return new RegExp(`${Number(value).toFixed(3)} L`);
}

function expectLitersAbsent(value) {
  expect(screen.queryAllByText(litersPattern(value))).toHaveLength(0);
}

function firstFillPourRow(volumeLiters, thicknessMm = FIRST_FILL_THICKNESS_MM) {
  return {
    label: "Pour 1 — First Fill Seal Coat",
    type: "firstFill",
    thicknessMm,
    volumeLiters,
    recommendedVolumeLiters: volumeLiters * 1.1,
  };
}

function remainingPourRow(volumeLiters, thicknessMm, index = 2) {
  return {
    label: `Pour ${index}`,
    type: "mainPour",
    thicknessMm,
    volumeLiters,
    recommendedVolumeLiters: volumeLiters * 1.1,
  };
}

function buildCompletedSnapshot(overrides = {}) {
  const {
    ui: uiOverrides = {},
    woodBoundaryMode: woodOverrides = {},
    calibration: calibrationOverrides,
    result = GENERATION_A,
    ...rest
  } = overrides;
  return {
    ...VALID_CALCULATOR_SNAPSHOT,
    ...rest,
    calibration: calibrationOverrides ?? {
      referenceMeasurements: [VERTICAL_REF, HORIZONTAL_REF],
    },
    ui: {
      calculationMode: "wood",
      selectedMode: "edit",
      rotationDeg: 0,
      zoomFactor: 1,
      selectedShape: null,
      measurementsComplete: true,
      woodBoundaryComplete: true,
      cavitiesComplete: true,
      ...uiOverrides,
    },
    woodBoundaryMode: {
      ...VALID_CALCULATOR_SNAPSHOT.woodBoundaryMode,
      useImageBorderAsMold: false,
      moldBoundaryPoints: MOLD,
      woodBoundaryPolygons: [WOOD],
      currentWoodBoundaryPoints: [],
      cavities: [{ name: "Cavity 1", points: CAVITY, depthMm: "12" }],
      cavityDepthsMm: ["12"],
      currentCavityPoints: [],
      mainResinDepthMm: "25",
      maxPourThicknessMm: "10",
      firstFillThicknessMm: String(FIRST_FILL_THICKNESS_MM),
      firstFillRecommendationMode: "30",
      ...woodOverrides,
    },
    result,
  };
}

function buildZeroWoodGuidedSnapshot() {
  return buildCompletedSnapshot({
    result: null,
    ui: {
      selectedMode: "wood",
      woodBoundaryComplete: false,
      cavitiesComplete: false,
    },
    woodBoundaryMode: {
      woodBoundaryPolygons: [],
      currentWoodBoundaryPoints: [],
      cavities: [],
      cavityDepthsMm: [],
    },
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

function woodCalculateCalls() {
  return fetch.mock.calls.filter(([url]) => String(url).includes("calculate-wood"));
}

function lastWoodPayload() {
  const call = [...woodCalculateCalls()].at(-1);
  return call?.[1]?.body ? JSON.parse(call[1].body) : null;
}

function installCalculatorFetchMock() {
  const originalFetch = global.fetch;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/api/me/capabilities")) {
        return originalFetch(url, options);
      }
      const body = options.body ? JSON.parse(options.body) : {};
      if (
        requestUrl.includes(DEMO_CALCULATE_WOOD_PATH) ||
        requestUrl.endsWith("/calculate-wood")
      ) {
        if (!Array.isArray(body.referenceMeasurements) || body.referenceMeasurements.length === 0) {
          return {
            ok: false,
            status: 400,
            json: async () => ({ error: "At least 1 reference measurement is required." }),
          };
        }
        const polygons = Array.isArray(body.woodBoundaryPolygons)
          ? body.woodBoundaryPolygons
          : [];
        return {
          ok: true,
          json: async () => (polygons.length === 0 ? ZERO_WOOD_RESULT : GENERATION_A),
        };
      }
      if (
        requestUrl.includes(DEMO_CALCULATE_FIRST_FILL_PATH) ||
        requestUrl.endsWith("/calculate-first-fill")
      ) {
        return {
          ok: true,
          json: async () => ({
            volumeLiters: volumeLitersFromAreaCm2AndThicknessMm(
              body.resinSurfaceAreaCm2,
              body.firstFillThicknessMm,
            ),
          }),
        };
      }
      if (
        requestUrl.includes(DEMO_CALCULATE_POUR_LAYERS_PATH) ||
        requestUrl.endsWith("/calculate-pour-layers")
      ) {
        return { ok: true, json: async () => ({ rows: [], layerCount: 0 }) };
      }
      return { ok: false, status: 404, json: async () => ({ detail: "Not found" }) };
    }),
  );
}

async function enterModify(user) {
  await user.click(screen.getByRole("button", { name: /^Modify this project$/i }));
  expect(screen.getByRole("status")).toHaveTextContent(/Modify this project/i);
}

describe("ResinCalculator zero-wood and reference state machine", () => {
  let restoreImage;
  let restoreClientSize;

  beforeEach(() => {
    restoreImage = installImageMock();
    seedDevicePreferences({ lengthUnit: "cm", interfaceLanguage: "en" });
    pdfTexts.length = 0;
    installCalculatorFetchMock();
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
  });

  it("lets Guided Build finish Wood and Cavities with zero items, then Calculate", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildZeroWoodGuidedSnapshot());

    expect(screen.getByRole("button", { name: /Done with Wood/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Calculate Resin Volume/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Done with Wood/i }));
    expect(ref.current.getProjectSnapshot().ui.woodBoundaryComplete).toBe(true);
    expect(ref.current.getProjectSnapshot().woodBoundaryMode.woodBoundaryPolygons).toEqual([]);

    await user.click(screen.getByRole("button", { name: /Finish Cavities/i }));
    expect(ref.current.getProjectSnapshot().ui.cavitiesComplete).toBe(true);
    expect(screen.getByRole("button", { name: /Calculate Resin Volume/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Calculate Resin Volume/i }));
    await waitFor(() => {
      expect(screen.getByText(/1\.50 L/)).toBeInTheDocument();
    });
    expect(lastWoodPayload().woodBoundaryPolygons).toEqual([]);
    await user.click(screen.getByText(/Detailed Breakdown/i));
    expect(screen.getAllByText(/Wood islands:\s*0/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Total wood island area:\s*0/i).length).toBeGreaterThan(0);
  });

  it("still blocks Done with Wood while a draft island is unfinished", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildZeroWoodGuidedSnapshot());
    await user.click(screen.getByRole("button", { name: /Add Wood Island/i }));
    clickCanvasAt(20, 20);
    await user.click(screen.getByRole("button", { name: /Done with Wood/i }));

    expect(screen.getByText(/Complete the current wood island/i)).toBeInTheDocument();
    expect(ref.current.getProjectSnapshot().ui.woodBoundaryComplete).toBe(false);
    expect(screen.queryByRole("button", { name: /Finish Cavities/i })).not.toBeInTheDocument();
  });

  it("does not offer Calculate while the Wood stage is unfinished", async () => {
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        result: null,
        ui: { woodBoundaryComplete: false, cavitiesComplete: true },
        woodBoundaryMode: { woodBoundaryPolygons: [], cavities: [], cavityDepthsMm: [] },
      }),
    );

    expect(screen.queryByRole("button", { name: /Calculate Resin Volume/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Done with Wood/i })).toBeInTheDocument();
  });

  it("round-trips woodBoundaryComplete=true with zero islands through snapshot restore", async () => {
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        ui: { woodBoundaryComplete: true, cavitiesComplete: true },
        woodBoundaryMode: { woodBoundaryPolygons: [], cavities: [], cavityDepthsMm: [] },
        result: ZERO_WOOD_RESULT,
      }),
    );

    const snap = ref.current.getProjectSnapshot();
    expect(snap.ui.woodBoundaryComplete).toBe(true);
    expect(snap.woodBoundaryMode.woodBoundaryPolygons).toEqual([]);
    expect(screen.getByRole("button", { name: /Calculate Resin Volume/i })).toBeInTheDocument();

    const envelope = mapCalculatorSnapshotToCanonicalV2(snap, { projectName: "Zero Wood" });
    const mapped = mapCanonicalV2ToCalculatorSnapshot(envelope);
    expect(mapped.ui.woodBoundaryComplete).toBe(true);
    expect(mapped.woodBoundaryMode.woodBoundaryPolygons).toEqual([]);

    const second = createRef();
    renderCalculator(
      <ResinCalculator ref={second} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(second, snap);
    expect(second.current.getProjectSnapshot().ui.woodBoundaryComplete).toBe(true);
    expect(second.current.getProjectSnapshot().woodBoundaryMode.woodBoundaryPolygons).toEqual([]);
  });

  it("infers wood complete from islands in legacy files without the persisted flag", async () => {
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        ui: { woodBoundaryComplete: undefined, cavitiesComplete: true },
      }),
    );

    expect(ref.current.getProjectSnapshot().ui.woodBoundaryComplete).toBe(true);
    expect(screen.getByRole("button", { name: /^Modify this project$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Done with Wood/i })).not.toBeInTheDocument();
  });

  it("infers an unfinished zero-wood build when a legacy file has no result", async () => {
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        result: null,
        ui: { woodBoundaryComplete: undefined, cavitiesComplete: false, selectedMode: "wood" },
        woodBoundaryMode: { woodBoundaryPolygons: [], cavities: [], cavityDepthsMm: [] },
      }),
    );

    expect(ref.current.getProjectSnapshot().ui.woodBoundaryComplete).toBe(false);
    expect(screen.getByRole("button", { name: /Done with Wood/i })).toBeInTheDocument();
  });

  it("stays in Modify after deleting the last wood island and keeps Calculate available", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        woodBoundaryMode: {
          firstFillVolumeLiters: GENERATION_A_FIRST_FILL,
          recommendedFirstFillVolumeLiters: GENERATION_A_FIRST_FILL * 1.3,
          pourPlanRows: [
            firstFillPourRow(GENERATION_A_FIRST_FILL),
            remainingPourRow(0.66, 22),
          ],
          recommendedLayerCount: 2,
        },
      }),
    );
    await enterModify(user);

    await user.click(screen.getByRole("button", { name: /Delete Wood Island 1/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/Modify this project/i);
    expect(ref.current.getProjectSnapshot().ui.woodBoundaryComplete).toBe(true);
    expect(ref.current.getProjectSnapshot().woodBoundaryMode.woodBoundaryPolygons).toEqual([]);
    expect(ref.current.getProjectSnapshot().result).toEqual(GENERATION_A);
    expect(screen.getByText(/Results need recalculation/i)).toBeInTheDocument();
    expect(screen.queryByText(/First Fill Seal Coat Volume:/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Calculate Resin Volume/i })).toBeInTheDocument();
    expect(woodCalculateCalls()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /Calculate Resin Volume/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Results need recalculation/i)).not.toBeInTheDocument();
    });
    expect(lastWoodPayload().woodBoundaryPolygons).toEqual([]);
    expect(screen.queryByText(/First Fill Seal Coat Volume:/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("treats Clear Wood Islands in Modify as a valid completed zero-wood stage", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await enterModify(user);
    await user.click(screen.getByRole("button", { name: /Clear Wood Islands/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/Modify this project/i);
    expect(ref.current.getProjectSnapshot().ui.woodBoundaryComplete).toBe(true);
    expect(ref.current.getProjectSnapshot().ui.cavitiesComplete).toBe(true);
    expect(ref.current.getProjectSnapshot().woodBoundaryMode.woodBoundaryPolygons).toEqual([]);
    expect(screen.getByText(/Results need recalculation/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Calculate Resin Volume/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Done with Wood/i })).not.toBeInTheDocument();
  });

  it("keeps a non-zero wood calculation on the existing generation path", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /Calculate Resin Volume/i }));
    await waitFor(() => {
      expect(lastWoodPayload().woodBoundaryPolygons).toHaveLength(1);
    });
    expect(lastWoodPayload().woodBoundaryPolygons[0]).toEqual(WOOD);
    expect(screen.getByText(/1\.12 L/)).toBeInTheDocument();
  });

  it("marks the result outdated after adding a reference and does not auto-calculate", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        woodBoundaryMode: {
          firstFillVolumeLiters: GENERATION_A_FIRST_FILL,
          recommendedFirstFillVolumeLiters: GENERATION_A_FIRST_FILL * 1.3,
          pourPlanRows: [firstFillPourRow(GENERATION_A_FIRST_FILL)],
          recommendedLayerCount: 1,
        },
      }),
    );
    await enterModify(user);
    await user.click(screen.getByRole("button", { name: /Add Reference Measurement/i }));
    clickCanvasAt(48, 48);
    clickCanvasAt(62, 48);
    const lengthInput = screen.getByLabelText(/Reference length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, "8");
    expect(woodCalculateCalls()).toHaveLength(0);
    expect(screen.queryByText(/Results need recalculation/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Save Reference Measurement/i }));
    expect(ref.current.getProjectSnapshot().result).toEqual(GENERATION_A);
    expect(screen.getByText(/Results need recalculation/i)).toBeInTheDocument();
    expect(screen.queryByText(/First Fill Seal Coat Volume:/i)).not.toBeInTheDocument();
    expect(woodCalculateCalls()).toHaveLength(0);
  });

  it("marks the result outdated after editing a reference known length", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await enterModify(user);
    await user.click(screen.getByText(/Reference 2/i));
    const lengthInput = screen.getByLabelText(/Reference length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, "15");

    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements[1].knownLengthCm).toBe(15);
    expect(ref.current.getProjectSnapshot().result).toEqual(GENERATION_A);
    expect(screen.getByText(/Results need recalculation/i)).toBeInTheDocument();
    expect(woodCalculateCalls()).toHaveLength(0);
  });

  it("does not invalidate on selection-only or invalid in-progress length text", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await enterModify(user);
    clickCanvasAt(5, 65);
    expect(ref.current.getProjectSnapshot().ui.selectedShape).toEqual({
      type: "reference",
      index: 0,
    });
    expect(screen.queryByText(/Results need recalculation/i)).not.toBeInTheDocument();

    const lengthInput = screen.getByLabelText(/Reference length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, "abc");
    expect(screen.queryByText(/Results need recalculation/i)).not.toBeInTheDocument();
    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements[0].knownLengthCm).toBe(10);
  });

  it("marks the result outdated after dragging a reference endpoint", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await enterModify(user);
    mouseCanvas("drag", 70, 5);

    const moved = ref.current.getProjectSnapshot().calibration.referenceMeasurements[1]
      .calibrationPoints[0];
    expect(moved).toEqual({ x: 78, y: 11 });
    expect(ref.current.getProjectSnapshot().result).toEqual(GENERATION_A);
    expect(screen.getByText(/Results need recalculation/i)).toBeInTheDocument();
    expect(woodCalculateCalls()).toHaveLength(0);
  });

  it("keeps Calculate available after deleting a non-last reference and requires explicit recalc", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        woodBoundaryMode: {
          firstFillVolumeLiters: GENERATION_A_FIRST_FILL,
          recommendedFirstFillVolumeLiters: GENERATION_A_FIRST_FILL * 1.3,
          pourPlanRows: [firstFillPourRow(GENERATION_A_FIRST_FILL)],
          recommendedLayerCount: 1,
        },
      }),
    );
    await enterModify(user);
    await user.click(screen.getByText(/Reference 2/i));
    await user.click(
      screen.getByRole("button", { name: /Delete Selected Reference Measurement/i }),
    );

    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(/Modify this project/i);
    expect(screen.getByText(/Results need recalculation/i)).toBeInTheDocument();
    expect(screen.queryByText(/First Fill Seal Coat Volume:/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Calculate Resin Volume/i })).toBeInTheDocument();
    expect(woodCalculateCalls()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /Calculate Resin Volume/i }));
    await waitFor(() => {
      expect(lastWoodPayload().referenceMeasurements).toHaveLength(1);
    });
  });

  it("blocks Calculate after deleting the last reference without posting an empty list", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        calibration: { referenceMeasurements: [VERTICAL_REF] },
        woodBoundaryMode: {
          firstFillVolumeLiters: GENERATION_A_FIRST_FILL,
          recommendedFirstFillVolumeLiters: GENERATION_A_FIRST_FILL * 1.3,
          pourPlanRows: [firstFillPourRow(GENERATION_A_FIRST_FILL)],
          recommendedLayerCount: 1,
        },
      }),
    );
    await enterModify(user);
    await user.click(screen.getByText(/Reference 1/i));
    await user.click(
      screen.getByRole("button", { name: /Delete Selected Reference Measurement/i }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(/Modify this project/i);
    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements).toEqual([]);
    expect(screen.getByText(/Add at least one reference measurement/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Calculate Resin Volume/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Reference Measurement/i })).toBeEnabled();
    expect(woodCalculateCalls()).toHaveLength(0);
  });

  it("restores Calculate after a new reference is added following last-reference deletion", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        calibration: { referenceMeasurements: [VERTICAL_REF] },
      }),
    );
    await enterModify(user);
    await user.click(screen.getByText(/Reference 1/i));
    await user.click(
      screen.getByRole("button", { name: /Delete Selected Reference Measurement/i }),
    );

    await user.click(screen.getByRole("button", { name: /Add Reference Measurement/i }));
    clickCanvasAt(48, 48);
    clickCanvasAt(62, 48);
    const lengthInput = screen.getByLabelText(/Reference length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, "8");
    await user.click(screen.getByRole("button", { name: /Save Reference Measurement/i }));

    expect(screen.getByRole("button", { name: /Calculate Resin Volume/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Calculate Resin Volume/i }));
    await waitFor(() => {
      expect(lastWoodPayload().referenceMeasurements).toHaveLength(1);
    });
    expect(lastWoodPayload().referenceMeasurements[0].knownLengthCm).toBe(8);
  });

  it("keeps axis fallback when all references on one orientation are removed", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await enterModify(user);
    await user.click(screen.getByText(/Reference 2/i));
    await user.click(
      screen.getByRole("button", { name: /Delete Selected Reference Measurement/i }),
    );

    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Calculate Resin Volume/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Calculate Resin Volume/i }));
    await waitFor(() => {
      expect(lastWoodPayload().referenceMeasurements).toHaveLength(1);
    });
    const remaining = lastWoodPayload().referenceMeasurements[0].calibrationPoints;
    expect(remaining[0].x).toBe(remaining[1].x);
  });

  it("omits stale First Fill / Pour Planning from PDF after a reference mutation", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        woodBoundaryMode: {
          firstFillVolumeLiters: GENERATION_A_FIRST_FILL,
          recommendedFirstFillVolumeLiters: GENERATION_A_FIRST_FILL * 1.3,
          pourPlanRows: [firstFillPourRow(GENERATION_A_FIRST_FILL)],
          recommendedLayerCount: 1,
        },
      }),
    );
    await enterModify(user);
    await user.click(screen.getByText(/Reference 1/i));
    const lengthInput = screen.getByLabelText(/Reference length/i);
    await user.clear(lengthInput);
    await user.type(lengthInput, "11");

    await user.click(screen.getByRole("button", { name: /Export PDF/i }));
    await waitFor(() => {
      expect(pdfTexts.length).toBeGreaterThan(0);
    });
    const joined = pdfTexts.join("\n");
    expect(joined).not.toContain(`${GENERATION_A_FIRST_FILL.toFixed(3)} L`);
    expect(joined).not.toContain("First fill seal coat volume");
  });

  it("does not revive stale planning after a zero-wood recalculation", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        woodBoundaryMode: {
          firstFillVolumeLiters: GENERATION_A_FIRST_FILL,
          recommendedFirstFillVolumeLiters: GENERATION_A_FIRST_FILL * 1.3,
          pourPlanRows: [firstFillPourRow(GENERATION_A_FIRST_FILL)],
          recommendedLayerCount: 1,
        },
      }),
    );
    await enterModify(user);
    await user.click(screen.getByRole("button", { name: /Clear Wood Islands/i }));
    await user.click(screen.getByRole("button", { name: /Calculate Resin Volume/i }));
    await waitFor(() => {
      expect(screen.getByText(/1\.50 L/)).toBeInTheDocument();
    });
    expectLitersAbsent(GENERATION_A_FIRST_FILL);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("uses demo calculate-wood for a zero-wood Demo project", async () => {
    const user = userEvent.setup();
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
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        ui: { woodBoundaryComplete: true, cavitiesComplete: true },
        woodBoundaryMode: { woodBoundaryPolygons: [], cavities: [], cavityDepthsMm: [] },
        result: ZERO_WOOD_RESULT,
      }),
    );
    await user.click(screen.getByRole("button", { name: /Calculate Resin Volume/i }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        DEMO_CALCULATE_WOOD_PATH,
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(lastWoodPayload().woodBoundaryPolygons).toEqual([]);
    expect(fetch).not.toHaveBeenCalledWith("/calculate-wood", expect.anything());
  });
});
