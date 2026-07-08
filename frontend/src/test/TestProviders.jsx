import { AuthProvider } from "../auth/AuthContext.jsx";
import { CapabilitiesProvider } from "../capabilities/CapabilitiesContext.jsx";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";

export function TestProviders({ children }) {
  return (
    <AuthProvider>
      <CapabilitiesProvider>
        <PreferencesProvider>
          <I18nProvider>{children}</I18nProvider>
        </PreferencesProvider>
      </CapabilitiesProvider>
    </AuthProvider>
  );
}
