import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { mockAuthAdapter, resolveAuthAdapter } from "./authAdapter.js";

export const AuthContext = createContext(null);

function readInitialSession(authAdapter) {
  const result = authAdapter.restoreSession();
  if (result instanceof Promise) {
    return { user: null, isLoading: true };
  }
  return { user: result, isLoading: false };
}

async function resolveAdapterResult(result) {
  return result instanceof Promise ? result : result;
}

export function AuthProvider({ children, authAdapter = resolveAuthAdapter() }) {
  const [{ user, isLoading }, setAuthState] = useState(() => readInitialSession(authAdapter));

  useEffect(() => {
    const result = authAdapter.restoreSession();
    if (!(result instanceof Promise)) {
      return;
    }

    let cancelled = false;
    result
      .then((restoredUser) => {
        if (!cancelled) {
          setAuthState({ user: restoredUser, isLoading: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthState({ user: null, isLoading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authAdapter]);

  const refreshSession = useCallback(async () => {
    try {
      const restoredUser = await resolveAdapterResult(authAdapter.restoreSession());
      setAuthState({ user: restoredUser, isLoading: false });
      return restoredUser;
    } catch {
      setAuthState({ user: null, isLoading: false });
      return null;
    }
  }, [authAdapter]);

  const login = useCallback(
    async (credentials = {}) => {
      const nextUser = await resolveAdapterResult(authAdapter.login(credentials));
      setAuthState((current) => ({ ...current, user: nextUser }));
      return nextUser;
    },
    [authAdapter],
  );

  const register = useCallback(
    async (credentials = {}) => {
      if (typeof authAdapter.register !== "function") {
        return login(credentials);
      }
      return resolveAdapterResult(authAdapter.register(credentials));
    },
    [authAdapter, login],
  );

  const confirmRegistration = useCallback(
    async (payload = {}) => {
      if (typeof authAdapter.confirmRegistration !== "function") {
        return { confirmed: true };
      }
      return resolveAdapterResult(authAdapter.confirmRegistration(payload));
    },
    [authAdapter],
  );

  const initiatePasswordRecovery = useCallback(
    async (payload = {}) => {
      if (typeof authAdapter.initiatePasswordRecovery !== "function") {
        return { codeSent: true };
      }
      return resolveAdapterResult(authAdapter.initiatePasswordRecovery(payload));
    },
    [authAdapter],
  );

  const confirmPasswordReset = useCallback(
    async (payload = {}) => {
      if (typeof authAdapter.confirmPasswordReset !== "function") {
        return { completed: true };
      }
      return resolveAdapterResult(authAdapter.confirmPasswordReset(payload));
    },
    [authAdapter],
  );

  const logout = useCallback(async () => {
    await resolveAdapterResult(authAdapter.logout());
    setAuthState({ user: null, isLoading: false });
  }, [authAdapter]);

  const value = useMemo(
    () => ({
      isAuthenticated: user !== null,
      isAdministrator: user?.role === "administrator",
      isLoading,
      user,
      login,
      register,
      confirmRegistration,
      initiatePasswordRecovery,
      confirmPasswordReset,
      refreshSession,
      logout,
    }),
    [
      user,
      isLoading,
      login,
      register,
      confirmRegistration,
      initiatePasswordRecovery,
      confirmPasswordReset,
      refreshSession,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProviderForTests({ children, authAdapter = mockAuthAdapter }) {
  return <AuthProvider authAdapter={authAdapter}>{children}</AuthProvider>;
}
