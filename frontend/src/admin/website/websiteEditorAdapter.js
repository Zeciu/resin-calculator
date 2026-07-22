import { blocksToDocument, documentToBlocks, documentsSemanticallyEqual } from "../manual/manualEditorAdapter.js";
import { DEFAULT_KNOWLEDGE_BASE_LINK_LABEL, DEFAULT_MANUAL_LINK_LABEL } from "./websiteConstants.js";
import { ensureHeroSection, mergeAboutSections, splitAboutSections } from "./websiteSectionUtils.js";

const PRICING_OFFER_ORDER = ["free", "subscriber", "lifetime"];

const PRICING_OFFER_LABELS = {
  free: "Free",
  subscriber: "Subscriber",
  lifetime: "Lifetime",
};

export function pricingOfferLabel(offerId) {
  return PRICING_OFFER_LABELS[offerId] ?? offerId;
}

function emptyHomeBody() {
  return {
    pageKind: "home",
    publicTitle: "",
    subtitle: "",
    description: "",
    image: { src: "", alt: "", visible: false },
    video: { url: "", visible: false },
    cta: { label: "", destination: "", visible: false },
  };
}

function emptyAboutBody() {
  return {
    pageKind: "about",
    publicTitle: "",
    sections: ensureHeroSection([]),
  };
}

function emptyPricingBody() {
  return {
    pageKind: "pricing",
    publicTitle: "",
    intro: "",
    offers: PRICING_OFFER_ORDER.map((id) => ({
      id,
      title: "",
      displayedPriceText: "",
      benefits: [],
      ctaLabel: "",
      ctaDestination: "",
      visible: true,
    })),
    footnote: "",
  };
}

function emptyDocumentBody(pageKind) {
  return {
    pageKind,
    publicTitle: "",
    sections: [],
  };
}

function emptyContactBody() {
  return {
    pageKind: "contact",
    publicTitle: "",
    intro: "",
    supportEmail: "",
    links: [],
    showManualLink: true,
    showKnowledgeBaseLink: true,
    manualLinkLabel: DEFAULT_MANUAL_LINK_LABEL,
    knowledgeBaseLinkLabel: DEFAULT_KNOWLEDGE_BASE_LINK_LABEL,
  };
}

function emptyBodyForKind(pageKind) {
  switch (pageKind) {
    case "home":
      return emptyHomeBody();
    case "about":
      return emptyAboutBody();
    case "pricing":
      return emptyPricingBody();
    case "privacy":
      return emptyDocumentBody("privacy");
    case "terms":
      return emptyDocumentBody("terms");
    case "contact":
      return emptyContactBody();
    default:
      return { pageKind, publicTitle: "" };
  }
}

function normalizeAboutSection(section) {
  const image = section?.image ?? {};
  return {
    id: section.id,
    title: section.title ?? "",
    blocks: Array.isArray(section.blocks) ? section.blocks.map((block) => ({ ...block })) : [],
    image: {
      src: image.src ?? "",
      alt: image.alt ?? "",
    },
  };
}

function normalizePricingOffers(offers) {
  const byId = new Map((offers ?? []).map((offer) => [offer.id, offer]));
  return PRICING_OFFER_ORDER.map((id) => {
    const existing = byId.get(id) ?? {};
    return {
      id,
      title: existing.title ?? "",
      displayedPriceText: existing.displayedPriceText ?? "",
      benefits: Array.isArray(existing.benefits) ? [...existing.benefits] : [],
      ctaLabel: existing.ctaLabel ?? "",
      ctaDestination: existing.ctaDestination ?? "",
      visible: existing.visible !== false,
    };
  });
}

function cloneBody(body, pageKind) {
  const fallback = emptyBodyForKind(pageKind);
  const merged = {
    ...fallback,
    ...(body ?? {}),
    pageKind,
  };

  if (pageKind === "about") {
    merged.sections = ensureHeroSection(merged.sections).map(normalizeAboutSection);
  }
  if (pageKind === "pricing") {
    merged.offers = normalizePricingOffers(merged.offers);
  }
  if (pageKind === "contact") {
    merged.links = Array.isArray(merged.links) ? merged.links.map((link) => ({ ...link })) : [];
    merged.manualLinkLabel = merged.manualLinkLabel ?? DEFAULT_MANUAL_LINK_LABEL;
    merged.knowledgeBaseLinkLabel =
      merged.knowledgeBaseLinkLabel ?? DEFAULT_KNOWLEDGE_BASE_LINK_LABEL;
  }
  if (pageKind === "privacy" || pageKind === "terms") {
    merged.sections = Array.isArray(merged.sections)
      ? merged.sections.map((section) => ({
          id: section.id,
          title: section.title ?? "",
          blocks: Array.isArray(section.blocks) ? section.blocks.map((block) => ({ ...block })) : [],
        }))
      : [];
  }

  return merged;
}

export function emptyEditorState(pageKind = "home") {
  return {
    pageKey: "",
    pageKind,
    body: emptyBodyForKind(pageKind),
    status: "draft",
    editorialVisibility: "empty",
    exists: false,
    translationUpdateState: null,
    translationUpdateAction: null,
  };
}

export function variantToEditor(variant) {
  const pageKind = variant?.pageKind ?? "home";
  return {
    pageKey: variant?.pageKey ?? "",
    pageKind,
    body: cloneBody(variant?.body, pageKind),
    status: variant?.status ?? "draft",
    editorialVisibility: variant?.editorialVisibility ?? "empty",
    exists: variant?.exists !== false,
    translationUpdateState: variant?.translationUpdateState ?? null,
    translationUpdateAction: variant?.translationUpdateAction ?? null,
  };
}

export function editorToVariantBody(editorState) {
  const pageKind = editorState.pageKind;
  const body = cloneBody(editorState.body, pageKind);
  return body;
}

export function editorStatesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function sectionBlocksToDocument(blocks) {
  return blocksToDocument(blocks ?? []);
}

export function documentToSectionBlocks(document) {
  return documentToBlocks(document);
}

export function documentsEqual(left, right) {
  return documentsSemanticallyEqual(left, right);
}

export { splitAboutSections, mergeAboutSections, ensureHeroSection };
