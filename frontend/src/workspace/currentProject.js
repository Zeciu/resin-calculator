import { isForeignReadOnlyOwnershipMode } from "../project/projectOwnership.js";

export const CURRENT_PROJECT_KIND = {
  NEW: "new",
  OPENED: "opened",
};

/** @typedef {import("../project/projectOwnership.js").PROJECT_OWNERSHIP_MODE} ProjectOwnershipMode */

export function createNewCurrentProject() {
  return { kind: CURRENT_PROJECT_KIND.NEW };
}

export function createOpenedCurrentProject({
  recentEntryId,
  projectName,
  lastKnownFileName = null,
  fileHandle = null,
  persistedLifecycle = null,
  ownershipMode = null,
}) {
  return {
    kind: CURRENT_PROJECT_KIND.OPENED,
    recentEntryId,
    projectName,
    lastKnownFileName,
    fileHandle,
    persistedLifecycle,
    ownershipMode,
  };
}

export function canUpdateCurrentProjectInPlace(currentProject) {
  return (
    currentProject?.kind === CURRENT_PROJECT_KIND.OPENED &&
    !isForeignReadOnlyOwnershipMode(currentProject?.ownershipMode) &&
    Boolean(currentProject.recentEntryId) &&
    typeof currentProject.fileHandle?.createWritable === "function"
  );
}
