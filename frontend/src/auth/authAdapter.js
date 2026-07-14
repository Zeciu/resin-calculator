import { isCognitoAuthMode } from "./authMode.js";
import { cognitoAuthAdapter } from "./cognitoAuthAdapter.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function readStoredSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user || typeof parsed.user !== "object") return null;
    return {
      ...parsed.user,
      role: isMockAdminEnabled() ? "administrator" : normalizeRole(parsed.user.role),
    };
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

const VALID_ROLES = new Set(["administrator", "user"]);

function isMockAdminEnabled() {
  const value = import.meta.env.VITE_MOCK_ADMIN;
  if (value === true) {
    return true;
  }
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

function normalizeRole(role) {
  return VALID_ROLES.has(role) ? role : "user";
}

function resolveRole(credentials = {}) {
  if (isMockAdminEnabled()) {
    return "administrator";
  }

  if (VALID_ROLES.has(credentials.role)) {
    return credentials.role;
  }

  return "user";
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
    id:
      typeof credentials.id === "string" && credentials.id.trim()
        ? credentials.id.trim()
        : "stub-user",
    email,
    username,
    role: resolveRole(credentials),
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

  register(credentials = {}) {
    return this.login(credentials);
  },

  confirmRegistration() {
    return { confirmed: true };
  },

  initiatePasswordRecovery() {
    return { codeSent: true };
  },

  confirmPasswordReset() {
    return { completed: true };
  },

  logout() {
    writeStoredSession(null);
  },
};

export { cognitoAuthAdapter };

export function resolveAuthAdapter() {
  return isCognitoAuthMode() ? cognitoAuthAdapter : mockAuthAdapter;
}
