import { describe, expect, it } from "vitest";
import {
  canRenderHomeCta,
  canRenderHomeImage,
  canRenderWebsiteDestination,
  resolveHomeVideoSource,
  resolvePublishedHomeBody,
} from "./homePublicUtils.js";

describe("homePublicUtils", () => {
  it("resolves published home body only when ready and available", () => {
    expect(resolvePublishedHomeBody(null, "loading")).toBeNull();
    expect(
      resolvePublishedHomeBody(
        { available: false, page: null },
        "unavailable",
      ),
    ).toBeNull();
    expect(
      resolvePublishedHomeBody(
        {
          available: true,
          page: { body: { pageKind: "home", publicTitle: "Title" } },
        },
        "ready",
      ),
    ).toEqual({ pageKind: "home", publicTitle: "Title" });
  });

  it("gates destinations, CTA, image and video by visibility and supported values", () => {
    expect(canRenderWebsiteDestination("Go", "/pricing")).toBe(true);
    expect(canRenderWebsiteDestination("Go", "https://example.com")).toBe(true);
    expect(canRenderWebsiteDestination("", "/pricing")).toBe(false);
    expect(canRenderWebsiteDestination("Go", "javascript:alert(1)")).toBe(false);
    expect(canRenderHomeCta({ visible: true, label: "Go", destination: "/pricing" })).toBe(true);
    expect(canRenderHomeCta({ visible: true, label: "Go", destination: "https://example.com" })).toBe(
      true,
    );
    expect(canRenderHomeCta({ visible: false, label: "View Pricing", destination: "/pricing" })).toBe(
      false,
    );
    expect(canRenderHomeCta({ visible: false, label: "Go", destination: "/pricing" })).toBe(false);
    expect(canRenderHomeCta({ visible: true, label: "", destination: "/pricing" })).toBe(false);
    expect(canRenderHomeCta({ label: "View Pricing", destination: "/pricing" })).toBe(false);
    expect(canRenderHomeImage({ visible: true, src: "/api/content/website/images/a.png" })).toBe(
      true,
    );
    expect(canRenderHomeImage({ visible: false, src: "/x.png" })).toBe(false);
    expect(resolveHomeVideoSource({ visible: true, url: "https://youtu.be/abc123" })).toEqual({
      kind: "iframe",
      src: "https://www.youtube.com/embed/abc123",
    });
    expect(
      resolveHomeVideoSource({ visible: true, url: "https://cdn.example.com/clip.mp4" }),
    ).toEqual({ kind: "video", src: "https://cdn.example.com/clip.mp4" });
    expect(resolveHomeVideoSource({ visible: false, url: "https://youtu.be/abc123" })).toBeNull();
    expect(resolveHomeVideoSource({ visible: true, url: "javascript:alert(1)" })).toBeNull();
  });
});
