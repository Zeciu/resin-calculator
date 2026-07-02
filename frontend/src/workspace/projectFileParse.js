export class ProjectFileParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProjectFileParseError";
  }
}

export function parseProjectFileText(text) {
  if (typeof text !== "string") {
    throw new ProjectFileParseError("Invalid project file.");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ProjectFileParseError("Invalid project file.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new ProjectFileParseError("Invalid project file.");
  }

  if (!parsed.image?.dataUrl || typeof parsed.image.dataUrl !== "string") {
    throw new ProjectFileParseError("Invalid project file: missing image data.");
  }

  return parsed;
}

export function readProjectFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => {
      reject(new ProjectFileParseError("Could not read project file."));
    };
    reader.readAsText(file);
  });
}

export async function parseProjectFile(file) {
  const text = await readProjectFileAsText(file);
  return parseProjectFileText(text);
}

export function getProjectDisplayName(project, fileName = "") {
  if (project?.projectName?.trim()) {
    return project.projectName.trim();
  }

  if (fileName) {
    return fileName.replace(/\.(hfzproject|json)$/i, "");
  }

  return "Untitled project";
}

export function getProjectSavedAt(project) {
  return typeof project?.savedAt === "string" ? project.savedAt : null;
}

export function detectProjectSourceFormat(fileName = "") {
  return fileName.toLowerCase().endsWith(".hfzproject") ? "hfzproject" : "json";
}
