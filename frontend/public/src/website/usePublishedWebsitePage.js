import { useCallback } from "react";
import { usePublishedContent } from "../content/usePublishedContent.js";
import { fetchPublishedWebsitePage } from "./websitePublicApi.js";

/**
 * Load one published Website page for the active public locale.
 *
 * @param {string} pageKey
 */
export function usePublishedWebsitePage(pageKey) {
  const fetchContent = useCallback(
    (locale) => fetchPublishedWebsitePage(pageKey, locale),
    [pageKey],
  );
  return usePublishedContent(fetchContent);
}
