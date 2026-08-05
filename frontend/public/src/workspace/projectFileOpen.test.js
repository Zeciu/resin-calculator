import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPersistedV2OpenEnvelope } from "../project/canonicalProjectV2.test.js";
import {
  buildV2ProjectFileJson,
  buildV2ProjectFileJsonForOwner,
  VALID_CALCULATOR_SNAPSHOT,
} from "../project/projectFileTestFixtures.js";
import {
  loadProjectFromFile,
  loadProjectIntoRecentEntry,
  loadRecentProject,
  RecentProjectRebindMismatchError,
  RecentProjectUnavailableError,
  recordSavedProjectInRecentIndex,
} from "./projectFileOpen.js";
import { ProjectFileParseError } from "./projectFileParse.js";
import {
  buildRecentProjectEntry,
  loadRecentProjects,
  markRecentProjectUnavailable,
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
    buildRecentProjectEntry(
      buildPersistedV2OpenEnvelope({ identity: { ownerId: "stub-user" } }),
      { fileName: "river-table.hfzproject" },
    ),
  )[0];
}

function buildValidProjectFile() {
  return new File(
    [
      buildV2ProjectFileJsonForOwner("stub-user", {
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

describe("loadProjectFromFile", () => {
  beforeEach(() => {
    localStorage.clear();
    storeRecentProjectHandleMock.mockClear();
  });

  it("creates one recent entry with projectId on first owned open", async () => {
    const file = buildValidProjectFile();

    const result = await loadProjectFromFile(file, null, { user: { id: "stub-user" } });

    expect(result.entry?.projectId).toBe("project-1");
    expect(loadRecentProjects()).toHaveLength(1);
    expect(loadRecentProjects()[0].id).toBe(result.entry?.id);
  });

  it("reuses the same recent entry when opening the same owned projectId again", async () => {
    const file = buildValidProjectFile();
    const first = await loadProjectFromFile(file, null, { user: { id: "stub-user" } });
    const second = await loadProjectFromFile(file, null, { user: { id: "stub-user" } });

    expect(loadRecentProjects()).toHaveLength(1);
    expect(second.entry?.id).toBe(first.entry?.id);
  });

  it("does not add foreign-owned projects to recent projects", async () => {
    const file = new File(
      [buildV2ProjectFileJsonForOwner("other-owner", { snapshot: VALID_CALCULATOR_SNAPSHOT })],
      "foreign-table.hfzproject",
      { type: "application/json" },
    );

    const result = await loadProjectFromFile(file, null, { user: { id: "stub-user" } });

    expect(result.entry).toBeNull();
    expect(loadRecentProjects()).toHaveLength(0);
    expect(storeRecentProjectHandleMock).not.toHaveBeenCalled();
  });

  it("does not store a file handle for foreign-owned projects", async () => {
    const file = new File(
      [buildV2ProjectFileJsonForOwner("other-owner", { snapshot: VALID_CALCULATOR_SNAPSHOT })],
      "foreign-table.hfzproject",
      { type: "application/json" },
    );
    const handle = buildPermissionHandle({ file, includePermissionMethods: false });

    await loadProjectFromFile(file, handle, { user: { id: "stub-user" } });

    expect(storeRecentProjectHandleMock).not.toHaveBeenCalled();
  });
});

describe("recordSavedProjectInRecentIndex", () => {
  beforeEach(() => {
    localStorage.clear();
    storeRecentProjectHandleMock.mockClear();
  });

  it("creates one recent entry with projectId on first save", async () => {
    const envelope = buildPersistedV2OpenEnvelope({
      identity: { projectId: "project-save-1", ownerId: "stub-user" },
    });

    const entry = await recordSavedProjectInRecentIndex({
      payload: envelope,
      fileName: "river-table.hfzproject",
    });

    expect(entry.projectId).toBe("project-save-1");
    expect(loadRecentProjects()).toHaveLength(1);
  });
});

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

  it("rebinds when the selected file has the same projectId in a different location", async () => {
    const entry = buildRecentEntry();
    const file = new File(
      [
        buildV2ProjectFileJsonForOwner("stub-user", {
          snapshot: VALID_CALCULATOR_SNAPSHOT,
          identity: { projectId: "project-1", lastModifiedAt: "2026-02-01T12:00:00.000Z" },
        }),
      ],
      "moved/river-table-copy.hfzproject",
      { type: "application/json" },
    );
    const handle = buildPermissionHandle({ file, includePermissionMethods: false });

    const result = await loadProjectIntoRecentEntry(entry, file, handle);

    expect(result.entry.id).toBe(entry.id);
    expect(loadRecentProjects()[0].lastKnownFileName).toBe("moved/river-table-copy.hfzproject");
    expect(storeRecentProjectHandleMock).toHaveBeenCalledWith(entry.id, handle);
  });

  it("rejects rebind when the selected file belongs to a different projectId", async () => {
    const entry = buildRecentEntry();
    const file = new File(
      [
        buildV2ProjectFileJsonForOwner("stub-user", {
          snapshot: VALID_CALCULATOR_SNAPSHOT,
          identity: { projectId: "project-other", lastModifiedAt: "2026-02-01T12:00:00.000Z" },
        }),
      ],
      "other-table.hfzproject",
      { type: "application/json" },
    );
    const handle = buildPermissionHandle({ file, includePermissionMethods: false });
    const originalLastKnownFileName = entry.lastKnownFileName;

    await expect(loadProjectIntoRecentEntry(entry, file, handle)).rejects.toBeInstanceOf(
      RecentProjectRebindMismatchError,
    );

    expect(loadRecentProjects()).toHaveLength(1);
    expect(loadRecentProjects()[0].id).toBe(entry.id);
    expect(loadRecentProjects()[0].projectId).toBe("project-1");
    expect(loadRecentProjects()[0].lastKnownFileName).toBe(originalLastKnownFileName);
    expect(storeRecentProjectHandleMock).not.toHaveBeenCalled();
  });

  it("clears unavailable state after a matching projectId rebind", async () => {
    const entry = markRecentProjectUnavailable(buildRecentEntry().id)[0];
    const file = buildValidProjectFile();
    const handle = buildPermissionHandle({ file, includePermissionMethods: false });

    await loadProjectIntoRecentEntry(entry, file, handle);

    expect(loadRecentProjects()[0].localFileUnavailable).toBeUndefined();
  });

  it("preserves unavailable state after a mismatched projectId rebind", async () => {
    const entry = markRecentProjectUnavailable(buildRecentEntry().id)[0];
    const file = new File(
      [
        buildV2ProjectFileJsonForOwner("stub-user", {
          snapshot: VALID_CALCULATOR_SNAPSHOT,
          identity: { projectId: "project-other" },
        }),
      ],
      "other-table.hfzproject",
      { type: "application/json" },
    );

    await expect(loadProjectIntoRecentEntry(entry, file)).rejects.toBeInstanceOf(
      RecentProjectRebindMismatchError,
    );

    expect(loadRecentProjects()[0].localFileUnavailable).toBe(true);
  });
});

describe("loadRecentProject", () => {
  beforeEach(() => {
    localStorage.clear();
    storeRecentProjectHandleMock.mockClear();
    getRecentProjectHandleMock.mockReset();
  });

  it("does not touch a foreign-owned recent entry on reopen", async () => {
    const entry = buildRecentEntry();
    const file = new File(
      [buildV2ProjectFileJsonForOwner("other-owner", { snapshot: VALID_CALCULATOR_SNAPSHOT })],
      "river-table.hfzproject",
      { type: "application/json" },
    );
    const originalLastOpenedAt = entry.lastOpenedAt;
    const handle = buildPermissionHandle({ file });

    getRecentProjectHandleMock.mockResolvedValue(handle);

    await loadRecentProject(entry, { user: { id: "stub-user" } });

    expect(loadRecentProjects()[0].lastOpenedAt).toBe(originalLastOpenedAt);
    expect(storeRecentProjectHandleMock).not.toHaveBeenCalled();
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

    const result = await loadRecentProject(entry, { user: { id: "stub-user" } });

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

    const result = await loadRecentProject(entry, { user: { id: "stub-user" } });

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

    const result = await loadRecentProject(entry, { user: { id: "stub-user" } });

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

    await expect(loadRecentProject(entry, { user: { id: "stub-user" } })).rejects.toMatchObject({
      name: "RecentProjectUnavailableError",
      entry,
      message:
        "This recent project could not be opened. Please locate the project file manually.",
    });

    expect(getFile).not.toHaveBeenCalled();
    expect(loadRecentProjects()[0].localFileUnavailable).toBe(true);
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

    const result = await loadRecentProject(entry, { user: { id: "stub-user" } });

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

    await expect(loadRecentProject(entry, { user: { id: "stub-user" } })).rejects.toMatchObject({
      name: "RecentProjectUnavailableError",
      entry,
      message:
        "This recent project could not be opened. Please locate the project file manually.",
    });

    expect(loadRecentProjects()[0].localFileUnavailable).toBe(true);
  });

  it("marks the recent entry unavailable when no stored handle exists", async () => {
    const entry = buildRecentEntry();

    getRecentProjectHandleMock.mockResolvedValue(null);

    await expect(loadRecentProject(entry, { user: { id: "stub-user" } })).rejects.toBeInstanceOf(
      RecentProjectUnavailableError,
    );

    expect(loadRecentProjects()[0].localFileUnavailable).toBe(true);
  });

  it("clears unavailable state after a successful recent open", async () => {
    const entry = markRecentProjectUnavailable(buildRecentEntry().id)[0];
    const file = buildValidProjectFile();
    const handle = buildPermissionHandle({ file });

    getRecentProjectHandleMock.mockResolvedValue(handle);

    await loadRecentProject(entry, { user: { id: "stub-user" } });

    expect(loadRecentProjects()[0].localFileUnavailable).toBeUndefined();
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

    await expect(loadRecentProject(entry, { user: { id: "stub-user" } })).rejects.toBeInstanceOf(
      ProjectFileParseError,
    );
    await expect(loadRecentProject(entry, { user: { id: "stub-user" } })).rejects.toMatchObject({
      message: "Invalid project file.",
    });
  });
});
