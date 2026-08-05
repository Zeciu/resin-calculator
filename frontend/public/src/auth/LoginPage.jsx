import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth.js";
import { isCognitoAuthMode } from "./authMode.js";
import { ROUTES } from "../workspace/routes.js";

function credentialsFromLoginInput(value) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    return { email: trimmed, username: trimmed.split("@")[0] };
  }
  return { username: trimmed };
}

export default function LoginPage() {
  const { login, confirmRegistration } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!username) {
      setError("Email or username is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await login({ ...credentialsFromLoginInput(username), password });
      setPendingConfirmationEmail("");
      navigate(ROUTES.HOME, { replace: true });
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : "Sign-in failed. Please try again.";
      if (
        isCognitoAuthMode() &&
        loginError?.code === "UserNotConfirmedException" &&
        username.includes("@")
      ) {
        setPendingConfirmationEmail(username);
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmSubmit(event) {
    event.preventDefault();
    if (!pendingConfirmationEmail) {
      return;
    }

    if (!confirmationCode.trim()) {
      setError("Confirmation code is required.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await confirmRegistration({
        email: pendingConfirmationEmail,
        confirmationCode: confirmationCode.trim(),
      });
      setPendingConfirmationEmail("");
      setConfirmationCode("");
      setError("");
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { confirmationComplete: true },
      });
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Account confirmation failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (pendingConfirmationEmail) {
    return (
      <section className="login-page">
        <h2 className="login-page__title">Confirm your HFZWood account</h2>
        <p className="login-page__intro">
          Enter the confirmation code sent to <strong>{pendingConfirmationEmail}</strong>.
        </p>

        <form className="login-page__form" onSubmit={handleConfirmSubmit} noValidate>
          <label className="login-page__field">
            <span className="login-page__label">Confirmation code</span>
            <input
              className="login-page__input"
              type="text"
              name="confirmationCode"
              autoComplete="one-time-code"
              value={confirmationCode}
              onChange={(event) => setConfirmationCode(event.target.value)}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "login-confirm-error" : undefined}
            />
          </label>

          {error ? (
            <p className="login-page__error" id="login-confirm-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="login-page__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Confirming…" : "Confirm account"}
          </button>
        </form>

        <div className="login-page__links">
          <Link className="login-page__link" to={ROUTES.LOGIN}>
            Back to Log in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="login-page">
      <h2 className="login-page__title">Log in to HFZWood</h2>

      <form className="login-page__form" onSubmit={handleSubmit} noValidate>
        <label className="login-page__field">
          <span className="login-page__label">Email or username</span>
          <input
            className="login-page__input"
            type="text"
            name="username"
            autoComplete="username"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "login-form-error" : undefined}
          />
        </label>

        <label className="login-page__field">
          <span className="login-page__label">Password</span>
          <input
            className="login-page__input"
            type="password"
            name="password"
            autoComplete="current-password"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "login-form-error" : undefined}
          />
        </label>

        {error ? (
          <p className="login-page__error" id="login-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="login-page__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Log in"}
        </button>
      </form>

      <div className="login-page__links">
        <Link className="login-page__link" to={ROUTES.REGISTER}>
          Create an account
        </Link>
        <Link className="login-page__link" to={ROUTES.PASSWORD_RECOVERY}>
          Forgot your password?
        </Link>
      </div>
    </section>
  );
}
