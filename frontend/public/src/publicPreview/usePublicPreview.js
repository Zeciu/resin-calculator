import { useCallback } from "react";
import { usePublishedContent } from "../content/usePublishedContent.js";
import { fetchPublicPreview } from "./publicPreviewApi.js";

/**
 * Load a public-preview payload for the active interface locale.
 * Does not substitute another locale's educational bodies.
 */
export function usePublicPreview(module) {
  const fetchContent = useCallback(
    (locale) => fetchPublicPreview(module, locale),
    [module],
  );
  return usePublishedContent(fetchContent);
}
