import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

const WorkspaceNavigationContext = createContext(null);

export function isNavItemLocked(item, isAuthenticated) {
  return item.requiresAuth && !isAuthenticated;
}

export function WorkspaceNavigationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [showLockedMessage, setShowLockedMessage] = useState(false);

  useEffect(() => {
    setShowLockedMessage(false);
  }, [location.pathname]);

  const showLockedModuleMessage = useCallback(() => {
    setShowLockedMessage(true);
  }, []);

  const clearLockedModuleMessage = useCallback(() => {
    setShowLockedMessage(false);
  }, []);

  const handleNavItemClick = useCallback(
    (item, event) => {
      if (isNavItemLocked(item, isAuthenticated)) {
        event.preventDefault();
        setShowLockedMessage(true);
        return;
      }
      setShowLockedMessage(false);
    },
    [isAuthenticated],
  );

  const value = useMemo(
    () => ({
      isAuthenticated,
      showLockedMessage,
      isNavItemLocked: (item) => isNavItemLocked(item, isAuthenticated),
      showLockedModuleMessage,
      clearLockedModuleMessage,
      handleNavItemClick,
    }),
    [
      isAuthenticated,
      showLockedMessage,
      showLockedModuleMessage,
      clearLockedModuleMessage,
      handleNavItemClick,
    ],
  );

  return createElement(WorkspaceNavigationContext.Provider, { value }, children);
}

export function useWorkspaceNavigation() {
  const context = useContext(WorkspaceNavigationContext);
  if (!context) {
    throw new Error(
      "useWorkspaceNavigation must be used within WorkspaceNavigationProvider",
    );
  }
  return context;
}
