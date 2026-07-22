import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./useAuth.js";
import { isMockAuthMode } from "./authMode.js";
import { ROUTES } from "../workspace/routes.js";

export default function PasswordRecoveryPage() {
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
      setEmailError("Email is required.");
      setIsSubmitted(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      setIsSubmitted(false);
      return;
    }

    setEmailError("");
    setFormError("");

    if (isMockAuthMode()) {
      setSubmittedEmail(email);
      setIsSubmitted(true);
      formElement.reset();
      return;
    }

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
          : "Password recovery could not be started. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetSubmit(event) {
    event.preventDefault();

    if (!confirmationCode.trim()) {
      setFormError("Confirmation code is required.");
      return;
    }
    if (!newPassword) {
      setFormError("New password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
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
          : "Password reset failed. Check the code and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (resetComplete) {
    return (
      <section className="password-recovery-page">
        <h2 className="password-recovery-page__title">Password updated</h2>
        <p className="password-recovery-page__confirmation" role="status">
          Your password has been reset. You can now log in with your new password.
        </p>
        <div className="password-recovery-page__links">
          <Link className="password-recovery-page__link" to={ROUTES.LOGIN}>
            Back to Log in
          </Link>
        </div>
      </section>
    );
  }

  if (awaitingResetConfirmation) {
    return (
      <section className="password-recovery-page">
        <h2 className="password-recovery-page__title">Reset your password</h2>
        <p className="password-recovery-page__intro">
          Enter the confirmation code sent to <strong>{submittedEmail}</strong> and choose a new
          password.
        </p>

        <form className="password-recovery-page__form" onSubmit={handleResetSubmit} noValidate>
          <label className="password-recovery-page__field">
            <span className="password-recovery-page__label">Confirmation code</span>
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
            <span className="password-recovery-page__label">New password</span>
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
            <span className="password-recovery-page__label">Confirm new password</span>
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
            {isSubmitting ? "Updating password…" : "Update password"}
          </button>
        </form>

        <div className="password-recovery-page__links">
          <Link className="password-recovery-page__link" to={ROUTES.LOGIN}>
            Back to Log in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="password-recovery-page">
      <h2 className="password-recovery-page__title">Reset your password</h2>

      {isSubmitted ? (
        <p className="password-recovery-page__confirmation" role="status">
          If an account exists for <strong>{submittedEmail}</strong>, you will receive
          password recovery instructions shortly.
        </p>
      ) : (
        <p className="password-recovery-page__intro">
          Enter the email address associated with your account and we will send you
          instructions to reset your password.
        </p>
      )}

      <form className="password-recovery-page__form" onSubmit={handleSubmit} noValidate>
        <label className="password-recovery-page__field">
          <span className="password-recovery-page__label">Email</span>
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
          {isSubmitting ? "Sending…" : "Send recovery instructions"}
        </button>
      </form>

      <div className="password-recovery-page__links">
        <Link className="password-recovery-page__link" to={ROUTES.LOGIN}>
          Back to Log in
        </Link>
      </div>
    </section>
  );
}
