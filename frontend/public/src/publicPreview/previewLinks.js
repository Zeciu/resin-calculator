import { ROUTES } from "../workspace/routes.js";

const AUTHENTICATED_PREFIXES = [
  [ROUTES.KNOWLEDGE_BASE, ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE],
  [ROUTES.GLOSSARY, ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY],
  [ROUTES.MANUAL, ROUTES.KNOWLEDGE_PREVIEW_MANUAL],
];

export function rewritePreviewHref(href) {
  if (typeof href !== "string" || href.length === 0) {
    return href;
  }
  if (href.startsWith(ROUTES.KNOWLEDGE_PREVIEW)) {
    return href;
  }
  for (const [authenticatedPath, previewPath] of AUTHENTICATED_PREFIXES) {
    if (href === authenticatedPath || href.startsWith(`${authenticatedPath}#`) || href.startsWith(`${authenticatedPath}?`)) {
      return `${previewPath}${href.slice(authenticatedPath.length)}`;
    }
  }
  return href;
}

export function previewGlossaryHref(id) {
  return `${ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY}#glossary-entry-${id}`;
}

export function previewManualHref(id) {
  return `${ROUTES.KNOWLEDGE_PREVIEW_MANUAL}#${id}`;
}

export function previewKnowledgeBaseHref(id) {
  return `${ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE}#knowledge-base-entry-${id}`;
}

export function parseHashId(hash, prefix = "") {
  const raw = String(hash ?? "").replace(/^#/, "");
  if (!raw) {
    return "";
  }
  if (prefix && raw.startsWith(prefix)) {
    return raw.slice(prefix.length);
  }
  return raw;
}
