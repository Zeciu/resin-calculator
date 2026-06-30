import { Lock } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { WORKSPACE_NAV_ITEMS } from "./navigation.js";
import { ROUTES } from "./routes.js";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation.js";

function LockedNavItem({ item, onShowLockedMessage }) {
  return (
    <button
      type="button"
      className="workspace-sidebar__link workspace-sidebar__link--locked"
      onClick={onShowLockedMessage}
    >
      <span className="workspace-sidebar__label">{item.label}</span>
      <span className="workspace-sidebar__lock" aria-label="Locked feature">
        <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </button>
  );
}

export default function WorkspaceSidebar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { isNavItemLocked, showLockedModuleMessage, clearLockedModuleMessage } =
    useWorkspaceNavigation();

  function handleLogout() {
    logout();
    clearLockedModuleMessage();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <nav className="workspace-sidebar" aria-label="Workspace navigation">
      <ul className="workspace-sidebar__list">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const isLocked = isNavItemLocked(item);

          return (
            <li key={item.id} className="workspace-sidebar__item">
              {isLocked ? (
                <LockedNavItem item={item} onShowLockedMessage={showLockedModuleMessage} />
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      "workspace-sidebar__link",
                      isActive ? "workspace-sidebar__link--active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  onClick={clearLockedModuleMessage}
                >
                  <span className="workspace-sidebar__label">{item.label}</span>
                </NavLink>
              )}
            </li>
          );
        })}
        {isAuthenticated ? (
          <li className="workspace-sidebar__item">
            <button
              type="button"
              className="workspace-sidebar__link workspace-sidebar__logout"
              onClick={handleLogout}
            >
              <span className="workspace-sidebar__label">Log out</span>
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
