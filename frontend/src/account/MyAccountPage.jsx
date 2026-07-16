import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAuth } from "../auth/useAuth.js";
import { useCapabilities } from "../capabilities/CapabilitiesContext.jsx";
import { ROUTES } from "../workspace/routes.js";
import { useWorkspaceNavigation } from "../workspace/useWorkspaceNavigation.js";
import {
  createCheckoutSession,
  createPortalSession,
  fetchBillingStatus,
} from "./billingApi.js";

function displayValue(value) {
  return value && String(value).trim() ? String(value).trim() : "—";
}

function formatPeriodEnd(unixSeconds, locale) {
  if (!unixSeconds) {
    return null;
  }
  try {
    return new Date(Number(unixSeconds) * 1000).toLocaleString(locale || undefined);
  } catch {
    return null;
  }
}

export default function MyAccountPage() {
  const { user, logout, isAdministrator } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clearLockedModuleMessage } = useWorkspaceNavigation();
  const { capabilities, reloadCapabilities } = useCapabilities();

  const [billingStatus, setBillingStatus] = useState(null);
  const [billingError, setBillingError] = useState("");
  const [billingMessage, setBillingMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBillingStatus = useCallback(async () => {
    try {
      const status = await fetchBillingStatus();
      setBillingStatus(status);
      setBillingError("");
      return status;
    } catch (error) {
      setBillingError(error.message || t("account.billingUnavailable"));
      return null;
    }
  }, [t]);

  useEffect(() => {
    void loadBillingStatus();
  }, [loadBillingStatus]);

  useEffect(() => {
    const billingResult = searchParams.get("billing");
    if (!billingResult) {
      return;
    }

    let cancelled = false;

    async function handleReturn() {
      if (billingResult === "success") {
        setBillingMessage(t("account.billingPending"));
        setIsRefreshing(true);
        for (let attempt = 0; attempt < 5; attempt += 1) {
          if (cancelled) {
            return;
          }
          await reloadCapabilities();
          const status = await loadBillingStatus();
          if (status?.plan === "subscriber" || status?.status === "active") {
            setBillingMessage(t("account.billingActive"));
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        setIsRefreshing(false);
      } else if (billingResult === "cancel") {
        setBillingMessage(t("account.billingCancelledCheckout"));
      }

      const next = new URLSearchParams(searchParams);
      next.delete("billing");
      setSearchParams(next, { replace: true });
    }

    void handleReturn();
    return () => {
      cancelled = true;
    };
  }, [loadBillingStatus, reloadCapabilities, searchParams, setSearchParams, t]);

  function handleLogout() {
    logout();
    clearLockedModuleMessage();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  async function handleSubscribe() {
    setIsBusy(true);
    setBillingError("");
    try {
      const session = await createCheckoutSession();
      if (!session?.url) {
        throw new Error(t("account.billingUnavailable"));
      }
      window.location.assign(session.url);
    } catch (error) {
      setBillingError(error.message || t("account.billingUnavailable"));
      setIsBusy(false);
    }
  }

  async function handleManage() {
    setIsBusy(true);
    setBillingError("");
    try {
      const session = await createPortalSession();
      if (!session?.url) {
        throw new Error(t("account.billingUnavailable"));
      }
      window.location.assign(session.url);
    } catch (error) {
      setBillingError(error.message || t("account.billingUnavailable"));
      setIsBusy(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    setBillingError("");
    await reloadCapabilities();
    await loadBillingStatus();
    setIsRefreshing(false);
  }

  const planLabel = (() => {
    if (isAdministrator || capabilities?.accessTier === "administrator_unlimited") {
      return t("account.planAdministrator");
    }
    if (billingStatus?.plan === "subscriber" || capabilities?.accessTier === "subscriber") {
      return t("account.planSubscriber");
    }
    return t("account.planFree");
  })();

  const statusLabel = (() => {
    if (isAdministrator || capabilities?.accessTier === "administrator_unlimited") {
      return t("account.statusUnlimited");
    }
    const status = billingStatus?.status || "none";
    if (status === "active" && billingStatus?.cancelAtPeriodEnd) {
      return t("account.statusCancelAtPeriodEnd");
    }
    if (status === "active") {
      return t("account.statusActive");
    }
    if (status === "past_due") {
      return t("account.statusPastDue");
    }
    if (status === "canceled") {
      return t("account.statusCanceled");
    }
    if (status === "incomplete") {
      return t("account.statusIncomplete");
    }
    return t("account.statusNone");
  })();

  const periodEndLabel = formatPeriodEnd(billingStatus?.currentPeriodEnd, language);
  const showSubscribe =
    !isAdministrator && (billingStatus?.canCheckout ?? capabilities?.accessTier !== "subscriber");
  const showManage = !isAdministrator && Boolean(billingStatus?.canManage);

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
        <dl className="my-account-page__details">
          <div className="my-account-page__detail">
            <dt className="my-account-page__detail-label">{t("account.currentPlan")}</dt>
            <dd className="my-account-page__detail-value">{planLabel}</dd>
          </div>
          <div className="my-account-page__detail">
            <dt className="my-account-page__detail-label">{t("account.subscriptionStatus")}</dt>
            <dd className="my-account-page__detail-value">{statusLabel}</dd>
          </div>
          {periodEndLabel ? (
            <div className="my-account-page__detail">
              <dt className="my-account-page__detail-label">{t("account.currentPeriodEnd")}</dt>
              <dd className="my-account-page__detail-value">{periodEndLabel}</dd>
            </div>
          ) : null}
        </dl>
        {billingMessage ? (
          <p className="my-account-page__billing-message" role="status">
            {billingMessage}
          </p>
        ) : null}
        {billingError ? (
          <p className="my-account-page__billing-error" role="alert">
            {billingError}
          </p>
        ) : null}
        <div className="my-account-page__billing-actions">
          {showSubscribe ? (
            <button
              type="button"
              className="my-account-page__billing-button"
              onClick={handleSubscribe}
              disabled={isBusy || isRefreshing}
            >
              {t("account.subscribe")}
            </button>
          ) : null}
          {showManage ? (
            <button
              type="button"
              className="my-account-page__billing-button my-account-page__billing-button--secondary"
              onClick={handleManage}
              disabled={isBusy || isRefreshing}
            >
              {t("account.manageSubscription")}
            </button>
          ) : null}
          <button
            type="button"
            className="my-account-page__billing-button my-account-page__billing-button--secondary"
            onClick={handleRefresh}
            disabled={isBusy || isRefreshing}
          >
            {isRefreshing ? t("account.refreshing") : t("account.refreshStatus")}
          </button>
        </div>
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
