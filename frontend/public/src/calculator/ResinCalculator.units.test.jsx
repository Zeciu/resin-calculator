import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResinCalculator from "./ResinCalculator.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { usePreferences } from "../preferences/PreferencesContext.jsx";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
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

function fourPoints() {
  return [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
}

function threePoints() {
  return [
    { x: 60, y: 60 },
    { x: 90, y: 60 },
    { x: 90, y: 90 },
  ];
}

function LengthUnitControls({ children }) {
  const { preferences, updatePreferences } = usePreferences();
  return (
    <>
      <button type="button" onClick={() => void updatePreferences({ lengthUnit: "mm" })}>
        set-length-mm
      </button>
      <button type="button" onClick={() => void updatePreferences({ lengthUnit: "cm" })}>
        set-length-cm
      </button>
      <button type="button" onClick={() => void updatePreferences({ lengthUnit: "in" })}>
        set-length-in
      </button>
      <span data-testid="active-length-unit">{preferences.lengthUnit}</span>
      {children}
    </>
  );
}

function buildUnitsSnapshot(overrides = {}) {
  const {
    ui: uiOverrides = {},
    woodBoundaryMode: woodOverrides = {},
    result = null,
    ...rest
  } = overrides;

  return {
    ...VALID_CALCULATOR_SNAPSHOT,
    ...rest,
    ui: {
      calculationMode: "wood",
      selectedMode: "edit",
      measurementsComplete: true,
      rotationDeg: 0,
      zoomFactor: 1,
      selectedShape: { type: "cavity", index: 0 },
      ...uiOverrides,
    },
    woodBoundaryMode: {
      useImageBorderAsMold: false,
      moldBoundaryPoints: fourPoints(),
      woodBoundaryPolygons: [fourPoints()],
      currentWoodBoundaryPoints: [],
      cavities: [
        {
          name: "Cavity 1",
          points: threePoints(),
          depthMm: "20",
        },
      ],
      cavityDepthsMm: ["20"],
      useMainDepthForCavities: false,
      currentCavityPoints: [],
      mainResinDepthMm: "20",
      resinMixRatio: "2:1",
      ...woodOverrides,
    },
    result,
  };
}

const WOOD_RESULT = {
  calculationType: "wood",
  volumeLiters: 1.23,
  recommendedVolumeLiters: 1.353,
  safetyMarginPercent: 10,
  moldAreaCm2: 200,
  woodAreaCm2: 40,
  woodIslandCount: 1,
  mainResinAreaCm2: 150,
  mainVolumeLiters: 1.1,
  cavityAreaCm2: 10,
  mainPourDepthMm: 20,
  useImageBorderAsMold: false,
  cavities: [{ name: "Cavity 1", depthMm: 20, areaCm2: 10, volumeLiters: 0.02 }],
};

function installPersistentImageMock() {
  const OriginalImage = global.Image;
  global.Image = class MockImage {
    set src(_value) {
      this.width = 100;
      this.height = 80;
      if (this.onload) {
        this.onload();
      }
    }
  };
  return () => {
    global.Image = OriginalImage;
  };
}

function volumeFromWoodPayload(body) {
  const mainAreaCm2 = 1000;
  const cavityAreaCm2 = 100;
  const mainMm = Number(body.mainPourDepthMm);
  const cavityMm = Number(body.cavityDepthsMm?.[0] ?? 0);
  return (mainAreaCm2 * (mainMm / 10) + cavityAreaCm2 * (cavityMm / 10)) / 1000;
}

describe("ResinCalculator — preferred length units", () => {
  let restoreImage;
  let lastWoodBody;
  let lastPourBody;
  let lastFirstFillBody;

  beforeEach(() => {
    restoreImage = installPersistentImageMock();
    lastWoodBody = null;
    lastPourBody = null;
    lastFirstFillBody = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, options = {}) => {
        const requestUrl = String(url);
        if (requestUrl.includes("/api/content/public-languages")) {
          return {
            ok: true,
            json: async () => ({
              defaultPublicLocale: "en",
              activePublicLocales: ["en", "ro"],
            }),
          };
        }
        if (requestUrl.includes("/api/me/capabilities")) {
          return {
            ok: true,
            json: async () => ({
              role: "user",
              accessTier: "subscriber",
              catalogVersion: 1,
              capabilities: { "calculator.layerCalculation": true },
            }),
          };
        }
        if (requestUrl.includes("/calculate-wood")) {
          lastWoodBody = JSON.parse(options.body);
          const volumeLiters = volumeFromWoodPayload(lastWoodBody);
          return {
            ok: true,
            json: async () => ({
              ...WOOD_RESULT,
              volumeLiters,
              recommendedVolumeLiters: volumeLiters * 1.1,
              mainPourDepthMm: lastWoodBody.mainPourDepthMm,
              cavities: [
                {
                  name: "Cavity 1",
                  depthMm: lastWoodBody.cavityDepthsMm[0],
                  areaCm2: 10,
                  volumeLiters: (10 * (Number(lastWoodBody.cavityDepthsMm[0]) / 10)) / 1000,
                },
              ],
            }),
          };
        }
        if (requestUrl.includes("/calculate-pour-layers")) {
          lastPourBody = JSON.parse(options.body);
          return {
            ok: true,
            json: async () => ({
              layerCount: 1,
              rows: [{ label: "Pour 1", thicknessMm: lastPourBody.maxPourThicknessMm, volumeLiters: 0.5 }],
            }),
          };
        }
        if (requestUrl.includes("/calculate-first-fill")) {
          lastFirstFillBody = JSON.parse(options.body);
          return { ok: true, json: async () => ({ volumeLiters: 0.08 }) };
        }
        return { ok: true, json: async () => ({}) };
      }),
    );
  });

  afterEach(() => {
    restoreImage();
  });

  function renderCalculator(ui) {
    return render(
      <TestProviders>
        <LengthUnitControls>{ui}</LengthUnitControls>
      </TestProviders>,
    );
  }

  async function restoreSnapshot(ref, snapshot) {
    await act(async () => {
      ref.current.restoreProjectSnapshot(snapshot);
    });
    await waitFor(() => {
      expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
    });
  }

  async function editAndConfirmCavity(user) {
    await user.click(screen.getByRole("button", { name: "Edit Depth" }));
    await user.click(screen.getByRole("button", { name: "Confirm Depth" }));
  }

  it("stores 20 mm as 20 mm canonical and displays millimetres", async () => {
    seedDevicePreferences({ lengthUnit: "mm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(
      ref,
      buildUnitsSnapshot({
        woodBoundaryMode: { cavityDepthsMm: [""], cavities: [{ name: "Cavity 1", points: threePoints(), depthMm: "" }] },
      }),
    );

    await user.click(screen.getByRole("button", { name: "Edit Depth" }));
    fireEvent.change(screen.getByLabelText(/^Depth \(mm\)/i), { target: { value: "20" } });
    await user.click(screen.getByRole("button", { name: "Confirm Depth" }));

    expect(Number(ref.current.getProjectSnapshot().woodBoundaryMode.cavityDepthsMm[0])).toBe(20);
    expect(screen.getByText("Depth: 20 mm")).toBeInTheDocument();
  });

  it("stores 2 cm as 20 mm canonical and displays centimetres", async () => {
    seedDevicePreferences({ lengthUnit: "cm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(
      ref,
      buildUnitsSnapshot({
        woodBoundaryMode: { cavityDepthsMm: [""], cavities: [{ name: "Cavity 1", points: threePoints(), depthMm: "" }] },
      }),
    );

    await user.click(screen.getByRole("button", { name: "Edit Depth" }));
    fireEvent.change(screen.getByLabelText(/^Depth \(cm\)/i), { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: "Confirm Depth" }));

    expect(Number(ref.current.getProjectSnapshot().woodBoundaryMode.cavityDepthsMm[0])).toBe(20);
    expect(screen.getByText("Depth: 2 cm")).toBeInTheDocument();
  });

  it("stores 2.5 cm as 25 mm canonical", async () => {
    seedDevicePreferences({ lengthUnit: "cm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(
      ref,
      buildUnitsSnapshot({
        woodBoundaryMode: { cavityDepthsMm: [""], cavities: [{ name: "Cavity 1", points: threePoints(), depthMm: "" }] },
      }),
    );

    await user.click(screen.getByRole("button", { name: "Edit Depth" }));
    fireEvent.change(screen.getByLabelText(/^Depth \(cm\)/i), { target: { value: "2.5" } });
    await user.click(screen.getByRole("button", { name: "Confirm Depth" }));

    expect(Number(ref.current.getProjectSnapshot().woodBoundaryMode.cavityDepthsMm[0])).toBe(25);
    expect(screen.getByText("Depth: 2.5 cm")).toBeInTheDocument();
  });

  it("does not multiply cavity depth when Confirm is pressed twice", async () => {
    seedDevicePreferences({ lengthUnit: "cm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(ref, buildUnitsSnapshot());

    expect(screen.getByText("Depth: 2 cm")).toBeInTheDocument();
    await editAndConfirmCavity(user);
    expect(Number(ref.current.getProjectSnapshot().woodBoundaryMode.cavityDepthsMm[0])).toBe(20);
    await editAndConfirmCavity(user);
    expect(Number(ref.current.getProjectSnapshot().woodBoundaryMode.cavityDepthsMm[0])).toBe(20);
    expect(screen.getByText("Depth: 2 cm")).toBeInTheDocument();
  });

  it("reformats cavity depth when Preferred Length Unit changes without altering canonical mm", async () => {
    seedDevicePreferences({ lengthUnit: "mm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(ref, buildUnitsSnapshot());

    expect(screen.getByText("Depth: 20 mm")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "set-length-cm" }));
    await waitFor(() => {
      expect(screen.getByTestId("active-length-unit")).toHaveTextContent("cm");
    });
    expect(screen.getByText("Depth: 2 cm")).toBeInTheDocument();
    expect(Number(ref.current.getProjectSnapshot().woodBoundaryMode.cavityDepthsMm[0])).toBe(20);

    await user.click(screen.getByRole("button", { name: "set-length-mm" }));
    await waitFor(() => {
      expect(screen.getByTestId("active-length-unit")).toHaveTextContent("mm");
    });
    expect(screen.getByText("Depth: 20 mm")).toBeInTheDocument();
    expect(Number(ref.current.getProjectSnapshot().woodBoundaryMode.cavityDepthsMm[0])).toBe(20);
  });

  it("sends canonical millimetres for main resin depth regardless of display unit", async () => {
    seedDevicePreferences({ lengthUnit: "cm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(ref, buildUnitsSnapshot());

    const mainInput = screen.getByLabelText(/Main resin depth \(cm\)/i);
    expect(mainInput).toHaveValue(2);
    fireEvent.change(mainInput, { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: "Calculate Resin Volume" }));

    await waitFor(() => {
      expect(lastWoodBody).not.toBeNull();
    });
    expect(lastWoodBody.mainPourDepthMm).toBe(20);
    expect(lastWoodBody.cavityDepthsMm[0]).toBe(20);
  });

  it("reformats main resin depth when the preferred unit changes", async () => {
    seedDevicePreferences({ lengthUnit: "mm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(ref, buildUnitsSnapshot());

    expect(screen.getByLabelText(/Main resin depth \(mm\)/i)).toHaveValue(20);
    await user.click(screen.getByRole("button", { name: "set-length-cm" }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Main resin depth \(cm\)/i)).toHaveValue(2);
    });
    expect(Number(ref.current.getProjectSnapshot().woodBoundaryMode.mainResinDepthMm)).toBe(20);
  });

  function unitSuffixFor(input) {
    return input.closest(".length-unit-input")?.querySelector("[data-testid='length-unit-suffix']");
  }

  it("shows mm as a persistent suffix inside length inputs", async () => {
    seedDevicePreferences({ lengthUnit: "mm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(ref, buildUnitsSnapshot());

    const mainInput = screen.getByLabelText(/Main resin depth \(mm\)/i);
    expect(unitSuffixFor(mainInput)).toHaveTextContent("mm");
    expect(mainInput.value).toBe("20");
    expect(mainInput.value).not.toMatch(/mm/);

    await user.click(screen.getByRole("button", { name: "Edit Depth" }));
    const cavityInput = screen.getByLabelText(/^Depth \(mm\)/i);
    expect(unitSuffixFor(cavityInput)).toHaveTextContent("mm");
    expect(cavityInput.value).toBe("20");
    expect(cavityInput.value).not.toMatch(/mm/);
  });

  it("shows cm as a persistent suffix inside length inputs", async () => {
    seedDevicePreferences({ lengthUnit: "cm" });
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(ref, buildUnitsSnapshot());

    const mainInput = screen.getByLabelText(/Main resin depth \(cm\)/i);
    expect(unitSuffixFor(mainInput)).toHaveTextContent("cm");
    expect(mainInput.value).toBe("2");
    expect(mainInput.value).not.toMatch(/cm/);
  });

  it("updates the in-control unit suffix when Preferred Length Unit changes", async () => {
    seedDevicePreferences({ lengthUnit: "mm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(ref, buildUnitsSnapshot());

    const mainInput = screen.getByLabelText(/Main resin depth \(mm\)/i);
    expect(unitSuffixFor(mainInput)).toHaveTextContent("mm");
    expect(mainInput.value).toBe("20");

    await user.click(screen.getByRole("button", { name: "set-length-cm" }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Main resin depth \(cm\)/i)).toHaveValue(2);
    });
    const switched = screen.getByLabelText(/Main resin depth \(cm\)/i);
    expect(unitSuffixFor(switched)).toHaveTextContent("cm");
    expect(switched.value).toBe("2");
    expect(switched.value).not.toMatch(/cm|mm/);
    expect(Number(ref.current.getProjectSnapshot().woodBoundaryMode.mainResinDepthMm)).toBe(20);
  });

  it("displays reference measurements in the preferred unit without changing knownLengthCm", async () => {
    seedDevicePreferences({ lengthUnit: "mm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(ref, buildUnitsSnapshot());

    await user.click(screen.getByText("Reference Measurements"));
    expect(screen.getByText(/Reference 1: 100 mm/i)).toBeInTheDocument();
    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements[0].knownLengthCm).toBe(10);

    await user.click(screen.getByRole("button", { name: "set-length-cm" }));
    await waitFor(() => {
      expect(screen.getByText(/Reference 1: 10 cm/i)).toBeInTheDocument();
    });
    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements[0].knownLengthCm).toBe(10);
  });

  it("sends pour-planning thicknesses as canonical millimetres", async () => {
    seedDevicePreferences({ lengthUnit: "cm" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(ref, buildUnitsSnapshot({ result: WOOD_RESULT }));

    fireEvent.change(screen.getByLabelText(/First Fill Seal Coat Thickness \(cm\)/i), {
      target: { value: "0.3" },
    });
    fireEvent.change(screen.getByLabelText(/Maximum Pour Thickness Per Layer \(cm\)/i), {
      target: { value: "2" },
    });

    await user.click(screen.getByRole("button", { name: "Calculate First Fill Volume" }));
    await waitFor(() => {
      expect(lastFirstFillBody).not.toBeNull();
    });
    expect(lastFirstFillBody.firstFillThicknessMm).toBe(3);

    await user.click(screen.getByRole("button", { name: "Calculate Pour Plan" }));
    await waitFor(() => {
      expect(lastPourBody).not.toBeNull();
    });
    expect(lastPourBody.mainDepthMm).toBe(20);
    expect(lastPourBody.maxPourThicknessMm).toBe(20);
    expect(lastPourBody.firstFillThicknessMm).toBe(3);
  });

  it("produces the same wood volume for equivalent mm and cm inputs", async () => {
    const user = userEvent.setup();

    seedDevicePreferences({ lengthUnit: "mm" });
    const mmRef = createRef();
    const mmView = renderCalculator(<ResinCalculator ref={mmRef} showHeader={false} />);
    await restoreSnapshot(
      mmRef,
      buildUnitsSnapshot({
        woodBoundaryMode: {
          cavityDepthsMm: [""],
          cavities: [{ name: "Cavity 1", points: threePoints(), depthMm: "" }],
          mainResinDepthMm: "",
        },
      }),
    );
    await user.click(screen.getByRole("button", { name: "Edit Depth" }));
    fireEvent.change(screen.getByLabelText(/^Depth \(mm\)/i), { target: { value: "20" } });
    await user.click(screen.getByRole("button", { name: "Confirm Depth" }));
    fireEvent.change(screen.getByLabelText(/Main resin depth \(mm\)/i), { target: { value: "20" } });
    await user.click(screen.getByRole("button", { name: "Calculate Resin Volume" }));
    await waitFor(() => expect(lastWoodBody).not.toBeNull());
    const mmPayload = lastWoodBody;
    const mmVolume = volumeFromWoodPayload(mmPayload);
    mmView.unmount();

    lastWoodBody = null;
    seedDevicePreferences({ lengthUnit: "cm" });
    const cmRef = createRef();
    renderCalculator(<ResinCalculator ref={cmRef} showHeader={false} />);
    await restoreSnapshot(
      cmRef,
      buildUnitsSnapshot({
        woodBoundaryMode: {
          cavityDepthsMm: [""],
          cavities: [{ name: "Cavity 1", points: threePoints(), depthMm: "" }],
          mainResinDepthMm: "",
        },
      }),
    );
    await user.click(screen.getByRole("button", { name: "Edit Depth" }));
    fireEvent.change(screen.getByLabelText(/^Depth \(cm\)/i), { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: "Confirm Depth" }));
    fireEvent.change(screen.getByLabelText(/Main resin depth \(cm\)/i), { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: "Calculate Resin Volume" }));
    await waitFor(() => expect(lastWoodBody).not.toBeNull());

    expect(lastWoodBody.mainPourDepthMm).toBe(mmPayload.mainPourDepthMm);
    expect(lastWoodBody.cavityDepthsMm).toEqual(mmPayload.cavityDepthsMm);
    expect(volumeFromWoodPayload(lastWoodBody)).toBeCloseTo(mmVolume, 10);
  });

  it("does not double-convert inches on confirm", async () => {
    seedDevicePreferences({ lengthUnit: "in" });
    const user = userEvent.setup();
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} />);
    await restoreSnapshot(
      ref,
      buildUnitsSnapshot({
        woodBoundaryMode: { cavityDepthsMm: [""], cavities: [{ name: "Cavity 1", points: threePoints(), depthMm: "" }] },
      }),
    );

    await user.click(screen.getByRole("button", { name: "Edit Depth" }));
    fireEvent.change(screen.getByLabelText(/^Depth \(in\)/i), { target: { value: "1" } });
    await user.click(screen.getByRole("button", { name: "Confirm Depth" }));
    const afterFirst = Number(ref.current.getProjectSnapshot().woodBoundaryMode.cavityDepthsMm[0]);
    expect(afterFirst).toBeCloseTo(25.4, 5);
    await editAndConfirmCavity(user);
    expect(Number(ref.current.getProjectSnapshot().woodBoundaryMode.cavityDepthsMm[0])).toBeCloseTo(afterFirst, 10);
  });
});
