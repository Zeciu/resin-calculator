import { beforeEach, describe, expect, it, vi } from "vitest";

const amplifyAuth = vi.hoisted(() => ({
  confirmResetPassword: vi.fn(),
  confirmSignUp: vi.fn(),
  fetchAuthSession: vi.fn(),
  getCurrentUser: vi.fn(),
  resetPassword: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("aws-amplify/auth", () => amplifyAuth);

import { cognitoAuthAdapter } from "./cognitoAuthAdapter.js";

describe("cognitoAuthAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restores authenticated user with Cognito sub as user.id", async () => {
    amplifyAuth.getCurrentUser.mockResolvedValue({
      userId: "sub-restored",
      username: "restored",
    });
    amplifyAuth.fetchAuthSession.mockResolvedValue({
      tokens: {
        accessToken: { toString: () => "access-token", payload: { "cognito:groups": [] } },
        idToken: {
          payload: {
            sub: "sub-restored",
            email: "restored@example.com",
            preferred_username: "restored",
          },
        },
      },
    });

    const user = await cognitoAuthAdapter.restoreSession();

    expect(user).toEqual({
      id: "sub-restored",
      email: "restored@example.com",
      username: "restored",
      role: "user",
    });
  });

  it("logs in with email and password", async () => {
    amplifyAuth.signIn.mockResolvedValue({ nextStep: { signInStep: "DONE" } });
    amplifyAuth.getCurrentUser.mockResolvedValue({
      userId: "sub-login",
      username: "login-user",
    });
    amplifyAuth.fetchAuthSession.mockResolvedValue({
      tokens: {
        accessToken: { toString: () => "access-token", payload: { "cognito:groups": [] } },
        idToken: {
          payload: {
            sub: "sub-login",
            email: "login@example.com",
            preferred_username: "login-user",
          },
        },
      },
    });

    const user = await cognitoAuthAdapter.login({
      email: "login@example.com",
      password: "Password123",
    });

    expect(amplifyAuth.signIn).toHaveBeenCalledWith({
      username: "login@example.com",
      password: "Password123",
    });
    expect(user.id).toBe("sub-login");
  });

  it("routes CONFIRM_SIGN_UP sign-in next step to unconfirmed-account handling", async () => {
    amplifyAuth.signIn.mockResolvedValue({
      nextStep: { signInStep: "CONFIRM_SIGN_UP" },
    });

    await expect(
      cognitoAuthAdapter.login({
        email: "unconfirmed@example.com",
        password: "Password123",
      }),
    ).rejects.toMatchObject({
      code: "UserNotConfirmedException",
    });
  });

  it("returns needsConfirmation after sign up", async () => {
    amplifyAuth.signUp.mockResolvedValue({
      nextStep: { signUpStep: "CONFIRM_SIGN_UP" },
    });

    const result = await cognitoAuthAdapter.register({
      email: "new@example.com",
      username: "new-user",
      password: "Password123",
    });

    expect(result).toEqual({ needsConfirmation: true, email: "new@example.com" });
  });

  it("signs out through Amplify", async () => {
    amplifyAuth.signOut.mockResolvedValue(undefined);

    await cognitoAuthAdapter.logout();

    expect(amplifyAuth.signOut).toHaveBeenCalled();
  });
});
