import { isFirstFillPourRow } from "./planningResultState.js";

export function formatPdfTimestamp(date, language) {
  const when = date instanceof Date ? date : new Date(date);
  try {
    return when.toLocaleString(language || undefined);
  } catch {
    return when.toLocaleString();
  }
}

export function localizePdfDirection(direction, ui) {
  switch (direction) {
    case "horizontal":
      return ui.pdf.directionHorizontal;
    case "vertical":
      return ui.pdf.directionVertical;
    case "diagonal":
      return ui.pdf.directionDiagonal;
    default:
      return ui.pdf.directionUnknown;
  }
}

export function localizePdfPourRowLabel(row, index, ui) {
  const pourIndex = Number(index) + 1;
  if (isFirstFillPourRow(row)) {
    return ui.pdf.pourFirstFill(pourIndex);
  }
  return ui.pdf.pourN(pourIndex);
}

export function formatPdfPourRowValue({
  thicknessText,
  volumeLiters,
  volumeMass,
  recommendedVolumeLiters,
  recommendedMass,
  componentAMl,
  componentBMl,
  formatNumber,
  ui,
}) {
  const na = ui.pdf.notAvailable;
  return [
    thicknessText,
    `${formatNumber(volumeLiters, 3)} L`,
    volumeMass || na,
    `${formatNumber(recommendedVolumeLiters, 3)} L ${ui.pdf.recommended}`,
    recommendedMass || na,
    `${ui.pdf.componentA} ${componentAMl} ml`,
    `${ui.pdf.componentB} ${componentBMl} ml`,
  ].join(" | ");
}

export function formatPdfAxisReferencesUsed(scaleQuality, ui) {
  const axisCount =
    (scaleQuality?.horizontalCount || 0) + (scaleQuality?.verticalCount || 0);
  const diagonalCount = scaleQuality?.diagonalCount || 0;
  return ui.pdf.axisReferencesTracked(axisCount, diagonalCount);
}
