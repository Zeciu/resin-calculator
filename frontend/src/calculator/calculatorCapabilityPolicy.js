import { CAPABILITY_KEYS } from "../capabilities/capabilityKeys.js";

export const POLYGON_KIND_LABELS = {
  mold: "mold boundary",
  wood: "wood island",
  cavity: "cavity",
  standard: "resin area",
};

/**
 * @param {number} currentCount
 * @param {number | null | undefined} maxPoints
 * @returns {boolean}
 */
export function canAddPolygonPoint(currentCount, maxPoints) {
  if (maxPoints == null || maxPoints === undefined) {
    return true;
  }
  return currentCount < maxPoints;
}

/**
 * @param {number} maxPoints
 * @param {"mold" | "wood" | "cavity" | "standard" | string} [polygonKind]
 */
export function polygonPointLimitMessage(maxPoints, polygonKind = "polygon") {
  const label = POLYGON_KIND_LABELS[polygonKind] ?? "polygon";
  return `This ${label} is limited to ${maxPoints} points for new projects on this account.`;
}

/**
 * @param {boolean} enforceAccountCapabilities
 * @param {{
 *   maxPolygonPoints?: number | null;
 *   layerCalculation?: boolean;
 *   pdfExport?: boolean;
 *   advancedReports?: boolean;
 * }} accountCapabilities
 * @returns {{
 *   maxPolygonPoints: number | null;
 *   layerCalculation: boolean;
 *   pdfExport: boolean;
 *   advancedReports: boolean;
 * }}
 */
export function resolveEffectiveCalculatorCapabilities(
  enforceAccountCapabilities,
  accountCapabilities,
) {
  if (!enforceAccountCapabilities) {
    return {
      maxPolygonPoints: null,
      layerCalculation: true,
      pdfExport: true,
      advancedReports: true,
    };
  }

  return {
    maxPolygonPoints:
      accountCapabilities.maxPolygonPoints == null
        ? null
        : Number(accountCapabilities.maxPolygonPoints),
    layerCalculation: Boolean(accountCapabilities.layerCalculation),
    pdfExport: Boolean(accountCapabilities.pdfExport),
    advancedReports: Boolean(accountCapabilities.advancedReports),
  };
}

export { CAPABILITY_KEYS };
