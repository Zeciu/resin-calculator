export const EDITORIAL_VISIBILITY = {
  EMPTY: "empty",
  DRAFT: "draft",
  LIVE: "live",
  STALE: "stale",
};

/**
 * @param {{
 *   isDirty?: boolean;
 *   editorialVisibility?: string;
 *   exists?: boolean;
 *   locale?: string;
 * }} params
 */
export function resolveEditorialDisplay({ isDirty = false, editorialVisibility, exists = true, locale = "ro" }) {
  const localeLabel = locale.toUpperCase();

  if (isDirty) {
    return {
      kind: "unsaved",
      label: "Unsaved changes",
      message: "You have unsaved changes in the editor.",
      tone: "warning",
    };
  }

  switch (editorialVisibility) {
    case EDITORIAL_VISIBILITY.LIVE:
      return {
        kind: "live",
        label: `Published (${localeLabel})`,
        message:
          "This version is published in the editorial store and available for local preview. Production still requires packaging and deployment.",
        tone: "success",
      };
    case EDITORIAL_VISIBILITY.STALE:
      return {
        kind: "stale",
        label: `Draft changes (${localeLabel})`,
        message:
          "Draft saved. Local preview still shows the previous published version until you publish again. Production still requires packaging and deployment.",
        tone: "warning",
      };
    case EDITORIAL_VISIBILITY.DRAFT:
      return {
        kind: "draft",
        label: `Draft (${localeLabel})`,
        message:
          "Saved as draft only. Publish it before it appears in the local workspace. Production still requires packaging and deployment.",
        tone: "neutral",
      };
    default:
      if (!exists) {
        return {
          kind: "empty",
          label: `No ${localeLabel} content yet`,
          message: `No ${localeLabel} content saved yet. Start writing, then click Save draft.`,
          tone: "neutral",
        };
      }
      return {
        kind: "draft",
        label: `Draft (${localeLabel})`,
        message:
          "Saved as draft only. Publish it before it appears in the local workspace. Production still requires packaging and deployment.",
        tone: "neutral",
      };
  }
}

/**
 * @param {string | undefined} editorialVisibility
 */
export function publishButtonLabel(editorialVisibility) {
  if (
    editorialVisibility === EDITORIAL_VISIBILITY.LIVE ||
    editorialVisibility === EDITORIAL_VISIBILITY.STALE
  ) {
    return "Update published";
  }
  return "Publish";
}
