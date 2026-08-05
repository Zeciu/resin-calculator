import { fetchAuthSession } from "aws-amplify/auth";

async function readCognitoAccessToken() {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();
    return typeof token === "string" && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

export async function buildAuthHeaders({ includeJsonContentType = true } = {}) {
  const headers = {};
  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }
  const token = await readCognitoAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
