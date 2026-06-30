import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { mockAuthAdapter } from "./authAdapter.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children, authAdapter = mockAuthAdapter }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(authAdapter.restoreSession());
  }, [authAdapter]);

  const login = useCallback(
    (credentials = {}) => {
      const nextUser = authAdapter.login(credentials);
      setUser(nextUser);
    },
    [authAdapter],
  );

  const logout = useCallback(() => {
    authAdapter.logout();
    setUser(null);
  }, [authAdapter]);

  const value = useMemo(
    () => ({
      isAuthenticated: user !== null,
      user,
      login,
      logout,
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
