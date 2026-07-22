import { useCallback, useMemo, useState } from "react";
import { AdminApiError } from "./editorialAdminApi.js";
import {
  countPublishableDrafts,
  formatBulkPublishSummary,
  isLocaleFullyPublished,
} from "./editorialBulkPublish.js";

/**
 * Shared Publish-all drafts controls for Manual / Glossary / Knowledge Base.
 *
 * @param {{
 *   items: unknown[];
 *   locale: string;
 *   publishAllDrafts: (locale: string) => Promise<unknown>;
 *   reloadAfterBulkUpdate: () => Promise<void> | void;
 *   confirmNoun?: string;
 * }} params
 */
export function useEditorialBulkPublish({
  items,
  locale,
  publishAllDrafts,
  reloadAfterBulkUpdate,
  confirmNoun = "draft",
}) {
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [bulkErrorMessage, setBulkErrorMessage] = useState("");

  const publishableDraftCount = useMemo(
    () => countPublishableDrafts(items, locale),
    [items, locale],
  );
  const localeFullyPublished = useMemo(
    () => isLocaleFullyPublished(items, locale),
    [items, locale],
  );

  const handlePublishAllDrafts = useCallback(async () => {
    if (isBulkPublishing) {
      return;
    }
    const count = countPublishableDrafts(items, locale);
    if (count <= 0) {
      return;
    }
    const localeLabel = String(locale || "").toUpperCase();
    const noun = count === 1 ? confirmNoun : `${confirmNoun}s`;
    const confirmed = window.confirm(
      `Publish all drafts for ${localeLabel}?\n\n${count} ${noun} will be published for this language only.\n\nGenerate All / Update All already saves translations as drafts. This action publishes them.`,
    );
    if (!confirmed) {
      return;
    }

    setIsBulkPublishing(true);
    setBulkErrorMessage("");
    setStatusMessage("");
    try {
      const result = await publishAllDrafts(locale);
      const summary = formatBulkPublishSummary(result, locale);
      setStatusMessage(summary);
      if (Number(result?.failedCount ?? 0) > 0) {
        setBulkErrorMessage(summary);
      }
      await reloadAfterBulkUpdate();
    } catch (error) {
      const detail =
        error instanceof AdminApiError && error.message.trim()
          ? error.message
          : error.message || "Failed to publish drafts.";
      setBulkErrorMessage(detail);
    } finally {
      setIsBulkPublishing(false);
    }
  }, [confirmNoun, isBulkPublishing, items, locale, publishAllDrafts, reloadAfterBulkUpdate]);

  return {
    isBulkPublishing,
    statusMessage,
    bulkErrorMessage,
    publishableDraftCount,
    localeFullyPublished,
    handlePublishAllDrafts,
    canPublishAllDrafts: publishableDraftCount > 0 && !isBulkPublishing,
  };
}
