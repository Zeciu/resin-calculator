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

export function buildRecentProjectEntry(project, { fileName = "", sourceFormat } = {}) {
  const now = new Date().toISOString();

  return sanitizeRecentProjectEntry({
    id: createRecentProjectId(),
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

  const existing = loadRecentProjects().filter((item) => item.id !== sanitizedEntry.id);
  return saveRecentProjects([sanitizedEntry, ...existing]);
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
