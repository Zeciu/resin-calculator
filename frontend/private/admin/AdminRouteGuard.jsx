import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { ROUTES } from "../workspace/routes.js";

export default function AdminRouteGuard({ children }) {
  const { isAuthenticated, isAdministrator } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !isAdministrator) {
    return <Navigate to={ROUTES.HOME} replace state={{ from: location.pathname }} />;
  }

  return children;
}
