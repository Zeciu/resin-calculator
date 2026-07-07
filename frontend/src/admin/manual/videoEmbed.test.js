import { describe, expect, it } from "vitest";
import { deriveVideoTitle, normalizeVideoEmbedUrl } from "./videoEmbed.js";

describe("normalizeVideoEmbedUrl", () => {
  it("converts YouTube watch URLs to embed URLs", () => {
    expect(normalizeVideoEmbedUrl("https://www.youtube.com/watch?v=EngW7tLk6R8")).toBe(
      "https://www.youtube.com/embed/EngW7tLk6R8",
    );
  });

  it("converts youtu.be URLs to embed URLs", () => {
    expect(normalizeVideoEmbedUrl("https://youtu.be/EngW7tLk6R8")).toBe(
      "https://www.youtube.com/embed/EngW7tLk6R8",
    );
  });

  it("converts Vimeo page URLs to player URLs", () => {
    expect(normalizeVideoEmbedUrl("https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789",
    );
  });
});

describe("deriveVideoTitle", () => {
  it("derives a title from YouTube URLs", () => {
    expect(
      deriveVideoTitle(
        "https://www.youtube.com/watch?v=EngW7tLk6R8",
        "https://www.youtube.com/embed/EngW7tLk6R8",
      ),
    ).toBe("YouTube video EngW7tLk6R8");
  });

  it("derives a title from Vimeo URLs", () => {
    expect(
      deriveVideoTitle("https://vimeo.com/123456789", "https://player.vimeo.com/video/123456789"),
    ).toBe("Vimeo video 123456789");
  });
});
