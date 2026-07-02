import { useAuth } from "../auth/useAuth.js";
import LockedModuleMessage from "./LockedModuleMessage.jsx";

export default function AuthRouteGuard({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LockedModuleMessage />;
  }

  return children;
}
