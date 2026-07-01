import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { ROUTES } from "../workspace/routes.js";
import { useWorkspaceNavigation } from "../workspace/useWorkspaceNavigation.js";

function displayValue(value) {
  return value && String(value).trim() ? String(value).trim() : "—";
}

export default function MyAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { clearLockedModuleMessage } = useWorkspaceNavigation();

  function handleLogout() {
    logout();
    clearLockedModuleMessage();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <section className="my-account-page">
      <h2 className="my-account-page__title">My Account</h2>

      <section className="my-account-page__section" aria-labelledby="my-account-profile-heading">
        <h3 className="my-account-page__section-title" id="my-account-profile-heading">
          Profile
        </h3>
        <dl className="my-account-page__details">
          <div className="my-account-page__detail">
            <dt className="my-account-page__detail-label">Username</dt>
            <dd className="my-account-page__detail-value">{displayValue(user?.username)}</dd>
          </div>
          <div className="my-account-page__detail">
            <dt className="my-account-page__detail-label">Email</dt>
            <dd className="my-account-page__detail-value">{displayValue(user?.email)}</dd>
          </div>
        </dl>
      </section>

      <section
        className="my-account-page__section"
        aria-labelledby="my-account-subscription-heading"
      >
        <h3 className="my-account-page__section-title" id="my-account-subscription-heading">
          Subscription
        </h3>
        <p className="my-account-page__placeholder">
          Free plan — billing and subscription management will be added in a later phase.
        </p>
      </section>

      <section className="my-account-page__section" aria-labelledby="my-account-settings-heading">
        <h3 className="my-account-page__section-title" id="my-account-settings-heading">
          Settings
        </h3>
        <ul className="my-account-page__settings-list">
          <li className="my-account-page__settings-item">Account preferences (coming soon)</li>
          <li className="my-account-page__settings-item">Notification settings (coming soon)</li>
        </ul>
      </section>

      <button className="my-account-page__logout" type="button" onClick={handleLogout}>
        Log out
      </button>
    </section>
  );
}
