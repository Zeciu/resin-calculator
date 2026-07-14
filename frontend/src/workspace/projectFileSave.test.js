import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HFZ_PROJECT_CANONICAL_FORMAT_VERSION } from "../projectFileTypes.js";
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
  updateProjectFile,
} from "./projectFileSave.js";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUV0WQl3MBPQ8EAAAABJRU5ErkJggg==";

const STUB_USER = { id: "stub-user" };

const SAMPLE_SNAPSHOT = {
  appVersion: "1.0",
  savedAt: "2026-01-01T00:00:00.000Z",
  image: {
    dataUrl: TINY_PNG,
    width: 100,
    height: 80,
  },
  calibration: {
    referenceMeasurements: [
      {
        knownLengthCm: 10,
        calibrationPoints: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
      },
    ],
  },
  woodBoundaryMode: {
    woodBoundaryPolygons: [],
    cavities: [],
  },
  projectNotes: "Notes",
  result: { totalVolumeLiters: 1.2 },
};

const EXISTING_LIFECYCLE = {
  projectMetadata: {
    projectId: "project-1",
    ownerId: "stub-user",
    primaryImageHash: "hash-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    versionId: "version-1",
    parentVersionId: null,
    ancestorVersionIds: [],
    lastModifiedAt: "2026-01-01T00:00:00.000Z",
    metadataModifiedAt: null,
    structuralCapabilitySnapshot: null,
  },
  persistence: { status: "persisted" },
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
    it("builds a canonical v2 envelope with persisted lifecycle metadata", async () => {
      const result = await buildProjectFilePayload({
        projectName: "River Table",
        snapshot: SAMPLE_SNAPSHOT,
        user: STUB_USER,
      });

      expect(result.payload.format).toBe(HFZ_PROJECT_FORMAT);
      expect(result.payload.formatVersion).toBe(HFZ_PROJECT_CANONICAL_FORMAT_VERSION);
      expect(result.payload.descriptiveMetadata.projectName).toBe("River Table");
      expect(result.payload.technicalContent.image.dataUrl).toBe(TINY_PNG);
      expect(result.payload.projectMetadata.projectId).toBeTruthy();
      expect(result.payload.projectMetadata.versionId).toBeTruthy();
      expect(result.persistedLifecycle.persistence).toEqual({ status: "persisted" });
    });

    it("rejects an empty project name", async () => {
      await expect(
        buildProjectFilePayload({
          projectName: "   ",
          snapshot: SAMPLE_SNAPSHOT,
          user: STUB_USER,
        }),
      ).rejects.toThrow(ProjectFileSaveError);
    });

    it("rejects an incomplete project without a completed reference measurement", async () => {
      await expect(
        buildProjectFilePayload({
          projectName: "River Table",
          snapshot: {
            ...SAMPLE_SNAPSHOT,
            calibration: {
              referenceMeasurements: [{ knownLengthCm: 10, calibrationPoints: [] }],
            },
          },
          user: STUB_USER,
        }),
      ).rejects.toThrow(/reference measurement/i);
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
        user: STUB_USER,
      });

      expect(supportsNativeProjectSavePicker()).toBe(false);
      expect(result.payload.formatVersion).toBe(HFZ_PROJECT_CANONICAL_FORMAT_VERSION);
      expect(result.payload.descriptiveMetadata.projectName).toBe("River Table");
      expect(result.payload.technicalContent.image.dataUrl).toBe(TINY_PNG);
      expect(result.persistedLifecycle.projectMetadata.projectId).toBeTruthy();
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
        user: STUB_USER,
      });

      expect(window.showSaveFilePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestedName: `river-table${HFZ_PROJECT_FILE_EXTENSION}`,
        }),
      );
      expect(createWritable).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledTimes(1);
      expect(result.payload.technicalContent.image.dataUrl).toBe(TINY_PNG);
      expect(result.persistedLifecycle.persistence).toEqual({ status: "persisted" });
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
          user: STUB_USER,
        }),
      ).rejects.toBeInstanceOf(ProjectFileSaveCancelledError);
    });

    it("does not return persisted lifecycle when save is cancelled", async () => {
      window.showSaveFilePicker = vi.fn(async () => {
        throw new DOMException("User cancelled", "AbortError");
      });

      await expect(
        saveProjectFile({
          projectName: "River Table",
          snapshot: SAMPLE_SNAPSHOT,
          user: STUB_USER,
        }),
      ).rejects.toBeInstanceOf(ProjectFileSaveCancelledError);
    });
  });

  describe("updateProjectFile", () => {
    it("writes through an existing file handle without opening a picker", async () => {
      const write = vi.fn();
      const close = vi.fn();
      const createWritable = vi.fn(async () => ({ write, close }));
      const fileHandle = {
        getFile: vi.fn(),
        createWritable,
      };

      const result = await updateProjectFile({
        fileHandle,
        projectName: "River Table",
        snapshot: SAMPLE_SNAPSHOT,
        user: STUB_USER,
        persistedLifecycle: EXISTING_LIFECYCLE,
        fileName: "river-table.hfzproject",
      });

      expect(createWritable).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledTimes(1);
      expect(result.payload.descriptiveMetadata.projectName).toBe("River Table");
      expect(result.payload.projectMetadata.projectId).toBe("project-1");
      expect(result.payload.projectMetadata.versionId).toBe("version-1");
      expect(result.payload.projectMetadata.lastModifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.persistedLifecycle.projectMetadata.projectId).toBe("project-1");
      expect(result.fileName).toBe("river-table.hfzproject");
      expect(window.showSaveFilePicker).toBeUndefined();
    });

    it("rejects updates without a file handle", async () => {
      await expect(
        updateProjectFile({
          fileHandle: null,
          projectName: "River Table",
          snapshot: SAMPLE_SNAPSHOT,
          user: STUB_USER,
        }),
      ).rejects.toThrow(/file handle/i);
    });

    it("does not return persisted lifecycle when the write fails", async () => {
      const fileHandle = {
        createWritable: vi.fn(async () => {
          throw new Error("disk full");
        }),
      };

      await expect(
        updateProjectFile({
          fileHandle,
          projectName: "River Table",
          snapshot: SAMPLE_SNAPSHOT,
          user: STUB_USER,
          persistedLifecycle: EXISTING_LIFECYCLE,
        }),
      ).rejects.toThrow(ProjectFileSaveError);
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
