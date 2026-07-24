/**
 * Resolve published Home body for public rendering.
 * Returns null while loading, unavailable, errored, or non-home payloads.
 *
 * @param {object | null} payload
 * @param {"loading" | "ready" | "unavailable" | "error"} loadState
 * @returns {Record<string, unknown> | null}
 */
export function resolvePublishedHomeBody(payload, loadState) {
  if (loadState !== "ready") {
    return null;
  }
  if (!payload?.available || !payload?.page?.body) {
    return null;
  }
  const body = payload.page.body;
  if (body.pageKind !== "home") {
    return null;
  }
  return body;
}

/**
 * @param {unknown} destination
 */
export function isInternalWebsitePath(destination) {
  const trimmed = String(destination ?? "").trim();
  return trimmed.startsWith("/") && !trimmed.startsWith("//");
}

/**
 * @param {unknown} destination
 */
export function isSafeExternalWebsiteUrl(destination) {
  const trimmed = String(destination ?? "").trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * @param {unknown} label
 * @param {unknown} destination
 */
export function canRenderWebsiteDestination(label, destination) {
  const trimmedLabel = String(label ?? "").trim();
  const trimmedDestination = String(destination ?? "").trim();
  if (!trimmedLabel || !trimmedDestination) {
    return false;
  }
  return isInternalWebsitePath(trimmedDestination) || isSafeExternalWebsiteUrl(trimmedDestination);
}

/**
 * @param {{ visible?: boolean; label?: string; destination?: string } | null | undefined} cta
 */
export function canRenderHomeCta(cta) {
  // Strict true only — never treat missing/undefined as shown.
  if (cta?.visible !== true) {
    return false;
  }
  return canRenderWebsiteDestination(cta.label, cta.destination);
}

/**
 * @param {{ visible?: boolean; src?: string } | null | undefined} image
 */
export function canRenderHomeImage(image) {
  return Boolean(image?.visible && String(image.src ?? "").trim());
}

/**
 * @param {{ visible?: boolean; url?: string } | null | undefined} video
 * @returns {{ kind: "video" | "iframe"; src: string } | null}
 */
export function resolveHomeVideoSource(video) {
  if (!video?.visible) {
    return null;
  }
  const url = String(video.url ?? "").trim();
  if (!url || !isSafeExternalWebsiteUrl(url)) {
    return null;
  }

  const lower = url.toLowerCase();
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(lower)) {
    return { kind: "video", src: url };
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id) {
        return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
      }
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname.startsWith("/embed/")) {
        return { kind: "iframe", src: url };
      }
      const id = parsed.searchParams.get("v");
      if (id) {
        return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
      }
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) {
        return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
      }
    }
    if (host === "player.vimeo.com" && parsed.pathname.startsWith("/video/")) {
      return { kind: "iframe", src: url };
    }
  } catch {
    return null;
  }

  return null;
}
