import { NavLink } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "./routes.js";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation.js";

export default function ModuleHomeNav() {
  const { t } = useI18n();
  const { clearLockedModuleMessage } = useWorkspaceNavigation();
  const homeLabel = t("nav.home");

  return (
    <nav className="module-home-nav module-header__home" aria-label="Module navigation">
      <NavLink
        to={ROUTES.HOME}
        className={({ isActive }) =>
          ["module-home-nav__link", isActive ? "module-home-nav__link--active" : ""]
            .filter(Boolean)
            .join(" ")
        }
        aria-label={homeLabel}
        onClick={clearLockedModuleMessage}
      >
        ← {homeLabel}
      </NavLink>
    </nav>
  );
}
