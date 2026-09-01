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
  "knowledgeBase.prevention",
  "knowledgeBase.tips",
  "knowledgeBase.warnings",
  "knowledgeBase.supportInformation",
  "knowledgeBase.estimatedRepairTime",
  "knowledgeBase.tools",
  "knowledgeBase.materials",
  "knowledgeBase.relatedArticles",
  "knowledgeBase.glossary",
  "knowledgeBase.manual",
  "knowledgeBase.backToTop",
];

/** Public Glossary structural UI keys (must exist in every supported locale bundle). */
export const GLOSSARY_UI_KEYS = [
  "glossary.searchLabel",
  "glossary.searchPlaceholder",
  "glossary.emptyTitle",
  "glossary.emptyHint",
];

/** Document titles and not-found copy (must exist in every supported locale bundle). */
export const DOCUMENT_METADATA_UI_KEYS = [
  "app.documentTitle",
  "website.documentTitle.about",
  "website.documentTitle.pricing",
  "website.documentTitle.privacy",
  "website.documentTitle.terms",
  "website.documentTitle.contact",
  "notFound.title",
  "notFound.body",
];

/** Workspace navigation labels (must exist in every supported locale bundle). */
export const WORKSPACE_NAV_UI_KEYS = [
  "nav.newProject",
  "nav.projects",
  "nav.manualTutorials",
  "nav.glossary",
  "nav.knowledgeBase",
  "nav.publicKnowledgePreview",
  "nav.loginRegister",
  "nav.myAccount",
  "nav.home",
  "nav.logout",
  "nav.workspaceDisclosure",
];

/**
 * Logged-out login and password-recovery copy that active public locales must own.
 */
export const GUEST_AUTH_UI_KEYS = [
  "login.title",
  "login.username",
  "login.usernameRequired",
  "login.submitting",
  "login.failed",
  "login.createAccount",
  "login.forgotPassword",
  "login.backToLogin",
  "recovery.title",
  "recovery.intro",
  "recovery.submit",
  "recovery.submitting",
  "recovery.failed",
  "recovery.sent",
  "recovery.codeIntro",
  "recovery.newPassword",
  "recovery.confirmNewPassword",
  "recovery.newPasswordRequired",
  "recovery.updatePassword",
  "recovery.updating",
  "recovery.resetFailed",
  "recovery.updatedTitle",
  "recovery.updatedBody",
  "register.password",
  "register.passwordRequired",
  "register.logIn",
  "register.email",
  "register.emailRequired",
  "register.emailInvalid",
  "register.confirmTitle",
  "register.confirmIntro",
  "register.confirmCode",
  "register.confirmSubmit",
  "register.confirming",
  "register.confirmCodeRequired",
  "register.confirmFailed",
  "register.passwordTooShort",
  "register.passwordMismatch",
];

/**
 * Logged-out/public shell copy that active public locales must own.
 * English fallback remains as a safety net; these keys should not rely on it
 * for production public locales.
 */
export const GUEST_PUBLIC_SHELL_UI_KEYS = [
  ...WORKSPACE_NAV_UI_KEYS,
  ...DOCUMENT_METADATA_UI_KEYS,
  ...KNOWLEDGE_BASE_UI_KEYS,
  ...GLOSSARY_UI_KEYS,
  "a11y.skipToContent",
  "publicLanguage.label",
  "locked.featureAria",
  "hero.headline",
  "hero.subtitle",
  "hero.estimate.title",
  "hero.estimate.depth",
  "home.guestStatement",
  "home.guestSupporting",
  "home.guestAccountMessage",
  "home.videoLabel",
  "home.videoPlaceholder",
  "home.onboardingTitle",
  "home.onboardingBody",
  "home.onboardingRegister",
  "home.onboardingLogin",
  "locked.title",
  "locked.body",
  "locked.action",
  "demo.cta",
  "demo.title",
  "demo.reset",
  "demo.accountCta",
  "demo.loadError",
  "demo.retry",
  "demo.projectNote",
  "demo.valueHeadline",
  "demo.valueBody",
  "demo.useHeadline",
  "demo.useBody",
  "demo.seePlans",
  "demo.learnHeadline",
  "demo.learnBody",
  "demo.exploreKnowledgePreview",
  "common.loading",
  "calculator.modifyProject",
  "calculator.modifyProjectActive",
  "preview.landingIntro",
  "preview.resourceManualHint",
  "preview.resourceKbHint",
  "preview.resourceGlossaryHint",
  "preview.accessFreeLead",
  "preview.accessSubscriptionLead",
  "preview.resourceManualAccess",
  "preview.resourceKbAccess",
  "preview.resourceGlossaryAccess",
  "preview.backToLanding",
  "preview.manualContext",
  "preview.kbContext",
  "preview.glossaryContext",
  "preview.emptyTitle",
  "preview.lockedHeading",
  "preview.lockedManual",
  "preview.lockedKnowledgeBase",
  "preview.lockedGlossary",
  "preview.viewPlans",
  "preview.lockedAria",
  "preview.availableInPreview",
  "preview.contents",
  "preview.searchLabel",
  "preview.searchPlaceholderTitle",
  "preview.searchPlaceholderTerm",
  "preview.noSearchMatches",
  "content.loadingManual",
  "content.loadingGlossary",
  "content.loadingKnowledgeBase",
  "content.loadingWebsite",
  "content.unavailableWebsite",
  "content.viewEnglishVersion",
  "content.manualTitle",
  "content.glossaryTitle",
  "content.knowledgeBaseTitle",
  "website.backHome",
  "website.footerLabel",
  "website.footerNavLabel",
  "website.nav.about",
  "website.nav.pricing",
  "website.nav.privacy",
  "website.nav.terms",
  "website.nav.contact",
  "website.pricing.freeDescription",
  "website.pricing.monthlyDescription",
  "website.pricing.annualDescription",
  "website.pricing.perMonth",
  "website.pricing.perYear",
  "website.pricing.bestValue",
  "website.pricing.save25",
  "website.pricing.annualEquivalent",
  "website.pricing.freeCta",
  "website.pricing.monthlyCta",
  "website.pricing.annualCta",
  "website.pricing.trustTitle",
  "website.contact.communityTitle",
  "website.contact.communityIntro",
  "register.title",
  "register.comparePlansLead",
  "register.email",
  "register.username",
  "register.password",
  "register.confirmPassword",
  "register.submit",
  "register.submitting",
  "register.alreadyHaveAccount",
  "register.logIn",
  "register.emailRequired",
  "register.emailInvalid",
  "register.usernameRequired",
  "register.usernameTooShort",
  "register.passwordRequired",
  "register.passwordTooShort",
  "register.confirmPasswordRequired",
  "register.passwordMismatch",
  "register.failed",
  "register.confirmTitle",
  "register.confirmIntro",
  "register.confirmCode",
  "register.confirmSubmit",
  "register.confirming",
  "register.alreadyConfirmed",
  "register.confirmCodeRequired",
  "register.confirmFailed",
  ...GUEST_AUTH_UI_KEYS,
];

/**
 * Dynamic calculator keys used via templates (not literal t("...") in source).
 * Completeness scans should include these alongside extracted calculator t() keys.
 */
export const DEMO_CALCULATOR_DYNAMIC_UI_KEYS = [
  "calculator.polygonKind.mold",
  "calculator.polygonKind.wood",
  "calculator.polygonKind.cavity",
  "calculator.polygonKind.standard",
  "calculator.polygonKind.polygon",
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
  if (routePath === "/knowledge-preview" || routePath.startsWith("/knowledge-preview/")) {
    return translate(language, "nav.publicKnowledgePreview");
  }
  const keyByPath = {
    "/new-project": "nav.newProject",
    "/projects": "nav.projects",
    "/manual": "nav.manualTutorials",
    "/glossary": "nav.glossary",
    "/knowledge-base": "nav.knowledgeBase",
    "/demo": "demo.title",
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
