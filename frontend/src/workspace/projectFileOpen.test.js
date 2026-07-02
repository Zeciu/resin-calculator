import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadProjectIntoRecentEntry } from "./projectFileOpen.js";
import {
  buildRecentProjectEntry,
  loadRecentProjects,
  upsertRecentProject,
} from "./recentProjectsIndex.js";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUV0WQl3MBPQ8EAAAABJRU5ErkJggg==";

const storeRecentProjectHandleMock = vi.fn(async () => {});

vi.mock("./recentProjectHandles.js", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    storeRecentProjectHandle: (...args) => storeRecentProjectHandleMock(...args),
  };
});

describe("loadProjectIntoRecentEntry", () => {
  beforeEach(() => {
    localStorage.clear();
    storeRecentProjectHandleMock.mockClear();
  });

  it("rebinds an existing recent entry instead of creating a duplicate", async () => {
    const entry = upsertRecentProject(
      buildRecentProjectEntry(
        {
          projectName: "River Table",
          savedAt: "2026-01-01T12:00:00.000Z",
          image: { dataUrl: TINY_PNG },
        },
        { fileName: "river-table.hfzproject" },
      ),
    )[0];

    const file = new File(
      [
        JSON.stringify({
          projectName: "River Table",
          savedAt: "2026-02-01T12:00:00.000Z",
          image: { dataUrl: TINY_PNG },
        }),
      ],
      "river-table.hfzproject",
      { type: "application/json" },
    );
    const handle = {
      getFile: vi.fn(async () => file),
      createWritable: vi.fn(),
    };

    const result = await loadProjectIntoRecentEntry(entry, file, handle);

    expect(result.entry.id).toBe(entry.id);
    expect(loadRecentProjects()).toHaveLength(1);
    expect(storeRecentProjectHandleMock).toHaveBeenCalledWith(entry.id, handle);
  });
});
