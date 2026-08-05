import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { WEBSITE_FOOTER_LINKS } from "./websitePublicConstants.js";

export default function PublicWebsiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="public-website-footer" aria-label={t("website.footerLabel")}>
      <nav className="public-website-footer__nav" aria-label={t("website.footerNavLabel")}>
        <ul className="public-website-footer__list">
          {WEBSITE_FOOTER_LINKS.map((link) => (
            <li key={link.pageKey}>
              <Link className="public-website-footer__link" to={link.path}>
                {t(link.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
