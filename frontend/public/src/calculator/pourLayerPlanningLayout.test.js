import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../styles.css"),
  "utf8",
);

describe("Pour Layer Planning layout contract", () => {
  it("contains table overflow in the dedicated wrapper instead of the page", () => {
    const wrapBlock = stylesSource.match(/\.pour-plan-table-wrap\s*\{([^}]+)\}/)?.[1];
    expect(wrapBlock).toMatch(/overflow-x:\s*auto;/);
    expect(wrapBlock).toMatch(/min-width:\s*0;/);
    expect(wrapBlock).toMatch(/max-width:\s*100%;/);
    expect(wrapBlock).not.toMatch(/overflow-x:\s*visible;/);
    expect(stylesSource).not.toMatch(/body\s*\{[^}]*overflow-x:\s*hidden;/);
  });

  it("keeps the desktop planning grid as controls plus a side help column", () => {
    expect(stylesSource).toMatch(
      /\.pour-layer-planning-row\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(230px, 285px\);/,
    );
  });

  it("stacks the help panel and allows the planning grid to shrink at the existing 760px breakpoint", () => {
    expect(stylesSource).toMatch(
      /@media \(max-width:\s*760px\)\s*\{[\s\S]*?\.pour-layer-planning-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);/,
    );
    expect(stylesSource).toMatch(
      /\.pour-layer-helper\s*\{[^}]*min-width:\s*0;/,
    );
    expect(stylesSource).toMatch(
      /\.pour-layer-helper p\s*\{[^}]*overflow-wrap:\s*break-word;/,
    );
  });
});
