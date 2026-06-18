// Amplify configuration — values injected at build time via environment variables.
// Set these in your shell or CI before running `npm run build`:
//   VITE_COGNITO_USER_POOL_ID   e.g. eu-central-1_AbCdEfGhI
//   VITE_COGNITO_CLIENT_ID      e.g. 1abc2defg3hijklmno
//   VITE_COGNITO_DOMAIN         e.g. resin-calculator-123456789.auth.eu-central-1.amazoncognito.com
//   VITE_COGNITO_REDIRECT_URI   e.g. http://localhost:5173/callback

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [import.meta.env.VITE_COGNITO_REDIRECT_URI],
          redirectSignOut: [import.meta.env.VITE_COGNITO_REDIRECT_URI?.replace("/callback", "") ?? ""],
          responseType: "code",
        },
      },
    },
  },
};

export default amplifyConfig;
