import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth.js";
import { ROUTES } from "../workspace/routes.js";

function credentialsFromLoginInput(value) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    return { email: trimmed, username: trimmed.split("@")[0] };
  }
  return { username: trimmed };
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  function handleSubmit(event) {
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
    login(credentialsFromLoginInput(username));
    navigate(ROUTES.PROJECTS, { replace: true });
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

        <button className="login-page__submit" type="submit">
          Log in
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
