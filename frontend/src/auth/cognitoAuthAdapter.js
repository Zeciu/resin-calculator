import {
  confirmResetPassword,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";
import { normalizeCognitoUser } from "./cognitoUser.js";

export class CognitoAuthError extends Error {
  constructor(message, { code } = {}) {
    super(message);
    this.name = "CognitoAuthError";
    this.code = code ?? null;
  }
}

function resolveSignInUsername(credentials = {}) {
  if (typeof credentials.email === "string" && credentials.email.trim()) {
    return credentials.email.trim();
  }
  if (typeof credentials.username === "string" && credentials.username.trim()) {
    return credentials.username.trim();
  }
  return "";
}

function mapCognitoError(error, fallbackMessage) {
  const code = error?.name ?? error?.code ?? null;
  const messageByCode = {
    NotAuthorizedException: "Incorrect email or password.",
    UserNotFoundException: "Incorrect email or password.",
    UserNotConfirmedException:
      "This account has not been confirmed yet. Enter the confirmation code sent to your email.",
    InvalidPasswordException: "Password does not meet the account requirements.",
    UsernameExistsException: "An account with this email already exists.",
    CodeMismatchException: "The confirmation code is incorrect.",
    ExpiredCodeException: "The confirmation code has expired. Request a new one.",
    LimitExceededException: "Too many attempts. Please wait and try again.",
    InvalidParameterException: "The submitted details are invalid. Check your input and try again.",
  };

  if (code && messageByCode[code]) {
    return new CognitoAuthError(messageByCode[code], { code });
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return new CognitoAuthError(error.message.trim(), { code });
  }

  return new CognitoAuthError(fallbackMessage, { code });
}

async function loadAuthenticatedUser() {
  const [currentUser, session] = await Promise.all([getCurrentUser(), fetchAuthSession()]);
  if (!session.tokens?.accessToken) {
    return null;
  }
  return normalizeCognitoUser(currentUser, session);
}

export const cognitoAuthAdapter = {
  async restoreSession() {
    try {
      return await loadAuthenticatedUser();
    } catch {
      return null;
    }
  },

  async login(credentials = {}) {
    const username = resolveSignInUsername(credentials);
    const password = typeof credentials.password === "string" ? credentials.password : "";

    if (!username) {
      throw new CognitoAuthError("Email or username is required.");
    }
    if (!password) {
      throw new CognitoAuthError("Password is required.");
    }

    try {
      const result = await signIn({ username, password });
      if (result.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
        throw new CognitoAuthError(
          "This account has not been confirmed yet. Enter the confirmation code sent to your email.",
          { code: "UserNotConfirmedException" },
        );
      }
      if (result.nextStep?.signInStep && result.nextStep.signInStep !== "DONE") {
        throw new CognitoAuthError(
          "Additional sign-in steps are required. Complete authentication and try again.",
          { code: result.nextStep.signInStep },
        );
      }

      const user = await loadAuthenticatedUser();
      if (!user?.id) {
        throw new CognitoAuthError("Sign-in completed but no authenticated user was returned.");
      }
      return user;
    } catch (error) {
      if (error instanceof CognitoAuthError) {
        throw error;
      }
      throw mapCognitoError(error, "Sign-in failed. Check your credentials and try again.");
    }
  },

  async register(credentials = {}) {
    const email = typeof credentials.email === "string" ? credentials.email.trim() : "";
    const username =
      typeof credentials.username === "string" && credentials.username.trim()
        ? credentials.username.trim()
        : email.split("@")[0];
    const password = typeof credentials.password === "string" ? credentials.password : "";

    if (!email) {
      throw new CognitoAuthError("Email is required.");
    }
    if (!password) {
      throw new CognitoAuthError("Password is required.");
    }

    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            preferred_username: username,
          },
        },
      });

      if (result.nextStep?.signUpStep === "CONFIRM_SIGN_UP") {
        return { needsConfirmation: true, email };
      }

      return this.login({ email, password });
    } catch (error) {
      if (error instanceof CognitoAuthError) {
        throw error;
      }
      throw mapCognitoError(error, "Registration failed. Check your details and try again.");
    }
  },

  async confirmRegistration({ email, confirmationCode }) {
    const username = typeof email === "string" ? email.trim() : "";
    const code = typeof confirmationCode === "string" ? confirmationCode.trim() : "";

    if (!username) {
      throw new CognitoAuthError("Email is required.");
    }
    if (!code) {
      throw new CognitoAuthError("Confirmation code is required.");
    }

    try {
      await confirmSignUp({ username, confirmationCode: code });
      return { confirmed: true, email: username };
    } catch (error) {
      if (error instanceof CognitoAuthError) {
        throw error;
      }
      throw mapCognitoError(error, "Account confirmation failed. Check the code and try again.");
    }
  },

  async initiatePasswordRecovery({ email }) {
    const username = typeof email === "string" ? email.trim() : "";
    if (!username) {
      throw new CognitoAuthError("Email is required.");
    }

    try {
      const result = await resetPassword({ username });
      if (result.nextStep?.resetPasswordStep === "CONFIRM_RESET_PASSWORD_WITH_CODE") {
        return { codeSent: true, email: username };
      }
      return { codeSent: true, email: username };
    } catch (error) {
      if (error instanceof CognitoAuthError) {
        throw error;
      }
      throw mapCognitoError(
        error,
        "Password recovery could not be started. Check the email address and try again.",
      );
    }
  },

  async confirmPasswordReset({ email, confirmationCode, newPassword }) {
    const username = typeof email === "string" ? email.trim() : "";
    const code = typeof confirmationCode === "string" ? confirmationCode.trim() : "";
    const password = typeof newPassword === "string" ? newPassword : "";

    if (!username) {
      throw new CognitoAuthError("Email is required.");
    }
    if (!code) {
      throw new CognitoAuthError("Confirmation code is required.");
    }
    if (!password) {
      throw new CognitoAuthError("New password is required.");
    }

    try {
      await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword: password,
      });
      return { completed: true, email: username };
    } catch (error) {
      if (error instanceof CognitoAuthError) {
        throw error;
      }
      throw mapCognitoError(error, "Password reset failed. Check the code and try again.");
    }
  },

  async logout() {
    try {
      await signOut();
    } catch {
      // Clear local auth state even if Cognito sign-out fails.
    }
  },
};
