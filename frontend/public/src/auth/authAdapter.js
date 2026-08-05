import { cognitoAuthAdapter } from "./cognitoAuthAdapter.js";

export { cognitoAuthAdapter };

export function resolveAuthAdapter() {
  return cognitoAuthAdapter;
}
