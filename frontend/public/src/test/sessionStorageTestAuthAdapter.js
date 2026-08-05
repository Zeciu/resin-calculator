// Test-only auth adapter. Production always uses cognitoAuthAdapter
// (frontend/public/src/auth/cognitoAuthAdapter.js); this module is never
// imported outside test files/test helpers.
//
// Component tests need to simulate an authenticated session without making
// real aws-amplify/auth network calls (Cognito hosted UI, JWT verification,
// etc. are exercised separately by cognitoAuthAdapter.test.js). This adapter
// implements the same authAdapter contract AuthContext.jsx expects
// (restoreSession/login/register/logout/...), synchronously, backed by a
// sessionStorage key tests can also seed/inspect directly for "already
// logged in" or "logged out" setup.
const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}

function writeStoredUser(user) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user }));
}

function clearStoredUser() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

function resolveUsername(credentials = {}) {
  if (typeof credentials.username === "string" && credentials.username.trim()) {
    return credentials.username.trim();
  }
  if (typeof credentials.email === "string" && credentials.email.trim()) {
    return credentials.email.split("@")[0];
  }
  return "user";
}

export const sessionStorageTestAuthAdapter = {
  restoreSession() {
    return readStoredUser();
  },

  login(credentials = {}) {
    const user = {
      id: typeof credentials.id === "string" && credentials.id.trim() ? credentials.id.trim() : "stub-user",
      email: typeof credentials.email === "string" ? credentials.email.trim() : "",
      username: resolveUsername(credentials),
      role: "user",
    };
    writeStoredUser(user);
    return user;
  },

  register(credentials = {}) {
    return this.login(credentials);
  },

  confirmRegistration({ email } = {}) {
    return { confirmed: true, email: typeof email === "string" ? email : "" };
  },

  initiatePasswordRecovery({ email } = {}) {
    return { codeSent: true, email: typeof email === "string" ? email : "" };
  },

  confirmPasswordReset({ email } = {}) {
    return { completed: true, email: typeof email === "string" ? email : "" };
  },

  logout() {
    clearStoredUser();
  },
};
