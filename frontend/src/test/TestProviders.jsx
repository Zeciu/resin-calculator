import { AuthProviderForTests } from "../auth/AuthContext.jsx";
import { CapabilitiesProvider } from "../capabilities/CapabilitiesContext.jsx";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { PublicLanguagesProvider } from "../publicLanguages/PublicLanguagesContext.jsx";

export function TestProviders({ children }) {
  return (
    <AuthProviderForTests>
      <CapabilitiesProvider>
        <PublicLanguagesProvider>
          <PreferencesProvider>
            <I18nProvider>{children}</I18nProvider>
          </PreferencesProvider>
        </PublicLanguagesProvider>
      </CapabilitiesProvider>
    </AuthProviderForTests>
  );
}
