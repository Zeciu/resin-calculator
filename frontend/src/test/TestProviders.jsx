import { AuthProvider } from "../auth/AuthContext.jsx";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";

export function TestProviders({ children }) {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <I18nProvider>{children}</I18nProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
