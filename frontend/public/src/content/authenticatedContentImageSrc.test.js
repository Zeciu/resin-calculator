import { describe, expect, it } from "vitest";
import {
  isAuthenticatedContentImageSrc,
  isPackagedContentImageRequest,
} from "./authenticatedContentImageSrc.js";

describe("authenticated content image src", () => {
  it("matches packaged glossary, manual, and knowledge-base image URLs", () => {
    expect(
      isAuthenticatedContentImageSrc(
        "/api/content/glossary/images/d3a552fc-7f95-4c27-9494-588304928ddb.jpg",
      ),
    ).toBe(true);
    expect(
      isAuthenticatedContentImageSrc(
        "/api/content/manual/images/4e561613-0f56-4d06-a5b9-170d1361cdff.png",
      ),
    ).toBe(true);
    expect(
      isAuthenticatedContentImageSrc(
        "/api/content/knowledge-base/images/20d85f36-6b20-4600-a2d1-4b02b24d5807.webp",
      ),
    ).toBe(true);
  });

  it("does not treat public-preview or static assets as authenticated content images", () => {
    expect(
      isAuthenticatedContentImageSrc(
        "/api/public-preview/glossary/images/d3a552fc-7f95-4c27-9494-588304928ddb.jpg",
      ),
    ).toBe(false);
    expect(isAuthenticatedContentImageSrc("/header-wood-epoxy.png")).toBe(false);
    expect(isAuthenticatedContentImageSrc("/api/content/website/images/story.png")).toBe(false);
    expect(isAuthenticatedContentImageSrc("")).toBe(false);
  });

  it("detects packaged content image fetch URLs used by test helpers", () => {
    expect(
      isPackagedContentImageRequest(
        "/api/content/glossary/images/d3a552fc-7f95-4c27-9494-588304928ddb.jpg",
      ),
    ).toBe(true);
    expect(isPackagedContentImageRequest("/api/content/glossary?locale=ro")).toBe(false);
  });
});
