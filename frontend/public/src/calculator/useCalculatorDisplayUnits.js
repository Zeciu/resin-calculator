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
  parseCanonicalMm,
  storeCanonicalMmFromDisplay,
  volumeToLiters,
} from "../units/conversion.js";

export function useCalculatorDisplayUnits() {
  const { preferences } = usePreferences();
  const { t } = useI18n();
  const { lengthUnit, volumeUnit } = preferences;
  const lengthLabel = LENGTH_UNIT_LABELS[lengthUnit] ?? lengthUnit;

  return useMemo(
    () => ({
      lengthUnit,
      volumeUnit,
      lengthLabel,
      volumeLabel: VOLUME_UNIT_LABELS[volumeUnit] ?? volumeUnit,
      formatReferenceLength: (cm) => formatLengthFromCm(cm, lengthUnit),
      formatDepth: (mm) => formatLengthFromMm(mm, lengthUnit),
      formatDepthWithUnit: (mm) => {
        const formatted = formatLengthFromMm(mm, lengthUnit);
        return formatted ? `${formatted} ${lengthLabel}` : "";
      },
      formatReferenceLengthWithUnit: (cm) => {
        const formatted = formatLengthFromCm(cm, lengthUnit);
        return formatted ? `${formatted} ${lengthLabel}` : "";
      },
      formatVolume: (liters) => formatVolumeFromLiters(liters, volumeUnit),
      parseReferenceLengthToCm: (value) => lengthToCm(value, lengthUnit),
      parseDepthToMm: (value) => lengthToMm(value, lengthUnit),
      storeDepthInput: (rawValue) => storeCanonicalMmFromDisplay(rawValue, lengthUnit),
      readCanonicalMm: parseCanonicalMm,
      parseVolumeToLiters: (value) => volumeToLiters(value, volumeUnit),
      referenceLengthError: () =>
        t("calculator.referenceLengthPositive", {
          unit: lengthLabel,
        }),
      cavityDepthError: () =>
        t("calculator.cavityDepthPositive", {
          unit: lengthLabel,
        }),
      mainPourDepthError: () =>
        t("calculator.mainPourDepthPositive", {
          unit: lengthLabel,
        }),
      referenceLengthLabel: () =>
        t("calculator.referenceLengthLabel", {
          unit: lengthLabel,
        }),
      resinDepthLabel: () =>
        t("calculator.resinDepthLabel", {
          unit: lengthLabel,
        }),
      mainResinDepthLabel: () =>
        t("calculator.mainResinDepthLabel", {
          unit: lengthLabel,
        }),
      depthLabel: () =>
        t("calculator.depthLabel", {
          unit: lengthLabel,
        }),
      firstFillThicknessLabel: () =>
        t("calculator.planning.firstFillThicknessLabel", {
          unit: lengthLabel,
        }),
      maxPourThicknessLabel: () =>
        t("calculator.planning.maxPourThicknessLabel", {
          unit: lengthLabel,
        }),
      firstFillThicknessPlaceholder: () =>
        t("calculator.planning.firstFillThicknessPlaceholder", {
          value: formatLengthFromMm(3, lengthUnit),
          unit: lengthLabel,
        }),
      mainResinDepthExamples: () =>
        t("calculator.help.mainResinDepth.examples", {
          value: formatLengthFromMm(50, lengthUnit),
          unit: lengthLabel,
        }),
      cavityDepthSummary: (mm) => {
        const formatted = formatLengthFromMm(mm, lengthUnit);
        if (!formatted) {
          return t("calculator.cavityDepthNotSet");
        }
        return t("calculator.cavityDepthSummary", {
          value: formatted,
          unit: lengthLabel,
        });
      },
      resultMainDepth: (mm) =>
        t("calculator.result.mainDepth", {
          value: formatLengthFromMm(mm, lengthUnit),
          unit: lengthLabel,
        }),
      resultDepth: (mm) =>
        t("calculator.result.depth", {
          value: formatLengthFromMm(mm, lengthUnit),
          unit: lengthLabel,
        }),
    }),
    [lengthUnit, volumeUnit, lengthLabel, t],
  );
}
