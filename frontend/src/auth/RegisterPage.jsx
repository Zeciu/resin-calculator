import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth.js";
import { ROUTES } from "../workspace/routes.js";

const INITIAL_ERRORS = {
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
};

function validateRegistration(formData) {
  const errors = { ...INITIAL_ERRORS };
  const email = String(formData.get("email") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!username) {
    errors.username = "Username is required.";
  } else if (username.length < 2) {
    errors.username = "Username must be at least 2 characters.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

function hasValidationErrors(errors) {
  return Object.values(errors).some((message) => message.length > 0);
}

export default function RegisterPage() {
  const { login, register, confirmRegistration } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = validateRegistration(formData);
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
        event.currentTarget.reset();
        setErrors(INITIAL_ERRORS);
        return;
      }

      await login({ email, username, password });
      event.currentTarget.reset();
      setErrors(INITIAL_ERRORS);
      navigate(ROUTES.HOME, { replace: true });
    } catch (registerError) {
      setFormError(
        registerError instanceof Error
          ? registerError.message
          : "Registration failed. Please try again.",
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
      setFormError("Confirmation code is required.");
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
        confirmError instanceof Error
          ? confirmError.message
          : "Account confirmation failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (pendingConfirmation) {
    return (
      <section className="register-page">
        <h2 className="register-page__title">Confirm your HFZWood account</h2>
        <p className="register-page__intro">
          Enter the confirmation code sent to <strong>{pendingConfirmation.email}</strong>.
        </p>

        <form className="register-page__form" onSubmit={handleConfirmSubmit} noValidate>
          <label className="register-page__field">
            <span className="register-page__label">Confirmation code</span>
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
            {isSubmitting ? "Confirming…" : "Confirm account"}
          </button>
        </form>

        <div className="register-page__links">
          <Link className="register-page__link" to={ROUTES.LOGIN}>
            Already confirmed? Log in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="register-page">
      <h2 className="register-page__title">Create your HFZWood account</h2>

      <form className="register-page__form" onSubmit={handleSubmit} noValidate>
        <label className="register-page__field">
          <span className="register-page__label">Email</span>
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
          <span className="register-page__label">Username</span>
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
          <span className="register-page__label">Password</span>
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
          <span className="register-page__label">Confirm password</span>
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="register-page__links">
        <Link className="register-page__link" to={ROUTES.LOGIN}>
          Already have an account? Log in
        </Link>
      </div>
    </section>
  );
}
