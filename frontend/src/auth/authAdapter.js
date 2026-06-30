const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

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

export const mockAuthAdapter = {
  restoreSession() {
    return readStoredSession();
  },

  login(credentials = {}) {
    const user = buildStubUser(credentials);
    writeStoredSession(user);
    return user;
  },

  logout() {
    writeStoredSession(null);
  },
};

export const cognitoAuthAdapter = {
  restoreSession() {
    return null;
  },

  login() {
    return Promise.reject(
      new Error("Cognito authentication is not enabled in Phase 1"),
    );
  },

  logout() {
    // Stub only — Cognito wiring deferred to a later phase.
  },
};
