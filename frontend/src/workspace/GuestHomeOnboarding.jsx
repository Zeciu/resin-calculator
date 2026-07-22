import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "./routes.js";

/**
 * Guest-only onboarding callout for public Home (CMS and i18n fallback).
 */
export default function GuestHomeOnboarding() {
  const { t } = useI18n();

  return (
    <aside className="guest-home-onboarding" aria-label={t("home.onboardingTitle")}>
      <h2 className="guest-home-onboarding__title">{t("home.onboardingTitle")}</h2>
      <p className="guest-home-onboarding__body">{t("home.onboardingBody")}</p>
      <div className="guest-home-onboarding__actions">
        <Link className="guest-home-onboarding__primary" to={ROUTES.REGISTER}>
          {t("home.onboardingRegister")}
        </Link>
        <Link className="guest-home-onboarding__secondary" to={ROUTES.LOGIN}>
          {t("home.onboardingLogin")}
        </Link>
      </div>
    </aside>
  );
}
