/**
 * Workspace sidebar navigation configuration.
 * Single source of truth for nav labels, paths, and auth requirements.
 */

import { getDedicatedModuleTitle as getDedicatedModuleTitleFromI18n } from "../i18n/translate.js";
import { ROUTES } from "./routes.js";

export const WORKSPACE_NAV_ITEMS = [
  {
    id: "new-project",
    labelKey: "nav.newProject",
    path: ROUTES.NEW_PROJECT,
    requiresAuth: true,
  },
  {
    id: "projects",
    labelKey: "nav.projects",
    path: ROUTES.PROJECTS,
    requiresAuth: true,
  },
  {
    id: "manual-tutorials",
    labelKey: "nav.manualTutorials",
    path: ROUTES.MANUAL,
    requiresAuth: true,
  },
  {
    id: "glossary",
    labelKey: "nav.glossary",
    path: ROUTES.GLOSSARY,
    requiresAuth: true,
  },
  {
    id: "knowledge-base",
    labelKey: "nav.knowledgeBase",
    path: ROUTES.KNOWLEDGE_BASE,
    requiresAuth: true,
  },
  {
    id: "login-register",
    labelKey: "nav.loginRegister",
    path: ROUTES.LOGIN,
    requiresAuth: false,
  },
  {
    id: "my-account",
    labelKey: "nav.myAccount",
    path: ROUTES.ACCOUNT,
    requiresAuth: true,
  },
];

/** Auth screens that share the Login / Register nav highlight. */
export const AUTH_FLOW_PATHS = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.PASSWORD_RECOVERY];

export function isAuthFlowPath(pathname) {
  return AUTH_FLOW_PATHS.includes(pathname);
}

/**
 * Route-derived active state for workspace sidebar items.
 * Login stays active across the auth flow; My Account stays active on preferences.
 */
export function isWorkspaceNavItemActive(item, pathname) {
  if (item.id === "login-register") {
    return isAuthFlowPath(pathname);
  }
  if (item.id === "my-account") {
    return pathname === ROUTES.ACCOUNT || pathname.startsWith(`${ROUTES.ACCOUNT}/`);
  }
  return pathname === item.path;
}

export function getVisibleWorkspaceNavItems(isAuthenticated) {
  return WORKSPACE_NAV_ITEMS.filter((item) => {
    if (item.id === "login-register") {
      return !isAuthenticated;
    }
    return true;
  });
}

export function getLoggedInHomeNavItems() {
  return WORKSPACE_NAV_ITEMS.filter(
    (item) => item.requiresAuth && item.id !== "login-register",
  );
}

/** Routes that use DedicatedModuleLayout instead of the home hub sidebar. */
export const DEDICATED_MODULE_PATHS = [
  ROUTES.NEW_PROJECT,
  ROUTES.PROJECTS,
  ROUTES.MANUAL,
  ROUTES.GLOSSARY,
  ROUTES.KNOWLEDGE_BASE,
];

export function isDedicatedModulePath(pathname) {
  return DEDICATED_MODULE_PATHS.includes(pathname);
}

export function getDedicatedModuleTitle(pathname, language = "en") {
  return getDedicatedModuleTitleFromI18n(language, pathname);
}
