import { NavLink } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "./routes.js";

export default function LockedModuleMessage() {
  const { t } = useI18n();

  return (
    <section className="locked-module-message">
      <h2 className="locked-module-message__title">{t("locked.title")}</h2>
      <p className="locked-module-message__text">{t("locked.body")}</p>
      <NavLink to={ROUTES.LOGIN} className="locked-module-message__action">
        {t("locked.action")}
      </NavLink>
    </section>
  );
}
