import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAuth } from "../auth/useAuth.js";
import { ROUTES } from "../workspace/routes.js";
import { useWorkspaceNavigation } from "../workspace/useWorkspaceNavigation.js";

function displayValue(value) {
  return value && String(value).trim() ? String(value).trim() : "—";
}

export default function MyAccountPage() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { clearLockedModuleMessage } = useWorkspaceNavigation();

  function handleLogout() {
    logout();
    clearLockedModuleMessage();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <section className="my-account-page">
      <h2 className="my-account-page__title">{t("account.title")}</h2>

      <section className="my-account-page__section" aria-labelledby="my-account-profile-heading">
        <h3 className="my-account-page__section-title" id="my-account-profile-heading">
          {t("account.profile")}
        </h3>
        <dl className="my-account-page__details">
          <div className="my-account-page__detail">
            <dt className="my-account-page__detail-label">{t("account.username")}</dt>
            <dd className="my-account-page__detail-value">{displayValue(user?.username)}</dd>
          </div>
          <div className="my-account-page__detail">
            <dt className="my-account-page__detail-label">{t("account.email")}</dt>
            <dd className="my-account-page__detail-value">{displayValue(user?.email)}</dd>
          </div>
        </dl>
      </section>

      <section
        className="my-account-page__section my-account-page__preferences"
        aria-labelledby="my-account-preferences-heading"
      >
        <h3 className="my-account-page__section-title" id="my-account-preferences-heading">
          {t("account.applicationPreferences")}
        </h3>
        <p className="my-account-page__placeholder">
          {t("account.applicationPreferencesDescription")}
        </p>
        <Link to={ROUTES.PREFERENCES} className="my-account-page__preferences-cta">
          <span>{t("account.applicationPreferences")}</span>
          <span className="my-account-page__preferences-cta-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </section>

      <section
        className="my-account-page__section"
        aria-labelledby="my-account-subscription-heading"
      >
        <h3 className="my-account-page__section-title" id="my-account-subscription-heading">
          {t("account.subscription")}
        </h3>
        <p className="my-account-page__placeholder">{t("account.subscriptionPlaceholder")}</p>
      </section>

      <section className="my-account-page__section" aria-labelledby="my-account-settings-heading">
        <h3 className="my-account-page__section-title" id="my-account-settings-heading">
          {t("account.settings")}
        </h3>
        <ul className="my-account-page__settings-list">
          <li className="my-account-page__settings-item my-account-page__settings-item--future">
            {t("account.security")} — {t("account.securityPlaceholder")}
          </li>
          <li className="my-account-page__settings-item my-account-page__settings-item--future">
            {t("account.notifications")} — {t("account.notificationsPlaceholder")}
          </li>
        </ul>
      </section>

      <button className="my-account-page__logout" type="button" onClick={handleLogout}>
        {t("account.logout")}
      </button>
    </section>
  );
}
