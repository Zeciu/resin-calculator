import { describe, expect, it } from "vitest";
import { isSafeExternalWebsiteUrl } from "./homePublicUtils.js";
import {
  OFFICIAL_LINK_KEYS,
  normalizeOfficialLinks,
  resolveOfficialCommunityLinks,
} from "./websiteOfficialLinks.js";

describe("websiteOfficialLinks", () => {
  it("normalizes missing officialLinks to empty strings", () => {
    expect(normalizeOfficialLinks(undefined)).toEqual({
      website: "",
      youtube: "",
      facebook: "",
      instagram: "",
      tiktok: "",
      linkedin: "",
    });
  });

  it("resolves nothing when all URLs are empty", () => {
    expect(resolveOfficialCommunityLinks({}, isSafeExternalWebsiteUrl)).toEqual([]);
  });

  it("keeps only safe external URLs and preserves channel order", () => {
    const links = resolveOfficialCommunityLinks(
      {
        linkedin: "https://www.linkedin.com/company/hfzwood",
        youtube: "https://www.youtube.com/@hfzwood",
        website: "https://hfzwood.com",
        facebook: "javascript:alert(1)",
        instagram: "",
        tiktok: "not-a-url",
      },
      isSafeExternalWebsiteUrl,
    );

    expect(links.map((link) => link.key)).toEqual(["website", "youtube", "linkedin"]);
    expect(OFFICIAL_LINK_KEYS).toEqual([
      "website",
      "youtube",
      "facebook",
      "instagram",
      "tiktok",
      "linkedin",
    ]);
  });
});
