import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LengthUnitInput } from "./LengthUnitInput.jsx";

describe("LengthUnitInput", () => {
  it("shows a non-editable mm suffix beside the numeric value", () => {
    render(
      <label>
        Depth (mm)
        <LengthUnitInput unit="mm" value="20" onChange={() => {}} />
      </label>,
    );

    const input = screen.getByLabelText(/Depth \(mm\)/i);
    expect(input).toHaveValue(20);
    expect(input.value).toBe("20");
    expect(input.value).not.toMatch(/mm/);
    expect(screen.getByTestId("length-unit-suffix")).toHaveTextContent("mm");
  });

  it("shows a cm suffix without putting it in the numeric value", () => {
    render(
      <label>
        Depth (cm)
        <LengthUnitInput unit="cm" value="2" onChange={() => {}} />
      </label>,
    );

    const input = screen.getByLabelText(/Depth \(cm\)/i);
    expect(input).toHaveValue(2);
    expect(input.value).toBe("2");
    expect(screen.getByTestId("length-unit-suffix")).toHaveTextContent("cm");
  });
});
