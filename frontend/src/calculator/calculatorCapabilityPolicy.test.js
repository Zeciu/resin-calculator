import { describe, expect, it } from "vitest";
import {
  canAddPolygonPoint,
  polygonPointLimitMessage,
  resolveEffectiveCalculatorCapabilities,
} from "./calculatorCapabilityPolicy.js";

describe("calculatorCapabilityPolicy", () => {
  it("allows unlimited polygon points when max is null", () => {
    expect(canAddPolygonPoint(100, null)).toBe(true);
  });

  it("blocks polygon additions at the configured free limit", () => {
    expect(canAddPolygonPoint(3, 4)).toBe(true);
    expect(canAddPolygonPoint(4, 4)).toBe(false);
  });

  it("formats polygon limit feedback for each polygon kind", () => {
    expect(polygonPointLimitMessage(4, "mold")).toContain("mold boundary");
    expect(polygonPointLimitMessage(4, "wood")).toContain("wood island");
    expect(polygonPointLimitMessage(4, "cavity")).toContain("cavity");
    expect(polygonPointLimitMessage(4, "standard")).toContain("resin area");
  });

  it("bypasses account restrictions for established project sessions", () => {
    expect(
      resolveEffectiveCalculatorCapabilities(false, {
        maxPolygonPoints: 4,
        layerCalculation: false,
        pdfExport: false,
        advancedReports: false,
      }),
    ).toEqual({
      maxPolygonPoints: null,
      layerCalculation: true,
      pdfExport: true,
      advancedReports: true,
    });
  });

  it("applies account restrictions for new project sessions", () => {
    expect(
      resolveEffectiveCalculatorCapabilities(true, {
        maxPolygonPoints: 4,
        layerCalculation: false,
        pdfExport: false,
        advancedReports: false,
      }),
    ).toEqual({
      maxPolygonPoints: 4,
      layerCalculation: false,
      pdfExport: false,
      advancedReports: false,
    });
  });
});
