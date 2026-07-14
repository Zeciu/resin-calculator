/** @typedef {import("./canonicalProjectLifecycle.js").CanonicalProjectLifecycle} CanonicalProjectLifecycle */

export const PROJECT_OWNERSHIP_MODE = {
  OWNED: "owned",
  FOREIGN_READ_ONLY: "foreign_read_only",
};

export const PROJECT_WRITE_FORBIDDEN_MESSAGE =
  "This project belongs to another HFZWood user and cannot be edited or saved.";

export const PROJECT_READ_ONLY_NOTICE_MESSAGE =
  "This project belongs to another HFZWood user. You can view it here, but it cannot be edited, saved, or assigned to your account.";

/**
 * @param {{ id?: unknown } | null | undefined} user
 * @param {CanonicalProjectLifecycle | null | undefined} persistedLifecycle
 * @returns {typeof PROJECT_OWNERSHIP_MODE[keyof typeof PROJECT_OWNERSHIP_MODE]}
 */
export function resolveProjectOwnershipMode(user, persistedLifecycle) {
  const ownerId = persistedLifecycle?.projectMetadata?.ownerId;
  if (typeof ownerId !== "string" || !ownerId.trim()) {
    return PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY;
  }

  const userId = user?.id;
  if (typeof userId !== "string" || !userId.trim()) {
    return PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY;
  }

  return userId.trim() === ownerId.trim()
    ? PROJECT_OWNERSHIP_MODE.OWNED
    : PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY;
}

/**
 * @param {typeof PROJECT_OWNERSHIP_MODE[keyof typeof PROJECT_OWNERSHIP_MODE] | null | undefined} ownershipMode
 * @returns {boolean}
 */
export function isForeignReadOnlyOwnershipMode(ownershipMode) {
  return ownershipMode === PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY;
}

/**
 * @param {{ ownershipMode?: string | null } | null | undefined} currentProject
 * @returns {boolean}
 */
export function isCurrentProjectReadOnly(currentProject) {
  return isForeignReadOnlyOwnershipMode(currentProject?.ownershipMode);
}

/**
 * @param {typeof PROJECT_OWNERSHIP_MODE[keyof typeof PROJECT_OWNERSHIP_MODE] | null | undefined} ownershipMode
 */
export function assertProjectWritableByMode(ownershipMode) {
  if (isForeignReadOnlyOwnershipMode(ownershipMode)) {
    const error = new Error(PROJECT_WRITE_FORBIDDEN_MESSAGE);
    error.name = "ProjectWriteForbiddenError";
    throw error;
  }
}

/**
 * @param {{ ownershipMode?: string | null } | null | undefined} currentProject
 */
export function assertCurrentProjectWritable(currentProject) {
  assertProjectWritableByMode(currentProject?.ownershipMode);
}
