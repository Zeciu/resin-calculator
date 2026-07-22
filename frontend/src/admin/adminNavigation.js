import { ADMIN_ROUTES } from "./adminRoutes.js";

/** @typedef {"link" | "placeholder"} AdminNavItemKind */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   path: string;
 *   kind: AdminNavItemKind;
 *   end?: boolean;
 *   placeholderTitle?: string;
 *   placeholderMessage?: string;
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
    kind: "link",
  },
  {
    id: "glossary",
    label: "Glossary",
    path: ADMIN_ROUTES.GLOSSARY,
    kind: "link",
  },
  {
    id: "knowledge-base",
    label: "Knowledge Base",
    path: ADMIN_ROUTES.KNOWLEDGE_BASE,
    kind: "link",
  },
  {
    id: "website",
    label: "Website",
    path: ADMIN_ROUTES.WEBSITE,
    kind: "link",
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
