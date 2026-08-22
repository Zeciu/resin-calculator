/**
 * Restore and modify-mode helpers for calculator workflow flags.
 * interactionMode stays session-only; cavitiesComplete is persisted because
 * Finish Cavities with zero cavities cannot be inferred from geometry.
 */

export function resolveRestoredCavitiesComplete({
  storedCavitiesComplete,
  cavityCount = 0,
  hasCalculatedResult = false,
} = {}) {
  if (typeof storedCavitiesComplete === "boolean") {
    return storedCavitiesComplete;
  }
  if (cavityCount > 0) return true;
  return Boolean(hasCalculatedResult);
}

export function canEnterModifyProject({
  isReadOnly = false,
  interactionMode = "build",
  calculationMode = "wood",
  measurementsComplete = false,
  moldBoundaryComplete = false,
  woodBoundaryComplete = false,
  cavitiesComplete = false,
  hasCalculatedResult = false,
} = {}) {
  if (isReadOnly) return false;
  if (interactionMode === "modify") return false;
  if (calculationMode !== "wood") return false;
  if (!measurementsComplete || !moldBoundaryComplete || !woodBoundaryComplete) {
    return false;
  }
  return Boolean(cavitiesComplete || hasCalculatedResult);
}
