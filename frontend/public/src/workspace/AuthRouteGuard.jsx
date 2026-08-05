import { useAuth } from "../auth/useAuth.js";
import LockedModuleMessage from "./LockedModuleMessage.jsx";

export default function AuthRouteGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <LockedModuleMessage />;
  }

  return children;
}
