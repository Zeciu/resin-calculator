/**
 * Embed Noto Sans so jsPDF can render Romanian/Latin diacritics.
 * Helvetica (WinAnsi) cannot draw ă, ș, ț and similar glyphs.
 *
 * Font files: ./pdf-fonts/ (SIL Open Font License 1.1, see OFL.txt)
 */

import notoSansRegular from "./pdf-fonts/NotoSans-Regular.ttf?inline";
import notoSansBold from "./pdf-fonts/NotoSans-Bold.ttf?inline";

export const PDF_UNICODE_FONT_FAMILY = "NotoSans";
const REGULAR_VFS_NAME = "NotoSans-Regular.ttf";
const BOLD_VFS_NAME = "NotoSans-Bold.ttf";

function dataUrlToBase64(dataUrl) {
  const value = String(dataUrl ?? "");
  const marker = "base64,";
  const index = value.indexOf(marker);
  return index >= 0 ? value.slice(index + marker.length) : value;
}

export function registerPdfUnicodeFont(doc) {
  if (!doc || typeof doc.addFileToVFS !== "function" || typeof doc.addFont !== "function") {
    throw new Error("jsPDF document cannot register a custom Unicode font.");
  }
  doc.addFileToVFS(REGULAR_VFS_NAME, dataUrlToBase64(notoSansRegular));
  doc.addFont(REGULAR_VFS_NAME, PDF_UNICODE_FONT_FAMILY, "normal");
  doc.addFileToVFS(BOLD_VFS_NAME, dataUrlToBase64(notoSansBold));
  doc.addFont(BOLD_VFS_NAME, PDF_UNICODE_FONT_FAMILY, "bold");
}

export function applyPdfUnicodeFont(doc, style = "normal") {
  doc.setFont(PDF_UNICODE_FONT_FAMILY, style === "bold" ? "bold" : "normal");
}
