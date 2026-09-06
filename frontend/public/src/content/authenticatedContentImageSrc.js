const PACKAGED_CONTENT_IMAGE_SRC =
  /^\/api\/content\/(?:manual|knowledge-base|glossary)\/images\/[a-f0-9-]{36}\.(?:jpg|png|gif|webp)$/;

export function isAuthenticatedContentImageSrc(src) {
  return typeof src === "string" && PACKAGED_CONTENT_IMAGE_SRC.test(src.trim());
}

export function isPackagedContentImageRequest(url) {
  return /\/api\/content\/(?:manual|knowledge-base|glossary)\/images\//.test(String(url));
}
