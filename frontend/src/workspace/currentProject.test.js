import { canUpdateCurrentProjectInPlace, createOpenedCurrentProject } from "./currentProject.js";

describe("currentProject", () => {
  it("allows in-place updates only for opened projects with a writable handle", () => {
    const writableHandle = { createWritable: async () => ({ write: () => {}, close: () => {} }) };
    const opened = createOpenedCurrentProject({
      recentEntryId: "entry-1",
      projectName: "River Table",
      lastKnownFileName: "river-table.hfzproject",
      fileHandle: writableHandle,
    });

    expect(canUpdateCurrentProjectInPlace(opened)).toBe(true);
    expect(
      canUpdateCurrentProjectInPlace({
        ...opened,
        fileHandle: null,
      }),
    ).toBe(false);
  });
});
