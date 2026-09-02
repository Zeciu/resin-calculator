import { NavLink, useLocation } from "react-router-dom";
import { useCapabilityLimit } from "../capabilities/CapabilitiesContext.jsx";
import { CAPABILITY_KEYS } from "../capabilities/capabilityKeys.js";
import { FREE_CAPABILITIES } from "../capabilities/capabilityDefaults.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { GUEST_LOCKED_MESSAGE_KEYS, resolveGuestLockedModuleId } from "./navigation.js";
import { ROUTES } from "./routes.js";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation.js";

export default function LockedModuleMessage() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const { lockedModuleId } = useWorkspaceNavigation();
  const capabilityLimit = useCapabilityLimit(CAPABILITY_KEYS.CALCULATOR_MAX_POLYGON_POINTS);
  const maxPoints = capabilityLimit ?? FREE_CAPABILITIES[CAPABILITY_KEYS.CALCULATOR_MAX_POLYGON_POINTS];
  const moduleId = resolveGuestLockedModuleId(lockedModuleId, pathname);
  const keys = moduleId ? GUEST_LOCKED_MESSAGE_KEYS[moduleId] : null;

  return (
    <section className="locked-module-message">
      <h2 className="locked-module-message__title">
        {keys ? t(keys.titleKey) : t("locked.title")}
      </h2>
      <p className="locked-module-message__text">
        {keys ? t(keys.bodyKey, { maxPoints }) : t("locked.body")}
      </p>
      <p className="locked-module-message__actions">
        <NavLink to={ROUTES.LOGIN} className="locked-module-message__action">
          {t("register.logIn")}
        </NavLink>
        <span className="locked-module-message__separator" aria-hidden="true">
          {" / "}
        </span>
        <NavLink to={ROUTES.REGISTER} className="locked-module-message__action">
          {t("home.onboardingRegister")}
        </NavLink>
        <span className="locked-module-message__separator" aria-hidden="true">
          {" / "}
        </span>
        <NavLink to={ROUTES.PRICING} className="locked-module-message__action">
          {t("preview.viewPlans")}
        </NavLink>
      </p>
    </section>
  );
}
