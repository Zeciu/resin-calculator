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
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState(INITIAL_ERRORS);

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = validateRegistration(formData);
    setErrors(nextErrors);

    if (!hasValidationErrors(nextErrors)) {
      const email = String(formData.get("email") ?? "").trim();
      const username = String(formData.get("username") ?? "").trim();
      login({ email, username });
      event.currentTarget.reset();
      setErrors(INITIAL_ERRORS);
      navigate(ROUTES.PROJECTS, { replace: true });
    }
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

        <button className="register-page__submit" type="submit">
          Create account
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
