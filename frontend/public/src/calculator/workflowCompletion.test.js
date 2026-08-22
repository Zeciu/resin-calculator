import { describe, expect, it } from "vitest";
import {
  canEnterModifyProject,
  resolveRestoredCavitiesComplete,
} from "./workflowCompletion.js";

describe("resolveRestoredCavitiesComplete", () => {
  it("prefers the persisted flag including zero-cavity completion", () => {
    expect(
      resolveRestoredCavitiesComplete({
        storedCavitiesComplete: true,
        cavityCount: 0,
        hasCalculatedResult: false,
      }),
    ).toBe(true);
    expect(
      resolveRestoredCavitiesComplete({
        storedCavitiesComplete: false,
        cavityCount: 2,
        hasCalculatedResult: true,
      }),
    ).toBe(false);
  });

  it("infers completion from cavities when the flag is absent", () => {
    expect(
      resolveRestoredCavitiesComplete({
        cavityCount: 1,
        hasCalculatedResult: false,
      }),
    ).toBe(true);
  });

  it("treats a calculated project with zero cavities as complete", () => {
    expect(
      resolveRestoredCavitiesComplete({
        cavityCount: 0,
        hasCalculatedResult: true,
      }),
    ).toBe(true);
  });

  it("keeps an unfinished zero-cavity build incomplete", () => {
    expect(
      resolveRestoredCavitiesComplete({
        cavityCount: 0,
        hasCalculatedResult: false,
      }),
    ).toBe(false);
  });
});

describe("canEnterModifyProject", () => {
  const ready = {
    calculationMode: "wood",
    measurementsComplete: true,
    moldBoundaryComplete: true,
    woodBoundaryComplete: true,
    cavitiesComplete: true,
  };

  it("allows Modify Project on a completed wood project", () => {
    expect(canEnterModifyProject(ready)).toBe(true);
  });

  it("allows Modify Project on a calculated zero-cavity project", () => {
    expect(
      canEnterModifyProject({
        ...ready,
        cavitiesComplete: false,
        hasCalculatedResult: true,
      }),
    ).toBe(true);
  });

  it("does not show the control while already in modify mode", () => {
    expect(canEnterModifyProject({ ...ready, interactionMode: "modify" })).toBe(
      false,
    );
  });

  it("does not show the control during guided construction", () => {
    expect(canEnterModifyProject({ ...ready, woodBoundaryComplete: false })).toBe(
      false,
    );
  });
});
