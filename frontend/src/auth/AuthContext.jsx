import { createContext, useCallback, useEffect, useMemo, useState } from "react";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

export const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user || typeof parsed.user !== "object") return null;
    return parsed.user;
  } catch {
    return null;
  }
}

function writeStoredSession(user) {
  if (user) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user }));
  } else {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

function buildStubUser(credentials = {}) {
  const email =
    typeof credentials.email === "string" && credentials.email.trim()
      ? credentials.email.trim()
      : "guest@example.com";
  const username =
    typeof credentials.username === "string" && credentials.username.trim()
      ? credentials.username.trim()
      : email.split("@")[0];

  return {
    id: "stub-user",
    email,
    username,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(readStoredSession());
  }, []);

  const login = useCallback((credentials = {}) => {
    const nextUser = buildStubUser(credentials);
    setUser(nextUser);
    writeStoredSession(nextUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    writeStoredSession(null);
  }, []);

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
