/**
 * Workspace sidebar navigation configuration.
 * Single source of truth for nav labels, paths, and auth requirements.
 */

export const WORKSPACE_NAV_ITEMS = [
  {
    id: "new-project",
    label: "New Project",
    path: "/new-project",
    requiresAuth: true,
  },
  {
    id: "projects",
    label: "Projects",
    path: "/projects",
    requiresAuth: true,
  },
  {
    id: "manual-tutorials",
    label: "Manual & Tutorials",
    path: "/manual",
    requiresAuth: true,
  },
  {
    id: "glossary",
    label: "Glossary",
    path: "/glossary",
    requiresAuth: true,
  },
  {
    id: "knowledge-base",
    label: "Knowledge Base",
    path: "/knowledge-base",
    requiresAuth: true,
  },
  {
    id: "login-register",
    label: "Login / Register",
    path: "/login",
    requiresAuth: false,
  },
  {
    id: "my-account",
    label: "My Account",
    path: "/account",
    requiresAuth: true,
  },
];
