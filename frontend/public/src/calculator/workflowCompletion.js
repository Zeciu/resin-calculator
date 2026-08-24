/**
 * Restore and modify-mode helpers for calculator workflow flags.
 * interactionMode stays session-only; cavitiesComplete and woodBoundaryComplete
 * are persisted because finishing those stages with zero items cannot be
 * inferred from geometry alone.
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

export function resolveRestoredWoodComplete({
  storedWoodBoundaryComplete,
  woodIslandCount = 0,
  hasCalculatedResult = false,
} = {}) {
  if (typeof storedWoodBoundaryComplete === "boolean") {
    return storedWoodBoundaryComplete;
  }
  if (woodIslandCount > 0) return true;
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
