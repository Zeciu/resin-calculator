import { describe, expect, it } from "vitest";
import { buildCalculatorUi } from "./calculatorUi.js";
import {
  formatPdfAxisReferencesUsed,
  formatPdfPourRowValue,
  formatPdfTimestamp,
  localizePdfDirection,
  localizePdfPourRowLabel,
} from "./pdfExportCopy.js";
import { translate } from "../i18n/translate.js";

function uiFor(language) {
  return buildCalculatorUi((key, params) => translate(language, key, params));
}

describe("pdfExportCopy", () => {
  it("formats timestamps with the active UI language", () => {
    const date = new Date("2026-08-24T12:00:00Z");
    expect(formatPdfTimestamp(date, "ro")).toBe(date.toLocaleString("ro"));
    expect(formatPdfTimestamp(date, "en")).toBe(date.toLocaleString("en"));
    expect(formatPdfTimestamp(date, "ro")).not.toBe(formatPdfTimestamp(date, "en"));
  });

  it("localizes reference directions", () => {
    const ui = uiFor("ro");
    expect(localizePdfDirection("horizontal", ui)).toBe("orizontală");
    expect(localizePdfDirection("vertical", ui)).toBe("verticală");
    expect(localizePdfDirection("diagonal", ui)).toBe("diagonală");
    expect(localizePdfDirection("unknown", ui)).toBe("necunoscută");
  });

  it("derives pour labels from row type and index, ignoring backend English labels", () => {
    const ui = uiFor("ro");
    expect(
      localizePdfPourRowLabel(
        { type: "firstFill", label: "Pour 1 — First Fill Seal Coat" },
        0,
        ui,
      ),
    ).toBe("Turn 1 — Strat sigilant prim turn");
    expect(localizePdfPourRowLabel({ type: "mainPour", label: "Pour 2" }, 1, ui)).toBe(
      "Turn 2",
    );
  });

  it("keeps English pour labels when the UI language is EN", () => {
    const ui = uiFor("en");
    expect(
      localizePdfPourRowLabel({ type: "firstFill", label: "English backend label" }, 0, ui),
    ).toBe("Pour 1 — First Fill Seal Coat");
    expect(localizePdfPourRowLabel({ type: "mainPour", label: "Pour 9" }, 1, ui)).toBe(
      "Pour 2",
    );
  });

  it("localizes first-fill pour labels in French from row type, not stored English copy", () => {
    const ui = uiFor("fr");
    expect(
      localizePdfPourRowLabel(
        { type: "firstFill", label: "Pour 1 — First Fill Seal Coat" },
        0,
        ui,
      ),
    ).toBe("Coulée 1 — Couche d’étanchéité du premier coulage");
    expect(localizePdfPourRowLabel({ type: "mainPour", label: "Pour 2" }, 1, ui)).toBe(
      "Coulée 2",
    );
  });

  it("localizes pour value surrounding words but keeps unit tokens", () => {
    const ui = uiFor("ro");
    const value = formatPdfPourRowValue({
      thicknessText: "10 mm",
      volumeLiters: 0.737,
      volumeMass: "811 g",
      recommendedVolumeLiters: 0.811,
      recommendedMass: "892 g",
      componentAMl: 540,
      componentBMl: 271,
      formatNumber: (value, digits) => Number(value).toFixed(digits),
      ui,
    });
    expect(value).toContain("0.737 L");
    expect(value).toContain("0.811 L recomandat");
    expect(value).toContain("A 540 ml");
    expect(value).toContain("B 271 ml");
    expect(value).not.toContain("recommended");
  });

  it("formats axis-reference counts through i18n", () => {
    const ui = uiFor("ro");
    expect(
      formatPdfAxisReferencesUsed({ horizontalCount: 2, verticalCount: 1, diagonalCount: 1 }, ui),
    ).toBe("3 referințe pe axe (1 diagonale urmărite)");
  });
});
