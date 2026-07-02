/**
 * Workspace sidebar navigation configuration.
 * Single source of truth for nav labels, paths, and auth requirements.
 */

import { ROUTES } from "./routes.js";

export const WORKSPACE_NAV_ITEMS = [
  {
    id: "new-project",
    label: "New Project",
    path: ROUTES.NEW_PROJECT,
    requiresAuth: true,
  },
  {
    id: "projects",
    label: "Projects",
    path: ROUTES.PROJECTS,
    requiresAuth: true,
  },
  {
    id: "manual-tutorials",
    label: "Manual & Tutorials",
    path: ROUTES.MANUAL,
    requiresAuth: true,
  },
  {
    id: "glossary",
    label: "Glossary",
    path: ROUTES.GLOSSARY,
    requiresAuth: true,
  },
  {
    id: "knowledge-base",
    label: "Knowledge Base",
    path: ROUTES.KNOWLEDGE_BASE,
    requiresAuth: true,
  },
  {
    id: "login-register",
    label: "Login / Register",
    path: ROUTES.LOGIN,
    requiresAuth: false,
  },
  {
    id: "my-account",
    label: "My Account",
    path: ROUTES.ACCOUNT,
    requiresAuth: true,
  },
];

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
    (item) =>
      item.requiresAuth &&
      item.id !== "my-account" &&
      item.id !== "login-register",
  );
}
