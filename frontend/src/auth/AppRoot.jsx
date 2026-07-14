import { Outlet, useNavigate } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext.jsx";
import AuthCallback from "../AuthCallback.jsx";

function AuthCallbackRoute() {
  const navigate = useNavigate();

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
