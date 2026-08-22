import { describe, expect, it } from "vitest";
import {
  CALCULATOR_API_KIND,
  getCalculatorApiPath,
} from "./calculatorApi.js";
import {
  DEMO_CALCULATE_FIRST_FILL_PATH,
  DEMO_CALCULATE_POUR_LAYERS_PATH,
  DEMO_CALCULATE_WOOD_PATH,
} from "../demo/demoConstants.js";

describe("getCalculatorApiPath", () => {
  it("selects public demo endpoints only in demo mode", () => {
    expect(getCalculatorApiPath(CALCULATOR_API_KIND.WOOD, true)).toBe(DEMO_CALCULATE_WOOD_PATH);
    expect(getCalculatorApiPath(CALCULATOR_API_KIND.FIRST_FILL, true)).toBe(
      DEMO_CALCULATE_FIRST_FILL_PATH,
    );
    expect(getCalculatorApiPath(CALCULATOR_API_KIND.POUR_LAYERS, true)).toBe(
      DEMO_CALCULATE_POUR_LAYERS_PATH,
    );
  });

  it("keeps authenticated calculator endpoints in normal mode", () => {
    expect(getCalculatorApiPath(CALCULATOR_API_KIND.WOOD, false)).toBe("/calculate-wood");
    expect(getCalculatorApiPath(CALCULATOR_API_KIND.FIRST_FILL, false)).toBe("/calculate-first-fill");
    expect(getCalculatorApiPath(CALCULATOR_API_KIND.POUR_LAYERS, false)).toBe(
      "/calculate-pour-layers",
    );
  });
});
