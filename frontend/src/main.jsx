import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { getCurrentUser } from "aws-amplify/auth";
import amplifyConfig from "./amplify-config.js";
import App from "./App";
import LandingPage from "./LandingPage";
import AuthCallback from "./AuthCallback";
import WorkspaceRouter, { isWorkspacePath } from "./workspace/WorkspaceRouter.jsx";
import "./styles.css";

Amplify.configure(amplifyConfig);

function Root() {
  const location = useLocation();
  // "loading" | "authenticated" | "unauthenticated"
  const [authState, setAuthState] = useState("loading");

  const isCallback = location.pathname === "/callback";

  useEffect(() => {
    if (isCallback) return;
    getCurrentUser()
      .then(() => setAuthState("authenticated"))
      .catch(() => setAuthState("unauthenticated"));
  }, [isCallback]);

  if (isCallback) {
    return (
      <AuthCallback
        onAuthenticated={() => {
          window.history.replaceState({}, "", "/");
          setAuthState("authenticated");
        }}
      />
    );
  }

  if (authState === "loading") return null;

  if (isWorkspacePath(location.pathname)) {
    return <WorkspaceRouter />;
  }

  if (authState === "unauthenticated") return <LandingPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);
