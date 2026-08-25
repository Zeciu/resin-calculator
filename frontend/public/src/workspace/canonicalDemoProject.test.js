import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseProjectFileText } from "./projectFileParse.js";

const CANONICAL_DEMO_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../static/demo/hfzwood-demo.hfzproject",
);

describe("canonical demo project asset", () => {
  it("parses through the real project parser as a completed wood project", () => {
    const text = readFileSync(CANONICAL_DEMO_PATH, "utf8");
    const parsed = parseProjectFileText(text);

    expect(parsed.envelope.format).toBe("hfzwood-project");
    expect(parsed.envelope.formatVersion).toBe(2);
    expect(parsed.envelope.projectMetadata.projectId).toBe("hfzwood-public-demo-project");
    expect(parsed.envelope.projectMetadata.ownerId).toBe("hfzwood-public-demo");
    expect(parsed.envelope.descriptiveMetadata.projectName).toBe("Demo");
    expect(parsed.snapshot.image.dataUrl).toMatch(/^data:image\//);
    expect(parsed.snapshot.calibration.referenceMeasurements.length).toBeGreaterThanOrEqual(1);
    expect(parsed.snapshot.woodBoundaryMode.woodBoundaryPolygons.length).toBeGreaterThanOrEqual(1);
    expect(parsed.snapshot.woodBoundaryMode.cavities.length).toBeGreaterThanOrEqual(1);
    expect(parsed.snapshot.woodBoundaryMode.moldBoundaryPoints.length).toBeGreaterThanOrEqual(3);
    expect(parsed.snapshot.woodBoundaryMode.firstFillThicknessMm).toBeTruthy();
    expect(parsed.snapshot.woodBoundaryMode.pourPlanRows.length).toBeGreaterThan(0);
    expect(parsed.snapshot.ui.calculationMode).toBe("wood");
    expect(parsed.snapshot.ui.measurementsComplete).toBe(true);
    expect(parsed.snapshot.ui.cavitiesComplete).toBe(true);
    expect(parsed.snapshot.result.calculationType).toBe("wood");
    expect(parsed.snapshot.ui).not.toHaveProperty("interactionMode");
  });
});
