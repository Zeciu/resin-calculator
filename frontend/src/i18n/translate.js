import en from "./en.json";
import ro from "./ro.json";
import fr from "./fr.json";
import de from "./de.json";
import es from "./es.json";
import pt from "./pt.json";
import pl from "./pl.json";
import cs from "./cs.json";
import it from "./it.json";

const BUNDLES = { en, ro, fr, de, es, pt, pl, cs, it };

/** Public Knowledge Base structural UI keys (must exist in every supported locale bundle). */
export const KNOWLEDGE_BASE_UI_KEYS = [
  "knowledgeBase.searchLabel",
  "knowledgeBase.searchPlaceholder",
  "knowledgeBase.problemSummary",
  "knowledgeBase.symptoms",
  "knowledgeBase.possibleCauses",
  "knowledgeBase.solution",
  "knowledgeBase.tips",
  "knowledgeBase.warnings",
];

/** Workspace navigation labels (must exist in every supported locale bundle). */
export const WORKSPACE_NAV_UI_KEYS = [
  "nav.newProject",
  "nav.projects",
  "nav.manualTutorials",
  "nav.glossary",
  "nav.knowledgeBase",
  "nav.loginRegister",
  "nav.myAccount",
  "nav.home",
  "nav.logout",
];

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

export function getSupportedI18nLanguages() {
  return Object.keys(BUNDLES);
}

export function localeBundleHasOwnKey(language, key) {
  const bundle = BUNDLES[language];
  return Boolean(bundle && Object.prototype.hasOwnProperty.call(bundle, key));
}
