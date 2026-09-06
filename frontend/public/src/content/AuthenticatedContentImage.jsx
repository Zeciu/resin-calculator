import { useEffect, useState } from "react";
import { buildAuthHeaders } from "../auth/authHeaders.js";
import { isAuthenticatedContentImageSrc } from "./authenticatedContentImageSrc.js";

/**
 * Educational content images live behind Cognito Bearer auth. Native <img src>
 * cannot send that header, so packaged /api/content/.../images URLs must be
 * fetched with the same headers as JSON and shown via an object URL.
 * Public-preview and static assets keep a normal img src.
 *
 * @param {{
 *   src: string;
 *   alt: string;
 *   className?: string;
 *   loading?: "lazy" | "eager";
 * }} props
 */
export default function AuthenticatedContentImage({ src, alt, className, loading = "lazy" }) {
  const needsAuthFetch = isAuthenticatedContentImageSrc(src);
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (!needsAuthFetch) {
      setObjectUrl(null);
      return undefined;
    }

    let cancelled = false;
    let createdUrl = null;

    async function loadImage() {
      try {
        const response = await fetch(src, {
          headers: await buildAuthHeaders({ includeJsonContentType: false }),
          cache: "no-store",
        });
        if (!response.ok) {
          return;
        }
        const blob = await response.blob();
        createdUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(createdUrl);
          createdUrl = null;
          return;
        }
        setObjectUrl(createdUrl);
      } catch {
        // Leave the image unrendered so alt text is not mistaken for a loaded photo.
      }
    }

    setObjectUrl(null);
    void loadImage();

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [needsAuthFetch, src]);

  const resolvedSrc = needsAuthFetch ? objectUrl : src;
  if (!resolvedSrc) {
    return null;
  }

  return <img className={className} src={resolvedSrc} alt={alt} loading={loading} />;
}
