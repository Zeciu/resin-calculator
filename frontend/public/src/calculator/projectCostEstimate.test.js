import { describe, expect, it } from "vitest";
import {
  calculateProjectCostEstimate,
  deserializeProjectCostEstimate,
  formatCostAmount,
  formatCostPerDisplayUnit,
  hasMeaningfulCostEstimateInput,
  parseNonNegativeNumber,
  resolveResinCostQuantityLiters,
  sanitizeCostInputValue,
  serializeProjectCostEstimate,
  storeCanonicalCostPerLiterFromDisplay,
} from "./projectCostEstimate.js";
import { formatVolumeFromLiters, volumeToLiters } from "../units/conversion.js";

describe("projectCostEstimate math", () => {
  it("treats empty optional fields as zero", () => {
    expect(
      calculateProjectCostEstimate({
        resinQuantityLiters: "",
        resinCostPerLiter: "",
        woodCost: "",
        otherProjectCosts: "",
        laborHours: "",
        laborHourlyRate: "",
        desiredMarkupPercent: "",
      }),
    ).toEqual({
      resinTotal: 0,
      laborTotal: 0,
      estimatedProjectCost: 0,
      suggestedSellingPrice: 0,
    });
  });

  it("calculates resin, labor, project cost, and markup selling price", () => {
    const totals = calculateProjectCostEstimate({
      resinQuantityLiters: 15,
      resinCostPerLiter: 20,
      woodCost: 150,
      otherProjectCosts: 75,
      laborHours: 12,
      laborHourlyRate: 25,
      desiredMarkupPercent: 25,
    });

    expect(totals.resinTotal).toBe(300);
    expect(totals.laborTotal).toBe(300);
    expect(totals.estimatedProjectCost).toBe(825);
    expect(totals.suggestedSellingPrice).toBe(1031.25);
  });

  it("normalizes negative, NaN, and Infinity values to zero", () => {
    expect(parseNonNegativeNumber(-4)).toBe(0);
    expect(parseNonNegativeNumber("not-a-number")).toBe(0);
    expect(parseNonNegativeNumber(Infinity)).toBe(0);
    expect(formatCostAmount(NaN)).toBe("0.00");
    expect(formatCostAmount(Infinity)).toBe("0.00");
    expect(formatCostAmount(-10)).toBe("0.00");
    expect(sanitizeCostInputValue("-12.5")).toBe("12.5");
    expect(
      calculateProjectCostEstimate({
        resinQuantityLiters: Infinity,
        resinCostPerLiter: NaN,
        woodCost: -8,
        otherProjectCosts: "abc",
        laborHours: Infinity,
        laborHourlyRate: 25,
        desiredMarkupPercent: -10,
      }),
    ).toEqual({
      resinTotal: 0,
      laborTotal: 0,
      estimatedProjectCost: 0,
      suggestedSellingPrice: 0,
    });
  });

  it("follows calculated resin volume until the costing quantity is overridden", () => {
    expect(
      resolveResinCostQuantityLiters({
        calculatedVolumeLiters: 10.2,
        resinCostQuantityInput: "15",
        resinCostQuantityFollowsCalculated: true,
      }),
    ).toBeCloseTo(10.2);
    expect(
      resolveResinCostQuantityLiters({
        calculatedVolumeLiters: 10.2,
        resinCostQuantityInput: "15",
        resinCostQuantityFollowsCalculated: false,
      }),
    ).toBe(15);
  });
});

describe("projectCostEstimate persistence", () => {
  it("omits empty costing data and restores older projects safely", () => {
    expect(
      serializeProjectCostEstimate({
        resinCostQuantityInput: "",
        resinCostQuantityFollowsCalculated: true,
        resinCostPerLiterInput: "",
        woodCostInput: "",
        otherProjectCostsInput: "",
        laborHoursInput: "",
        laborHourlyRateInput: "",
        desiredMarkupPercentInput: "",
      }),
    ).toBeNull();

    const restored = deserializeProjectCostEstimate(undefined);
    expect(restored.resinCostQuantityFollowsCalculated).toBe(true);
    expect(hasMeaningfulCostEstimateInput(restored)).toBe(false);
  });

  it("persists a manual resin costing quantity independently of calculated volume", () => {
    const stored = serializeProjectCostEstimate({
      resinCostQuantityInput: "15",
      resinCostQuantityFollowsCalculated: false,
      resinCostPerLiterInput: "20",
      woodCostInput: "150",
      otherProjectCostsInput: "75",
      laborHoursInput: "12",
      laborHourlyRateInput: "25",
      desiredMarkupPercentInput: "25",
    });

    expect(stored.resinCostQuantityLiters).toBe(15);
    expect(stored.resinTotal).toBeUndefined();
    expect(stored.estimatedProjectCost).toBeUndefined();

    const restored = deserializeProjectCostEstimate(stored);
    expect(restored.resinCostQuantityFollowsCalculated).toBe(false);
    expect(restored.resinCostQuantityInput).toBe("15");
    expect(hasMeaningfulCostEstimateInput(restored)).toBe(true);
  });
});

describe("projectCostEstimate volume units", () => {
  it("converts cost per liter to the selected volume unit without changing resin total", () => {
    expect(
      calculateProjectCostEstimate({
        resinQuantityLiters: 15,
        resinCostPerLiter: 20,
        woodCost: "",
        otherProjectCosts: "",
        laborHours: "",
        laborHourlyRate: "",
        desiredMarkupPercent: "",
      }).resinTotal,
    ).toBe(300);
    expect(Number(storeCanonicalCostPerLiterFromDisplay(formatCostPerDisplayUnit("20", "fl_oz"), "fl_oz"))).toBeCloseTo(
      20,
      2,
    );
    const displayQuantity = Number(formatVolumeFromLiters(15, "fl_oz"));
    const displayCost = Number(formatCostPerDisplayUnit("20", "fl_oz"));
    expect(displayCost * displayQuantity).toBeCloseTo(300, 1);
  });

  it("stores an edited display-unit quantity as canonical liters", () => {
    expect(volumeToLiters("15", "L")).toBe(15);
    expect(volumeToLiters("60", "fl_oz")).toBeCloseTo(1.77441, 4);
  });
});
