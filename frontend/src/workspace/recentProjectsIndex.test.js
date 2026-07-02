import { beforeEach, describe, expect, it } from "vitest";
import {
  buildRecentProjectEntry,
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
});
