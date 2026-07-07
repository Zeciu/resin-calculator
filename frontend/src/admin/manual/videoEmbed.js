export function normalizeVideoEmbedUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "").split("/")[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    if (parsed.hostname.includes("vimeo.com") && !parsed.hostname.includes("player.vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean).pop();
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

export function deriveVideoTitle(url, embedUrl = "") {
  const target = (embedUrl || normalizeVideoEmbedUrl(url)).trim();
  if (!target) {
    return "Embedded video";
  }

  try {
    const parsed = new URL(target);
    if (parsed.hostname.includes("youtube.com") || parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.split("/").filter(Boolean).pop();
      if (videoId) {
        return `YouTube video ${videoId}`;
      }
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean).pop();
      if (videoId) {
        return `Vimeo video ${videoId}`;
      }
    }
  } catch {
    return "Embedded video";
  }

  return "Embedded video";
}
