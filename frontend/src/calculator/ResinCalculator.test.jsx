import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import ResinCalculator from "./ResinCalculator.jsx";
import { HFZ_PROJECT_IMPORT_ACCEPT } from "../projectFileTypes.js";
import { VALID_CALCULATOR_SNAPSHOT } from "../project/projectFileTestFixtures.js";
import { TestProviders } from "../test/TestProviders.jsx";

function renderCalculator(ui) {
  return render(<TestProviders>{ui}</TestProviders>);
}

// Canvas methods not implemented in jsdom
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

describe("ResinCalculator — smoke", () => {
  it("renders without crashing and shows upload controls", () => {
    renderCalculator(<ResinCalculator />);
    const fileInput = document.querySelector("input[type='file'][accept='image/*']");
    expect(fileInput).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import Project/i })).toBeInTheDocument();
    expect(screen.getByText("References")).toBeInTheDocument();
    expect(screen.getByText("Calculate")).toBeInTheDocument();
  });

  it("keeps project action controls in safe initial state", () => {
    renderCalculator(<ResinCalculator />);
    expect(screen.getByText(/Save Project/i)).toBeInTheDocument();
    const pdfBtn = screen.getByText(/Export PDF/i).closest("button");
    expect(pdfBtn).toBeDisabled();
  });
});

describe("ResinCalculator — header behavior", () => {
  it("renders legacy AppHeader by default", () => {
    renderCalculator(<ResinCalculator />);
    expect(screen.getByText(/Epoxy Resin Volume Estimator/i)).toBeInTheDocument();
  });

  it("hides legacy AppHeader when showHeader is false", () => {
    renderCalculator(<ResinCalculator showHeader={false} />);
    expect(screen.queryByText(/Epoxy Resin Volume Estimator/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import Project/i })).toBeInTheDocument();
  });

  it("omits duplicate product title when workspaceVariant is dedicated", () => {
    renderCalculator(<ResinCalculator showHeader={false} workspaceVariant="dedicated" />);
    expect(
      screen.queryByText(/River Table & Woodworking Resin Calculator/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import Project/i })).toBeInTheDocument();
  });

  it("accepts HFZWood project files and legacy JSON project files for import", () => {
    renderCalculator(<ResinCalculator />);
    const importInput = document.querySelector(
      `input[type='file'][accept='${HFZ_PROJECT_IMPORT_ACCEPT}']`,
    );

    expect(importInput).toBeInTheDocument();
    expect(HFZ_PROJECT_IMPORT_ACCEPT).toContain(".hfzproject");
    expect(HFZ_PROJECT_IMPORT_ACCEPT).toContain("application/json");
    expect(HFZ_PROJECT_IMPORT_ACCEPT).toContain(".json");
  });
});

describe("ResinCalculator — UI state", () => {
  it("shows save error when no image exists", async () => {
    renderCalculator(<ResinCalculator />);
    fireEvent.click(screen.getByText(/Save Project/i));
    await waitFor(() => {
      expect(document.querySelector(".error")).toBeInTheDocument();
    });
  });
});

describe("ResinCalculator — /calculate-wood fetch errors", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));
  });

  it("keeps initial workflow visible when no image is provided", () => {
    renderCalculator(<ResinCalculator />);
    expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
  });
});

describe("ResinCalculator — read-only persistent mutations", () => {
  let restoreImage;

  const WOOD_AND_CAVITY_SNAPSHOT = {
    ...VALID_CALCULATOR_SNAPSHOT,
    ui: {
      calculationMode: "wood",
      selectedMode: "edit",
      rotationDeg: 0,
      zoomFactor: 1,
      selectedShape: { type: "wood", index: 0 },
      measurementsComplete: true,
    },
    woodBoundaryMode: {
      useImageBorderAsMold: false,
      moldBoundaryPoints: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      woodBoundaryPolygons: [
        [
          { x: 10, y: 10 },
          { x: 40, y: 10 },
          { x: 40, y: 40 },
        ],
      ],
      currentWoodBoundaryPoints: [],
      cavities: [
        {
          name: "Cavity 1",
          points: [
            { x: 60, y: 60 },
            { x: 90, y: 60 },
            { x: 90, y: 90 },
          ],
          depthMm: "12",
        },
      ],
      cavityDepthsMm: ["12"],
      useMainDepthForCavities: false,
      currentCavityPoints: [],
      mainResinDepthMm: "20",
      resinMixRatio: "2:1",
    },
  };

  beforeEach(() => {
    restoreImage = installPersistentImageMock();
  });

  afterEach(() => {
    restoreImage();
  });

  async function restoreSnapshot(ref, snapshot) {
    act(() => {
      ref.current.restoreProjectSnapshot(snapshot);
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
    });
  }

  it("allows owned projects to delete a reference measurement", async () => {
    const user = userEvent.setup();
    const ref = createRef();

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );

    await restoreSnapshot(ref, VALID_CALCULATOR_SNAPSHOT);

    await user.click(screen.getByText("Reference Measurements"));

    await waitFor(() => {
      expect(screen.getByText(/Reference 1/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText(/Reference 1/i)).not.toBeInTheDocument();
    });
  });

  it("blocks reference measurement deletion in read-only mode", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    const onDirtyChange = vi.fn();

    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        readOnly
        onDirtyChange={onDirtyChange}
      />,
    );

    await restoreSnapshot(ref, VALID_CALCULATOR_SNAPSHOT);

    await user.click(screen.getByText("Reference Measurements"));

    await waitFor(() => {
      expect(screen.getByText(/Reference 1/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(deleteButton).toBeDisabled();
    fireEvent.click(deleteButton);

    expect(ref.current.getProjectSnapshot().calibration.referenceMeasurements).toHaveLength(1);
    expect(onDirtyChange).toHaveBeenCalledWith(false);
  });

  it("blocks wood island deletion in read-only mode", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    const onDirtyChange = vi.fn();

    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        readOnly
        onDirtyChange={onDirtyChange}
      />,
    );

    await restoreSnapshot(ref, WOOD_AND_CAVITY_SNAPSHOT);

    expect(screen.getByText("Wood Island 1")).toBeInTheDocument();
    const deleteButton = screen.getByRole("button", { name: "Delete Wood Island 1" });
    expect(deleteButton).toBeDisabled();
    fireEvent.click(deleteButton);

    expect(ref.current.getProjectSnapshot().woodBoundaryMode.woodBoundaryPolygons).toHaveLength(1);
    expect(onDirtyChange).toHaveBeenCalledWith(false);
  });

  it("allows owned projects to delete a wood island", async () => {
    const user = userEvent.setup();
    const ref = createRef();

    renderCalculator(
      <ResinCalculator ref={ref} showHeader={false} workspaceVariant="dedicated" />,
    );

    await restoreSnapshot(ref, WOOD_AND_CAVITY_SNAPSHOT);

    await user.click(screen.getByRole("button", { name: "Delete Wood Island 1" }));

    await waitFor(() => {
      expect(screen.queryByText("Wood Island 1")).not.toBeInTheDocument();
    });
  });

  it("blocks cavity deletion in read-only mode", async () => {
    const ref = createRef();
    const onDirtyChange = vi.fn();

    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        readOnly
        onDirtyChange={onDirtyChange}
      />,
    );

    await restoreSnapshot(ref, WOOD_AND_CAVITY_SNAPSHOT);

    expect(screen.getByText("Cavity 1")).toBeInTheDocument();
    const deleteButton = screen.getByRole("button", { name: "Delete Cavity 1" });
    expect(deleteButton).toBeDisabled();
    fireEvent.click(deleteButton);

    expect(ref.current.getProjectSnapshot().woodBoundaryMode.cavities).toHaveLength(1);
    expect(onDirtyChange).toHaveBeenCalledWith(false);
  });

  it("blocks clearing all cavities in read-only mode", async () => {
    const ref = createRef();
    const onDirtyChange = vi.fn();

    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        readOnly
        onDirtyChange={onDirtyChange}
      />,
    );

    await restoreSnapshot(ref, WOOD_AND_CAVITY_SNAPSHOT);

    const clearButton = screen.getByRole("button", { name: "Clear All Cavities" });
    expect(clearButton).toBeDisabled();
    fireEvent.click(clearButton);

    expect(ref.current.getProjectSnapshot().woodBoundaryMode.cavities).toHaveLength(1);
    expect(onDirtyChange).toHaveBeenCalledWith(false);
  });

  it("keeps session-only zoom available in read-only mode", async () => {
    const user = userEvent.setup();
    const ref = createRef();
    const onDirtyChange = vi.fn();

    renderCalculator(
      <ResinCalculator
        ref={ref}
        showHeader={false}
        workspaceVariant="dedicated"
        readOnly
        onDirtyChange={onDirtyChange}
      />,
    );

    await restoreSnapshot(ref, VALID_CALCULATOR_SNAPSHOT);

    await user.click(screen.getByRole("button", { name: "Zoom In" }));

    expect(screen.getByText(/Zoom:\s*240%/i)).toBeInTheDocument();
    expect(onDirtyChange).toHaveBeenCalledWith(false);
  });
});
