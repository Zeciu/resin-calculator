import { describe, expect, it } from "vitest";
import { parseAdminError } from "./editorialAdminApi.js";

function jsonResponse(status, body) {
  return {
    status,
    json: async () => body,
  };
}

describe("parseAdminError", () => {
  it("returns backend string detail for HTTP 400 validation failures", async () => {
    const message = await parseAdminError(
      jsonResponse(400, { detail: "Published related term required: Epoxy resin" }),
    );
    expect(message).toBe("Published related term required: Epoxy resin");
  });

  it("returns validation array msg when detail is a list", async () => {
    const message = await parseAdminError(
      jsonResponse(422, { detail: [{ loc: ["body"], msg: "field required", type: "value_error" }] }),
    );
    expect(message).toBe("field required");
  });

  it("falls back to Request failed (status) only when detail is missing", async () => {
    const message = await parseAdminError(jsonResponse(500, {}));
    expect(message).toBe("Request failed (500)");
  });
});
