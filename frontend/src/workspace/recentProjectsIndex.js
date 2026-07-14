import {
  detectProjectSourceFormat,
  getProjectDisplayName,
  getProjectSavedAt,
} from "./projectFileParse.js";

export const RECENT_PROJECTS_STORAGE_KEY = "hfzwood.recentProjects";
export const RECENT_PROJECTS_INDEX_VERSION = 1;
export const MAX_RECENT_PROJECTS = 10;

const ALLOWED_RECENT_FIELDS = new Set([
  "id",
  "projectId",
  "projectName",
  "lastOpenedAt",
  "lastSavedAt",
  "lastKnownFileName",
  "sourceFormat",
]);

export function createRecentProjectId() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${suffix}`;
}

/**
 * @param {unknown} project
 * @returns {string | null}
 */
export function extractCanonicalProjectId(project) {
  const projectId = project?.projectMetadata?.projectId;
  if (typeof projectId === "string" && projectId.trim()) {
    return projectId.trim();
  }

  return null;
}

/**
 * @param {string | null | undefined} projectId
 * @returns {import("./recentProjectsIndex.js").RecentProjectEntry | null}
 */
export function findRecentProjectByProjectId(projectId) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    return null;
  }

  const normalizedProjectId = projectId.trim();
  return (
    loadRecentProjects().find((item) => item.projectId === normalizedProjectId) ?? null
  );
}

export function sanitizeRecentProjectEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const sanitized = {};
  for (const field of ALLOWED_RECENT_FIELDS) {
    if (entry[field] != null) {
      sanitized[field] = entry[field];
    }
  }

  if (!sanitized.id || !sanitized.projectName || !sanitized.lastOpenedAt) {
    return null;
  }

  return sanitized;
}

export function loadRecentProjects() {
  const raw = localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.projects)) {
      return [];
    }

    return parsed.projects
      .map(sanitizeRecentProjectEntry)
      .filter(Boolean)
      .sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt))
      .slice(0, MAX_RECENT_PROJECTS);
  } catch {
    return [];
  }
}

export function saveRecentProjects(projects) {
  const sanitized = projects
    .map(sanitizeRecentProjectEntry)
    .filter(Boolean)
    .sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt))
    .slice(0, MAX_RECENT_PROJECTS);

  localStorage.setItem(
    RECENT_PROJECTS_STORAGE_KEY,
    JSON.stringify({
      version: RECENT_PROJECTS_INDEX_VERSION,
      projects: sanitized,
    }),
  );

  return sanitized;
}

export function buildRecentProjectEntry(project, { fileName = "", sourceFormat, entryId = null } = {}) {
  const now = new Date().toISOString();
  const projectId = extractCanonicalProjectId(project);

  return sanitizeRecentProjectEntry({
    id: entryId || createRecentProjectId(),
    projectId,
    projectName: getProjectDisplayName(project, fileName),
    lastOpenedAt: now,
    lastSavedAt: getProjectSavedAt(project),
    lastKnownFileName: fileName || null,
    sourceFormat: sourceFormat || detectProjectSourceFormat(fileName),
  });
}

export function upsertRecentProject(entry) {
  const sanitizedEntry = sanitizeRecentProjectEntry(entry);
  if (!sanitizedEntry) {
    throw new Error("Invalid recent project entry.");
  }

  const existing = loadRecentProjects();
  const matchByProjectId = sanitizedEntry.projectId
    ? existing.find((item) => item.projectId === sanitizedEntry.projectId)
    : null;
  const preservedId = matchByProjectId?.id ?? sanitizedEntry.id;

  const merged = sanitizeRecentProjectEntry({
    ...matchByProjectId,
    ...sanitizedEntry,
    id: preservedId,
  });

  if (!merged) {
    throw new Error("Invalid recent project entry.");
  }

  const remainder = existing.filter(
    (item) =>
      item.id !== preservedId &&
      (!merged.projectId || item.projectId !== merged.projectId),
  );
  return saveRecentProjects([merged, ...remainder]);
}

export function updateRecentProjectOnSave(
  entryId,
  { projectName, savedAt, lastKnownFileName },
) {
  const existing = loadRecentProjects();
  const match = existing.find((item) => item.id === entryId);
  if (!match) {
    throw new Error("Recent project entry not found.");
  }

  const updated = sanitizeRecentProjectEntry({
    ...match,
    projectName: projectName || match.projectName,
    lastSavedAt: savedAt,
    lastKnownFileName:
      lastKnownFileName != null ? lastKnownFileName : match.lastKnownFileName,
  });

  if (!updated) {
    throw new Error("Invalid recent project entry.");
  }

  const remainder = existing.filter((item) => item.id !== entryId);
  return saveRecentProjects([updated, ...remainder]);
}

export function refreshRecentProjectOnOpen(entryId, project, { fileName = "" } = {}) {
  const existing = loadRecentProjects();
  const match = existing.find((item) => item.id === entryId);
  if (!match) {
    throw new Error("Recent project entry not found.");
  }

  const resolvedFileName = fileName || match.lastKnownFileName || "";
  const updated = sanitizeRecentProjectEntry({
    ...match,
    projectId: extractCanonicalProjectId(project) || match.projectId || null,
    projectName: getProjectDisplayName(project, resolvedFileName),
    lastOpenedAt: new Date().toISOString(),
    lastSavedAt: getProjectSavedAt(project) || match.lastSavedAt,
    lastKnownFileName: resolvedFileName || null,
    sourceFormat: detectProjectSourceFormat(resolvedFileName),
  });

  if (!updated) {
    throw new Error("Invalid recent project entry.");
  }

  const remainder = existing.filter((item) => item.id !== entryId);
  saveRecentProjects([updated, ...remainder]);
  return updated;
}

export function touchRecentProject(entryId) {
  const existing = loadRecentProjects();
  const match = existing.find((item) => item.id === entryId);
  if (!match) {
    return existing;
  }

  const updated = {
    ...match,
    lastOpenedAt: new Date().toISOString(),
  };

  const remainder = existing.filter((item) => item.id !== entryId);
  return saveRecentProjects([updated, ...remainder]);
}
