import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../workspace/routes.js";

export default function PasswordRecoveryPage() {
  const [emailError, setEmailError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

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
    setSubmittedEmail(email);
    setIsSubmitted(true);
    event.currentTarget.reset();
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

        <button className="password-recovery-page__submit" type="submit">
          Send recovery instructions
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
