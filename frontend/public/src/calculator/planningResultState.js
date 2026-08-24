export const PLANNING_VOLUME_TOLERANCE_LITERS = 0.001;

export function woodPlanningSurfaceAreaCm2(result) {
  if (!result) return null;
  const cavityAreaFromItems = Array.isArray(result.cavities)
    ? result.cavities.reduce((sum, cavity) => {
        const area = Number(cavity.areaCm2);
        return sum + (Number.isFinite(area) ? area : 0);
      }, 0)
    : 0;
  const cavityArea =
    cavityAreaFromItems > 0 ? cavityAreaFromItems : Number(result.cavityAreaCm2) || 0;
  const area =
    result.calculationType === "wood"
      ? Number(result.mainResinAreaCm2) + cavityArea
      : result.areaCm2;
  const numericArea = Number(area);
  return Number.isFinite(numericArea) && numericArea > 0 ? numericArea : null;
}

export function volumeLitersFromAreaCm2AndThicknessMm(areaCm2, thicknessMm) {
  return (Number(areaCm2) * (Number(thicknessMm) / 10.0)) / 1000.0;
}

export function planningVolumesMatch(
  left,
  right,
  tolerance = PLANNING_VOLUME_TOLERANCE_LITERS,
) {
  const a = Number(left);
  const b = Number(right);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= tolerance;
}

export function isFirstFillPourRow(row) {
  return row?.type === "firstFill" || row?.label?.includes("First Fill Seal Coat");
}

export function canExportFirstFillVolume({ resultOutdated, firstFillVolumeLiters }) {
  return !resultOutdated && firstFillVolumeLiters != null;
}

export function canExportPourPlanRows({
  resultOutdated,
  firstFillVolumeLiters,
  pourPlanRows,
}) {
  if (resultOutdated) return false;
  if (!Array.isArray(pourPlanRows) || pourPlanRows.length === 0) return false;
  const firstFillRow = pourPlanRows.find(isFirstFillPourRow);
  if (firstFillVolumeLiters == null || !firstFillRow) return true;
  return planningVolumesMatch(firstFillRow.volumeLiters, firstFillVolumeLiters);
}

export function sanitizeRestoredPlanningOutputs({
  result,
  firstFillThicknessMm,
  firstFillVolumeLiters,
  recommendedFirstFillVolumeLiters,
  pourPlanRows,
  recommendedLayerCount,
}) {
  const area = woodPlanningSurfaceAreaCm2(result);
  const thickness = Number(firstFillThicknessMm);
  const restoredFirstFill = Number(firstFillVolumeLiters);
  const restoredRows = Array.isArray(pourPlanRows) ? pourPlanRows : [];

  let firstFill = null;
  if (
    Number.isFinite(restoredFirstFill) &&
    area &&
    Number.isFinite(thickness) &&
    thickness > 0
  ) {
    const expected = volumeLitersFromAreaCm2AndThicknessMm(area, thickness);
    if (planningVolumesMatch(restoredFirstFill, expected)) {
      firstFill = restoredFirstFill;
    }
  }

  let rows = [];
  let layerCount = null;
  if (restoredRows.length > 0 && area) {
    const rowsMatchArea = restoredRows.every((row) => {
      const rowThickness = Number(row.thicknessMm);
      if (!Number.isFinite(rowThickness) || rowThickness <= 0) return false;
      return planningVolumesMatch(
        row.volumeLiters,
        volumeLitersFromAreaCm2AndThicknessMm(area, rowThickness),
      );
    });
    const firstFillRow = restoredRows.find(isFirstFillPourRow);
    const firstFillAgrees =
      firstFill == null ||
      (firstFillRow && planningVolumesMatch(firstFillRow.volumeLiters, firstFill));

    if (rowsMatchArea && firstFillAgrees) {
      rows = restoredRows;
      layerCount =
        recommendedLayerCount == null ? restoredRows.length : recommendedLayerCount;
    }
  }

  return {
    firstFillVolumeLiters: firstFill,
    recommendedFirstFillVolumeLiters:
      firstFill == null
        ? null
        : Number.isFinite(Number(recommendedFirstFillVolumeLiters))
          ? Number(recommendedFirstFillVolumeLiters)
          : null,
    pourPlanRows: rows,
    recommendedLayerCount: rows.length > 0 ? layerCount : null,
  };
}
