import { describe, expect, it } from "vitest";
import {
  EDITORIAL_VISIBILITY,
  publishButtonLabel,
  resolveEditorialDisplay,
} from "./editorialStatus.js";

describe("editorialStatus", () => {
  it("shows unsaved state before draft persistence", () => {
    const display = resolveEditorialDisplay({
      isDirty: true,
      editorialVisibility: EDITORIAL_VISIBILITY.LIVE,
      exists: true,
      locale: "en",
    });
    expect(display.kind).toBe("unsaved");
    expect(display.label).toBe("Unsaved changes");
  });

  it("shows stale messaging after draft save on published content", () => {
    const display = resolveEditorialDisplay({
      editorialVisibility: EDITORIAL_VISIBILITY.STALE,
      exists: true,
      locale: "en",
    });
    expect(display.kind).toBe("stale");
    expect(display.message).toMatch(/local preview still shows the previous published version/i);
  });

  it("uses update published label when content is already published", () => {
    expect(publishButtonLabel(EDITORIAL_VISIBILITY.LIVE)).toBe("Update published");
    expect(publishButtonLabel(EDITORIAL_VISIBILITY.STALE)).toBe("Update published");
    expect(publishButtonLabel(EDITORIAL_VISIBILITY.DRAFT)).toBe("Publish");
  });

  it("describes published editorial content as local preview, not production", () => {
    const display = resolveEditorialDisplay({
      editorialVisibility: EDITORIAL_VISIBILITY.LIVE,
      exists: true,
      locale: "en",
    });
    expect(display.label).toBe("Published (EN)");
    expect(display.message).toMatch(/editorial store and available for local preview/i);
    expect(display.message).toMatch(/packaging and deployment/i);
  });
});
