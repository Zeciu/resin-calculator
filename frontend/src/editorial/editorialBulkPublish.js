/**
 * Count draft or stale editorial variants for a locale.
 *
 * @param {Array<{ variants?: Record<string, { status?: string; updatedAt?: string | null; publishedAt?: string | null }> }>} items
 * @param {string} locale
 */
export function countPublishableDrafts(items, locale) {
  let count = 0;
  for (const item of items ?? []) {
    const variant = item?.variants?.[locale];
    if (!variant) {
      continue;
    }
    if (variant.status !== "published" || !variant.publishedAt) {
      count += 1;
      continue;
    }
    if (variant.updatedAt && variant.publishedAt) {
      const updated = Date.parse(variant.updatedAt);
      const published = Date.parse(variant.publishedAt);
      if (Number.isFinite(updated) && Number.isFinite(published) && updated > published) {
        count += 1;
      }
    }
  }
  return count;
}

/**
 * @param {Array<{ variants?: Record<string, { status?: string; updatedAt?: string | null; publishedAt?: string | null }> }>} items
 * @param {string} locale
 */
export function isLocaleFullyPublished(items, locale) {
  const list = items ?? [];
  if (list.length === 0) {
    return false;
  }
  return countPublishableDrafts(list, locale) === 0;
}

/**
 * @param {{
 *   publishedCount?: number;
 *   failedCount?: number;
 *   skippedCount?: number;
 *   failed?: Array<{ term?: string; contentId?: string; reason?: string | null }>;
 * }} result
 * @param {string} locale
 */
export function formatBulkPublishSummary(result, locale) {
  const published = Number(result?.publishedCount ?? 0);
  const failed = Number(result?.failedCount ?? 0);
  const skipped = Number(result?.skippedCount ?? 0);
  const localeLabel = String(locale ?? "").toUpperCase();
  let message = `Publish all (${localeLabel}): ${published} published, ${failed} failed, ${skipped} skipped.`;
  const failures = Array.isArray(result?.failed) ? result.failed : [];
  if (failures.length > 0) {
    const details = failures
      .slice(0, 5)
      .map((item) => `${item.term || item.contentId}: ${item.reason || "failed"}`)
      .join("; ");
    message = `${message} ${details}`;
    if (failures.length > 5) {
      message = `${message} (+${failures.length - 5} more)`;
    }
  }
  return message;
}
