import { NavLink } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "../workspace/routes.js";

export default function DemoProjectNavLink({ className, onClick, labeled = false }) {
  const { t } = useI18n();
  const label = t("demo.cta");

  return (
    <NavLink
      to={ROUTES.DEMO}
      end
      data-nav="demo-project"
      className={className}
      onClick={onClick}
    >
      {labeled ? <span className="workspace-sidebar__label">{label}</span> : label}
    </NavLink>
  );
}
