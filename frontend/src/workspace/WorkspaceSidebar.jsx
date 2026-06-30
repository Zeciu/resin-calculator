import { Lock } from "lucide-react";
import { NavLink } from "react-router-dom";
import { WORKSPACE_NAV_ITEMS } from "./navigation.js";

export default function WorkspaceSidebar({ isAuthenticated = false }) {
  return (
    <nav className="workspace-sidebar" aria-label="Workspace navigation">
      <ul className="workspace-sidebar__list">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const isLocked = item.requiresAuth && !isAuthenticated;

          return (
            <li key={item.id} className="workspace-sidebar__item">
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
                aria-disabled={isLocked ? "true" : undefined}
                onClick={(event) => {
                  if (isLocked) {
                    event.preventDefault();
                  }
                }}
              >
                <span className="workspace-sidebar__label">{item.label}</span>
                {isLocked ? (
                  <span className="workspace-sidebar__lock" aria-label="Locked feature">
                    <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                ) : null}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
