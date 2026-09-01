import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResinCalculator from "./ResinCalculator.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { usePreferences } from "../preferences/PreferencesContext.jsx";
import { localeBundleHasOwnKey, translate } from "../i18n/translate.js";
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

const WOOD_RESULT = {
  calculationType: "wood",
  volumeLiters: 1.502,
  recommendedVolumeLiters: 1.652,
  safetyMarginPercent: 10,
  moldAreaCm2: 600,
  woodAreaCm2: 200,
  woodIslandCount: 1,
  mainResinAreaCm2: 400,
  mainVolumeLiters: 1.502,
  cavityAreaCm2: 9,
  cavities: [
    {
      name: "Cavity 1",
      areaCm2: 9,
      depthMm: 12,
      volumeLiters: 0.0108,
    },
  ],
  mainPourDepthMm: 25,
  useImageBorderAsMold: false,
  scaleQuality: {
    scaleXAvgCmPerPx: 0.1,
    scaleYAvgCmPerPx: 0.1,
    horizontalCount: 1,
    verticalCount: 1,
    diagonalCount: 0,
  },
};

const FIRST_FILL_THICKNESS_MM = 3;
const FIRST_FILL_VOLUME = volumeLitersFromAreaCm2AndThicknessMm(
  woodPlanningSurfaceAreaCm2(WOOD_RESULT),
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

function remainingPourRow() {
  const thicknessMm = 22;
  const volumeLiters = volumeLitersFromAreaCm2AndThicknessMm(
    woodPlanningSurfaceAreaCm2(WOOD_RESULT),
    thicknessMm,
  );
  return {
    label: "Pour 2",
    type: "mainPour",
    thicknessMm,
    volumeLiters,
    recommendedVolumeLiters: volumeLiters * 1.1,
  };
}

function buildCompletedSnapshot(overrides = {}) {
  const { woodBoundaryMode: woodOverrides = {}, result = WOOD_RESULT, ...rest } = overrides;
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
      firstFillVolumeLiters: FIRST_FILL_VOLUME,
      recommendedFirstFillVolumeLiters: FIRST_FILL_VOLUME * 1.3,
      firstFillRecommendationMode: "30",
      pourPlanRows: [firstFillPourRow(FIRST_FILL_VOLUME), remainingPourRow()],
      recommendedLayerCount: 2,
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

function LanguageToggle() {
  const { preferences, updatePreferences } = usePreferences();
  const nextLanguage = preferences.interfaceLanguage === "en" ? "ro" : "en";
  return (
    <button type="button" onClick={() => updatePreferences({ interfaceLanguage: nextLanguage })}>
      Toggle language
    </button>
  );
}

function renderCalculator(ui) {
  return render(<TestProviders>{ui}</TestProviders>);
}

async function clickExportPdf(user, name) {
  pdfTexts.length = 0;
  await user.click(screen.getByRole("button", { name }));
  await waitFor(() => {
    expect(pdfTexts.length).toBeGreaterThan(0);
  });
}

async function restoreSnapshot(ref, snapshot) {
  await act(async () => {
    ref.current.restoreProjectSnapshot(snapshot);
  });
  await waitFor(() => {
    expect(document.querySelector("canvas")).toBeTruthy();
  });
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
            activePublicLocales: ["en", "ro", "fr"],
          }),
        };
      }
      return { ok: false, status: 404, json: async () => ({ detail: "Not found" }) };
    }),
  );
}

const ROMANIAN_PDF_MARKERS = [
  "Calculator rășină pentru mese river și proiecte din lemn",
  "Măsurători de referință",
  "Rezultate",
  "Volum total rășină",
  "Cantitate recomandată (+10%)",
  "Strat sigilant prim turn",
  "Planificare straturi de turnare",
  "Informații despre scală",
  "Densitatea rășinii folosită",
  "Greutatea estimată a amestecului de rășină",
  "Turn 1 — Strat sigilant prim turn",
  "Cavitate 1",
];

const ENGLISH_PDF_MARKERS = [
  "River Table & Woodworking Resin Calculator",
  "Reference Measurements",
  "Results",
  "Total resin volume",
  "Recommended amount (+10%)",
  "First Fill Seal Coat",
  "Pour Layer Planning",
  "Scale Information",
  "Resin density used",
  "Estimated mixed resin weight",
  "Pour 1 — First Fill Seal Coat",
  "Cavity 1",
];

describe("ResinCalculator PDF i18n", () => {
  let restoreImage;
  let restoreClientSize;

  beforeEach(() => {
    restoreImage = installImageMock();
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
    restoreImage?.();
    restoreClientSize?.();
  });

  it("exports Romanian PDF labels when the active UI language is RO", async () => {
    const user = userEvent.setup();
    seedDevicePreferences({ lengthUnit: "cm", interfaceLanguage: "ro" });
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Exportă PDF/i })).toBeInTheDocument();
    });
    await clickExportPdf(user, /Exportă PDF/i);
    const joined = pdfTexts.join("\n");
    ROMANIAN_PDF_MARKERS.forEach((marker) => {
      expect(joined).toContain(marker);
    });
    expect(joined).toContain("Raport generat:");
    expect(joined).not.toContain("Epoxy Resin Volume Estimator");
    expect(joined).not.toContain("Reference Measurements");
    expect(joined).not.toContain("Pour 1 — First Fill Seal Coat");
    expect(joined).not.toContain("Cavity 1");
    expect(joined).toContain("1.502 L");
    expect(joined).toContain("1.65 kg");
  });

  it("exports English PDF labels when the active UI language is EN", async () => {
    const user = userEvent.setup();
    seedDevicePreferences({ lengthUnit: "cm", interfaceLanguage: "en" });
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await clickExportPdf(user, /Export PDF/i);
    const joined = pdfTexts.join("\n");
    ENGLISH_PDF_MARKERS.forEach((marker) => {
      expect(joined).toContain(marker);
    });
    expect(joined).toContain("Report generated:");
    expect(joined).not.toContain("Rezultate");
    expect(joined).not.toContain("Măsurători de referință");
  });

  it("switches PDF language with the UI without recalculating geometry", async () => {
    const user = userEvent.setup();
    seedDevicePreferences({ lengthUnit: "cm", interfaceLanguage: "ro" });
    const ref = createRef();
    renderCalculator(
      <>
        <LanguageToggle />
        <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />
      </>,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Exportă PDF/i })).toBeInTheDocument();
    });
    await clickExportPdf(user, /Exportă PDF/i);
    expect(pdfTexts.join("\n")).toContain("Rezultate");

    const woodCallsBefore = fetch.mock.calls.filter(([url]) =>
      String(url).includes("calculate-wood"),
    ).length;
    pdfTexts.length = 0;
    await user.click(screen.getByRole("button", { name: "Toggle language" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Export PDF/i })).toBeInTheDocument();
    });
    await clickExportPdf(user, /Export PDF/i);
    const joined = pdfTexts.join("\n");
    expect(joined).toContain("Results");
    expect(joined).not.toContain("Rezultate");
    expect(
      fetch.mock.calls.filter(([url]) => String(url).includes("calculate-wood")).length,
    ).toBe(woodCallsBefore);
  });

  it("exports French PDF copy from owned keys without English fallback", async () => {
    const user = userEvent.setup();
    seedDevicePreferences({ lengthUnit: "cm", interfaceLanguage: "fr" });
    expect(localeBundleHasOwnKey("fr", "calculator.pdf.results")).toBe(true);
    expect(translate("fr", "calculator.pdf.results")).toBe("Résultats");
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Exporter en PDF/i })).toBeInTheDocument();
    });
    await clickExportPdf(user, /Exporter en PDF/i);
    const joined = pdfTexts.join("\n");
    expect(joined).toContain("Résultats");
    expect(joined).toContain("Mesures de référence");
    expect(joined).toContain("Planification des couches de coulée");
    expect(joined).not.toContain("Results");
    expect(joined).not.toContain("Reference Measurements");
    expect(joined).not.toContain("Pour Layer Planning");
  });

  it("localizes pour and cavity headings independently from persisted English names", async () => {
    const user = userEvent.setup();
    seedDevicePreferences({ lengthUnit: "cm", interfaceLanguage: "ro" });
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Exportă PDF/i })).toBeInTheDocument();
    });
    await clickExportPdf(user, /Exportă PDF/i);
    const joined = pdfTexts.join("\n");
    expect(joined).toContain("Turn 1 — Strat sigilant prim turn");
    expect(joined).toContain("Turn 2");
    expect(joined).toContain("Cavitate 1");
    expect(joined).not.toContain("Pour 1 — First Fill Seal Coat");
    expect(joined).not.toContain("Cavity 1");
    expect(ref.current.getProjectSnapshot().woodBoundaryMode.cavities[0].name).toBe(
      "Cavity 1",
    );
  });
});
