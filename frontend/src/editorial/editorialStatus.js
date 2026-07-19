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
        label: `Live (${localeLabel})`,
        message: "This version is currently visible on the public site.",
        tone: "success",
      };
    case EDITORIAL_VISIBILITY.STALE:
      return {
        kind: "stale",
        label: `Draft changes (${localeLabel})`,
        message:
          "Draft saved. The public site still shows the previous version until you update public content.",
        tone: "warning",
      };
    case EDITORIAL_VISIBILITY.DRAFT:
      return {
        kind: "draft",
        label: `Draft (${localeLabel})`,
        message: "Saved as draft only. This version is not visible on the public site yet.",
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
        message: "Saved as draft only. This version is not visible on the public site yet.",
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
    return "Update public";
  }
  return "Publish";
}
