import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { ROUTES } from "../workspace/routes.js";

const INITIAL_ERRORS = {
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
};

function validateRegistration(formData, t) {
  const errors = { ...INITIAL_ERRORS };
  const email = String(formData.get("email") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email) {
    errors.email = t("register.emailRequired");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = t("register.emailInvalid");
  }

  if (!username) {
    errors.username = t("register.usernameRequired");
  } else if (username.length < 2) {
    errors.username = t("register.usernameTooShort");
  }

  if (!password) {
    errors.password = t("register.passwordRequired");
  } else if (password.length < 8) {
    errors.password = t("register.passwordTooShort");
  }

  if (!confirmPassword) {
    errors.confirmPassword = t("register.confirmPasswordRequired");
  } else if (password !== confirmPassword) {
    errors.confirmPassword = t("register.passwordMismatch");
  }

  return errors;
}

function hasValidationErrors(errors) {
  return Object.values(errors).some((message) => message.length > 0);
}

export default function RegisterPage() {
  const { t } = useI18n();
  const { login, register, confirmRegistration } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const nextErrors = validateRegistration(formData, t);
    setErrors(nextErrors);
    setFormError("");

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    const email = String(formData.get("email") ?? "").trim();
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);
    try {
      const result = await register({ email, username, password });
      if (result?.needsConfirmation) {
        setPendingConfirmation({ email: result.email ?? email });
        formElement.reset();
        setErrors(INITIAL_ERRORS);
        return;
      }

      await login({ email, username, password });
      formElement.reset();
      setErrors(INITIAL_ERRORS);
      navigate(ROUTES.HOME, { replace: true });
    } catch (registerError) {
      setFormError(
        registerError instanceof Error ? registerError.message : t("register.failed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmSubmit(event) {
    event.preventDefault();
    if (!pendingConfirmation?.email) {
      return;
    }

    if (!confirmationCode.trim()) {
      setFormError(t("register.confirmCodeRequired"));
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      await confirmRegistration({
        email: pendingConfirmation.email,
        confirmationCode: confirmationCode.trim(),
      });
      setPendingConfirmation(null);
      setConfirmationCode("");
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { confirmationComplete: true },
      });
    } catch (confirmError) {
      setFormError(
        confirmError instanceof Error ? confirmError.message : t("register.confirmFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (pendingConfirmation) {
    return (
      <section className="register-page">
        <h2 className="register-page__title">{t("register.confirmTitle")}</h2>
        <p className="register-page__intro">
          {t("register.confirmIntro", { email: pendingConfirmation.email })}
        </p>

        <form className="register-page__form" onSubmit={handleConfirmSubmit} noValidate>
          <label className="register-page__field">
            <span className="register-page__label">{t("register.confirmCode")}</span>
            <input
              className="register-page__input"
              type="text"
              name="confirmationCode"
              autoComplete="one-time-code"
              value={confirmationCode}
              onChange={(event) => setConfirmationCode(event.target.value)}
              aria-invalid={formError ? "true" : undefined}
              aria-describedby={formError ? "register-confirm-error" : undefined}
            />
          </label>

          {formError ? (
            <p className="register-page__error" id="register-confirm-error" role="alert">
              {formError}
            </p>
          ) : null}

          <button className="register-page__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("register.confirming") : t("register.confirmSubmit")}
          </button>
        </form>

        <div className="register-page__links">
          <Link className="register-page__link" to={ROUTES.LOGIN}>
            {t("register.alreadyConfirmed")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="register-page">
      <h2 className="register-page__title">{t("register.title")}</h2>
      <div className="register-page__pricing">
        <p className="register-page__hint">{t("register.comparePlansLead")}</p>
        <Link className="register-page__secondary" to={ROUTES.PRICING}>
          {t("preview.viewPlans")}
        </Link>
      </div>

      <form className="register-page__form" onSubmit={handleSubmit} noValidate>
        <label className="register-page__field">
          <span className="register-page__label">{t("register.email")}</span>
          <input
            className="register-page__input"
            type="email"
            name="email"
            autoComplete="email"
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? "register-email-error" : undefined}
          />
          {errors.email ? (
            <span className="register-page__error" id="register-email-error" role="alert">
              {errors.email}
            </span>
          ) : null}
        </label>

        <label className="register-page__field">
          <span className="register-page__label">{t("register.username")}</span>
          <input
            className="register-page__input"
            type="text"
            name="username"
            autoComplete="username"
            aria-invalid={errors.username ? "true" : undefined}
            aria-describedby={errors.username ? "register-username-error" : undefined}
          />
          {errors.username ? (
            <span
              className="register-page__error"
              id="register-username-error"
              role="alert"
            >
              {errors.username}
            </span>
          ) : null}
        </label>

        <label className="register-page__field">
          <span className="register-page__label">{t("register.password")}</span>
          <input
            className="register-page__input"
            type="password"
            name="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? "true" : undefined}
            aria-describedby={errors.password ? "register-password-error" : undefined}
          />
          {errors.password ? (
            <span
              className="register-page__error"
              id="register-password-error"
              role="alert"
            >
              {errors.password}
            </span>
          ) : null}
        </label>

        <label className="register-page__field">
          <span className="register-page__label">{t("register.confirmPassword")}</span>
          <input
            className="register-page__input"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            aria-invalid={errors.confirmPassword ? "true" : undefined}
            aria-describedby={
              errors.confirmPassword ? "register-confirm-password-error" : undefined
            }
          />
          {errors.confirmPassword ? (
            <span
              className="register-page__error"
              id="register-confirm-password-error"
              role="alert"
            >
              {errors.confirmPassword}
            </span>
          ) : null}
        </label>

        {formError ? (
          <p className="register-page__error" role="alert">
            {formError}
          </p>
        ) : null}

        <button className="register-page__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("register.submitting") : t("register.submit")}
        </button>
      </form>

      <div className="register-page__links">
        <Link className="register-page__link" to={ROUTES.LOGIN}>
          {t("register.alreadyHaveAccount")} {t("register.logIn")}
        </Link>
      </div>
    </section>
  );
}
