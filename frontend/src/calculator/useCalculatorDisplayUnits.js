import { useMemo } from "react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { usePreferences } from "../preferences/usePreferences.js";
import {
  LENGTH_UNIT_LABELS,
  VOLUME_UNIT_LABELS,
  formatLengthFromCm,
  formatLengthFromMm,
  formatVolumeFromLiters,
  lengthToCm,
  lengthToMm,
  volumeToLiters,
} from "../units/conversion.js";

export function useCalculatorDisplayUnits() {
  const { preferences } = usePreferences();
  const { t } = useI18n();
  const { lengthUnit, volumeUnit } = preferences;

  return useMemo(
    () => ({
      lengthUnit,
      volumeUnit,
      lengthLabel: LENGTH_UNIT_LABELS[lengthUnit] ?? lengthUnit,
      volumeLabel: VOLUME_UNIT_LABELS[volumeUnit] ?? volumeUnit,
      formatReferenceLength: (cm) => formatLengthFromCm(cm, lengthUnit),
      formatDepth: (mm) => formatLengthFromMm(mm, lengthUnit),
      formatVolume: (liters) => formatVolumeFromLiters(liters, volumeUnit),
      parseReferenceLengthToCm: (value) => lengthToCm(value, lengthUnit),
      parseDepthToMm: (value) => lengthToMm(value, lengthUnit),
      parseVolumeToLiters: (value) => volumeToLiters(value, volumeUnit),
      referenceLengthError: () =>
        t("calculator.referenceLengthPositive", {
          unit: LENGTH_UNIT_LABELS[lengthUnit] ?? lengthUnit,
        }),
      cavityDepthError: () =>
        t("calculator.cavityDepthPositive", {
          unit: LENGTH_UNIT_LABELS[lengthUnit] ?? lengthUnit,
        }),
      mainPourDepthError: () =>
        t("calculator.mainPourDepthPositive", {
          unit: LENGTH_UNIT_LABELS[lengthUnit] ?? lengthUnit,
        }),
      resinDepthLabel: () =>
        t("calculator.resinDepthLabel", {
          unit: LENGTH_UNIT_LABELS[lengthUnit] ?? lengthUnit,
        }),
      mainResinDepthLabel: () =>
        t("calculator.mainResinDepthLabel", {
          unit: LENGTH_UNIT_LABELS[lengthUnit] ?? lengthUnit,
        }),
      depthLabel: () =>
        t("calculator.depthLabel", {
          unit: LENGTH_UNIT_LABELS[lengthUnit] ?? lengthUnit,
        }),
    }),
    [lengthUnit, volumeUnit, t],
  );
}
