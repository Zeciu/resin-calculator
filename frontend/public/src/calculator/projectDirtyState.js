/**
 * Determines whether a calculator session contains meaningful work
 * that would be lost if the user leaves the New Project workspace.
 * Photo upload alone is not considered dirty.
 */

import { DEFAULT_RESIN_DENSITY_KG_PER_LITER } from "./resinMassConversion.js";
import { hasMeaningfulCostEstimateInput } from "./projectCostEstimate.js";

function hasNonEmptyString(value) {
  return String(value ?? "").trim().length > 0;
}

function hasPolygonData(polygons) {
  return Array.isArray(polygons) && polygons.some((polygon) => polygon.length > 0);
}

export function computeProjectDirtyState({
  referenceMeasurements = [],
  draftReferencePoints = [],
  polygonPoints = [],
  moldBoundaryPoints = [],
  woodBoundaryPolygons = [],
  woodBoundaryPoints = [],
  cavityPolygons = [],
  currentCavityPoints = [],
  projectNotes = "",
  depthMm = "",
  maxPourThicknessMm = "",
  firstFillThicknessMm = "",
  cavityDepthsMm = [],
  resinDensityInput = "",
  result = null,
  measurementsComplete = false,
  moldBoundaryComplete = false,
  woodBoundaryComplete = false,
  cavitiesComplete = false,
  costEstimate = null,
}) {
  if (referenceMeasurements.length > 0) {
    return true;
  }

  if (draftReferencePoints.length >= 2) {
    return true;
  }

  if (polygonPoints.length > 0) {
    return true;
  }

  if (moldBoundaryPoints.length > 0) {
    return true;
  }

  if (hasPolygonData(woodBoundaryPolygons) || woodBoundaryPoints.length > 0) {
    return true;
  }

  if (hasPolygonData(cavityPolygons) || currentCavityPoints.length > 0) {
    return true;
  }

  if (hasNonEmptyString(projectNotes)) {
    return true;
  }

  if (hasNonEmptyString(depthMm)) {
    return true;
  }

  if (hasNonEmptyString(maxPourThicknessMm)) {
    return true;
  }

  if (hasNonEmptyString(firstFillThicknessMm)) {
    return true;
  }

  if (hasNonEmptyString(resinDensityInput)) {
    const parsedDensity = Number(resinDensityInput);
    if (
      !Number.isFinite(parsedDensity) ||
      Math.abs(parsedDensity - DEFAULT_RESIN_DENSITY_KG_PER_LITER) > 1e-9
    ) {
      return true;
    }
  }

  if (cavityDepthsMm.some((depth) => hasNonEmptyString(depth))) {
    return true;
  }

  if (result) {
    return true;
  }

  if (
    measurementsComplete ||
    moldBoundaryComplete ||
    woodBoundaryComplete ||
    cavitiesComplete
  ) {
    return true;
  }

  if (hasMeaningfulCostEstimateInput(costEstimate)) {
    return true;
  }

  return false;
}
