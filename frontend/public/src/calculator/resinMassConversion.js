/**
 * Volume → mixed-resin mass conversion.
 * massKg = volumeLiters × densityKgPerLiter
 *
 * This is the total mixed resin only. It does not split A/B components.
 */

export const DEFAULT_RESIN_DENSITY_KG_PER_LITER = 1.1;
export const MIN_RESIN_DENSITY_KG_PER_LITER = 0.5;
export const MAX_RESIN_DENSITY_KG_PER_LITER = 2.0;

export function formatResinDensityInput(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_RESIN_DENSITY_KG_PER_LITER.toFixed(2);
  }
  return numeric.toFixed(2);
}

export function parseResinDensityKgPerLiter(rawValue) {
  if (rawValue == null || String(rawValue).trim() === "") {
    return null;
  }
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  if (
    numeric < MIN_RESIN_DENSITY_KG_PER_LITER ||
    numeric > MAX_RESIN_DENSITY_KG_PER_LITER
  ) {
    return null;
  }
  return numeric;
}

export function resolveResinDensityKgPerLiter(rawValue) {
  return (
    parseResinDensityKgPerLiter(rawValue) ?? DEFAULT_RESIN_DENSITY_KG_PER_LITER
  );
}

export function mixedResinMassKg(volumeLiters, densityKgPerLiter) {
  if (volumeLiters == null || densityKgPerLiter == null) {
    return null;
  }
  const volume = Number(volumeLiters);
  const density = Number(densityKgPerLiter);
  if (!Number.isFinite(volume) || volume < 0) {
    return null;
  }
  if (!Number.isFinite(density) || density <= 0) {
    return null;
  }
  return volume * density;
}

/**
 * Formats mixed-resin mass for display.
 * < 1 kg → integer grams; >= 1 kg → kg with 2 decimals.
 */
export function formatEstimatedResinMass(volumeLiters, densityKgPerLiter) {
  const massKg = mixedResinMassKg(volumeLiters, densityKgPerLiter);
  if (massKg == null) {
    return null;
  }
  if (massKg < 1) {
    return `${Math.round(massKg * 1000)} g`;
  }
  return `${massKg.toFixed(2)} kg`;
}
