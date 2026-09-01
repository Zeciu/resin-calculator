import { formatDisplayNumber, volumeToLiters } from "../units/conversion.js";

/**
 * Lightweight project-cost estimator. Derived totals are recomputed, not stored.
 * Technical resin volume stays separate from the quantity used for costing.
 * Costing quantity and resin price are canonical in liters / cost-per-liter.
 */

export const EMPTY_PROJECT_COST_ESTIMATE_INPUTS = {
  resinCostQuantityInput: "",
  resinCostQuantityFollowsCalculated: true,
  resinCostPerLiterInput: "",
  woodCostInput: "",
  otherProjectCostsInput: "",
  laborHoursInput: "",
  laborHourlyRateInput: "",
  desiredMarkupPercentInput: "",
};

export function parseNonNegativeNumber(value) {
  if (value == null || String(value).trim() === "") {
    return 0;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return 0;
  }
  return num;
}

export function sanitizeCostInputValue(raw) {
  return String(raw ?? "").replace(/-/g, "");
}

export function formatCostAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return "0.00";
  }
  return num.toFixed(2);
}

export function resolveResinCostQuantityLiters({
  calculatedVolumeLiters,
  resinCostQuantityInput,
  resinCostQuantityFollowsCalculated,
}) {
  if (resinCostQuantityFollowsCalculated) {
    return parseNonNegativeNumber(calculatedVolumeLiters);
  }
  return parseNonNegativeNumber(resinCostQuantityInput);
}

export function litersPerDisplayVolumeUnit(volumeUnit) {
  const litersPerUnit = volumeToLiters(1, volumeUnit);
  if (!Number.isFinite(litersPerUnit) || litersPerUnit <= 0) {
    return 1;
  }
  return litersPerUnit;
}

export function formatCostPerDisplayUnit(costPerLiterInput, volumeUnit) {
  if (costPerLiterInput == null || String(costPerLiterInput).trim() === "") {
    return "";
  }
  const perLiter = Number(costPerLiterInput);
  if (!Number.isFinite(perLiter) || perLiter < 0) {
    return "";
  }
  return formatDisplayNumber(perLiter * litersPerDisplayVolumeUnit(volumeUnit), 6);
}

export function storeCanonicalCostPerLiterFromDisplay(rawValue, volumeUnit) {
  const sanitized = sanitizeCostInputValue(rawValue);
  if (sanitized.trim() === "") {
    return "";
  }
  const displayCost = Number(sanitized);
  if (!Number.isFinite(displayCost) || displayCost < 0) {
    return sanitized;
  }
  const perLiter = displayCost / litersPerDisplayVolumeUnit(volumeUnit);
  return Number.isFinite(perLiter) ? String(perLiter) : sanitized;
}

export function calculateProjectCostEstimate({
  resinQuantityLiters,
  resinCostPerLiter,
  woodCost,
  otherProjectCosts,
  laborHours,
  laborHourlyRate,
  desiredMarkupPercent,
}) {
  const resinTotal = parseNonNegativeNumber(resinQuantityLiters) * parseNonNegativeNumber(resinCostPerLiter);
  const laborTotal = parseNonNegativeNumber(laborHours) * parseNonNegativeNumber(laborHourlyRate);
  const estimatedProjectCost =
    resinTotal +
    parseNonNegativeNumber(woodCost) +
    parseNonNegativeNumber(otherProjectCosts) +
    laborTotal;
  const markupRatio = parseNonNegativeNumber(desiredMarkupPercent) / 100;
  const suggestedSellingPrice = estimatedProjectCost * (1 + markupRatio);

  return {
    resinTotal,
    laborTotal,
    estimatedProjectCost,
    suggestedSellingPrice,
  };
}

function toPersistedNumber(value) {
  if (value == null || String(value).trim() === "") {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return null;
  }
  return num;
}

function persistedNumberToInput(value) {
  if (value == null || value === "") {
    return "";
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return "";
  }
  return String(value);
}

export function serializeProjectCostEstimate(inputs) {
  const payload = {
    resinCostQuantityLiters: inputs.resinCostQuantityFollowsCalculated
      ? null
      : toPersistedNumber(inputs.resinCostQuantityInput),
    resinCostPerLiter: toPersistedNumber(inputs.resinCostPerLiterInput),
    woodCost: toPersistedNumber(inputs.woodCostInput),
    otherProjectCosts: toPersistedNumber(inputs.otherProjectCostsInput),
    laborHours: toPersistedNumber(inputs.laborHoursInput),
    laborHourlyRate: toPersistedNumber(inputs.laborHourlyRateInput),
    desiredMarkupPercent: toPersistedNumber(inputs.desiredMarkupPercentInput),
  };

  const hasAnyValue = Object.values(payload).some((value) => value != null);
  return hasAnyValue ? payload : null;
}

export function deserializeProjectCostEstimate(stored) {
  if (!stored || typeof stored !== "object") {
    return { ...EMPTY_PROJECT_COST_ESTIMATE_INPUTS };
  }

  const storedQuantity = stored.resinCostQuantityLiters;
  const followsCalculated = storedQuantity == null || storedQuantity === "";

  return {
    resinCostQuantityInput: followsCalculated ? "" : persistedNumberToInput(storedQuantity),
    resinCostQuantityFollowsCalculated: followsCalculated,
    resinCostPerLiterInput: persistedNumberToInput(stored.resinCostPerLiter),
    woodCostInput: persistedNumberToInput(stored.woodCost),
    otherProjectCostsInput: persistedNumberToInput(stored.otherProjectCosts),
    laborHoursInput: persistedNumberToInput(stored.laborHours),
    laborHourlyRateInput: persistedNumberToInput(stored.laborHourlyRate),
    desiredMarkupPercentInput: persistedNumberToInput(stored.desiredMarkupPercent),
  };
}

export function hasMeaningfulCostEstimateInput(inputs) {
  if (!inputs) {
    return false;
  }
  if (!inputs.resinCostQuantityFollowsCalculated && String(inputs.resinCostQuantityInput ?? "").trim()) {
    return true;
  }
  return [
    inputs.resinCostPerLiterInput,
    inputs.woodCostInput,
    inputs.otherProjectCostsInput,
    inputs.laborHoursInput,
    inputs.laborHourlyRateInput,
    inputs.desiredMarkupPercentInput,
  ].some((value) => String(value ?? "").trim() !== "");
}
