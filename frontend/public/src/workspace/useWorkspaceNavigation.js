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
  const [lockedModuleId, setLockedModuleId] = useState(null);

  useEffect(() => {
    setLockedModuleId(null);
  }, [location.pathname]);

  const showLockedModuleMessage = useCallback((itemId) => {
    setLockedModuleId(itemId ?? null);
  }, []);

  const clearLockedModuleMessage = useCallback(() => {
    setLockedModuleId(null);
  }, []);

  const handleNavItemClick = useCallback(
    (item, event) => {
      if (isNavItemLocked(item, isAuthenticated)) {
        event.preventDefault();
        setLockedModuleId(item.id);
        return;
      }
      setLockedModuleId(null);
    },
    [isAuthenticated],
  );

  const showLockedMessage = Boolean(lockedModuleId);

  const value = useMemo(
    () => ({
      isAuthenticated,
      lockedModuleId,
      showLockedMessage,
      isNavItemLocked: (item) => isNavItemLocked(item, isAuthenticated),
      showLockedModuleMessage,
      clearLockedModuleMessage,
      handleNavItemClick,
    }),
    [
      isAuthenticated,
      lockedModuleId,
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
