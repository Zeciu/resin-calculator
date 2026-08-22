import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "../workspace/routes.js";

/**
 * @param {{ copyKey: string; headingLevel?: 2 | 3 }} props
 */
export default function PreviewLockedPanel({ copyKey, headingLevel = 2 }) {
  const { t } = useI18n();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const headingId = `knowledge-preview-locked-${copyKey}`;

  return (
    <section className="knowledge-preview-locked" aria-labelledby={headingId}>
      <Heading id={headingId} className="knowledge-preview-locked__title">
        {t("preview.lockedHeading")}
      </Heading>
      <p className="knowledge-preview-locked__body">{t(copyKey)}</p>
      <Link className="knowledge-preview-locked__cta" to={ROUTES.PRICING}>
        {t("preview.viewPlans")}
      </Link>
    </section>
  );
}
