import { Lock } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import QuickPreferences from "../preferences/QuickPreferences.jsx";
import { getLoggedInHomeNavItems, getVisibleWorkspaceNavItems, isWorkspaceNavItemActive } from "./navigation.js";
import { ROUTES } from "./routes.js";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation.js";

function LockedNavItem({ item, label, onShowLockedMessage }) {
  return (
    <button
      type="button"
      className="workspace-sidebar__link workspace-sidebar__link--locked"
      onClick={onShowLockedMessage}
    >
      <span className="workspace-sidebar__label">{label}</span>
      <span className="workspace-sidebar__lock" aria-label="Locked feature">
        <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </button>
  );
}

export default function WorkspaceSidebar() {
  const { isAuthenticated, logout } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { isNavItemLocked, showLockedModuleMessage, clearLockedModuleMessage } =
    useWorkspaceNavigation();

  const isLoggedInHome = isAuthenticated && location.pathname === ROUTES.HOME;
  const navItems = isLoggedInHome
    ? getLoggedInHomeNavItems()
    : getVisibleWorkspaceNavItems(isAuthenticated);

  function handleLogout() {
    logout();
    clearLockedModuleMessage();
    navigate(ROUTES.HOME, { replace: true });
  }

  return (
    <nav className="workspace-sidebar" aria-label="Workspace navigation">
      <ul className="workspace-sidebar__list">
        {navItems.map((item) => {
          const label = t(item.labelKey);
          const isLocked = isNavItemLocked(item);
          // Primary emphasis is Home-only; do not keep New Project highlighted on
          // Login, auth-flow, or preferences routes.
          const isPrimaryAction = isLoggedInHome && item.id === "new-project" && !isLocked;
          const isItemActive = isWorkspaceNavItemActive(item, location.pathname);

          return (
            <li key={item.id} className="workspace-sidebar__item">
              {isLocked ? (
                <LockedNavItem
                  item={item}
                  label={label}
                  onShowLockedMessage={showLockedModuleMessage}
                />
              ) : (
                <NavLink
                  to={item.path}
                  end={item.id !== "my-account"}
                  className={() =>
                    [
                      "workspace-sidebar__link",
                      isPrimaryAction ? "workspace-sidebar__link--primary-action" : "",
                      isItemActive ? "workspace-sidebar__link--active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  aria-current={isItemActive ? "page" : undefined}
                  onClick={clearLockedModuleMessage}
                >
                  <span className="workspace-sidebar__label">{label}</span>
                </NavLink>
              )}
            </li>
          );
        })}
        {isLoggedInHome ? (
          <li className="workspace-sidebar__item workspace-sidebar__item--quick-preferences">
            <QuickPreferences variant="sidebar" />
          </li>
        ) : null}
        {isAuthenticated ? (
          <li className="workspace-sidebar__item">
            <button
              type="button"
              className="workspace-sidebar__link workspace-sidebar__logout"
              onClick={handleLogout}
            >
              <span className="workspace-sidebar__label">{t("nav.logout")}</span>
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
