import { AdminApiError, adminHeaders, parseAdminError } from "./editorialAdminApi.js";

const API_BASE_URL = "";

/** @typedef {"manual" | "glossary" | "knowledge_base"} BulkModule */

const MODULE_PATH = {
  manual: "manual",
  glossary: "glossary",
  knowledge_base: "knowledge-base",
};

/**
 * @param {BulkModule} module
 */
function modulePath(module) {
  const path = MODULE_PATH[module];
  if (!path) {
    throw new Error(`Unsupported editorial module: ${module}`);
  }
  return path;
}

/**
 * @param {BulkModule} module
 * @param {string} locale
 * @param {{ includeTextOutdated?: boolean }} [options]
 */
export async function previewBulkTranslations(module, locale, options = {}) {
  const { includeTextOutdated = false } = options;
  const response = await fetch(
    `${API_BASE_URL}/api/admin/${modulePath(module)}/translations/${encodeURIComponent(locale)}/bulk-preview`,
    {
      method: "POST",
      cache: "no-store",
      headers: await adminHeaders(),
      body: JSON.stringify({ includeTextOutdated }),
    },
  );

  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }

  return response.json();
}

/**
 * @param {BulkModule} module
 * @param {string} locale
 * @param {{ includeTextOutdated?: boolean; offset?: number; limit?: number }} [options]
 */
export async function updateBulkTranslationsChunk(module, locale, options = {}) {
  const { includeTextOutdated = false, offset = 0, limit = 5 } = options;
  const response = await fetch(
    `${API_BASE_URL}/api/admin/${modulePath(module)}/translations/${encodeURIComponent(locale)}/bulk-update`,
    {
      method: "POST",
      cache: "no-store",
      headers: await adminHeaders(),
      body: JSON.stringify({ includeTextOutdated, offset, limit }),
    },
  );

  if (!response.ok) {
    throw new AdminApiError(await parseAdminError(response), response.status);
  }

  return response.json();
}

/**
 * @param {Record<string, number>} left
 * @param {Record<string, number>} right
 */
export function mergeBulkSummaries(left, right) {
  const keys = [
    "total",
    "generated",
    "mediaSynced",
    "skippedCurrent",
    "skippedTextOutdated",
    "skippedManualUntracked",
    "skippedInvalid",
    "failed",
    "providerCallItems",
  ];
  const out = {};
  for (const key of keys) {
    out[key] = (left?.[key] ?? 0) + (right?.[key] ?? 0);
  }
  return out;
}

/**
 * Run chunked Update All Translations until done.
 *
 * @param {BulkModule} module
 * @param {string} locale
 * @param {{
 *   includeTextOutdated?: boolean;
 *   limit?: number;
 *   onProgress?: (progress: {
 *     processed: number;
 *     total: number;
 *     currentLabel: string | null;
 *     currentAction: string | null;
 *     summary: Record<string, number>;
 *     items: object[];
 *     done: boolean;
 *   }) => void;
 * }} [options]
 */
export async function runBulkUpdateAll(module, locale, options = {}) {
  const { includeTextOutdated = false, limit = 5, onProgress } = options;
  let offset = 0;
  let summary = mergeBulkSummaries({}, {});
  const items = [];
  let total = 0;

  while (true) {
    const chunk = await updateBulkTranslationsChunk(module, locale, {
      includeTextOutdated,
      offset,
      limit,
    });
    total = chunk.total ?? total;
    summary = mergeBulkSummaries(summary, chunk.chunkSummary ?? {});
    items.push(...(chunk.items ?? []));

    const last = chunk.items?.[chunk.items.length - 1] ?? null;
    onProgress?.({
      processed: items.length,
      total,
      currentLabel: last?.label ?? null,
      currentAction: last?.action ?? null,
      summary,
      items: [...items],
      done: Boolean(chunk.done),
    });

    if (chunk.done) {
      return { total, summary, items };
    }

    offset = chunk.nextOffset ?? offset + (chunk.items?.length ?? limit);
  }
}
