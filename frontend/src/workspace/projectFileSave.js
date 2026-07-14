import {
  HFZ_PROJECT_FILE_EXTENSION,
  HFZ_PROJECT_MIME_TYPE,
} from "../projectFileTypes.js";
import {
  BuildPersistableCanonicalV2Error,
  buildPersistableCanonicalV2,
} from "../project/buildPersistableCanonicalV2.js";
import { isFileSystemHandle } from "./recentProjectHandles.js";

export {
  HFZ_PROJECT_FILE_EXTENSION,
  HFZ_PROJECT_FORMAT,
  HFZ_PROJECT_FORMAT_VERSION,
  HFZ_PROJECT_IMPORT_ACCEPT,
  HFZ_PROJECT_MIME_TYPE,
} from "../projectFileTypes.js";

export class ProjectFileSaveError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "ProjectFileSaveError";
    this.cause = cause;
  }
}

export class ProjectFileSaveCancelledError extends Error {
  constructor() {
    super("Save cancelled.");
    this.name = "ProjectFileSaveCancelledError";
  }
}

export function slugifyProjectFilename(projectName) {
  const slug = projectName
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return slug || "hfzwood-project";
}

/**
 * @param {{
 *   projectName: string;
 *   snapshot: Record<string, unknown>;
 *   user: { id?: unknown } | null | undefined;
 *   persistedLifecycle?: import("../project/canonicalProjectLifecycle.js").CanonicalProjectLifecycle | null;
 * }} params
 */
export async function buildProjectFilePayload(params) {
  try {
    const { envelope, persistedLifecycle } = await buildPersistableCanonicalV2(params);
    return { payload: envelope, persistedLifecycle };
  } catch (error) {
    if (error instanceof BuildPersistableCanonicalV2Error) {
      throw new ProjectFileSaveError(error.message);
    }

    throw error;
  }
}

export function supportsNativeProjectSavePicker() {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

async function writeBlobToFileHandle(fileHandle, blob) {
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export function downloadProjectFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function updateProjectFile({
  fileHandle,
  projectName,
  snapshot,
  user,
  persistedLifecycle = null,
  fileName = null,
}) {
  if (!isFileSystemHandle(fileHandle)) {
    throw new ProjectFileSaveError("Cannot update project file without a file handle.");
  }

  const { payload, persistedLifecycle: nextPersistedLifecycle } =
    await buildProjectFilePayload({
      projectName,
      snapshot,
      user,
      persistedLifecycle,
    });
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: HFZ_PROJECT_MIME_TYPE });
  const resolvedFileName =
    fileName || `${slugifyProjectFilename(projectName)}${HFZ_PROJECT_FILE_EXTENSION}`;

  try {
    await writeBlobToFileHandle(fileHandle, blob);
    return {
      payload,
      persistedLifecycle: nextPersistedLifecycle,
      fileHandle,
      fileName: resolvedFileName,
    };
  } catch (error) {
    throw new ProjectFileSaveError("Could not update project file.", error);
  }
}

export async function saveProjectFile({ projectName, snapshot, user, persistedLifecycle = null }) {
  const { payload, persistedLifecycle: nextPersistedLifecycle } =
    await buildProjectFilePayload({
      projectName,
      snapshot,
      user,
      persistedLifecycle,
    });
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: HFZ_PROJECT_MIME_TYPE });
  const filename = `${slugifyProjectFilename(projectName)}${HFZ_PROJECT_FILE_EXTENSION}`;

  if (supportsNativeProjectSavePicker()) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "HFZWood Project",
            accept: {
              [HFZ_PROJECT_MIME_TYPE]: [HFZ_PROJECT_FILE_EXTENSION],
            },
          },
        ],
      });
      await writeBlobToFileHandle(fileHandle, blob);
      return {
        payload,
        persistedLifecycle: nextPersistedLifecycle,
        fileHandle,
        fileName: filename,
      };
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new ProjectFileSaveCancelledError();
      }

      throw new ProjectFileSaveError("Could not save project file.", error);
    }
  }

  try {
    downloadProjectFile(blob, filename);
    return {
      payload,
      persistedLifecycle: nextPersistedLifecycle,
      fileHandle: null,
      fileName: filename,
    };
  } catch (error) {
    throw new ProjectFileSaveError("Could not save project file.", error);
  }
}
