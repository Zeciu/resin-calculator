import { computePrimaryImageHash } from "./primaryImageHash.js";
import {
  adoptCanonicalProjectIdentity,
  hasCanonicalProjectIdentity,
  isProjectCreationThresholdMet,
} from "./projectCreationThreshold.js";

/** @typedef {import("./canonicalProjectLifecycle.js").CanonicalProjectLifecycle} CanonicalProjectLifecycle */
/** @typedef {import("./projectCreationThreshold.js").ProjectCreationThresholdInputs} ProjectCreationThresholdInputs */

/**
 * @typedef {({
 *   lifecycle: CanonicalProjectLifecycle;
 *   inputs: ProjectCreationThresholdInputs;
 *   ownerId: string | null;
 *   isOperationCurrent: () => boolean;
 *   computeHash?: typeof computePrimaryImageHash;
 *   generateProjectId?: () => string;
 *   now?: () => string;
 * })} EnsureCanonicalProjectIdentityParams
 */

/**
 * @typedef {({
 *   lifecycle: CanonicalProjectLifecycle;
 *   adopted: boolean;
 *   stale?: boolean;
 *   missingOwner?: boolean;
 *   identityError?: string | null;
 * })} EnsureCanonicalProjectIdentityResult
 */

/**
 * Evaluates the creation threshold and, when appropriate, adopts canonical identity once.
 *
 * @param {EnsureCanonicalProjectIdentityParams} params
 * @returns {Promise<EnsureCanonicalProjectIdentityResult>}
 */
export async function ensureCanonicalProjectIdentity(params) {
  const computeHash = params.computeHash ?? computePrimaryImageHash;
  const generateProjectId = params.generateProjectId ?? (() => crypto.randomUUID());
  const now = params.now ?? (() => new Date().toISOString());
  const isOperationCurrent = params.isOperationCurrent ?? (() => true);

  if (!isOperationCurrent()) {
    return {
      lifecycle: params.lifecycle,
      adopted: false,
      stale: true,
      identityError: null,
    };
  }

  if (!isProjectCreationThresholdMet(params.inputs)) {
    return {
      lifecycle: params.lifecycle,
      adopted: false,
      identityError: null,
    };
  }

  if (hasCanonicalProjectIdentity(params.lifecycle)) {
    return {
      lifecycle: params.lifecycle,
      adopted: false,
      identityError: null,
    };
  }

  if (!params.ownerId) {
    return {
      lifecycle: params.lifecycle,
      adopted: false,
      missingOwner: true,
      identityError:
        "Authenticated user identity is required before Project creation.",
    };
  }

  let primaryImageHash;
  try {
    primaryImageHash = await computeHash(params.inputs.imageDataUrl);
  } catch {
    return {
      lifecycle: params.lifecycle,
      adopted: false,
      identityError: "Could not compute primary image hash.",
    };
  }

  if (!isOperationCurrent()) {
    return {
      lifecycle: params.lifecycle,
      adopted: false,
      stale: true,
      identityError: null,
    };
  }

  if (!isProjectCreationThresholdMet(params.inputs)) {
    return {
      lifecycle: params.lifecycle,
      adopted: false,
      identityError: null,
    };
  }

  if (hasCanonicalProjectIdentity(params.lifecycle)) {
    return {
      lifecycle: params.lifecycle,
      adopted: false,
      identityError: null,
    };
  }

  const adoption = adoptCanonicalProjectIdentity(params.lifecycle, {
    projectId: generateProjectId(),
    ownerId: params.ownerId,
    primaryImageHash,
    createdAt: now(),
  });

  return {
    lifecycle: adoption.lifecycle,
    adopted: adoption.adopted,
    identityError: null,
  };
}
