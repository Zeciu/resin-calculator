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
    expect(display.message).toMatch(/public site still shows the previous version/i);
  });

  it("uses update public label when content is already live", () => {
    expect(publishButtonLabel(EDITORIAL_VISIBILITY.LIVE)).toBe("Update public");
    expect(publishButtonLabel(EDITORIAL_VISIBILITY.STALE)).toBe("Update public");
    expect(publishButtonLabel(EDITORIAL_VISIBILITY.DRAFT)).toBe("Publish");
  });
});
