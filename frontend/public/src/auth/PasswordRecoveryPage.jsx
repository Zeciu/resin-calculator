import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./useAuth.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "../workspace/routes.js";

export default function PasswordRecoveryPage() {
  const { t } = useI18n();
  const { initiatePasswordRecovery, confirmPasswordReset } = useAuth();
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [awaitingResetConfirmation, setAwaitingResetConfirmation] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetComplete, setResetComplete] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const email = String(new FormData(formElement).get("email") ?? "").trim();

    if (!email) {
      setEmailError(t("register.emailRequired"));
      setIsSubmitted(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t("register.emailInvalid"));
      setIsSubmitted(false);
      return;
    }

    setEmailError("");
    setFormError("");

    setIsSubmitting(true);
    try {
      await initiatePasswordRecovery({ email });
      setSubmittedEmail(email);
      setAwaitingResetConfirmation(true);
      setIsSubmitted(true);
      formElement.reset();
    } catch (recoveryError) {
      setFormError(
        recoveryError instanceof Error
          ? recoveryError.message
          : t("recovery.failed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetSubmit(event) {
    event.preventDefault();

    if (!confirmationCode.trim()) {
      setFormError(t("register.confirmCodeRequired"));
      return;
    }
    if (!newPassword) {
      setFormError(t("recovery.newPasswordRequired"));
      return;
    }
    if (newPassword.length < 8) {
      setFormError(t("register.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError(t("register.passwordMismatch"));
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      await confirmPasswordReset({
        email: submittedEmail,
        confirmationCode: confirmationCode.trim(),
        newPassword,
      });
      setResetComplete(true);
      setAwaitingResetConfirmation(false);
    } catch (resetError) {
      setFormError(
        resetError instanceof Error
          ? resetError.message
          : t("recovery.resetFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (resetComplete) {
    return (
      <section className="password-recovery-page">
        <h2 className="password-recovery-page__title">{t("recovery.updatedTitle")}</h2>
        <p className="password-recovery-page__confirmation" role="status">
          {t("recovery.updatedBody")}
        </p>
        <div className="password-recovery-page__links">
          <Link className="password-recovery-page__link" to={ROUTES.LOGIN}>
            {t("login.backToLogin")}
          </Link>
        </div>
      </section>
    );
  }

  if (awaitingResetConfirmation) {
    return (
      <section className="password-recovery-page">
        <h2 className="password-recovery-page__title">{t("recovery.title")}</h2>
        <p className="password-recovery-page__intro">
          {t("recovery.codeIntro", { email: submittedEmail })}
        </p>

        <form className="password-recovery-page__form" onSubmit={handleResetSubmit} noValidate>
          <label className="password-recovery-page__field">
            <span className="password-recovery-page__label">{t("register.confirmCode")}</span>
            <input
              className="password-recovery-page__input"
              type="text"
              name="confirmationCode"
              autoComplete="one-time-code"
              value={confirmationCode}
              onChange={(event) => setConfirmationCode(event.target.value)}
            />
          </label>

          <label className="password-recovery-page__field">
            <span className="password-recovery-page__label">{t("recovery.newPassword")}</span>
            <input
              className="password-recovery-page__input"
              type="password"
              name="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>

          <label className="password-recovery-page__field">
            <span className="password-recovery-page__label">{t("recovery.confirmNewPassword")}</span>
            <input
              className="password-recovery-page__input"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          {formError ? (
            <p className="password-recovery-page__error" role="alert">
              {formError}
            </p>
          ) : null}

          <button className="password-recovery-page__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("recovery.updating") : t("recovery.updatePassword")}
          </button>
        </form>

        <div className="password-recovery-page__links">
          <Link className="password-recovery-page__link" to={ROUTES.LOGIN}>
            {t("login.backToLogin")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="password-recovery-page">
      <h2 className="password-recovery-page__title">{t("recovery.title")}</h2>

      {isSubmitted ? (
        <p className="password-recovery-page__confirmation" role="status">
          {t("recovery.sent", { email: submittedEmail })}
        </p>
      ) : (
        <p className="password-recovery-page__intro">{t("recovery.intro")}</p>
      )}

      <form className="password-recovery-page__form" onSubmit={handleSubmit} noValidate>
        <label className="password-recovery-page__field">
          <span className="password-recovery-page__label">{t("register.email")}</span>
          <input
            className="password-recovery-page__input"
            type="email"
            name="email"
            autoComplete="email"
            aria-invalid={emailError ? "true" : undefined}
            aria-describedby={emailError ? "password-recovery-email-error" : undefined}
          />
          {emailError ? (
            <span
              className="password-recovery-page__error"
              id="password-recovery-email-error"
              role="alert"
            >
              {emailError}
            </span>
          ) : null}
        </label>

        {formError ? (
          <p className="password-recovery-page__error" role="alert">
            {formError}
          </p>
        ) : null}

        <button className="password-recovery-page__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("recovery.submitting") : t("recovery.submit")}
        </button>
      </form>

      <div className="password-recovery-page__links">
        <Link className="password-recovery-page__link" to={ROUTES.LOGIN}>
          {t("login.backToLogin")}
        </Link>
      </div>
    </section>
  );
}
