import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guards the code-splitting boundaries that keep the calculator and PDF export
// out of the initial bundle. A static import here would silently pull them
// back into the main chunk that every public page downloads.
const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(path.join(srcDir, relativePath), "utf8");
}

function staticImportSpecifiers(source) {
  return [...source.matchAll(/^\s*import\s[^;]*?from\s+["']([^"']+)["']/gm)].map(
    (match) => match[1],
  );
}

describe("initial bundle code-splitting boundaries", () => {
  it("lazy-loads the calculator routes from the workspace router", () => {
    const source = readSource("workspace/WorkspaceRouter.jsx");
    const imports = staticImportSpecifiers(source);

    expect(imports).not.toContain("./NewProjectWorkspace.jsx");
    expect(imports).not.toContain("./DemoWorkspace.jsx");
    expect(imports.some((spec) => spec.includes("calculator/"))).toBe(false);
    expect(source).toMatch(/lazy\(\(\) => import\("\.\/NewProjectWorkspace\.jsx"\)\)/);
    expect(source).toMatch(/lazy\(\(\) => import\("\.\/DemoWorkspace\.jsx"\)\)/);
  });

  it("loads jsPDF only when a PDF is exported", () => {
    const source = readSource("calculator/ResinCalculator.jsx");

    expect(staticImportSpecifiers(source)).not.toContain("jspdf");
    expect(source).toContain('import("jspdf")');
  });
});
