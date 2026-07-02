import { HFZ_PROJECT_IMPORT_ACCEPT } from "../projectFileTypes.js";
import { parseProjectFile, ProjectFileParseError } from "./projectFileParse.js";
import {
  buildRecentProjectEntry,
  touchRecentProject,
  upsertRecentProject,
} from "./recentProjectsIndex.js";
import {
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

export async function loadProjectFromFile(file, handle = null) {
  const project = await parseProjectFile(file);
  const entry = buildRecentProjectEntry(project, {
    fileName: file.name,
  });

  upsertRecentProject(entry);

  if (isFileSystemHandle(handle)) {
    await storeRecentProjectHandle(entry.id, handle);
  }

  return { project, entry };
}

export async function loadRecentProject(entry) {
  const handle = await getRecentProjectHandle(entry.id);
  if (!handle) {
    throw new RecentProjectUnavailableError(
      entry,
      "This recent project cannot be opened automatically. Please locate the project file manually.",
    );
  }

  try {
    const file = await handle.getFile();
    const project = await parseProjectFile(file);
    touchRecentProject(entry.id);
    await storeRecentProjectHandle(entry.id, handle);
    return { project, entry };
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

export async function recordSavedProjectInRecentIndex({ payload, fileName, fileHandle = null }) {
  const entry = buildRecentProjectEntry(
    {
      projectName: payload.projectName,
      savedAt: payload.savedAt,
    },
    { fileName },
  );

  upsertRecentProject(entry);

  if (isFileSystemHandle(fileHandle)) {
    await storeRecentProjectHandle(entry.id, fileHandle);
  }

  return entry;
}

export { HFZ_PROJECT_IMPORT_ACCEPT };
