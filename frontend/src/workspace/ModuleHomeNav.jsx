import { NavLink } from "react-router-dom";
import { ROUTES } from "./routes.js";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation.js";

export default function ModuleHomeNav() {
  const { clearLockedModuleMessage } = useWorkspaceNavigation();

  return (
    <nav className="module-home-nav module-header__home" aria-label="Module navigation">
      <NavLink
        to={ROUTES.HOME}
        className={({ isActive }) =>
          ["module-home-nav__link", isActive ? "module-home-nav__link--active" : ""]
            .filter(Boolean)
            .join(" ")
        }
        aria-label="Home"
        onClick={clearLockedModuleMessage}
      >
        ← Home
      </NavLink>
    </nav>
  );
}
