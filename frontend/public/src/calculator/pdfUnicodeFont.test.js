import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import {
  applyPdfUnicodeFont,
  PDF_UNICODE_FONT_FAMILY,
  registerPdfUnicodeFont,
} from "./pdfUnicodeFont.js";

function pdfLatin1(doc) {
  const bytes = new Uint8Array(doc.output("arraybuffer"));
  let text = "";
  bytes.forEach((byte) => {
    text += String.fromCharCode(byte);
  });
  return text;
}

function utf16BeHex(text) {
  return Array.from(text, (char) =>
    char.charCodeAt(0).toString(16).padStart(4, "0"),
  ).join("");
}

describe("pdfUnicodeFont", () => {
  it("embeds Noto Sans and encodes Romanian diacritics as Unicode text", () => {
    const sample = "rășină șțâîă";
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    registerPdfUnicodeFont(doc);
    applyPdfUnicodeFont(doc, "normal");
    doc.setFontSize(12);
    doc.text(sample, 14, 20);
    const output = pdfLatin1(doc);

    expect(doc.getFont().fontName).toBe(PDF_UNICODE_FONT_FAMILY);
    expect(output).toContain(PDF_UNICODE_FONT_FAMILY);
    expect(output).toContain("Identity-H");
    expect(output).toContain(utf16BeHex("ă"));
    expect(output).toContain(utf16BeHex("ș"));
    expect(output).toContain(utf16BeHex("ț"));
    expect(output).toContain(utf16BeHex("â"));
    expect(output).toContain(utf16BeHex("î"));
  });

  it("wraps long Romanian section titles within the page content width", () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    registerPdfUnicodeFont(doc);
    applyPdfUnicodeFont(doc, "bold");
    doc.setFontSize(13);
    const wrapWidth = 55;
    const title = "Calculator rășină pentru mese river și proiecte din lemn";
    const lines = doc.splitTextToSize(title, wrapWidth);
    expect(lines.length).toBeGreaterThan(1);
    lines.forEach((line) => {
      expect(doc.getTextWidth(line)).toBeLessThanOrEqual(wrapWidth + 0.5);
    });
  });

  it("does not use WinAnsi Helvetica for Romanian glyphs once the Unicode font is registered", () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    registerPdfUnicodeFont(doc);
    applyPdfUnicodeFont(doc, "bold");
    expect(doc.getFont().fontName).not.toBe("helvetica");
    expect(doc.getFont().fontName).toBe(PDF_UNICODE_FONT_FAMILY);
  });
});
