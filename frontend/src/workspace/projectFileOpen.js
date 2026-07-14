import { HFZ_PROJECT_IMPORT_ACCEPT } from "../projectFileTypes.js";
import { getRecentIndexFieldsFromSavedPayload } from "../project/buildPersistableCanonicalV2.js";
import {
  isForeignReadOnlyOwnershipMode,
  resolveProjectOwnershipMode,
} from "../project/projectOwnership.js";
import { parseProjectFile, ProjectFileParseError } from "./projectFileParse.js";
import {
  buildRecentProjectEntry,
  refreshRecentProjectOnOpen,
  touchRecentProject,
  updateRecentProjectOnSave,
  upsertRecentProject,
} from "./recentProjectsIndex.js";
import {
  ensureFileHandleReadPermission,
  getRecentProjectHandle,
  isFileSystemHandle,
  storeRecentProjectHandle,
} from "./recentProjectHandles.js";

export class RecentProjectUnavailableError extends Error {
  constructor(entry, message = "This recent project is no longer available.") {
    super(message);
    this.name = "RecentProjectUnavailableError";
    this.entry = entry;
  }
}

export function supportsNativeProjectOpenPicker() {
  return typeof window !== "undefined" && "showOpenFilePicker" in window;
}

export async function pickProjectFileWithHandle() {
  if (!supportsNativeProjectOpenPicker()) {
    return null;
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "HFZWood Project",
          accept: {
            "application/vnd.hfzwood.project+json": [".hfzproject"],
            "application/json": [".json"],
          },
        },
      ],
    });

    if (!isFileSystemHandle(handle)) {
      return null;
    }

    const file = await handle.getFile();
    return { file, handle };
  } catch (error) {
    if (error?.name === "AbortError") {
      return null;
    }

    throw error;
  }
}

function isForeignOwnedProject(user, persistedLifecycle) {
  return isForeignReadOnlyOwnershipMode(
    resolveProjectOwnershipMode(user, persistedLifecycle),
  );
}

export async function loadProjectFromFile(file, handle = null, { user = null } = {}) {
  const parsed = await parseProjectFile(file);

  if (isForeignOwnedProject(user, parsed.persistedLifecycle)) {
    return { ...parsed, entry: null, fileName: file.name };
  }

  const entry = buildRecentProjectEntry(parsed.envelope, {
    fileName: file.name,
  });
  const [savedEntry] = upsertRecentProject(entry);

  if (isFileSystemHandle(handle)) {
    await storeRecentProjectHandle(savedEntry.id, handle);
  }

  return { ...parsed, entry: savedEntry, fileName: file.name };
}

export async function loadProjectIntoRecentEntry(entry, file, handle = null) {
  const parsed = await parseProjectFile(file);
  const refreshedEntry = refreshRecentProjectOnOpen(entry.id, parsed.envelope, {
    fileName: file.name,
  });

  if (isFileSystemHandle(handle)) {
    await storeRecentProjectHandle(entry.id, handle);
  }

  return { ...parsed, entry: refreshedEntry };
}

export async function loadRecentProject(entry, { user = null } = {}) {
  const handle = await getRecentProjectHandle(entry.id);
  if (!handle) {
    throw new RecentProjectUnavailableError(
      entry,
      "This recent project cannot be opened automatically. Please locate the project file manually.",
    );
  }

  const hasReadPermission = await ensureFileHandleReadPermission(handle);
  if (!hasReadPermission) {
    throw new RecentProjectUnavailableError(
      entry,
      "This recent project could not be opened. Please locate the project file manually.",
    );
  }

  try {
    const file = await handle.getFile();
    const parsed = await parseProjectFile(file);
    const isForeign = isForeignOwnedProject(user, parsed.persistedLifecycle);

    if (!isForeign) {
      touchRecentProject(entry.id);
      await storeRecentProjectHandle(entry.id, handle);
    }

    return { ...parsed, entry };
  } catch (error) {
    if (error instanceof ProjectFileParseError) {
      throw error;
    }

    throw new RecentProjectUnavailableError(
      entry,
      "This recent project could not be opened. Please locate the project file manually.",
    );
  }
}

export async function recordUpdatedProjectInRecentIndex({
  entryId,
  payload,
  fileName,
  fileHandle = null,
}) {
  const { projectName, savedAt } = getRecentIndexFieldsFromSavedPayload(payload);

  updateRecentProjectOnSave(entryId, {
    projectName,
    savedAt,
    lastKnownFileName: fileName,
  });

  if (isFileSystemHandle(fileHandle)) {
    await storeRecentProjectHandle(entryId, fileHandle);
  }
}

export async function recordSavedProjectInRecentIndex({ payload, fileName, fileHandle = null }) {
  const entry = buildRecentProjectEntry(payload, { fileName });
  const [savedEntry] = upsertRecentProject(entry);

  if (isFileSystemHandle(fileHandle)) {
    await storeRecentProjectHandle(savedEntry.id, fileHandle);
  }

  return savedEntry;
}

export { HFZ_PROJECT_IMPORT_ACCEPT };
