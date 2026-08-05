import {
  canUpdateCurrentProjectInPlace,
  createOpenedCurrentProject,
} from "./currentProject.js";
import { PROJECT_OWNERSHIP_MODE } from "../project/projectOwnership.js";

describe("currentProject", () => {
  it("allows in-place updates only for opened projects with a writable handle", () => {
    const writableHandle = { createWritable: async () => ({ write: () => {}, close: () => {} }) };
    const opened = createOpenedCurrentProject({
      recentEntryId: "entry-1",
      projectName: "River Table",
      lastKnownFileName: "river-table.hfzproject",
      fileHandle: writableHandle,
      ownershipMode: PROJECT_OWNERSHIP_MODE.OWNED,
    });

    expect(canUpdateCurrentProjectInPlace(opened)).toBe(true);
    expect(
      canUpdateCurrentProjectInPlace({
        ...opened,
        fileHandle: null,
      }),
    ).toBe(false);
    expect(
      canUpdateCurrentProjectInPlace({
        ...opened,
        ownershipMode: PROJECT_OWNERSHIP_MODE.FOREIGN_READ_ONLY,
      }),
    ).toBe(false);
  });
});
