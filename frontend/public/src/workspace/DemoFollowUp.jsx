import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "./routes.js";

export default function DemoFollowUp() {
  const { t } = useI18n();

  return (
    <section className="demo-follow-up" aria-label={t("demo.valueHeadline")}>
      <div className="demo-follow-up__value">
        <h2 className="demo-follow-up__headline">{t("demo.valueHeadline")}</h2>
        <p className="demo-follow-up__body">{t("demo.valueBody")}</p>
      </div>

      <div className="demo-follow-up__paths">
        <article className="demo-follow-up__card">
          <h3 className="demo-follow-up__card-title">{t("demo.useHeadline")}</h3>
          <p className="demo-follow-up__card-body">{t("demo.useBody")}</p>
          <Link className="demo-follow-up__cta" to={ROUTES.PRICING}>
            {t("demo.seePlans")}
          </Link>
        </article>

        <article className="demo-follow-up__card">
          <h3 className="demo-follow-up__card-title">{t("demo.learnHeadline")}</h3>
          <p className="demo-follow-up__card-body">{t("demo.learnBody")}</p>
          <Link className="demo-follow-up__cta" to={ROUTES.KNOWLEDGE_PREVIEW}>
            {t("demo.exploreKnowledgePreview")}
          </Link>
        </article>
      </div>
    </section>
  );
}
