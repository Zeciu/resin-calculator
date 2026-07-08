import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ResinCalculator from "./ResinCalculator.jsx";
import { HFZ_PROJECT_IMPORT_ACCEPT } from "../projectFileTypes.js";
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
