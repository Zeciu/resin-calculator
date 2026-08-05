const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return true;
  }
  return EMAIL_PATTERN.test(trimmed);
}

export function isValidUrl(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return true;
  }
  if (trimmed.startsWith("/")) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateRequiredTitle(value, label = "Title") {
  if (!String(value ?? "").trim()) {
    return `${label} cannot be empty.`;
  }
  return null;
}

export function validateDuplicateSectionIds(sections) {
  const seen = new Set();
  for (const section of sections ?? []) {
    const id = String(section?.id ?? "").trim();
    if (!id) {
      return "Each section must have an identifier.";
    }
    if (seen.has(id)) {
      return `Duplicate section identifier: ${id}`;
    }
    seen.add(id);
  }
  return null;
}

/**
 * @param {{ pageKind: string; body: Record<string, unknown> }} editorState
 * @returns {string | null}
 */
export function validateWebsiteEditorState(editorState) {
  const body = editorState?.body ?? {};
  const pageKind = editorState?.pageKind ?? body.pageKind;

  const titleError = validateRequiredTitle(body.publicTitle, "Page title");
  if (titleError) {
    return titleError;
  }

  if (pageKind === "home") {
    if (!isValidUrl(body.cta?.destination)) {
      return "CTA destination must be a valid URL or site path.";
    }
    if (String(body.video?.url ?? "").trim() && !isValidUrl(body.video.url)) {
      return "Video URL must be a valid URL.";
    }
    return null;
  }

  if (pageKind === "about") {
    const duplicateError = validateDuplicateSectionIds(body.sections);
    if (duplicateError) {
      return duplicateError;
    }
    return null;
  }

  if (pageKind === "pricing") {
    const requiredIds = ["free", "subscriber", "lifetime"];
    const offerIds = (body.offers ?? []).map((offer) => offer.id);
    if (!requiredIds.every((id) => offerIds.includes(id))) {
      return "Pricing plans must include Free, Subscriber, and Lifetime.";
    }
    for (const offer of body.offers ?? []) {
      if (!isValidUrl(offer.ctaDestination)) {
        return `${offer.id} CTA destination must be a valid URL or site path.`;
      }
    }
    return null;
  }

  if (pageKind === "privacy" || pageKind === "terms") {
    const duplicateError = validateDuplicateSectionIds(body.sections);
    if (duplicateError) {
      return duplicateError;
    }
    return null;
  }

  if (pageKind === "contact") {
    if (!isValidEmail(body.supportEmail)) {
      return "Support email must be a valid email address.";
    }
    for (const link of body.links ?? []) {
      if (!isValidUrl(link.url)) {
        return "Each contact link must have a valid URL.";
      }
    }
    const officialLinks = body.officialLinks ?? {};
    for (const key of ["website", "youtube", "facebook", "instagram", "tiktok", "linkedin"]) {
      if (!isValidUrl(officialLinks[key])) {
        return "Official link URLs must be valid http(s) addresses or left empty.";
      }
    }
    return null;
  }

  return null;
}
