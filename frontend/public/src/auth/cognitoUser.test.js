import { describe, expect, it } from "vitest";
import { normalizeCognitoUser, roleFromCognitoGroups } from "./cognitoUser.js";

describe("cognitoUser normalization", () => {
  it("maps Cognito sub to user.id", () => {
    const user = normalizeCognitoUser(
      { userId: "sub-abc-123", username: "maker" },
      {
        tokens: {
          idToken: {
            payload: {
              sub: "sub-abc-123",
              email: "maker@example.com",
              preferred_username: "maker",
            },
          },
          accessToken: {
            payload: {
              "cognito:groups": ["users"],
            },
          },
        },
      },
    );

    expect(user.id).toBe("sub-abc-123");
    expect(user.email).toBe("maker@example.com");
    expect(user.username).toBe("maker");
    expect(user.role).toBe("user");
  });

  it("keeps legacy administrator group members as customer users", () => {
    expect(roleFromCognitoGroups(["administrators"])).toBe("user");
    expect(roleFromCognitoGroups(["users"])).toBe("user");
  });
});
