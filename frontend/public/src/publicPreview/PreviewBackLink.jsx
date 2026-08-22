import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "../workspace/routes.js";

export default function PreviewBackLink() {
  const { t } = useI18n();
  const label = t("preview.backToLanding");

  return (
    <p className="knowledge-preview-back">
      <Link className="module-home-nav__link knowledge-preview-back__link" to={ROUTES.KNOWLEDGE_PREVIEW}>
        ← {label}
      </Link>
    </p>
  );
}
