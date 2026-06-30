import { Lock } from "lucide-react";
import { WORKSPACE_NAV_ITEMS } from "./navigation.js";

export default function WorkspaceSidebar({ isAuthenticated = false }) {
  return (
    <nav className="workspace-sidebar" aria-label="Workspace navigation">
      <ul className="workspace-sidebar__list">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const isLocked = item.requiresAuth && !isAuthenticated;

          return (
            <li key={item.id} className="workspace-sidebar__item">
              <a
                className="workspace-sidebar__link"
                href={item.path}
                aria-disabled={isLocked ? "true" : undefined}
              >
                <span className="workspace-sidebar__label">{item.label}</span>
                {isLocked ? (
                  <span className="workspace-sidebar__lock" aria-label="Locked feature">
                    <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
