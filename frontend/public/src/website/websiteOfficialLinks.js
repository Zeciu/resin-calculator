/** Fixed Official Links channel order for CMS + public Contact. */
export const OFFICIAL_LINK_KEYS = [
  "website",
  "youtube",
  "facebook",
  "instagram",
  "tiktok",
  "linkedin",
];

/** @type {Record<string, string>} */
export const OFFICIAL_LINK_LABELS = {
  website: "Website",
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

export function emptyOfficialLinks() {
  return {
    website: "",
    youtube: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    linkedin: "",
  };
}

/**
 * @param {unknown} value
 * @returns {Record<string, string>}
 */
export function normalizeOfficialLinks(value) {
  const source = value && typeof value === "object" ? value : {};
  const normalized = emptyOfficialLinks();
  for (const key of OFFICIAL_LINK_KEYS) {
    normalized[key] = String(source[key] ?? "");
  }
  return normalized;
}

/**
 * @param {unknown} officialLinks
 * @param {(url: string) => boolean} isSafeUrl
 * @returns {{ key: string; label: string; url: string }[]}
 */
export function resolveOfficialCommunityLinks(officialLinks, isSafeUrl) {
  const normalized = normalizeOfficialLinks(officialLinks);
  return OFFICIAL_LINK_KEYS.map((key) => {
    const url = String(normalized[key] ?? "").trim();
    return {
      key,
      label: OFFICIAL_LINK_LABELS[key],
      url,
    };
  }).filter((link) => isSafeUrl(link.url));
}
