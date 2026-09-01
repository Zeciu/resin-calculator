import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResinCalculator from "./ResinCalculator.jsx";
import { TestProviders } from "../test/TestProviders.jsx";
import { VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";
import { mapCalculatorSnapshotToCanonicalV2 } from "../project/mapSnapshotToCanonicalV2.js";
import { mapCanonicalV2ToCalculatorSnapshot } from "../project/mapCanonicalV2ToCalculatorSnapshot.js";
import { usePreferences } from "../preferences/PreferencesContext.jsx";
import { seedDevicePreferences } from "../preferences/testHelpers.js";
import { formatCostPerDisplayUnit } from "./projectCostEstimate.js";
import { formatVolumeFromLiters, VOLUME_UNIT_LABELS, volumeToLiters } from "../units/conversion.js";

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

const COST_RESULT = {
  calculationType: "wood",
  volumeLiters: 10.2,
  recommendedVolumeLiters: 11.22,
  safetyMarginPercent: 10,
  moldAreaCm2: 600,
  woodAreaCm2: 200,
  woodIslandCount: 1,
  mainResinAreaCm2: 400,
  mainVolumeLiters: 10.2,
  cavityAreaCm2: 0,
  cavities: [],
  mainPourDepthMm: 25,
  useImageBorderAsMold: false,
};

function buildCompletedSnapshot(overrides = {}) {
  const { result = COST_RESULT, ...rest } = overrides;
  return {
    ...VALID_CALCULATOR_SNAPSHOT,
    ...rest,
    ui: {
      ...VALID_CALCULATOR_SNAPSHOT.ui,
      calculationMode: "wood",
      measurementsComplete: true,
      woodBoundaryComplete: true,
      cavitiesComplete: true,
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

function VolumeUnitControls({ children }) {
  const { updatePreferences } = usePreferences();
  return (
    <>
      <button type="button" onClick={() => void updatePreferences({ volumeUnit: "L" })}>
        set-volume-L
      </button>
      <button type="button" onClick={() => void updatePreferences({ volumeUnit: "fl_oz" })}>
        set-volume-fl-oz
      </button>
      {children}
    </>
  );
}

function renderCalculator(ui) {
  return render(
    <TestProviders>
      <VolumeUnitControls>{ui}</VolumeUnitControls>
    </TestProviders>,
  );
}

function costPerUnitField(unit = "L") {
  return screen.getByLabelText(`Resin cost per ${VOLUME_UNIT_LABELS[unit] ?? unit}`);
}

function quantityUnitSuffix() {
  return screen
    .getByLabelText("Resin quantity for costing")
    .closest(".length-unit-input")
    .querySelector('[data-testid="length-unit-suffix"]');
}

async function restoreSnapshot(ref, snapshot) {
  await act(async () => {
    ref.current.restoreProjectSnapshot(snapshot);
  });
  await waitFor(() => {
    expect(document.querySelector("canvas")).toBeTruthy();
  });
}

describe("ResinCalculator project cost estimate", () => {
  let restoreImage;

  beforeEach(() => {
    restoreImage = installImageMock();
    seedDevicePreferences({ volumeUnit: "L" });
  });

  afterEach(() => {
    restoreImage();
    vi.restoreAllMocks();
  });

  it("renders the collapsible cost section after a result and lets the user collapse it", async () => {
    const ref = createRef();
    const user = userEvent.setup();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />);
    await restoreSnapshot(ref, buildCompletedSnapshot());

    const summary = screen.getByText("Project Cost Estimate");
    const details = summary.closest("details");
    expect(details).toHaveAttribute("open");
    expect(screen.getByLabelText("Resin quantity for costing")).toBeVisible();

    await user.click(summary);
    expect(details).not.toHaveAttribute("open");
  });

  it("keeps calculated resin volume read-only and follows it until costing quantity is edited", async () => {
    const ref = createRef();
    const user = userEvent.setup();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />);
    await restoreSnapshot(ref, buildCompletedSnapshot());

    expect(screen.getByTestId("cost-calculated-resin-volume")).toHaveTextContent("10.2 L");
    expect(screen.queryByRole("spinbutton", { name: "Calculated resin volume" })).not.toBeInTheDocument();

    const quantity = screen.getByLabelText("Resin quantity for costing");
    expect(quantity).toHaveValue(10.2);
    expect(quantityUnitSuffix()).toHaveTextContent("L");

    await user.clear(quantity);
    await user.type(quantity, "15");
    expect(quantity).toHaveValue(15);
    expect(screen.getByTestId("cost-calculated-resin-volume")).toHaveTextContent("10.2 L");
  });

  it("calculates resin, labor, project cost, and suggested selling price", async () => {
    const ref = createRef();
    const user = userEvent.setup();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />);
    await restoreSnapshot(ref, buildCompletedSnapshot());

    await user.clear(screen.getByLabelText("Resin quantity for costing"));
    await user.type(screen.getByLabelText("Resin quantity for costing"), "15");
    await user.type(costPerUnitField(), "20");
    await user.type(screen.getByLabelText("Wood cost"), "150");
    await user.type(screen.getByLabelText("Mold, consumables & accessories"), "75");
    await user.type(screen.getByLabelText("Labor hours"), "12");
    await user.type(screen.getByLabelText("Hourly labor rate"), "25");
    await user.type(screen.getByLabelText("Desired profit / markup"), "25");

    expect(screen.getByTestId("cost-resin-total")).toHaveTextContent("300.00");
    expect(screen.getByTestId("cost-labor-total")).toHaveTextContent("300.00");
    expect(screen.getByTestId("cost-estimated-project-cost")).toHaveTextContent("825.00");
    expect(screen.getByTestId("cost-suggested-selling-price")).toHaveTextContent("1031.25");
  });

  it("treats empty costing fields as zero and strips negative signs from input", async () => {
    const ref = createRef();
    const user = userEvent.setup();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />);
    await restoreSnapshot(ref, buildCompletedSnapshot());

    expect(screen.getByTestId("cost-resin-total")).toHaveTextContent("0.00");
    expect(screen.getByTestId("cost-labor-total")).toHaveTextContent("0.00");
    expect(screen.getByTestId("cost-estimated-project-cost")).toHaveTextContent("0.00");

    await user.type(screen.getByLabelText("Wood cost"), "-50");
    expect(screen.getByLabelText("Wood cost")).toHaveValue(50);
    expect(screen.getByTestId("cost-estimated-project-cost")).toHaveTextContent("50.00");
    expect(screen.getByTestId("cost-suggested-selling-price")).toHaveTextContent("50.00");
  });

  it("keeps a manual costing quantity when the calculated resin volume later changes", async () => {
    const ref = createRef();
    const user = userEvent.setup();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />);
    await restoreSnapshot(ref, buildCompletedSnapshot());

    const quantity = screen.getByLabelText("Resin quantity for costing");
    await user.clear(quantity);
    await user.type(quantity, "15");

    const snapshot = ref.current.getProjectSnapshot();
    await restoreSnapshot(ref, {
      ...snapshot,
      result: { ...COST_RESULT, volumeLiters: 8.4, recommendedVolumeLiters: 9.24 },
    });

    expect(screen.getByTestId("cost-calculated-resin-volume")).toHaveTextContent("8.4 L");
    expect(screen.getByLabelText("Resin quantity for costing")).toHaveValue(15);
  });

  it("round-trips costing values through canonical save/open mapping", async () => {
    const ref = createRef();
    const user = userEvent.setup();
    const first = renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );
    await restoreSnapshot(ref, buildCompletedSnapshot());

    await user.clear(screen.getByLabelText("Resin quantity for costing"));
    await user.type(screen.getByLabelText("Resin quantity for costing"), "15");
    await user.type(costPerUnitField(), "20");
    await user.type(screen.getByLabelText("Wood cost"), "150");

    const snapshot = ref.current.getProjectSnapshot();
    expect(snapshot.projectCostEstimate.resinCostQuantityLiters).toBe(15);
    expect(snapshot.projectCostEstimate.resinCostPerLiter).toBe(20);
    expect(snapshot.projectCostEstimate.woodCost).toBe(150);
    expect(snapshot.projectCostEstimate.resinTotal).toBeUndefined();

    const mapped = mapCanonicalV2ToCalculatorSnapshot(
      mapCalculatorSnapshotToCanonicalV2(snapshot, { projectName: "Costed Table" }),
    );
    expect(mapped.projectCostEstimate.resinCostQuantityLiters).toBe(15);

    first.unmount();
    const second = createRef();
    renderCalculator(<ResinCalculator ref={second} showHeader={false} workspaceVariant="dedicated" />);
    await restoreSnapshot(second, mapped);

    expect(screen.getByLabelText("Resin quantity for costing")).toHaveValue(15);
    expect(costPerUnitField()).toHaveValue(20);
    expect(screen.getByLabelText("Wood cost")).toHaveValue(150);
  });

  it("loads older projects without costing data and follows calculated volume", async () => {
    const ref = createRef();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />);
    const snapshot = buildCompletedSnapshot();
    expect(snapshot.projectCostEstimate).toBeUndefined();
    await restoreSnapshot(ref, snapshot);

    expect(screen.getByText("Project Cost Estimate")).toBeInTheDocument();
    expect(screen.getByLabelText("Resin quantity for costing")).toHaveValue(10.2);
    expect(ref.current.getProjectSnapshot().projectCostEstimate).toBeUndefined();
  });

  it("displays and edits resin volumes in the selected non-liter unit", async () => {
    const ref = createRef();
    const user = userEvent.setup();
    const expectedFlOz = Number(formatVolumeFromLiters(COST_RESULT.volumeLiters, "fl_oz"));
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />);
    await restoreSnapshot(ref, buildCompletedSnapshot());

    await user.click(screen.getByRole("button", { name: "set-volume-fl-oz" }));

    await waitFor(() => {
      expect(screen.getByTestId("cost-calculated-resin-volume")).toHaveTextContent(
        `${formatVolumeFromLiters(COST_RESULT.volumeLiters, "fl_oz")} fl oz`,
      );
    });
    expect(screen.getByLabelText("Resin quantity for costing")).toHaveValue(expectedFlOz);
    expect(quantityUnitSuffix()).toHaveTextContent("fl oz");
    expect(costPerUnitField("fl_oz")).toBeInTheDocument();
  });

  it("does not treat a volume-unit change as a costing-quantity override", async () => {
    const ref = createRef();
    const user = userEvent.setup();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />);
    await restoreSnapshot(ref, buildCompletedSnapshot());

    await user.click(screen.getByRole("button", { name: "set-volume-fl-oz" }));
    await waitFor(() => {
      expect(quantityUnitSuffix()).toHaveTextContent("fl oz");
    });

    expect(ref.current.getProjectSnapshot().projectCostEstimate).toBeUndefined();
    expect(screen.getByLabelText("Resin quantity for costing")).toHaveValue(
      Number(formatVolumeFromLiters(COST_RESULT.volumeLiters, "fl_oz")),
    );
  });

  it("keeps physical quantity and resin total stable when switching units", async () => {
    const ref = createRef();
    const user = userEvent.setup();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />);
    await restoreSnapshot(ref, buildCompletedSnapshot());

    await user.type(costPerUnitField(), "20");
    expect(screen.getByTestId("cost-resin-total")).toHaveTextContent("204.00");
    expect(ref.current.getProjectSnapshot().projectCostEstimate.resinCostPerLiter).toBe(20);

    await user.click(screen.getByRole("button", { name: "set-volume-fl-oz" }));
    await waitFor(() => {
      expect(quantityUnitSuffix()).toHaveTextContent("fl oz");
    });

    expect(costPerUnitField("fl_oz")).toHaveValue(Number(formatCostPerDisplayUnit("20", "fl_oz")));
    expect(screen.getByTestId("cost-resin-total")).toHaveTextContent("204.00");
    expect(ref.current.getProjectSnapshot().projectCostEstimate.resinCostPerLiter).toBe(20);
    expect(ref.current.getProjectSnapshot().projectCostEstimate.resinCostQuantityLiters).toBeNull();
  });

  it("keeps a manual costing quantity as the same physical amount after unit changes", async () => {
    const ref = createRef();
    const user = userEvent.setup();
    renderCalculator(<ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />);
    await restoreSnapshot(ref, buildCompletedSnapshot());

    await user.click(screen.getByRole("button", { name: "set-volume-fl-oz" }));
    await waitFor(() => {
      expect(quantityUnitSuffix()).toHaveTextContent("fl oz");
    });

    const quantity = screen.getByLabelText("Resin quantity for costing");
    fireEvent.change(quantity, { target: { value: "60" } });
    expect(ref.current.getProjectSnapshot().projectCostEstimate.resinCostQuantityLiters).toBeCloseTo(
      volumeToLiters(60, "fl_oz"),
      5,
    );

    await user.click(screen.getByRole("button", { name: "set-volume-L" }));
    await waitFor(() => {
      expect(quantityUnitSuffix()).toHaveTextContent("L");
    });

    expect(quantity).toHaveValue(Number(formatVolumeFromLiters(volumeToLiters(60, "fl_oz"), "L")));
    expect(ref.current.getProjectSnapshot().projectCostEstimate.resinCostQuantityLiters).toBeCloseTo(
      volumeToLiters(60, "fl_oz"),
      5,
    );
  });
});
