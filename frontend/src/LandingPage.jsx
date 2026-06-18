import { useState } from "react";
import { signInWithRedirect } from "aws-amplify/auth";
import AppHeader from "./AppHeader";

// Amplify builds the full Hosted UI authorize URL (with PKCE code_challenge
// and state, both stored before this runs) and hands it to authSessionOpener
// instead of navigating itself. For sign-up we rewrite the /oauth2/authorize
// path to /signup, which accepts the same params and shows the sign-up screen.
// Because Amplify still owns the PKCE/state setup, the token exchange on the
// /callback return works identically to the normal login flow.
function makeAuthSessionOpener(toSignup) {
  return (url) => {
    const target = toSignup
      ? String(url).replace("/oauth2/authorize", "/signup")
      : String(url);
    window.location.href = target;
  };
}

export default function LandingPage() {
  const [error, setError] = useState("");

  const handleAuth = async (toSignup) => {
    setError("");
    try {
      await signInWithRedirect({
        options: { authSessionOpener: makeAuthSessionOpener(toSignup) },
      });
    } catch (err) {
      // Amplify throws if a session already exists — just enter the app.
      if (err?.name === "UserAlreadyAuthenticatedException") {
        window.location.assign("/");
        return;
      }
      console.error("Hosted UI start failed:", err);
      setError(err?.message || "Could not start sign-in. Please try again.");
    }
  };

  return (
    <div className="container">
      <AppHeader />

      <div className="landing-body">
        <section className="landing-features">
          <h2>What it does</h2>
          <ul>
            <li>Upload a top-down photo of your project</li>
            <li>Draw the mold boundary and wood islands on the photo</li>
            <li>Add real-world reference measurements for accurate scaling</li>
            <li>Get precise resin volume estimates with a 10% safety margin</li>
            <li>Plan pour layers based on resin manufacturer limits</li>
            <li>Export a full PDF report for each project</li>
          </ul>
        </section>

        <div className="landing-actions">
          <button className="primary-action landing-btn" onClick={() => handleAuth(false)}>
            Log In
          </button>
          <button className="secondary-action landing-btn" onClick={() => handleAuth(true)}>
            Sign Up
          </button>
        </div>
        {error && <p className="error landing-error">{error}</p>}
      </div>
    </div>
  );
}
