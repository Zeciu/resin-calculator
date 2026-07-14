import { describe, expect, it } from "vitest";
import { TINY_PNG } from "./canonicalProjectV2.test.js";
import { computePrimaryImageHash } from "./primaryImageHash.js";

describe("primaryImageHash", () => {
  it("returns the same SHA-256 hash for the same data URL", async () => {
    const first = await computePrimaryImageHash(TINY_PNG);
    const second = await computePrimaryImageHash(TINY_PNG);

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns different hashes for different data URLs", async () => {
    const other =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    const first = await computePrimaryImageHash(TINY_PNG);
    const second = await computePrimaryImageHash(other);

    expect(first).not.toBe(second);
  });

  it("rejects empty image data URLs", async () => {
    await expect(computePrimaryImageHash("")).rejects.toThrow(
      "Primary image data URL is required.",
    );
  });
});
