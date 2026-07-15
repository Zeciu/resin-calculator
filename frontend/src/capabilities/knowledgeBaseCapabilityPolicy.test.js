import { describe, expect, it } from "vitest";
import { limitKnowledgeBaseEntries } from "./knowledgeBaseCapabilityPolicy.js";

describe("knowledgeBaseCapabilityPolicy", () => {
  it("returns all entries when the limit is unlimited", () => {
    expect(limitKnowledgeBaseEntries([{ id: "a" }, { id: "b" }], null)).toHaveLength(2);
  });

  it("limits visible entries for free accounts", () => {
    const entries = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(limitKnowledgeBaseEntries(entries, 2)).toEqual([{ id: "a" }, { id: "b" }]);
  });
});
