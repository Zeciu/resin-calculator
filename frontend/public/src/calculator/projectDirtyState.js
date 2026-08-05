/**
 * Determines whether a calculator session contains meaningful work
 * that would be lost if the user leaves the New Project workspace.
 * Photo upload alone is not considered dirty.
 */

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
  result = null,
  measurementsComplete = false,
  moldBoundaryComplete = false,
  woodBoundaryComplete = false,
  cavitiesComplete = false,
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

  return false;
}
