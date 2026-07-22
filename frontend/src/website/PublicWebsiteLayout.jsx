import { Link, Outlet } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "../workspace/routes.js";
import PublicWebsiteFooter from "./PublicWebsiteFooter.jsx";

export default function PublicWebsiteLayout() {
  const { t } = useI18n();

  return (
    <div className="public-website-layout">
      <header className="public-website-layout__header">
        <Link className="public-website-layout__brand" to={ROUTES.HOME} aria-label="HFZWood">
          <img
            className="public-website-layout__logo"
            src="/hefzech-logo.png"
            alt="HEFZECH logo"
          />
          <span className="public-website-layout__brand-name">HFZWood</span>
        </Link>
        <Link className="public-website-layout__home-link" to={ROUTES.HOME}>
          {t("website.backHome")}
        </Link>
      </header>
      <main className="public-website-layout__content">
        <Outlet />
      </main>
      <PublicWebsiteFooter />
    </div>
  );
}
