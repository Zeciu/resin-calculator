import { describe, expect, it } from "vitest";
import {
  DEFAULT_RESIN_DENSITY_KG_PER_LITER,
  formatEstimatedResinMass,
  formatResinDensityInput,
  mixedResinMassKg,
  parseResinDensityKgPerLiter,
  resolveResinDensityKgPerLiter,
} from "./resinMassConversion.js";

describe("resinMassConversion", () => {
  it("converts 1.652 L at 1.10 kg/L to about 1.82 kg", () => {
    expect(mixedResinMassKg(1.652, 1.1)).toBeCloseTo(1.8172, 6);
    expect(formatEstimatedResinMass(1.652, 1.1)).toBe("1.82 kg");
  });

  it("converts 1.502 L at 1.10 kg/L to about 1.65 kg", () => {
    expect(mixedResinMassKg(1.502, 1.1)).toBeCloseTo(1.6522, 6);
    expect(formatEstimatedResinMass(1.502, 1.1)).toBe("1.65 kg");
  });

  it("converts 0.205 L at 1.10 kg/L to about 226 g", () => {
    expect(mixedResinMassKg(0.205, 1.1)).toBeCloseTo(0.2255, 6);
    expect(formatEstimatedResinMass(0.205, 1.1)).toBe("226 g");
  });

  it("converts 0.050 L at 1.10 kg/L to 55 g", () => {
    expect(formatEstimatedResinMass(0.05, 1.1)).toBe("55 g");
  });

  it("switches to kg at 0.910 L / 1.10 kg/L", () => {
    expect(mixedResinMassKg(0.91, 1.1)).toBeCloseTo(1.001, 6);
    expect(formatEstimatedResinMass(0.91, 1.1)).toBe("1.00 kg");
  });

  it("converts 7.2 L at 1.10 kg/L to 7.92 kg", () => {
    expect(mixedResinMassKg(7.2, 1.1)).toBeCloseTo(7.92, 6);
    expect(formatEstimatedResinMass(7.2, 1.1)).toBe("7.92 kg");
  });

  it("formats zero volume as 0 g", () => {
    expect(mixedResinMassKg(0, 1.1)).toBe(0);
    expect(formatEstimatedResinMass(0, 1.1)).toBe("0 g");
  });

  it("returns null for missing volume or invalid density", () => {
    expect(mixedResinMassKg(null, 1.1)).toBeNull();
    expect(mixedResinMassKg(undefined, 1.1)).toBeNull();
    expect(mixedResinMassKg(1.5, 0)).toBeNull();
    expect(mixedResinMassKg(1.5, -1)).toBeNull();
    expect(mixedResinMassKg(1.5, Number.NaN)).toBeNull();
    expect(formatEstimatedResinMass(1.5, null)).toBeNull();
  });

  it("rejects non-positive and out-of-range density input", () => {
    expect(parseResinDensityKgPerLiter("")).toBeNull();
    expect(parseResinDensityKgPerLiter("0")).toBeNull();
    expect(parseResinDensityKgPerLiter("-1")).toBeNull();
    expect(parseResinDensityKgPerLiter("0.4")).toBeNull();
    expect(parseResinDensityKgPerLiter("2.1")).toBeNull();
    expect(parseResinDensityKgPerLiter("abc")).toBeNull();
    expect(parseResinDensityKgPerLiter("1.10")).toBeCloseTo(1.1, 6);
    expect(parseResinDensityKgPerLiter("0.5")).toBe(0.5);
    expect(parseResinDensityKgPerLiter("2")).toBe(2);
  });

  it("falls back to 1.10 kg/L when density is missing", () => {
    expect(DEFAULT_RESIN_DENSITY_KG_PER_LITER).toBeCloseTo(1.1, 6);
    expect(resolveResinDensityKgPerLiter(undefined)).toBeCloseTo(1.1, 6);
    expect(formatResinDensityInput(undefined)).toBe("1.10");
    expect(formatResinDensityInput(1.1)).toBe("1.10");
  });
});
