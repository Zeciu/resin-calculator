import { describe, expect, it } from "vitest";
import {
  cmToLength,
  formatLengthFromCm,
  formatLengthFromMm,
  formatVolumeFromLiters,
  lengthToCm,
  lengthToMm,
  parseCanonicalMm,
  storeCanonicalLitersFromDisplay,
  storeCanonicalMmFromDisplay,
  volumeToLiters,
} from "./conversion.js";

describe("unit conversion", () => {
  it("converts centimeters to and from display length units", () => {
    expect(formatLengthFromCm(10, "cm")).toBe("10");
    expect(lengthToCm("10", "cm")).toBe(10);
    expect(lengthToCm("1", "m")).toBe(100);
    expect(formatLengthFromCm(2.54, "in")).toBe("1");
  });

  it("converts millimeters to and from display length units", () => {
    expect(formatLengthFromMm(50, "mm")).toBe("50");
    expect(lengthToMm("5", "cm")).toBe(50);
    expect(lengthToMm("2", "in")).toBeCloseTo(50.8, 1);
  });

  it("maps preferred-unit entries to canonical millimetres once", () => {
    expect(lengthToMm("20", "mm")).toBe(20);
    expect(lengthToMm("2", "cm")).toBe(20);
    expect(lengthToMm("2.5", "cm")).toBe(25);
    expect(lengthToMm("150", "mm")).toBe(150);
    expect(lengthToMm("1", "in")).toBeCloseTo(25.4, 5);
  });

  it("stores display input as canonical millimetres without a second conversion", () => {
    expect(storeCanonicalMmFromDisplay("2", "cm")).toBe("20");
    expect(storeCanonicalMmFromDisplay("20", "mm")).toBe("20");
    expect(parseCanonicalMm(storeCanonicalMmFromDisplay("2", "cm"))).toBe(20);
    expect(parseCanonicalMm("20")).toBe(20);
    expect(parseCanonicalMm("")).toBeNaN();
  });

  it("converts liters to and from display volume units", () => {
    expect(formatVolumeFromLiters(1, "L")).toBe("1");
    expect(volumeToLiters("1000", "ml")).toBe(1);
    expect(volumeToLiters("1", "L")).toBe(1);
    expect(Number(formatVolumeFromLiters(1.43, "fl_oz"))).toBeCloseTo(48.354, 3);
    expect(volumeToLiters(formatVolumeFromLiters(1.43, "fl_oz"), "fl_oz")).toBeCloseTo(1.43, 3);
  });

  it("stores display volume input as canonical liters", () => {
    expect(storeCanonicalLitersFromDisplay("1.43", "L")).toBe("1.43");
    expect(Number(storeCanonicalLitersFromDisplay("60", "fl_oz"))).toBeCloseTo(volumeToLiters(60, "fl_oz"));
    expect(storeCanonicalLitersFromDisplay("", "fl_oz")).toBe("");
  });
});
