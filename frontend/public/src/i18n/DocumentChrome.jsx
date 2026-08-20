import { useEffect } from "react";
import { useI18n } from "./I18nContext.jsx";

/**
 * Keeps the document language and title aligned with the active public locale.
 */
export default function DocumentChrome() {
  const { language, t } = useI18n();

  useEffect(() => {
    document.documentElement.lang = language || "en";
    document.title = t("app.documentTitle");
  }, [language, t]);

  return (
    <a className="skip-to-content" href="#main-content">
      {t("a11y.skipToContent")}
    </a>
  );
}
