/**
 * Computes SHA-256 over the UTF-8 bytes of the authoritative stored image data URL.
 *
 * @param {string} imageDataUrl
 * @returns {Promise<string>} lowercase hexadecimal digest
 */
export async function computePrimaryImageHash(imageDataUrl) {
  if (typeof imageDataUrl !== "string" || !imageDataUrl.trim()) {
    throw new Error("Primary image data URL is required.");
  }

  if (!globalThis.crypto?.subtle?.digest) {
    throw new Error("Secure hashing is unavailable in this environment.");
  }

  const encoded = new TextEncoder().encode(imageDataUrl);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
