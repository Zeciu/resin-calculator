import { useCapability, useCapabilityLimit } from "../capabilities/CapabilitiesContext.jsx";
import {
  CAPABILITY_KEYS,
  resolveEffectiveCalculatorCapabilities,
} from "./calculatorCapabilityPolicy.js";

/**
 * @param {boolean} enforceAccountCapabilities
 */
export function useCalculatorCapabilityEnforcement(enforceAccountCapabilities) {
  const maxPolygonPoints = useCapabilityLimit(CAPABILITY_KEYS.CALCULATOR_MAX_POLYGON_POINTS);
  const layerCalculation = useCapability(CAPABILITY_KEYS.CALCULATOR_LAYER_CALCULATION);
  const pdfExport = useCapability(CAPABILITY_KEYS.CALCULATOR_PDF_EXPORT);
  const advancedReports = useCapability(CAPABILITY_KEYS.CALCULATOR_ADVANCED_REPORTS);

  return resolveEffectiveCalculatorCapabilities(enforceAccountCapabilities, {
    maxPolygonPoints,
    layerCalculation,
    pdfExport,
    advancedReports,
  });
}
