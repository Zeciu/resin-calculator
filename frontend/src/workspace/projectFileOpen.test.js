import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPersistedV2OpenEnvelope } from "../project/canonicalProjectV2.test.js";
import {
  buildV2ProjectFileJson,
  VALID_CALCULATOR_SNAPSHOT,
} from "../project/projectFileTestFixtures.js";
import {
  loadProjectIntoRecentEntry,
  loadRecentProject,
} from "./projectFileOpen.js";
import { ProjectFileParseError } from "./projectFileParse.js";
import {
  buildRecentProjectEntry,
  loadRecentProjects,
  upsertRecentProject,
} from "./recentProjectsIndex.js";

const storeRecentProjectHandleMock = vi.fn(async () => {});
const getRecentProjectHandleMock = vi.fn();

vi.mock("./recentProjectHandles.js", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    getRecentProjectHandle: (...args) => getRecentProjectHandleMock(...args),
    storeRecentProjectHandle: (...args) => storeRecentProjectHandleMock(...args),
  };
});

function buildRecentEntry() {
  return upsertRecentProject(
    buildRecentProjectEntry(buildPersistedV2OpenEnvelope(), {
      fileName: "river-table.hfzproject",
    }),
  )[0];
}

function buildValidProjectFile() {
  return new File(
    [
      buildV2ProjectFileJson({
        snapshot: VALID_CALCULATOR_SNAPSHOT,
        identity: { lastModifiedAt: "2026-02-01T12:00:00.000Z" },
      }),
    ],
    "river-table.hfzproject",
    { type: "application/json" },
  );
}

function buildPermissionHandle({
  file,
  queryPermission = vi.fn(async () => "granted"),
  requestPermission = vi.fn(async () => "granted"),
  getFile = vi.fn(async () => file),
  includePermissionMethods = true,
} = {}) {
  const resolvedFile = file ?? buildValidProjectFile();
  const handle = {
    getFile: getFile ?? vi.fn(async () => resolvedFile),
    createWritable: vi.fn(),
  };

  if (includePermissionMethods) {
    handle.queryPermission = queryPermission;
    handle.requestPermission = requestPermission;
  }

  return handle;
}

describe("loadProjectIntoRecentEntry", () => {
  beforeEach(() => {
    localStorage.clear();
    storeRecentProjectHandleMock.mockClear();
    getRecentProjectHandleMock.mockReset();
  });

  it("rebinds an existing recent entry instead of creating a duplicate", async () => {
    const entry = buildRecentEntry();
    const file = buildValidProjectFile();
    const handle = buildPermissionHandle({ file, includePermissionMethods: false });

    const result = await loadProjectIntoRecentEntry(entry, file, handle);

    expect(result.entry.id).toBe(entry.id);
    expect(result.snapshot.image.dataUrl).toBeTruthy();
    expect(result.persistedLifecycle.projectMetadata.projectId).toBe("project-1");
    expect(loadRecentProjects()).toHaveLength(1);
    expect(storeRecentProjectHandleMock).toHaveBeenCalledWith(entry.id, handle);
  });
});

describe("loadRecentProject", () => {
  beforeEach(() => {
    localStorage.clear();
    storeRecentProjectHandleMock.mockClear();
    getRecentProjectHandleMock.mockReset();
  });

  it("opens when queryPermission is already granted without requesting again", async () => {
    const entry = buildRecentEntry();
    const file = buildValidProjectFile();
    const queryPermission = vi.fn(async () => "granted");
    const requestPermission = vi.fn(async () => "granted");
    const getFile = vi.fn(async () => file);
    const handle = buildPermissionHandle({
      file,
      queryPermission,
      requestPermission,
      getFile,
    });

    getRecentProjectHandleMock.mockResolvedValue(handle);

    const result = await loadRecentProject(entry);

    expect(queryPermission).toHaveBeenCalledWith({ mode: "read" });
    expect(requestPermission).not.toHaveBeenCalled();
    expect(getFile).toHaveBeenCalled();
    expect(result.snapshot.image.dataUrl).toBeTruthy();
    expect(storeRecentProjectHandleMock).toHaveBeenCalledWith(entry.id, handle);
  });

  it("opens when queryPermission is prompt and requestPermission grants access", async () => {
    const entry = buildRecentEntry();
    const file = buildValidProjectFile();
    const queryPermission = vi.fn(async () => "prompt");
    const requestPermission = vi.fn(async () => "granted");
    const getFile = vi.fn(async () => file);
    const handle = buildPermissionHandle({
      file,
      queryPermission,
      requestPermission,
      getFile,
    });

    getRecentProjectHandleMock.mockResolvedValue(handle);

    const result = await loadRecentProject(entry);

    expect(requestPermission).toHaveBeenCalledWith({ mode: "read" });
    expect(getFile).toHaveBeenCalled();
    expect(result.persistedLifecycle.projectMetadata.projectId).toBe("project-1");
  });

  it("opens when queryPermission is denied and requestPermission grants access", async () => {
    const entry = buildRecentEntry();
    const file = buildValidProjectFile();
    const queryPermission = vi.fn(async () => "denied");
    const requestPermission = vi.fn(async () => "granted");
    const getFile = vi.fn(async () => file);
    const handle = buildPermissionHandle({
      file,
      queryPermission,
      requestPermission,
      getFile,
    });

    getRecentProjectHandleMock.mockResolvedValue(handle);

    const result = await loadRecentProject(entry);

    expect(requestPermission).toHaveBeenCalledWith({ mode: "read" });
    expect(getFile).toHaveBeenCalled();
    expect(result.entry.id).toBe(entry.id);
  });

  it("returns manual-locate fallback when permission is not granted after request", async () => {
    const entry = buildRecentEntry();
    const queryPermission = vi.fn(async () => "prompt");
    const requestPermission = vi.fn(async () => "denied");
    const getFile = vi.fn();
    const handle = buildPermissionHandle({
      queryPermission,
      requestPermission,
      getFile,
    });

    getRecentProjectHandleMock.mockResolvedValue(handle);

    await expect(loadRecentProject(entry)).rejects.toMatchObject({
      name: "RecentProjectUnavailableError",
      entry,
      message:
        "This recent project could not be opened. Please locate the project file manually.",
    });

    expect(getFile).not.toHaveBeenCalled();
  });

  it("preserves direct-open behavior when permission methods are unavailable", async () => {
    const entry = buildRecentEntry();
    const file = buildValidProjectFile();
    const getFile = vi.fn(async () => file);
    const handle = buildPermissionHandle({
      file,
      getFile,
      includePermissionMethods: false,
    });

    getRecentProjectHandleMock.mockResolvedValue(handle);

    const result = await loadRecentProject(entry);

    expect(getFile).toHaveBeenCalled();
    expect(result.snapshot.projectNotes).toBe("Round-trip notes");
  });

  it("returns manual-locate fallback when getFile fails after permission is granted", async () => {
    const entry = buildRecentEntry();
    const getFile = vi.fn(async () => {
      throw new Error("NotAllowedError");
    });
    const handle = buildPermissionHandle({
      queryPermission: vi.fn(async () => "granted"),
      getFile,
    });

    getRecentProjectHandleMock.mockResolvedValue(handle);

    await expect(loadRecentProject(entry)).rejects.toMatchObject({
      name: "RecentProjectUnavailableError",
      entry,
      message:
        "This recent project could not be opened. Please locate the project file manually.",
    });
  });

  it("propagates parse errors without converting them to unavailable errors", async () => {
    const entry = buildRecentEntry();
    const invalidFile = new File(["not-json"], "river-table.hfzproject", {
      type: "application/json",
    });
    const handle = buildPermissionHandle({
      file: invalidFile,
      queryPermission: vi.fn(async () => "granted"),
      getFile: vi.fn(async () => invalidFile),
    });

    getRecentProjectHandleMock.mockResolvedValue(handle);

    await expect(loadRecentProject(entry)).rejects.toBeInstanceOf(ProjectFileParseError);
    await expect(loadRecentProject(entry)).rejects.toMatchObject({
      message: "Invalid project file.",
    });
  });
});
