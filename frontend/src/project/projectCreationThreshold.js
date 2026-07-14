/** @typedef {import("./canonicalProjectLifecycle.js").CanonicalProjectLifecycle} CanonicalProjectLifecycle */

/**
 * @typedef {{
 *   imageDataUrl?: string;
 *   referenceMeasurements?: Array<{
 *     knownLengthCm?: number;
 *     calibrationPoints?: Array<{ x?: number; y?: number }>;
 *   }>;
 * }} ProjectCreationThresholdInputs
 */

/**
 * @param {{ x?: number; y?: number }} point
 */
export function isValidCalibrationPoint(point) {
  if (!point || typeof point !== "object") {
    return false;
  }

  return Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y));
}

/**
 * @param {unknown} referenceMeasurement
 */
export function isCompletedReferenceMeasurement(referenceMeasurement) {
  if (!referenceMeasurement || typeof referenceMeasurement !== "object") {
    return false;
  }

  const knownLengthCm = Number(referenceMeasurement.knownLengthCm);
  if (!Number.isFinite(knownLengthCm) || knownLengthCm <= 0) {
    return false;
  }

  const calibrationPoints = referenceMeasurement.calibrationPoints;
  if (!Array.isArray(calibrationPoints) || calibrationPoints.length < 2) {
    return false;
  }

  return calibrationPoints.every(isValidCalibrationPoint);
}

/**
 * @param {ProjectCreationThresholdInputs} inputs
 */
export function isProjectCreationThresholdMet(inputs) {
  const imageDataUrl = inputs?.imageDataUrl;
  if (typeof imageDataUrl !== "string" || !imageDataUrl.trim()) {
    return false;
  }

  const referenceMeasurements = inputs?.referenceMeasurements;
  if (!Array.isArray(referenceMeasurements) || referenceMeasurements.length === 0) {
    return false;
  }

  return referenceMeasurements.some(isCompletedReferenceMeasurement);
}

/**
 * @param {{ id?: unknown } | null | undefined} user
 * @returns {string | null}
 */
export function resolveAuthenticatedOwnerId(user) {
  const ownerId = user?.id;
  if (typeof ownerId !== "string" || !ownerId.trim()) {
    return null;
  }

  return ownerId.trim();
}

/**
 * @param {CanonicalProjectLifecycle} lifecycle
 */
export function hasCanonicalProjectIdentity(lifecycle) {
  return Boolean(lifecycle?.projectMetadata?.projectId);
}
