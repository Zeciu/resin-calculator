import { createPersistedLifecycleFromEnvelope } from "../project/canonicalProjectLifecycle.js";
import { mapCanonicalV2ToCalculatorSnapshot } from "../project/mapCanonicalV2ToCalculatorSnapshot.js";
import { isCanonicalProjectV2Envelope } from "../project/canonicalProjectV2.js";
import {
  HFZ_PROJECT_CANONICAL_FORMAT_VERSION,
  HFZ_PROJECT_FORMAT,
  HFZ_PROJECT_FORMAT_VERSION,
} from "../projectFileTypes.js";

/** @typedef {import("../project/canonicalProjectV2.js").CanonicalProjectV2Envelope} CanonicalProjectV2Envelope */
/** @typedef {import("../project/canonicalProjectLifecycle.js").CanonicalProjectLifecycle} CanonicalProjectLifecycle */

/**
 * @typedef {{
 *   envelope: CanonicalProjectV2Envelope;
 *   snapshot: Record<string, unknown>;
 *   persistedLifecycle: CanonicalProjectLifecycle;
 * }} ParsedOpenProject
 */

export class ProjectFileParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProjectFileParseError";
  }
}

const REQUIRED_IDENTITY_FIELDS = [
  "projectId",
  "ownerId",
  "primaryImageHash",
  "createdAt",
  "versionId",
  "lastModifiedAt",
];

/**
 * @param {unknown} value
 */
export function isV1FlatProjectPayload(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (isCanonicalProjectV2Envelope(value)) {
    return false;
  }

  const record = /** @type {Record<string, unknown>} */ (value);

  if (record.formatVersion === HFZ_PROJECT_FORMAT_VERSION) {
    return true;
  }

  const image = record.image;
  if (image && typeof image === "object" && typeof image.dataUrl === "string") {
    return true;
  }

  return false;
}

/**
 * @param {unknown} value
 * @returns {CanonicalProjectV2Envelope}
 */
export function validateCanonicalProjectV2ForOpen(value) {
  if (!value || typeof value !== "object") {
    throw new ProjectFileParseError("Invalid project file.");
  }

  if (isV1FlatProjectPayload(value)) {
    throw new ProjectFileParseError("Invalid project file: unsupported format version.");
  }

  const record = /** @type {Record<string, unknown>} */ (value);

  if (record.format != null && record.format !== HFZ_PROJECT_FORMAT) {
    throw new ProjectFileParseError("Invalid project file.");
  }

  if (
    record.formatVersion != null &&
    record.formatVersion !== HFZ_PROJECT_CANONICAL_FORMAT_VERSION
  ) {
    throw new ProjectFileParseError("Invalid project file: unsupported format version.");
  }

  if (!isCanonicalProjectV2Envelope(value)) {
    throw new ProjectFileParseError("Invalid project file.");
  }

  const metadata = value.projectMetadata;

  for (const field of REQUIRED_IDENTITY_FIELDS) {
    const fieldValue = metadata[field];
    if (typeof fieldValue !== "string" || !fieldValue.trim()) {
      throw new ProjectFileParseError(`Invalid project file: missing ${field}.`);
    }
  }

  const image = value.technicalContent?.image;
  if (
    !image ||
    typeof image !== "object" ||
    typeof image.dataUrl !== "string" ||
    !image.dataUrl.trim()
  ) {
    throw new ProjectFileParseError("Invalid project file: missing image data.");
  }

  return value;
}

/**
 * @param {string} text
 * @returns {ParsedOpenProject}
 */
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

  const envelope = validateCanonicalProjectV2ForOpen(parsed);

  return {
    envelope,
    snapshot: mapCanonicalV2ToCalculatorSnapshot(envelope),
    persistedLifecycle: createPersistedLifecycleFromEnvelope(envelope),
  };
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
  if (isCanonicalProjectV2Envelope(project)) {
    const name = project.descriptiveMetadata?.projectName;
    if (typeof name === "string" && name.trim()) {
      return name.trim();
    }
  }

  if (project?.projectName?.trim()) {
    return project.projectName.trim();
  }

  if (fileName) {
    return fileName.replace(/\.(hfzproject|json)$/i, "");
  }

  return "Untitled project";
}

export function getProjectSavedAt(project) {
  if (isCanonicalProjectV2Envelope(project)) {
    const lastModifiedAt = project.projectMetadata?.lastModifiedAt;
    if (typeof lastModifiedAt === "string") {
      return lastModifiedAt;
    }
  }

  return typeof project?.savedAt === "string" ? project.savedAt : null;
}

export function detectProjectSourceFormat(fileName = "") {
  return fileName.toLowerCase().endsWith(".hfzproject") ? "hfzproject" : "json";
}
