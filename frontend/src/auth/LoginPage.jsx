import { Link } from "react-router-dom";
import { ROUTES } from "../workspace/routes.js";

export default function LoginPage() {
  function handleSubmit(event) {
    event.preventDefault();
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
          />
        </label>

        <label className="login-page__field">
          <span className="login-page__label">Password</span>
          <input
            className="login-page__input"
            type="password"
            name="password"
            autoComplete="current-password"
          />
        </label>

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
