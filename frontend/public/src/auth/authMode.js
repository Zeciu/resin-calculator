export function resolveAuthMode() {
  return "cognito";
}

export function isCognitoAuthMode() {
  return true;
}

export function assertProductionAuthConfig() {
  const required = [
    "VITE_COGNITO_USER_POOL_ID",
    "VITE_COGNITO_CLIENT_ID",
    "VITE_COGNITO_DOMAIN",
    "VITE_COGNITO_REDIRECT_URI",
  ];
  const missing = required.filter((name) => !String(import.meta.env[name] ?? "").trim());
  if (missing.length) {
    throw new Error(`Cognito configuration is required: ${missing.join(", ")}`);
  }
}
