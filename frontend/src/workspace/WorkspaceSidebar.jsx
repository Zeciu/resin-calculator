import { Lock } from "lucide-react";
import { NavLink } from "react-router-dom";
import { WORKSPACE_NAV_ITEMS } from "./navigation.js";
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
  const { isNavItemLocked, showLockedModuleMessage, clearLockedModuleMessage } =
    useWorkspaceNavigation();

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
      </ul>
    </nav>
  );
}
