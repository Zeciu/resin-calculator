const CM_PER_INCH = 2.54;
const CM_PER_FOOT = 30.48;
const ML_PER_LITER = 1000;
const ML_PER_FL_OZ = 29.5735;
const ML_PER_PINT = 473.176;
const ML_PER_QUART = 946.353;
const ML_PER_GALLON = 3785.41;

export const LENGTH_UNIT_LABELS = {
  mm: "mm",
  cm: "cm",
  m: "m",
  in: "in",
  ft: "ft",
};

export const VOLUME_UNIT_LABELS = {
  ml: "ml",
  L: "L",
  fl_oz: "fl oz",
  pt: "pt",
  qt: "qt",
  gal: "gal",
};

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function cmToMm(cm) {
  return cm * 10;
}

export function mmToCm(mm) {
  return mm / 10;
}

export function lengthToMm(value, unit) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return NaN;
  }
  switch (unit) {
    case "mm":
      return numeric;
    case "cm":
      return numeric * 10;
    case "m":
      return numeric * 1000;
    case "in":
      return (numeric * CM_PER_INCH) * 10;
    case "ft":
      return (numeric * CM_PER_FOOT) * 10;
    default:
      return numeric;
  }
}

export function mmToLength(mm, unit) {
  const numeric = Number(mm);
  if (!Number.isFinite(numeric)) {
    return NaN;
  }
  switch (unit) {
    case "mm":
      return numeric;
    case "cm":
      return numeric / 10;
    case "m":
      return numeric / 1000;
    case "in":
      return mmToCm(numeric) / CM_PER_INCH;
    case "ft":
      return mmToCm(numeric) / CM_PER_FOOT;
    default:
      return numeric;
  }
}

export function cmToLength(cm, unit) {
  return mmToLength(cmToMm(cm), unit);
}

export function lengthToCm(value, unit) {
  return mmToCm(lengthToMm(value, unit));
}

export function litersToMl(liters) {
  return liters * ML_PER_LITER;
}

export function mlToLiters(ml) {
  return ml / ML_PER_LITER;
}

export function litersToVolume(liters, unit) {
  const ml = litersToMl(liters);
  switch (unit) {
    case "ml":
      return ml;
    case "L":
      return liters;
    case "fl_oz":
      return ml / ML_PER_FL_OZ;
    case "pt":
      return ml / ML_PER_PINT;
    case "qt":
      return ml / ML_PER_QUART;
    case "gal":
      return ml / ML_PER_GALLON;
    default:
      return liters;
  }
}

export function volumeToLiters(value, unit) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return NaN;
  }
  let ml = numeric;
  switch (unit) {
    case "ml":
      ml = numeric;
      break;
    case "L":
      return numeric;
    case "fl_oz":
      ml = numeric * ML_PER_FL_OZ;
      break;
    case "pt":
      ml = numeric * ML_PER_PINT;
      break;
    case "qt":
      ml = numeric * ML_PER_QUART;
      break;
    case "gal":
      ml = numeric * ML_PER_GALLON;
      break;
    default:
      return numeric;
  }
  return mlToLiters(ml);
}

export function formatDisplayNumber(value, digits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }
  return round(numeric, digits).toString();
}

export function formatLengthFromCm(cm, unit, digits = 2) {
  return formatDisplayNumber(cmToLength(cm, unit), digits);
}

export function formatLengthFromMm(mm, unit, digits = 2) {
  return formatDisplayNumber(mmToLength(mm, unit), digits);
}

export function formatVolumeFromLiters(liters, unit, digits = 3) {
  return formatDisplayNumber(litersToVolume(liters, unit), digits);
}
