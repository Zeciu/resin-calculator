import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext.jsx";
import AuthCallback from "../AuthCallback.jsx";
import {
  applyDocumentHead,
  resolveDocumentHeadState,
} from "../website/documentMetadata.js";
import { ROUTES } from "../workspace/routes.js";

function AuthCallbackRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    applyDocumentHead(resolveDocumentHeadState(ROUTES.CALLBACK, () => "HFZWood"));
  }, []);

  return (
    <AuthCallback
      onAuthenticated={() => {
        navigate("/", { replace: true });
      }}
    />
  );
}

export function AppRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export { AuthCallbackRoute };
