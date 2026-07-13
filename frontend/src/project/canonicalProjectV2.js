import {
  HFZ_PROJECT_CANONICAL_FORMAT_VERSION,
  HFZ_PROJECT_FORMAT,
} from "../projectFileTypes.js";

/**
 * @typedef {{
 *   projectId: string | null;
 *   ownerId: string | null;
 *   primaryImageHash: string | null;
 *   createdAt: string | null;
 *   versionId: string | null;
 *   parentVersionId: string | null;
 *   ancestorVersionIds: string[];
 *   lastModifiedAt: string | null;
 *   metadataModifiedAt: string | null;
 *   structuralCapabilitySnapshot: unknown | null;
 * }} CanonicalLifecycleProjectMetadata
 */

/**
 * @typedef {{
 *   format: string;
 *   formatVersion: number;
 *   projectMetadata: CanonicalLifecycleProjectMetadata;
 *   technicalContent: Record<string, unknown>;
 *   descriptiveMetadata: Record<string, unknown>;
 *   derivedData: Record<string, unknown>;
 * }} CanonicalProjectV2Envelope
 */

/**
 * @returns {CanonicalLifecycleProjectMetadata}
 */
export function createEmptyProjectMetadata() {
  return {
    projectId: null,
    ownerId: null,
    primaryImageHash: null,
    createdAt: null,
    versionId: null,
    parentVersionId: null,
    ancestorVersionIds: [],
    lastModifiedAt: null,
    metadataModifiedAt: null,
    structuralCapabilitySnapshot: null,
  };
}

/**
 * @returns {CanonicalProjectV2Envelope}
 */
export function createEmptyCanonicalProjectV2() {
  return {
    format: HFZ_PROJECT_FORMAT,
    formatVersion: HFZ_PROJECT_CANONICAL_FORMAT_VERSION,
    projectMetadata: createEmptyProjectMetadata(),
    technicalContent: {},
    descriptiveMetadata: {},
    derivedData: {},
  };
}

/**
 * Minimal structural guard for the canonical v2 envelope.
 * This is not strict Open validation.
 *
 * @param {unknown} value
 * @returns {value is CanonicalProjectV2Envelope}
 */
export function isCanonicalProjectV2Envelope(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const envelope = /** @type {Record<string, unknown>} */ (value);

  if (envelope.format !== HFZ_PROJECT_FORMAT) {
    return false;
  }

  if (envelope.formatVersion !== HFZ_PROJECT_CANONICAL_FORMAT_VERSION) {
    return false;
  }

  const sections = [
    "projectMetadata",
    "technicalContent",
    "descriptiveMetadata",
    "derivedData",
  ];

  for (const section of sections) {
    if (!envelope[section] || typeof envelope[section] !== "object") {
      return false;
    }
  }

  const metadata = /** @type {Record<string, unknown>} */ (envelope.projectMetadata);

  if (!Array.isArray(metadata.ancestorVersionIds)) {
    return false;
  }

  return true;
}
