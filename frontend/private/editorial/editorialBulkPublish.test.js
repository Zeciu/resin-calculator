import { describe, expect, it } from "vitest";
import {
  countPublishableDrafts,
  formatBulkPublishSummary,
  isLocaleFullyPublished,
} from "./editorialBulkPublish.js";

describe("editorialBulkPublish helpers", () => {
  it("counts draft and stale variants only", () => {
    const count = countPublishableDrafts(
      [
        { variants: { ro: { status: "draft" } } },
        {
          variants: {
            ro: {
              status: "published",
              updatedAt: "2026-01-02T00:00:00Z",
              publishedAt: "2026-01-01T00:00:00Z",
            },
          },
        },
        {
          variants: {
            ro: {
              status: "published",
              updatedAt: "2026-01-01T00:00:00Z",
              publishedAt: "2026-01-01T00:00:00Z",
            },
          },
        },
        { variants: { en: { status: "draft" } } },
      ],
      "ro",
    );
    expect(count).toBe(2);
  });

  it("detects when a locale is fully published", () => {
    expect(
      isLocaleFullyPublished(
        [
          {
            variants: {
              ro: {
                status: "published",
                updatedAt: "2026-01-01T00:00:00Z",
                publishedAt: "2026-01-01T00:00:00Z",
              },
            },
          },
        ],
        "ro",
      ),
    ).toBe(true);
    expect(isLocaleFullyPublished([{ variants: { ro: { status: "draft" } } }], "ro")).toBe(false);
  });

  it("formats bulk publish summaries including failures", () => {
    expect(
      formatBulkPublishSummary(
        {
          publishedCount: 2,
          failedCount: 1,
          skippedCount: 3,
          failed: [{ term: "Empty", reason: "Glossary definition cannot be empty." }],
        },
        "ro",
      ),
    ).toContain("Publish all (RO): 2 published, 1 failed, 3 skipped.");
  });
});
