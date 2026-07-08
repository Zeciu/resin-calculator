import en from "./en.json";
import ro from "./ro.json";

const BUNDLES = { en, ro };

export function translate(language, key, params = {}) {
  const bundle = BUNDLES[language] ?? BUNDLES.en;
  const fallback = BUNDLES.en;
  const template = bundle[key] ?? fallback[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? ""));
}

export function getNavigationLabel(language, itemId) {
  return translate(language, `nav.${itemId}`);
}

export function getDedicatedModuleTitle(language, routePath) {
  const keyByPath = {
    "/new-project": "nav.newProject",
    "/projects": "nav.projects",
    "/manual": "nav.manualTutorials",
    "/glossary": "nav.glossary",
    "/knowledge-base": "nav.knowledgeBase",
  };
  const key = keyByPath[routePath];
  return key ? translate(language, key) : "HFZWood";
}
