import { useEffect, useState } from "react";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser } from "aws-amplify/auth";
import { useAuth } from "./auth/useAuth.js";

// Rendered at /callback after a Cognito OAuth redirect completes.
// Amplify exchanges the authorization code for tokens on load.
export default function AuthCallback({ onAuthenticated }) {
  const { refreshSession } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    let settled = false;

    const succeed = async () => {
      if (settled) return;
      settled = true;
      await refreshSession();
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
          void succeed();
          break;
        case "signInWithRedirect_failure":
          fail();
          break;
        default:
          break;
      }
    });

    getCurrentUser()
      .then(() => {
        void succeed();
      })
      .catch(() => {
        setTimeout(fail, 10000);
      });

    return () => stopListening();
  }, [onAuthenticated, refreshSession]);

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
