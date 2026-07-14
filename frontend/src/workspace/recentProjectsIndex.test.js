import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPersistedV2OpenEnvelope } from "../project/canonicalProjectV2.test.js";
import {
  buildRecentProjectEntry,
  extractCanonicalProjectId,
  findRecentProjectByProjectId,
  loadRecentProjects,
  RECENT_PROJECTS_STORAGE_KEY,
  refreshRecentProjectOnOpen,
  updateRecentProjectOnSave,
  upsertRecentProject,
} from "./recentProjectsIndex.js";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUV0WQl3MBPQ8EAAAABJRU5ErkJggg==";

describe("recentProjectsIndex", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores only lightweight metadata", () => {
    const entry = upsertRecentProject(
      buildRecentProjectEntry(
        {
          projectName: "River Table",
          savedAt: "2026-01-01T12:00:00.000Z",
          image: { dataUrl: TINY_PNG },
          calibration: { referenceMeasurements: [{ knownLengthCm: 10 }] },
        },
        { fileName: "river-table.hfzproject" },
      ),
    );

    expect(entry).toHaveLength(1);
    expect(entry[0].projectName).toBe("River Table");
    expect(entry[0].lastKnownFileName).toBe("river-table.hfzproject");

    const raw = localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY);
    expect(raw).not.toContain(TINY_PNG);
    expect(raw).not.toContain("referenceMeasurements");
    expect(loadRecentProjects()[0].projectName).toBe("River Table");
  });

  it("updates an existing recent project entry on save", () => {
    const entry = upsertRecentProject(
      buildRecentProjectEntry(
        {
          projectName: "River Table",
          savedAt: "2026-01-01T12:00:00.000Z",
        },
        { fileName: "river-table.hfzproject" },
      ),
    )[0];

    const updated = updateRecentProjectOnSave(entry.id, {
      projectName: "River Table",
      savedAt: "2026-02-01T12:00:00.000Z",
      lastKnownFileName: "river-table.hfzproject",
    });

    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe(entry.id);
    expect(updated[0].lastSavedAt).toBe("2026-02-01T12:00:00.000Z");
    expect(loadRecentProjects()).toHaveLength(1);
  });

  it("refreshes an existing recent entry on reopen without changing its id", () => {
    const entry = upsertRecentProject(
      buildRecentProjectEntry(
        {
          projectName: "River Table",
          savedAt: "2026-01-01T12:00:00.000Z",
        },
        { fileName: "river-table.hfzproject" },
      ),
    )[0];

    const refreshed = refreshRecentProjectOnOpen(
      entry.id,
      {
        projectName: "River Table",
        savedAt: "2026-02-01T12:00:00.000Z",
      },
      { fileName: "river-table.hfzproject" },
    );

    expect(refreshed.id).toBe(entry.id);
    expect(refreshed.lastSavedAt).toBe("2026-02-01T12:00:00.000Z");
    expect(loadRecentProjects()).toHaveLength(1);
  });

  it("stores canonical projectId on recent entries", () => {
    const envelope = buildPersistedV2OpenEnvelope({
      identity: { projectId: "project-abc" },
    });

    const [entry] = upsertRecentProject(
      buildRecentProjectEntry(envelope, { fileName: "river-table.hfzproject" }),
    );

    expect(entry.projectId).toBe("project-abc");
    expect(extractCanonicalProjectId(envelope)).toBe("project-abc");
    expect(findRecentProjectByProjectId("project-abc")?.id).toBe(entry.id);
  });

  it("reuses the same recent entry when upserting the same projectId", () => {
    const envelope = buildPersistedV2OpenEnvelope({
      identity: { projectId: "project-abc" },
    });

    const [first] = upsertRecentProject(
      buildRecentProjectEntry(envelope, { fileName: "river-table.hfzproject" }),
    );
    const [second] = upsertRecentProject(
      buildRecentProjectEntry(envelope, { fileName: "river-table-copy.hfzproject" }),
    );

    expect(loadRecentProjects()).toHaveLength(1);
    expect(second.id).toBe(first.id);
    expect(second.projectId).toBe("project-abc");
    expect(second.lastKnownFileName).toBe("river-table-copy.hfzproject");
  });

  it("keeps separate recent entries for different projectIds with the same name", () => {
    const firstEnvelope = buildPersistedV2OpenEnvelope({
      identity: { projectId: "project-a" },
    });
    const secondEnvelope = buildPersistedV2OpenEnvelope({
      identity: { projectId: "project-b" },
    });

    upsertRecentProject(
      buildRecentProjectEntry(firstEnvelope, { fileName: "river-table.hfzproject" }),
    );
    upsertRecentProject(
      buildRecentProjectEntry(secondEnvelope, { fileName: "river-table.hfzproject" }),
    );

    expect(loadRecentProjects()).toHaveLength(2);
  });

  it("updates lastOpenedAt when the same projectId is opened again", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));

    const envelope = buildPersistedV2OpenEnvelope({
      identity: { projectId: "project-abc" },
    });
    const [first] = upsertRecentProject(
      buildRecentProjectEntry(envelope, { fileName: "river-table.hfzproject" }),
    );

    vi.setSystemTime(new Date("2026-02-01T12:00:00.000Z"));
    const [second] = upsertRecentProject(
      buildRecentProjectEntry(envelope, { fileName: "river-table.hfzproject" }),
    );

    expect(second.id).toBe(first.id);
    expect(second.lastOpenedAt).toBe("2026-02-01T12:00:00.000Z");
    vi.useRealTimers();
  });

  it("preserves the same recent entry id on save updates", () => {
    const envelope = buildPersistedV2OpenEnvelope({
      identity: { projectId: "project-abc" },
    });
    const [entry] = upsertRecentProject(
      buildRecentProjectEntry(envelope, { fileName: "river-table.hfzproject" }),
    );

    const updated = updateRecentProjectOnSave(entry.id, {
      projectName: "River Table",
      savedAt: "2026-03-01T12:00:00.000Z",
      lastKnownFileName: "river-table.hfzproject",
    });

    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe(entry.id);
    expect(updated[0].projectId).toBe("project-abc");
  });
});
