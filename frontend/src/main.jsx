import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { Amplify } from "aws-amplify";
import amplifyConfig from "./amplify-config.js";
import AuthCallback from "./AuthCallback";
import WorkspaceRouter from "./workspace/WorkspaceRouter.jsx";
import "./styles.css";

Amplify.configure(amplifyConfig);

function Root() {
  const location = useLocation();
  const isCallback = location.pathname === "/callback";

  if (isCallback) {
    return (
      <AuthCallback
        onAuthenticated={() => {
          window.history.replaceState({}, "", "/");
        }}
      />
    );
  }

  return <WorkspaceRouter />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);
