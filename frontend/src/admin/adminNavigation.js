import { ROUTES } from "../workspace/routes.js";
import { ADMIN_ROUTES } from "./adminRoutes.js";

/** @typedef {"link" | "placeholder" | "external"} AdminNavItemKind */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   path: string;
 *   kind: AdminNavItemKind;
 *   end?: boolean;
 *   placeholderTitle?: string;
 *   placeholderMessage?: string;
 *   showEditorialNote?: boolean;
 * }} AdminNavItem
 */

/** @type {AdminNavItem[]} */
export const ADMIN_NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: ADMIN_ROUTES.ROOT,
    kind: "link",
    end: true,
  },
  {
    id: "manual",
    label: "Manual & Tutorials",
    path: ADMIN_ROUTES.MANUAL,
    kind: "placeholder",
    placeholderTitle: "Manual & Tutorials management",
    placeholderMessage: "Manual content management begins in Task 59.",
    showEditorialNote: true,
  },
  {
    id: "glossary",
    label: "Glossary",
    path: ADMIN_ROUTES.GLOSSARY,
    kind: "placeholder",
    placeholderTitle: "Glossary management",
    placeholderMessage: "Glossary content management begins in Task 60.",
    showEditorialNote: true,
  },
  {
    id: "knowledge-base",
    label: "Knowledge Base",
    path: ADMIN_ROUTES.KNOWLEDGE_BASE,
    kind: "placeholder",
    placeholderTitle: "Knowledge Base management",
    placeholderMessage: "Knowledge Base content management begins in Task 61.",
    showEditorialNote: true,
  },
  {
    id: "projects",
    label: "Projects / Open Project",
    path: ROUTES.PROJECTS,
    kind: "external",
  },
  {
    id: "future-content",
    label: "Future content sections",
    path: ADMIN_ROUTES.FUTURE_CONTENT,
    kind: "placeholder",
    placeholderTitle: "Future content sections",
    placeholderMessage:
      "Additional completed content areas will be added here in a later phase.",
  },
  {
    id: "future-administration",
    label: "Future administration sections",
    path: ADMIN_ROUTES.FUTURE_ADMINISTRATION,
    kind: "placeholder",
    placeholderTitle: "Future administration sections",
    placeholderMessage:
      "Additional product administration tools will be added here in a later phase.",
  },
];

export function getAdminPlaceholderNavItems() {
  return ADMIN_NAV_ITEMS.filter((item) => item.kind === "placeholder");
}
