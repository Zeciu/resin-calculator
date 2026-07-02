import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import amplifyConfig from "./amplify-config.js";
import AuthCallback from "./AuthCallback";
import WorkspaceRouter from "./workspace/WorkspaceRouter.jsx";
import "./styles.css";

Amplify.configure(amplifyConfig);

const router = createBrowserRouter([
  {
    path: "/callback",
    element: (
      <AuthCallback
        onAuthenticated={() => {
          window.history.replaceState({}, "", "/");
        }}
      />
    ),
  },
  {
    path: "/*",
    element: <WorkspaceRouter />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
