import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import ResinCalculator from "./ResinCalculator.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { usePreferences } from "../preferences/PreferencesContext.jsx";
import {
  DEVICE_PREFERENCES_STORAGE_KEY,
} from "../preferences/devicePreferencesStorage.js";
import {
  mockCapabilitiesFetch,
  seedDevicePreferences,
} from "../preferences/testHelpers.js";
import { FREE_CAPABILITIES } from "../capabilities/capabilityDefaults.js";
import { VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";

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
  cavityAreaCm2: 0,
  mainPourDepthMm: 10,
  useImageBorderAsMold: false,
};

function buildResultSnapshot(overrides = {}) {
  return {
    ...VALID_CALCULATOR_SNAPSHOT,
    result: WOOD_RESULT,
    ...overrides,
  };
}

async function restoreSnapshot(ref, snapshot) {
  await act(async () => {
    ref.current.restoreProjectSnapshot(snapshot);
  });
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

function renderCalculator(ui) {
  return render(<TestProviders>{ui}</TestProviders>);
}

async function restoreWoodWorkflow(ref, snapshot) {
  await act(async () => {
    ref.current.restoreProjectSnapshot(snapshot);
  });
  await waitFor(() => {
    expect(
      screen.queryByRole("button", { name: /Done with Measurements|Măsurători finalizate/i }),
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

function LanguageToggle() {
  const { preferences, updatePreferences } = usePreferences();
  const nextLanguage = preferences.interfaceLanguage === "en" ? "ro" : "en";
  return (
    <button type="button" onClick={() => updatePreferences({ interfaceLanguage: nextLanguage })}>
      Toggle language
    </button>
  );
}

function mockFreeCapabilitiesFetch() {
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
            capabilities: FREE_CAPABILITIES,
          }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    }),
  );
}

describe("ResinCalculator i18n", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockCapabilitiesFetch();
  });

  it("renders the primary calculator workflow in Romanian when interface language is ro", () => {
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderCalculator(<ResinCalculator showHeader={false} />);

    expect(screen.getByText("Încarcă fotografie:")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pasul 1 — Încarcă o fotografie" })).toBeInTheDocument();
    expect(screen.getByText("Referințe")).toBeInTheDocument();
    expect(screen.getByText("Cofraj")).toBeInTheDocument();
    expect(screen.getByText("Lemn")).toBeInTheDocument();
    expect(screen.getByText("Cavități")).toBeInTheDocument();
    expect(screen.getByText("Calculează")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Acțiuni proiect" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvează proiectul/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportă PDF/i })).toBeInTheDocument();
  });

  it("renders the primary calculator workflow in English when interface language is en", () => {
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderCalculator(<ResinCalculator showHeader={false} />);

    expect(screen.getByText("Upload Photo:")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Step 1 — Upload a Photo" })).toBeInTheDocument();
    expect(screen.getByText("References")).toBeInTheDocument();
    expect(screen.getByText("Mold")).toBeInTheDocument();
    expect(screen.getByText("Wood")).toBeInTheDocument();
    expect(screen.getByText("Cavities")).toBeInTheDocument();
    expect(screen.getByText("Calculate")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Project Actions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Project/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export PDF/i })).toBeInTheDocument();
  });

  it("updates calculator labels when interface language changes without remounting", async () => {
    const user = userEvent.setup();
    seedDevicePreferences({ interfaceLanguage: "en" });
    renderCalculator(
      <>
        <LanguageToggle />
        <ResinCalculator showHeader={false} />
      </>,
    );

    expect(screen.getByText("Upload Photo:")).toBeInTheDocument();
    expect(screen.getByText("References")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Toggle language" }));

    await waitFor(() => {
      expect(screen.getByText("Încarcă fotografie:")).toBeInTheDocument();
      expect(screen.getByText("Referințe")).toBeInTheDocument();
      expect(screen.getByText("Cofraj")).toBeInTheDocument();
    });
  });

  it("renders wood result summary labels in Romanian", async () => {
    const restoreImageMock = installPersistentImageMock();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities={false} />,
    );
    await restoreSnapshot(ref, buildResultSnapshot());

    await waitFor(() => {
      expect(screen.getByText("Rășină totală necesară:")).toBeInTheDocument();
    });
    expect(screen.getByText("Cantitate recomandată (+10%):")).toBeInTheDocument();
    expect(screen.getByText("Detaliere completă")).toBeInTheDocument();
    restoreImageMock();
  });

  it("renders optional pour-planning controls in Romanian", async () => {
    const restoreImageMock = installPersistentImageMock();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities={false} />,
    );
    await restoreSnapshot(ref, buildResultSnapshot());

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Instrumente opționale de planificare a turnării" }),
      ).toBeInTheDocument();
    });
    expect(screen.getAllByText("Calculator strat sigilant prim turn").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Grosime strat sigilant prim turn (mm)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Calculează volumul primului turn/i })).toBeInTheDocument();
    expect(screen.getAllByText("Planificare straturi de turnare").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Grosime maximă turnare per strat (mm)")).toBeInTheDocument();
    expect(screen.getByText("Raport amestec rășină (A:B)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Calculează planul de turnare/i })).toBeInTheDocument();
    restoreImageMock();
  });

  it("renders pour-planning help panels in Romanian", async () => {
    const restoreImageMock = installPersistentImageMock();
    seedDevicePreferences({ interfaceLanguage: "ro" });
    const ref = createRef();
    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities={false} />,
    );
    await restoreSnapshot(ref, buildResultSnapshot());

    await waitFor(() => {
      expect(
        screen.getByText(/Introdu grosimea stratului inițial de sigilare/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Introdu grosimea maximă de turnare recomandată de producătorul rășinii/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Aplicația va folosi stratul sigilant de prim turn introdus/i),
    ).toBeInTheDocument();
    restoreImageMock();
  });

  it("uses Cofraj rather than Mulaj across the visible primary workflow", () => {
    seedDevicePreferences({ interfaceLanguage: "ro" });
    renderCalculator(<ResinCalculator showHeader={false} />);

    expect(screen.getByText("Cofraj")).toBeInTheDocument();
    expect(screen.queryByText("Mulaj")).not.toBeInTheDocument();
    expect(screen.queryByText(/mulaj/i)).not.toBeInTheDocument();
  });

  it("updates result and planning labels when interface language changes without remounting", async () => {
    const restoreImageMock = installPersistentImageMock();
    const user = userEvent.setup();
    seedDevicePreferences({ interfaceLanguage: "en" });
    const ref = createRef();
    renderCalculator(
      <>
        <LanguageToggle />
        <ResinCalculator ref={ref} showHeader={false} enforceAccountCapabilities={false} />
      </>,
    );
    await restoreSnapshot(ref, buildResultSnapshot());

    await waitFor(() => {
      expect(screen.getByText("Total Resin Required:")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Optional Pour Planning Tools" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Toggle language" }));

    await waitFor(() => {
      expect(screen.getByText("Rășină totală necesară:")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Instrumente opționale de planificare a turnării" }),
      ).toBeInTheDocument();
    });
    restoreImageMock();
  });

  it("keeps device-local preference persistence intact when calculator renders", () => {
    seedDevicePreferences({ interfaceLanguage: "ro", lengthUnit: "cm", volumeUnit: "ml" });
    renderCalculator(<ResinCalculator showHeader={false} />);

    expect(JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_STORAGE_KEY))).toMatchObject({
      interfaceLanguage: "ro",
      lengthUnit: "cm",
      volumeUnit: "ml",
    });
    expect(screen.getByText("Referințe")).toBeInTheDocument();
  });

  describe("free-tier capability messages", () => {
    let restoreImageMock;

    beforeEach(() => {
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

    it("renders polygon limit errors in Romanian when interface language is ro", async () => {
      mockFreeCapabilitiesFetch();
      seedDevicePreferences({ interfaceLanguage: "ro" });
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
        expect(
          screen.getByText(/contur de cofraj este limitat la 4 puncte/i),
        ).toBeInTheDocument();
      });
    });

    it("still renders polygon limit errors in English when interface language is en", async () => {
      mockFreeCapabilitiesFetch();
      seedDevicePreferences({ interfaceLanguage: "en" });
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
        expect(
          screen.getByText(/mold boundary is limited to 4 points/i),
        ).toBeInTheDocument();
      });
    });
  });
});
