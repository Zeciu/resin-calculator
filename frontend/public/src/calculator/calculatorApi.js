import { buildAuthHeaders } from "../auth/authHeaders.js";
import {
  DEMO_CALCULATE_FIRST_FILL_PATH,
  DEMO_CALCULATE_POUR_LAYERS_PATH,
  DEMO_CALCULATE_WOOD_PATH,
} from "../demo/demoConstants.js";

export const CALCULATOR_API_KIND = {
  WOOD: "wood",
  FIRST_FILL: "firstFill",
  POUR_LAYERS: "pourLayers",
};

const CALCULATOR_API_PATHS = {
  [CALCULATOR_API_KIND.WOOD]: {
    authenticated: "/calculate-wood",
    demo: DEMO_CALCULATE_WOOD_PATH,
  },
  [CALCULATOR_API_KIND.FIRST_FILL]: {
    authenticated: "/calculate-first-fill",
    demo: DEMO_CALCULATE_FIRST_FILL_PATH,
  },
  [CALCULATOR_API_KIND.POUR_LAYERS]: {
    authenticated: "/calculate-pour-layers",
    demo: DEMO_CALCULATE_POUR_LAYERS_PATH,
  },
};

export function getCalculatorApiPath(kind, demoMode = false) {
  const entry = CALCULATOR_API_PATHS[kind];
  if (!entry) {
    throw new Error(`Unknown calculator API kind: ${kind}`);
  }
  return demoMode ? entry.demo : entry.authenticated;
}

export async function getCalculatorRequestHeaders(demoMode = false) {
  if (demoMode) {
    return { "Content-Type": "application/json" };
  }
  return buildAuthHeaders();
}
