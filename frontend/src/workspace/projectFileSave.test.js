import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HFZ_PROJECT_FILE_EXTENSION,
  HFZ_PROJECT_FORMAT,
  ProjectFileSaveCancelledError,
  ProjectFileSaveError,
  buildProjectFilePayload,
  downloadProjectFile,
  saveProjectFile,
  slugifyProjectFilename,
  supportsNativeProjectSavePicker,
} from "./projectFileSave.js";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUV0WQl3MBPQ8EAAAABJRU5ErkJggg==";

const SAMPLE_SNAPSHOT = {
  appVersion: "1.0",
  savedAt: "2026-01-01T00:00:00.000Z",
  image: {
    dataUrl: TINY_PNG,
    width: 100,
    height: 80,
  },
  calibration: {
    referenceMeasurements: [{ knownLengthCm: 10, calibrationPoints: [] }],
  },
  woodBoundaryMode: {
    woodBoundaryPolygons: [],
    cavities: [],
  },
  projectNotes: "Notes",
  result: { totalVolumeLiters: 1.2 },
};

describe("projectFileSave", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete window.showSaveFilePicker;
  });

  describe("slugifyProjectFilename", () => {
    it("creates a safe lowercase filename slug", () => {
      expect(slugifyProjectFilename("River Table #1")).toBe("river-table-1");
    });

    it("falls back when the project name has no safe characters", () => {
      expect(slugifyProjectFilename("***")).toBe("hfzwood-project");
    });
  });

  describe("buildProjectFilePayload", () => {
    it("includes metadata and the full snapshot with original image data", () => {
      const payload = buildProjectFilePayload({
        projectName: "River Table",
        snapshot: SAMPLE_SNAPSHOT,
      });

      expect(payload.format).toBe(HFZ_PROJECT_FORMAT);
      expect(payload.projectName).toBe("River Table");
      expect(payload.image.dataUrl).toBe(TINY_PNG);
      expect(payload.calibration).toEqual(SAMPLE_SNAPSHOT.calibration);
      expect(payload.woodBoundaryMode).toEqual(SAMPLE_SNAPSHOT.woodBoundaryMode);
      expect(payload.result).toEqual(SAMPLE_SNAPSHOT.result);
      expect(payload.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("rejects an empty project name", () => {
      expect(() =>
        buildProjectFilePayload({
          projectName: "   ",
          snapshot: SAMPLE_SNAPSHOT,
        }),
      ).toThrow(ProjectFileSaveError);
    });

    it("rejects an incomplete project without image data", () => {
      expect(() =>
        buildProjectFilePayload({
          projectName: "River Table",
          snapshot: { ...SAMPLE_SNAPSHOT, image: { dataUrl: null } },
        }),
      ).toThrow(/Upload an image before saving/i);
    });
  });

  describe("saveProjectFile", () => {
    it("downloads a complete project file when the native save picker is unavailable", async () => {
      const click = vi.fn();
      const link = { click, download: "" };
      const createElement = vi.spyOn(document, "createElement").mockReturnValue(link);
      const appendChild = vi.spyOn(document.body, "appendChild").mockImplementation(() => link);
      const removeChild = vi.spyOn(document.body, "removeChild").mockImplementation(() => link);
      const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:project");
      const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

      const result = await saveProjectFile({
        projectName: "River Table",
        snapshot: SAMPLE_SNAPSHOT,
      });

      expect(supportsNativeProjectSavePicker()).toBe(false);
      expect(result.payload.projectName).toBe("River Table");
      expect(result.payload.image.dataUrl).toBe(TINY_PNG);
      expect(result.fileHandle).toBeNull();
      expect(result.fileName).toBe(`river-table${HFZ_PROJECT_FILE_EXTENSION}`);
      expect(click).toHaveBeenCalledTimes(1);

      createElement.mockRestore();
      appendChild.mockRestore();
      removeChild.mockRestore();
      createObjectURL.mockRestore();
      revokeObjectURL.mockRestore();
    });

    it("writes through the native save picker when supported", async () => {
      const write = vi.fn();
      const close = vi.fn();
      const createWritable = vi.fn(async () => ({ write, close }));
      const fileHandle = { createWritable };
      window.showSaveFilePicker = vi.fn(async () => fileHandle);

      const result = await saveProjectFile({
        projectName: "River Table",
        snapshot: SAMPLE_SNAPSHOT,
      });

      expect(window.showSaveFilePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestedName: `river-table${HFZ_PROJECT_FILE_EXTENSION}`,
        }),
      );
      expect(createWritable).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledTimes(1);
      expect(result.payload.image.dataUrl).toBe(TINY_PNG);
      expect(result.fileHandle).toBe(fileHandle);
      expect(result.fileName).toBe(`river-table${HFZ_PROJECT_FILE_EXTENSION}`);
    });

    it("throws a cancellation error when the native save picker is dismissed", async () => {
      window.showSaveFilePicker = vi.fn(async () => {
        const error = new DOMException("User cancelled", "AbortError");
        throw error;
      });

      await expect(
        saveProjectFile({
          projectName: "River Table",
          snapshot: SAMPLE_SNAPSHOT,
        }),
      ).rejects.toBeInstanceOf(ProjectFileSaveCancelledError);
    });
  });

  describe("downloadProjectFile", () => {
    it("triggers a browser download for the provided blob", () => {
      const click = vi.fn();
      const link = { click, download: "" };
      vi.spyOn(document, "createElement").mockReturnValue(link);
      vi.spyOn(document.body, "appendChild").mockImplementation(() => link);
      vi.spyOn(document.body, "removeChild").mockImplementation(() => link);
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:project");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

      downloadProjectFile(new Blob(["{}"], { type: "application/json" }), "river-table.hfzproject");

      expect(link.download).toBe("river-table.hfzproject");
      expect(click).toHaveBeenCalledTimes(1);
    });
  });
});
