import { useEffect, useState } from "react";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser } from "aws-amplify/auth";

// Rendered at /callback after the Cognito Hosted UI redirects back.
// Amplify automatically exchanges the authorization code for tokens on load.
// We listen for the auth Hub events to know when that completes, and also
// check the existing session in case the exchange finished before we mounted.
export default function AuthCallback({ onAuthenticated }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    let settled = false;

    const succeed = () => {
      if (settled) return;
      settled = true;
      onAuthenticated();
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      setError("We couldn't complete your sign-in. Please try again.");
    };

    const stopListening = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signInWithRedirect":
        case "signedIn":
          succeed();
          break;
        case "signInWithRedirect_failure":
          fail();
          break;
        default:
          break;
      }
    });

    // The token exchange may already be done by the time this mounts
    // (e.g. on a fast reload), so check the current session directly.
    getCurrentUser()
      .then(succeed)
      .catch(() => {
        // Not signed in yet — give the Hub-driven exchange a bounded window
        // to complete before showing an error so the user is never stuck.
        setTimeout(fail, 10000);
      });

    return () => stopListening();
  }, [onAuthenticated]);

  if (error) {
    return (
      <div className="auth-callback">
        <p className="error">{error}</p>
        <button onClick={() => window.location.replace("/")}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="auth-callback">
      <p>Signing you in…</p>
    </div>
  );
}
