import { describe, expect, it } from "vitest";
import {
  cmToLength,
  formatLengthFromCm,
  formatLengthFromMm,
  formatVolumeFromLiters,
  lengthToCm,
  lengthToMm,
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

  it("converts liters to and from display volume units", () => {
    expect(formatVolumeFromLiters(1, "L")).toBe("1");
    expect(volumeToLiters("1000", "ml")).toBe(1);
    expect(volumeToLiters("1", "L")).toBe(1);
  });
});
