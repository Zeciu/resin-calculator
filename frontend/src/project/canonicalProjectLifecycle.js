import { createEmptyProjectMetadata } from "./canonicalProjectV2.js";

/**
 * @typedef {import("./canonicalProjectV2.js").CanonicalLifecycleProjectMetadata} CanonicalLifecycleProjectMetadata
 */

/**
 * @typedef {"never-persisted"} CanonicalPersistenceStatus
 */

/**
 * @typedef {{
 *   projectMetadata: CanonicalLifecycleProjectMetadata;
 *   persistence: { status: CanonicalPersistenceStatus };
 * }} CanonicalProjectLifecycle
 */

/**
 * Creates the approved in-memory canonical lifecycle record.
 * Runtime workspace wiring begins in M1.2.
 *
 * @returns {CanonicalProjectLifecycle}
 */
export function createEmptyCanonicalLifecycle() {
  return {
    projectMetadata: createEmptyProjectMetadata(),
    persistence: { status: "never-persisted" },
  };
}
