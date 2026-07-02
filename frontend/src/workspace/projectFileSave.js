import {
  HFZ_PROJECT_FILE_EXTENSION,
  HFZ_PROJECT_FORMAT,
  HFZ_PROJECT_FORMAT_VERSION,
  HFZ_PROJECT_MIME_TYPE,
} from "../projectFileTypes.js";

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

export function buildProjectFilePayload({ projectName, snapshot }) {
  const trimmedName = projectName.trim();
  if (!trimmedName) {
    throw new ProjectFileSaveError("Project name is required.");
  }

  if (!snapshot?.image?.dataUrl || typeof snapshot.image.dataUrl !== "string") {
    throw new ProjectFileSaveError("Upload an image before saving a project.");
  }

  const savedAt = new Date().toISOString();

  return {
    format: HFZ_PROJECT_FORMAT,
    formatVersion: HFZ_PROJECT_FORMAT_VERSION,
    projectName: trimmedName,
    ...snapshot,
    savedAt,
  };
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

export async function saveProjectFile({ projectName, snapshot }) {
  const payload = buildProjectFilePayload({ projectName, snapshot });
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
      return { payload, fileHandle, fileName: filename };
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new ProjectFileSaveCancelledError();
      }

      throw new ProjectFileSaveError("Could not save project file.", error);
    }
  }

  try {
    downloadProjectFile(blob, filename);
    return { payload, fileHandle: null, fileName: filename };
  } catch (error) {
    throw new ProjectFileSaveError("Could not save project file.", error);
  }
}
