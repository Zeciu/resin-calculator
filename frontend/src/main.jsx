import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import amplifyConfig from "./amplify-config.js";
import { AppRoot, AuthCallbackRoute } from "./auth/AppRoot.jsx";
import { assertProductionAuthConfig } from "./auth/authMode.js";
import WorkspaceRouter from "./workspace/WorkspaceRouter.jsx";
import "./styles.css";

assertProductionAuthConfig();
Amplify.configure(amplifyConfig);

const router = createBrowserRouter([
  {
    element: <AppRoot />,
    children: [
      {
        path: "/callback",
        element: <AuthCallbackRoute />,
      },
      {
        path: "/*",
        element: <WorkspaceRouter />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
