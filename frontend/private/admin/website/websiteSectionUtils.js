export const HERO_SECTION_ID = "hero";

export function createSectionId(prefix = "section") {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${suffix}`;
}

export function moveItem(items, index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
}

export function ensureHeroSection(sections) {
  const list = Array.isArray(sections) ? [...sections] : [];
  const heroIndex = list.findIndex((section) => section.id === HERO_SECTION_ID);
  if (heroIndex >= 0) {
    return list;
  }
  return [
    {
      id: HERO_SECTION_ID,
      title: "",
      blocks: [{ type: "paragraph", text: "" }],
    },
    ...list,
  ];
}

export function splitAboutSections(sections) {
  const normalized = ensureHeroSection(sections);
  const hero = normalized.find((section) => section.id === HERO_SECTION_ID) ?? {
    id: HERO_SECTION_ID,
    title: "",
    blocks: [{ type: "paragraph", text: "" }],
  };
  const contentSections = normalized.filter((section) => section.id !== HERO_SECTION_ID);
  return { hero, contentSections };
}

export function mergeAboutSections(hero, contentSections) {
  return [hero, ...(contentSections ?? [])];
}
