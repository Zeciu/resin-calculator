/**
 * Title/term-only client-side filter for public preview lists.
 * Does not search bodies, keywords, or any field omitted by the preview API.
 */
export function filterPreviewItems(items, query, getLabel) {
  const normalized = String(query ?? "").trim().toLowerCase();
  if (!normalized) {
    return items;
  }
  return items.filter((item) => String(getLabel(item) ?? "").toLowerCase().includes(normalized));
}

export function firstUnlockedPreviewId(items) {
  return items.find((item) => item?.locked === false)?.id ?? null;
}

export function resolvePreviewSelection(items, currentId, preferredId) {
  if (preferredId && items.some((item) => item.id === preferredId)) {
    return preferredId;
  }
  if (currentId && items.some((item) => item.id === currentId)) {
    return currentId;
  }
  return firstUnlockedPreviewId(items);
}

export const PREVIEW_UNLOCKED_BODY_SELECTOR =
  ".knowledge-base-entry__body, .glossary-entry__body";

export const PREVIEW_REVEAL_TOP_OFFSET_PX = 72;

function isDocumentScroller(node) {
  if (!node || typeof document === "undefined") {
    return false;
  }
  return node === document.scrollingElement || node === document.documentElement || node === document.body;
}

function documentScrollOwner() {
  return document.scrollingElement || document.documentElement;
}

function glossaryListOwnsScroll(node) {
  return Boolean(node && node.scrollHeight > node.clientHeight + 1);
}

/**
 * Scroll owners measured in the real browser:
 * - Knowledge Base (desktop and mobile): document / window
 * - Glossary desktop: `.glossary-module__scroll` when it actually overflows
 * - Glossary mobile: document / window (the list exists but does not overflow)
 */
export function getPreviewScrollOwner(target) {
  if (target && typeof target.closest === "function") {
    const glossaryScroll = target.closest(".glossary-module__scroll");
    if (glossaryListOwnsScroll(glossaryScroll)) {
      return glossaryScroll;
    }
  }
  return documentScrollOwner();
}

export function getPreviewUnlockedRevealTarget(root) {
  if (!root || typeof root.querySelector !== "function") {
    return null;
  }
  const body = root.querySelector(PREVIEW_UNLOCKED_BODY_SELECTOR);
  if (!body) {
    return null;
  }
  if (typeof root.closest === "function") {
    return root.closest("[data-preview-unlocked-content]") || root;
  }
  return root;
}

function rectTop(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return 0;
  }
  return node.getBoundingClientRect().top;
}

/**
 * Move `owner`'s scroll position so `target` sits `offsetPx` below the owner's visible top.
 */
export function scrollOwnerToTarget(owner, target, offsetPx = PREVIEW_REVEAL_TOP_OFFSET_PX) {
  if (!owner || !target) {
    return false;
  }
  const topOffset = Number(offsetPx) || 0;
  if (isDocumentScroller(owner)) {
    const nextTop = Math.max(0, (window.scrollY || owner.scrollTop || 0) + rectTop(target) - topOffset);
    if (typeof window.scrollTo === "function") {
      window.scrollTo({ top: nextTop, behavior: "auto" });
    } else {
      owner.scrollTop = nextTop;
    }
    return true;
  }
  const nextTop = Math.max(0, owner.scrollTop + rectTop(target) - rectTop(owner) - topOffset);
  if (typeof owner.scrollTo === "function") {
    owner.scrollTo({ top: nextTop, behavior: "auto" });
  } else {
    owner.scrollTop = nextTop;
  }
  return true;
}

export function isPreviewUnlockedContentInView(target, owner, offsetPx = PREVIEW_REVEAL_TOP_OFFSET_PX) {
  if (!target || !owner) {
    return false;
  }
  const body = target.querySelector(PREVIEW_UNLOCKED_BODY_SELECTOR);
  if (!body) {
    return false;
  }
  const targetTop = rectTop(target);
  const bodyTop = rectTop(body);
  const bodyBottom = body.getBoundingClientRect().bottom;
  const slack = 48;

  if (isDocumentScroller(owner)) {
    const viewportHeight = window.innerHeight || owner.clientHeight || 0;
    const titleVisible = targetTop >= -1 && targetTop <= offsetPx + slack;
    const bodyVisible = bodyTop < viewportHeight && bodyBottom > 0;
    return titleVisible && bodyVisible;
  }

  const ownerRect = owner.getBoundingClientRect();
  const titleVisible = targetTop >= ownerRect.top - 1 && targetTop <= ownerRect.top + offsetPx + slack;
  const bodyVisible = bodyTop < ownerRect.bottom && bodyBottom > ownerRect.top;
  return titleVisible && bodyVisible;
}

/**
 * Scroll the measured scroll owner so the unlocked title and readable body are in view.
 * Returns true only when the content is actually in the visible region afterward.
 */
export function revealPreviewUnlockedContent(root) {
  const target = getPreviewUnlockedRevealTarget(root);
  if (!target) {
    return false;
  }
  const owner = getPreviewScrollOwner(target);
  if (!owner) {
    return false;
  }
  scrollOwnerToTarget(owner, target, PREVIEW_REVEAL_TOP_OFFSET_PX);
  return isPreviewUnlockedContentInView(target, owner, PREVIEW_REVEAL_TOP_OFFSET_PX);
}

