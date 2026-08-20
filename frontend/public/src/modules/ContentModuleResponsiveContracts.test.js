import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../styles.css"),
  "utf8",
);

const WORKSPACE_PAD_X = 20;
const SIDEBAR_WIDTH = 240;
const BODY_GAP = 20;
const CONTENT_PAD_X = 24;
const TOC_WIDTH = 260;
const TOC_GAP = 24;
const READING_PAD_DESKTOP_X = 96;
const MANUAL_STACK_MAX_REM = 59.99;
const MANUAL_DOCUMENT_MAX_REM = 52;
const KB_TWO_COL_MIN_REM = 28.5;
const KB_FOUR_COL_MIN_REM = 58;
const KB_MODULE_MAX_REM = 78;
const KB_SCROLL_PAD_DESKTOP_X = 64;
const KB_BODY_PAD_LEFT_DESKTOP = 36;

function dedicatedContentWidth(viewportWidth) {
  const workspaceWidth = Math.min(viewportWidth, 1680);
  if (viewportWidth <= 900) {
    return workspaceWidth - WORKSPACE_PAD_X - CONTENT_PAD_X;
  }
  return workspaceWidth - WORKSPACE_PAD_X - SIDEBAR_WIDTH - BODY_GAP - CONTENT_PAD_X;
}

function manualTocIsBesideReading(contentWidthPx) {
  return contentWidthPx > MANUAL_STACK_MAX_REM * 16;
}

function manualReadingInnerWidth(viewportWidth) {
  const contentWidth = dedicatedContentWidth(viewportWidth);
  const tocTaken = manualTocIsBesideReading(contentWidth) ? TOC_WIDTH + TOC_GAP : 0;
  const readingPadX = viewportWidth <= 900 ? 36 : READING_PAD_DESKTOP_X;
  return contentWidth - tocTaken - readingPadX;
}

function kbCardContainerWidth(viewportWidth) {
  const contentWidth = Math.min(dedicatedContentWidth(viewportWidth), KB_MODULE_MAX_REM * 16);
  const scrollPadX = viewportWidth <= 900 ? 36 : KB_SCROLL_PAD_DESKTOP_X;
  const bodyPadLeft = viewportWidth <= 560 ? 0 : viewportWidth <= 900 ? 28 : KB_BODY_PAD_LEFT_DESKTOP;
  return contentWidth - scrollPadX - bodyPadLeft;
}

function kbDiagnosticColumns(containerWidthPx) {
  if (containerWidthPx >= KB_FOUR_COL_MIN_REM * 16) {
    return 4;
  }
  if (containerWidthPx >= KB_TWO_COL_MIN_REM * 16) {
    return 2;
  }
  return 1;
}

describe("Content module responsive contracts", () => {
  it("keeps the Manual document max-width at 52rem", () => {
    expect(stylesSource).toMatch(
      /\.manual-module__document\s*\{[^}]*max-width:\s*52rem;/,
    );
  });

  it("stacks the Manual TOC from the reading-pane container until both rails and a comfortable column fit", () => {
    expect(stylesSource).toMatch(/container-name:\s*manual-reading;/);
    expect(stylesSource).toMatch(
      /@container\s+manual-reading\s+\(max-width:\s*59\.99rem\)/,
    );
    expect(stylesSource).toMatch(
      /@container\s+manual-reading\s+\(max-width:\s*59\.99rem\)\s*\{[\s\S]*?\.manual-module\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
    );

    expect(manualTocIsBesideReading(dedicatedContentWidth(900))).toBe(false);
    expect(manualTocIsBesideReading(dedicatedContentWidth(901))).toBe(false);
    expect(manualTocIsBesideReading(dedicatedContentWidth(1024))).toBe(false);
    expect(manualTocIsBesideReading(dedicatedContentWidth(1366))).toBe(true);
    expect(manualTocIsBesideReading(dedicatedContentWidth(1440))).toBe(true);
    expect(manualTocIsBesideReading(dedicatedContentWidth(1920))).toBe(true);

    expect(manualReadingInnerWidth(901)).toBeGreaterThan(480);
    expect(manualReadingInnerWidth(1024)).toBeGreaterThan(500);
    expect(manualReadingInnerWidth(1366)).toBeGreaterThan(600);
    expect(manualReadingInnerWidth(1366)).toBeLessThanOrEqual(MANUAL_DOCUMENT_MAX_REM * 16);
  });

  it("gives Glossary alphabet links a 44px hit area without disabling wrapping", () => {
    const alphabetLink = stylesSource.match(
      /\.glossary-toolbar__alphabet-link\s*\{([^}]+)\}/,
    )?.[1];
    expect(alphabetLink).toMatch(/min-width:\s*44px;/);
    expect(alphabetLink).toMatch(/min-height:\s*44px;/);
    expect(alphabetLink).toMatch(/display:\s*inline-flex;/);

    const alphabetList = stylesSource.match(
      /\.glossary-toolbar__alphabet-list\s*\{([^}]+)\}/,
    )?.[1];
    expect(alphabetList).toMatch(/flex-wrap:\s*wrap;/);
    expect(stylesSource).toMatch(/\.glossary-toolbar\s*\{[^}]*position:\s*sticky;/);
  });

  it("moves Knowledge Base diagnostic cards from 2×2 to 4×1 without a 3+1 leftover state", () => {
    const cardsBlock = stylesSource.match(
      /\.knowledge-base-entry__cards\s*\{([^}]+)\}/,
    )?.[1];
    expect(cardsBlock).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\);/);
    expect(cardsBlock).not.toMatch(/auto-fit/);

    expect(stylesSource).toMatch(
      /@container\s+\(min-width:\s*28\.5rem\)\s*\{[\s\S]*?\.knowledge-base-entry__cards\s*\{[\s\S]*?repeat\(2,/,
    );
    expect(stylesSource).toMatch(
      /@container\s+\(min-width:\s*58rem\)\s*\{[\s\S]*?\.knowledge-base-entry__cards\s*\{[\s\S]*?repeat\(4,/,
    );
    expect(stylesSource).not.toMatch(
      /@media\s+\(min-width:\s*1180px\)\s*\{[\s\S]*?\.knowledge-base-entry__cards[\s\S]*?auto-fit/,
    );

    const widths = [1024, 1100, 1180, 1200, 1280, 1366, 1440];
    const columns = widths.map((width) => kbDiagnosticColumns(kbCardContainerWidth(width)));
    expect(columns).not.toContain(3);
    expect(kbDiagnosticColumns(kbCardContainerWidth(1180))).toBe(2);
    expect(kbDiagnosticColumns(kbCardContainerWidth(1200))).toBe(2);
    expect(kbDiagnosticColumns(kbCardContainerWidth(1366))).toBe(4);
    expect(kbDiagnosticColumns(kbCardContainerWidth(1440))).toBe(4);
  });

  it("keeps Knowledge Base search sticky in the existing page scroll", () => {
    expect(stylesSource).toMatch(
      /\.knowledge-base-toolbar\s*\{[^}]*position:\s*sticky;/,
    );
    expect(stylesSource).toMatch(
      /\.knowledge-base-module__scroll\s*\{[^}]*overflow:\s*visible;/,
    );
  });
});
