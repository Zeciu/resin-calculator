import { mapCalculatorSnapshotToCanonicalV2 } from "./mapSnapshotToCanonicalV2.js";
import { createPersistedLifecycleFromEnvelope } from "./canonicalProjectLifecycle.js";
import { HFZ_PROJECT_CANONICAL_FORMAT_VERSION } from "../projectFileTypes.js";
import { computePrimaryImageHash } from "./primaryImageHash.js";
import {
  hasCanonicalProjectIdentity,
  isProjectCreationThresholdMet,
  resolveAuthenticatedOwnerId,
} from "./projectCreationThreshold.js";

/** @typedef {import("./canonicalProjectLifecycle.js").CanonicalProjectLifecycle} CanonicalProjectLifecycle */
/** @typedef {import("./canonicalProjectV2.js").CanonicalProjectV2Envelope} CanonicalProjectV2Envelope */

export class BuildPersistableCanonicalV2Error extends Error {
  constructor(message) {
    super(message);
    this.name = "BuildPersistableCanonicalV2Error";
  }
}

/**
 * @param {Record<string, unknown> | null | undefined} snapshot
 */
export function getSnapshotCreationThresholdInputs(snapshot) {
  const image = snapshot?.image;
  const imageDataUrl =
    image && typeof image === "object" && typeof image.dataUrl === "string"
      ? image.dataUrl
      : "";

  const calibration = snapshot?.calibration;
  const referenceMeasurements =
    calibration &&
    typeof calibration === "object" &&
    Array.isArray(calibration.referenceMeasurements)
      ? calibration.referenceMeasurements
      : [];

  return { imageDataUrl, referenceMeasurements };
}

/**
 * @param {CanonicalProjectV2Envelope} envelope
 */
export function getRecentIndexFieldsFromSavedPayload(envelope) {
  const projectName =
    typeof envelope?.descriptiveMetadata?.projectName === "string"
      ? envelope.descriptiveMetadata.projectName.trim()
      : "";

  const savedAt =
    typeof envelope?.projectMetadata?.lastModifiedAt === "string"
      ? envelope.projectMetadata.lastModifiedAt
      : null;

  return { projectName, savedAt };
}

/**
 * @param {{
 *   projectName: string;
 *   snapshot: Record<string, unknown>;
 *   user: { id?: unknown } | null | undefined;
 *   persistedLifecycle?: CanonicalProjectLifecycle | null;
 *   computeHash?: typeof computePrimaryImageHash;
 *   generateProjectId?: () => string;
 *   generateVersionId?: () => string;
 *   now?: () => string;
 * }} params
 * @returns {Promise<{ envelope: CanonicalProjectV2Envelope; persistedLifecycle: CanonicalProjectLifecycle }>}
 */
export async function buildPersistableCanonicalV2(params) {
  const trimmedName = params.projectName.trim();
  if (!trimmedName) {
    throw new BuildPersistableCanonicalV2Error("Project name is required.");
  }

  const thresholdInputs = getSnapshotCreationThresholdInputs(params.snapshot);
  if (!isProjectCreationThresholdMet(thresholdInputs)) {
    throw new BuildPersistableCanonicalV2Error(
      "Upload an image and complete at least one reference measurement before saving.",
    );
  }

  const computeHash = params.computeHash ?? computePrimaryImageHash;
  const generateProjectId = params.generateProjectId ?? (() => crypto.randomUUID());
  const generateVersionId = params.generateVersionId ?? (() => crypto.randomUUID());
  const now = params.now ?? (() => new Date().toISOString());
  const lastModifiedAt = now();

  const existingLifecycle = params.persistedLifecycle ?? null;
  const isUpdate = hasCanonicalProjectIdentity(existingLifecycle);

  let lifecycleForMapping;

  if (isUpdate) {
    const existingMetadata = existingLifecycle.projectMetadata;
    lifecycleForMapping = {
      projectMetadata: {
        projectId: existingMetadata.projectId,
        ownerId: existingMetadata.ownerId,
        primaryImageHash: existingMetadata.primaryImageHash,
        createdAt: existingMetadata.createdAt,
        versionId: existingMetadata.versionId,
        parentVersionId: null,
        ancestorVersionIds: [],
        lastModifiedAt,
        metadataModifiedAt: null,
        structuralCapabilitySnapshot: existingMetadata.structuralCapabilitySnapshot ?? null,
      },
      persistence: existingLifecycle.persistence,
    };
  } else {
    const ownerId = resolveAuthenticatedOwnerId(params.user);
    if (!ownerId) {
      throw new BuildPersistableCanonicalV2Error(
        "Authenticated user identity is required before saving a project.",
      );
    }

    let primaryImageHash;
    try {
      primaryImageHash = await computeHash(thresholdInputs.imageDataUrl);
    } catch {
      throw new BuildPersistableCanonicalV2Error("Could not compute primary image hash.");
    }

    lifecycleForMapping = {
      projectMetadata: {
        projectId: generateProjectId(),
        ownerId,
        primaryImageHash,
        createdAt: lastModifiedAt,
        versionId: generateVersionId(),
        parentVersionId: null,
        ancestorVersionIds: [],
        lastModifiedAt,
        metadataModifiedAt: null,
        structuralCapabilitySnapshot: null,
      },
      persistence: { status: "never-persisted" },
    };
  }

  const envelope = mapCalculatorSnapshotToCanonicalV2(params.snapshot, {
    projectName: trimmedName,
    lifecycle: lifecycleForMapping,
  });

  if (envelope.formatVersion !== HFZ_PROJECT_CANONICAL_FORMAT_VERSION) {
    throw new BuildPersistableCanonicalV2Error("Invalid canonical project format version.");
  }

  return {
    envelope,
    persistedLifecycle: createPersistedLifecycleFromEnvelope(envelope),
  };
}
