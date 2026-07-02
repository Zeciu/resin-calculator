export const CURRENT_PROJECT_KIND = {
  NEW: "new",
  OPENED: "opened",
};

export function createNewCurrentProject() {
  return { kind: CURRENT_PROJECT_KIND.NEW };
}

export function createOpenedCurrentProject({
  recentEntryId,
  projectName,
  lastKnownFileName = null,
  fileHandle = null,
}) {
  return {
    kind: CURRENT_PROJECT_KIND.OPENED,
    recentEntryId,
    projectName,
    lastKnownFileName,
    fileHandle,
  };
}

export function canUpdateCurrentProjectInPlace(currentProject) {
  return (
    currentProject?.kind === CURRENT_PROJECT_KIND.OPENED &&
    Boolean(currentProject.recentEntryId) &&
    typeof currentProject.fileHandle?.createWritable === "function"
  );
}
