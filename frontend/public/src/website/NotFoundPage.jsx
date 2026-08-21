import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "../workspace/routes.js";

export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <article className="public-website-page" aria-label={t("notFound.title")}>
      <header className="public-website-page__header">
        <h1 className="public-website-page__title">{t("notFound.title")}</h1>
      </header>
      <p className="public-website-page__status">{t("notFound.body")}</p>
      <p>
        <Link className="public-website-layout__home-link" to={ROUTES.HOME}>
          {t("website.backHome")}
        </Link>
      </p>
    </article>
  );
}
