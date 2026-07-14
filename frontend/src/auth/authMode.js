export function resolveAuthMode() {
  const mode = import.meta.env.VITE_AUTH_MODE;
  if (typeof mode === "string" && mode.trim().toLowerCase() === "cognito") {
    return "cognito";
  }
  return "mock";
}

export function isMockAuthMode() {
  return resolveAuthMode() === "mock";
}

export function isCognitoAuthMode() {
  return resolveAuthMode() === "cognito";
}

export function assertProductionAuthConfig() {
  if (import.meta.env.PROD && isMockAuthMode()) {
    throw new Error(
      "Production build requires VITE_AUTH_MODE=cognito. Mock authentication is not permitted in production.",
    );
  }
}
