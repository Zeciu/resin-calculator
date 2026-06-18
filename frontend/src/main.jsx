import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import { getCurrentUser } from "aws-amplify/auth";
import amplifyConfig from "./amplify-config.js";
import App from "./App";
import LandingPage from "./LandingPage";
import AuthCallback from "./AuthCallback";
import "./styles.css";

Amplify.configure(amplifyConfig);

function Root() {
  // "loading" | "authenticated" | "unauthenticated"
  const [authState, setAuthState] = useState("loading");

  const isCallback = window.location.pathname === "/callback";

  useEffect(() => {
    if (isCallback) return; // AuthCallback handles its own check
    getCurrentUser()
      .then(() => setAuthState("authenticated"))
      .catch(() => setAuthState("unauthenticated"));
  }, [isCallback]);

  if (isCallback) {
    return <AuthCallback onAuthenticated={() => {
      window.history.replaceState({}, "", "/");
      setAuthState("authenticated");
    }} />;
  }

  if (authState === "loading") return null;
  if (authState === "unauthenticated") return <LandingPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
