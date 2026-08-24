import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
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
import {
  volumeLitersFromAreaCm2AndThicknessMm,
  woodPlanningSurfaceAreaCm2,
} from "./planningResultState.js";
import { mapCalculatorSnapshotToCanonicalV2 } from "../project/mapSnapshotToCanonicalV2.js";
import { mapCanonicalV2ToCalculatorSnapshot } from "../project/mapCanonicalV2ToCalculatorSnapshot.js";

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

const MASS_RESULT = {
  calculationType: "wood",
  volumeLiters: 1.502,
  recommendedVolumeLiters: 1.652,
  safetyMarginPercent: 10,
  moldAreaCm2: 600,
  woodAreaCm2: 200,
  woodIslandCount: 1,
  mainResinAreaCm2: 400,
  mainVolumeLiters: 1.502,
  cavityAreaCm2: 0,
  cavities: [],
  mainPourDepthMm: 25,
  useImageBorderAsMold: false,
};

const FIRST_FILL_THICKNESS_MM = 3;
const FIRST_FILL_VOLUME = volumeLitersFromAreaCm2AndThicknessMm(
  woodPlanningSurfaceAreaCm2(MASS_RESULT),
  FIRST_FILL_THICKNESS_MM,
);

function firstFillPourRow(volumeLiters) {
  return {
    label: "Pour 1 — First Fill Seal Coat",
    type: "firstFill",
    thicknessMm: FIRST_FILL_THICKNESS_MM,
    volumeLiters,
    recommendedVolumeLiters: volumeLiters * 1.1,
  };
}

function remainingPourRow(volumeLiters) {
  return {
    label: "Pour 2",
    type: "mainPour",
    thicknessMm: 22,
    volumeLiters,
    recommendedVolumeLiters: volumeLiters * 1.1,
  };
}

function buildCompletedSnapshot(overrides = {}) {
  const {
    ui: uiOverrides = {},
    woodBoundaryMode: woodOverrides = {},
    result = MASS_RESULT,
    ...rest
  } = overrides;
  return {
    ...VALID_CALCULATOR_SNAPSHOT,
    ...rest,
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

function densityInput() {
  return screen.getByRole("spinbutton", { name: /Resin density/i });
}

function installFetchMock() {
  const originalFetch = global.fetch;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/api/me/capabilities")) {
        return originalFetch(url, options);
      }
      if (requestUrl.includes("/api/content/public-languages")) {
        return {
          ok: true,
          json: async () => ({
            defaultPublicLocale: "en",
            activePublicLocales: ["en", "ro"],
          }),
        };
      }
      const body = options.body ? JSON.parse(options.body) : {};
      if (
        requestUrl.includes(DEMO_CALCULATE_WOOD_PATH) ||
        requestUrl.endsWith("/calculate-wood")
      ) {
        return { ok: true, json: async () => MASS_RESULT };
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
        const area = Number(body.resinSurfaceAreaCm2);
        const firstFill = Number(body.firstFillThicknessMm);
        const remaining = Number(body.mainDepthMm) - firstFill;
        return {
          ok: true,
          json: async () => ({
            rows: [
              firstFillPourRow(volumeLitersFromAreaCm2AndThicknessMm(area, firstFill)),
              remainingPourRow(volumeLitersFromAreaCm2AndThicknessMm(area, remaining)),
            ],
            layerCount: 2,
          }),
        };
      }
      return { ok: false, status: 404, json: async () => ({ detail: "Not found" }) };
    }),
  );
}

describe("ResinCalculator resin mass conversion", () => {
  let restoreImage;
  let restoreClientSize;

  beforeEach(() => {
    restoreImage = installImageMock();
    seedDevicePreferences({ lengthUnit: "cm", interfaceLanguage: "en" });
    pdfTexts.length = 0;
    installFetchMock();
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

  it("shows estimated mass next to unchanged main volumes at 1.10 kg/L", async () => {
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());

    expect(screen.getByText(/1\.50 L/)).toBeInTheDocument();
    expect(screen.getByText(/1\.65 L/)).toBeInTheDocument();
    expect(screen.getAllByText("≈ 1.65 kg").length).toBeGreaterThan(0);
    expect(screen.getAllByText("≈ 1.82 kg").length).toBeGreaterThan(0);
    expect(densityInput()).toHaveValue(1.1);
    expect(screen.getAllByText(/Default estimate/i).length).toBeGreaterThan(0);
  });

  it("updates weights immediately when density changes without calling calculation APIs", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        woodBoundaryMode: {
          firstFillVolumeLiters: FIRST_FILL_VOLUME,
          recommendedFirstFillVolumeLiters: FIRST_FILL_VOLUME * 1.3,
          pourPlanRows: [
            firstFillPourRow(FIRST_FILL_VOLUME),
            remainingPourRow(0.88),
          ],
          recommendedLayerCount: 2,
        },
      }),
    );

    const fetchCallsBefore = fetch.mock.calls.length;
    await user.clear(densityInput());
    await user.type(densityInput(), "1.2");

    expect(screen.queryByText(/Results need recalculation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/First Fill Seal Coat Volume:/i)).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByText("≈ 1.80 kg").length).toBeGreaterThan(0);
    expect(screen.getAllByText("≈ 1.98 kg").length).toBeGreaterThan(0);
    expect(fetch.mock.calls.length).toBe(fetchCallsBefore);
    expect(
      fetch.mock.calls.some(([url]) => String(url).includes("calculate-wood")),
    ).toBe(false);
  });

  it("shows estimated First Fill and Pour Planning masses", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.click(screen.getByRole("button", { name: /Calculate First Fill Volume/i }));
    await waitFor(() => {
      expect(screen.getByText(/First Fill Seal Coat Volume:/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText("≈ 132 g").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /Calculate Pour Plan/i }));
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    const table = screen.getByRole("table");
    expect(within(table).getAllByText(/≈/).length).toBeGreaterThan(1);
    expect(screen.getByText(/Component A and B quantities are volumes/i)).toBeInTheDocument();
  });

  it("rejects invalid density without clamping and hides estimated mass", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await user.clear(densityInput());
    await user.type(densityInput(), "0");

    expect(screen.getByRole("alert")).toHaveTextContent(/between 0\.5 and 2\.0/i);
    expect(screen.queryByText("≈ 1.65 kg")).not.toBeInTheDocument();
    expect(densityInput()).toHaveValue(0);
  });

  it("round-trips density through snapshot restore and falls back to 1.10", async () => {
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        woodBoundaryMode: { resinDensityKgPerLiter: 1.15 },
      }),
    );
    expect(densityInput()).toHaveValue(1.15);
    expect(ref.current.getProjectSnapshot().woodBoundaryMode.resinDensityKgPerLiter).toBeCloseTo(
      1.15,
    );

    const envelope = mapCalculatorSnapshotToCanonicalV2(ref.current.getProjectSnapshot(), {
      projectName: "Mass",
    });
    expect(mapCanonicalV2ToCalculatorSnapshot(envelope).woodBoundaryMode.resinDensityKgPerLiter).toBeCloseTo(
      1.15,
    );

    await restoreSnapshot(ref, buildCompletedSnapshot());
    expect(densityInput()).toHaveValue(1.1);
    expect(ref.current.getProjectSnapshot().woodBoundaryMode.resinDensityKgPerLiter).toBeCloseTo(
      1.1,
    );
  });

  it("prints density and estimated mass on the PDF without stale planning", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        woodBoundaryMode: {
          firstFillVolumeLiters: FIRST_FILL_VOLUME,
          recommendedFirstFillVolumeLiters: FIRST_FILL_VOLUME * 1.3,
          pourPlanRows: [
            firstFillPourRow(FIRST_FILL_VOLUME),
            remainingPourRow(0.087),
          ],
          recommendedLayerCount: 2,
        },
      }),
    );

    await user.click(screen.getByRole("button", { name: /Export PDF/i }));
    await waitFor(() => {
      expect(pdfTexts.join("\n")).toContain("1.10 kg/L");
    });
    const joined = pdfTexts.join("\n");
    expect(joined).toContain("1.502 L");
    expect(joined).toContain("1.65 kg");
    expect(joined).toContain("1.652 L");
    expect(joined).toContain("1.82 kg");
    expect(joined).toContain("Resin density used");
    expect(joined).toContain("Estimated mixed resin weight");
    expect(joined).not.toContain("0.087 L");
  });

  it("prints density and estimated mass in Romanian when the UI language is RO", async () => {
    const user = userEvent.setup();
    seedDevicePreferences({ lengthUnit: "cm", interfaceLanguage: "ro" });
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(
      ref,
      buildCompletedSnapshot({
        woodBoundaryMode: {
          firstFillVolumeLiters: FIRST_FILL_VOLUME,
          recommendedFirstFillVolumeLiters: FIRST_FILL_VOLUME * 1.3,
          pourPlanRows: [
            firstFillPourRow(FIRST_FILL_VOLUME),
            remainingPourRow(FIRST_FILL_VOLUME),
          ],
          recommendedLayerCount: 2,
        },
      }),
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Exportă PDF/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Exportă PDF/i }));
    await waitFor(() => {
      expect(pdfTexts.join("\n")).toContain("Densitatea rășinii folosită");
    });
    const joined = pdfTexts.join("\n");
    expect(joined).toContain("Densitatea rășinii folosită");
    expect(joined).toContain("Greutatea estimată a amestecului de rășină");
    expect(joined).toContain("1.10 kg/L");
    expect(joined).toContain("1.502 L");
    expect(joined).toContain("1.65 kg");
    expect(joined).not.toContain("Resin density used");
  });

  it("exposes an editable density field in Demo Mode without saving", async () => {
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
    await restoreSnapshot(ref, buildCompletedSnapshot());
    expect(densityInput()).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Save Project/i })).not.toBeInTheDocument();
    await user.clear(densityInput());
    await user.type(densityInput(), "1.2");
    expect(screen.getAllByText("≈ 1.80 kg").length).toBeGreaterThan(0);
    expect(
      fetch.mock.calls.some(([url]) => String(url).includes("calculate-wood")),
    ).toBe(false);
  });

  it("shows Romanian density copy when the interface language is RO", async () => {
    seedDevicePreferences({ lengthUnit: "cm", interfaceLanguage: "ro" });
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await waitFor(() => {
      expect(screen.getByRole("spinbutton", { name: /Densitatea rășinii/i })).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Valoare estimativă implicită/i).length).toBeGreaterThan(0);
  });
});
