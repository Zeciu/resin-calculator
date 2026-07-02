import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NewProjectWorkspace from "./NewProjectWorkspace.jsx";

HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: () => {},
  fillRect: () => {},
  drawImage: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  setLineDash: () => {},
  measureText: () => ({ width: 0 }),
  fillText: () => {},
});

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("NewProjectWorkspace", () => {
  it("renders the calculator without duplicate product title chrome", () => {
    render(<NewProjectWorkspace />);

    expect(screen.getByRole("button", { name: /Import Project/i })).toBeInTheDocument();
    expect(screen.getByText("References")).toBeInTheDocument();
    expect(
      screen.queryByText(/River Table & Woodworking Resin Calculator/i),
    ).not.toBeInTheDocument();
  });
});
