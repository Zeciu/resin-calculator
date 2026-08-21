import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyDocumentHead, resolveDocumentHeadState } from "../website/documentMetadata.js";
import { useI18n } from "./I18nContext.jsx";

/**
 * Keeps document language, title, robots, and canonical tags aligned with
 * the active locale and current route.
 */
export default function DocumentChrome() {
  const { language, t } = useI18n();
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.lang = language || "en";
    applyDocumentHead(resolveDocumentHeadState(pathname, t));
  }, [language, t, pathname]);

  return (
    <a className="skip-to-content" href="#main-content">
      {t("a11y.skipToContent")}
    </a>
  );
}
