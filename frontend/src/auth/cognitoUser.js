const ADMIN_COGNITO_GROUP = "administrators";

export function roleFromCognitoGroups(groups) {
  if (Array.isArray(groups) && groups.includes(ADMIN_COGNITO_GROUP)) {
    return "administrator";
  }
  return "user";
}

/**
 * Normalize Amplify/Cognito session data to the application user shape.
 *
 * @param {{ userId: string, username?: string }} currentUser
 * @param {{ tokens?: { idToken?: { payload?: Record<string, unknown> }, accessToken?: { payload?: Record<string, unknown> } } }} session
 */
export function normalizeCognitoUser(currentUser, session) {
  const idPayload = session.tokens?.idToken?.payload ?? {};
  const accessPayload = session.tokens?.accessToken?.payload ?? {};

  const sub =
    typeof currentUser.userId === "string" && currentUser.userId.trim()
      ? currentUser.userId.trim()
      : typeof idPayload.sub === "string"
        ? idPayload.sub
        : "";

  const email =
    typeof idPayload.email === "string" && idPayload.email.trim()
      ? idPayload.email.trim()
      : typeof accessPayload.email === "string" && accessPayload.email.trim()
        ? accessPayload.email.trim()
        : "";

  const preferredUsername =
    typeof idPayload.preferred_username === "string" && idPayload.preferred_username.trim()
      ? idPayload.preferred_username.trim()
      : typeof currentUser.username === "string" && currentUser.username.trim()
        ? currentUser.username.trim()
        : email.includes("@")
          ? email.split("@")[0]
          : "user";

  const groups = accessPayload["cognito:groups"] ?? idPayload["cognito:groups"] ?? [];

  return {
    id: sub,
    email,
    username: preferredUsername,
    role: roleFromCognitoGroups(groups),
  };
}
