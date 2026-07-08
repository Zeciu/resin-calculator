import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import ModuleHomeNav from "./ModuleHomeNav.jsx";
import { ROUTES } from "./routes.js";

export default function ModuleHeader({ productName }) {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  return (
    <header className="module-header" aria-label="Module header">
      <ModuleHomeNav />
      <div className="module-header__brand">
        <img
          className="module-header__logo"
          src="/hefzech-logo.png"
          alt="HFZWood"
        />
        <p className="module-header__product">HFZWood</p>
      </div>
      <p className="module-header__title">{productName}</p>
      {isAuthenticated ? (
        <NavLink
          to={ROUTES.ACCOUNT}
          className={({ isActive }) =>
            ["module-header__account", isActive ? "module-header__account--active" : ""]
              .filter(Boolean)
              .join(" ")
          }
        >
          {t("nav.myAccount")}
        </NavLink>
      ) : null}
    </header>
  );
}
