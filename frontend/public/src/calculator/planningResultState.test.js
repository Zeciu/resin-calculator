import { describe, expect, it } from "vitest";
import {
  canExportFirstFillVolume,
  canExportPourPlanRows,
  planningVolumesMatch,
  sanitizeRestoredPlanningOutputs,
  volumeLitersFromAreaCm2AndThicknessMm,
  woodPlanningSurfaceAreaCm2,
} from "./planningResultState.js";

const WOOD_RESULT = {
  calculationType: "wood",
  mainResinAreaCm2: 378.07,
  cavityAreaCm2: 147.9,
  cavities: [{ name: "Cavity 1", areaCm2: 147.9 }],
};

describe("planningResultState", () => {
  it("uses main resin area plus cavity areas for wood planning", () => {
    expect(woodPlanningSurfaceAreaCm2(WOOD_RESULT)).toBeCloseTo(525.97, 5);
    expect(volumeLitersFromAreaCm2AndThicknessMm(525.97, 3)).toBeCloseTo(0.157791, 6);
  });

  it("keeps a consistent restored First Fill and discards a mismatched Pour Plan", () => {
    const sanitized = sanitizeRestoredPlanningOutputs({
      result: WOOD_RESULT,
      firstFillThicknessMm: "3",
      firstFillVolumeLiters: 0.158,
      recommendedFirstFillVolumeLiters: 0.205,
      recommendedLayerCount: 4,
      pourPlanRows: [
        {
          label: "Pour 1 — First Fill Seal Coat",
          type: "firstFill",
          thicknessMm: 3,
          volumeLiters: 0.087,
          recommendedVolumeLiters: 0.113,
        },
      ],
    });

    expect(sanitized.firstFillVolumeLiters).toBe(0.158);
    expect(sanitized.recommendedFirstFillVolumeLiters).toBe(0.205);
    expect(sanitized.pourPlanRows).toEqual([]);
    expect(sanitized.recommendedLayerCount).toBeNull();
  });

  it("keeps matching same-generation First Fill and Pour Planning", () => {
    const volume = volumeLitersFromAreaCm2AndThicknessMm(525.97, 3);
    const sanitized = sanitizeRestoredPlanningOutputs({
      result: WOOD_RESULT,
      firstFillThicknessMm: 3,
      firstFillVolumeLiters: volume,
      recommendedFirstFillVolumeLiters: volume * 1.3,
      recommendedLayerCount: 2,
      pourPlanRows: [
        {
          label: "Pour 1 — First Fill Seal Coat",
          type: "firstFill",
          thicknessMm: 3,
          volumeLiters: volume,
          recommendedVolumeLiters: volume * 1.1,
        },
      ],
    });

    expect(sanitized.firstFillVolumeLiters).toBe(volume);
    expect(sanitized.pourPlanRows).toHaveLength(1);
    expect(sanitized.recommendedLayerCount).toBe(2);
  });

  it("opens old snapshots that have no planning caches", () => {
    const sanitized = sanitizeRestoredPlanningOutputs({
      result: WOOD_RESULT,
      firstFillThicknessMm: "",
      firstFillVolumeLiters: null,
      pourPlanRows: undefined,
      recommendedLayerCount: undefined,
    });

    expect(sanitized).toEqual({
      firstFillVolumeLiters: null,
      recommendedFirstFillVolumeLiters: null,
      pourPlanRows: [],
      recommendedLayerCount: null,
    });
  });

  it("blocks mixed-generation PDF pour-plan export", () => {
    expect(
      canExportFirstFillVolume({ resultOutdated: false, firstFillVolumeLiters: 0.158 }),
    ).toBe(true);
    expect(
      canExportPourPlanRows({
        resultOutdated: false,
        firstFillVolumeLiters: 0.158,
        pourPlanRows: [
          {
            type: "firstFill",
            volumeLiters: 0.087,
            thicknessMm: 3,
          },
        ],
      }),
    ).toBe(false);
    expect(
      planningVolumesMatch(0.158, volumeLitersFromAreaCm2AndThicknessMm(525.97, 3)),
    ).toBe(true);
  });
});
