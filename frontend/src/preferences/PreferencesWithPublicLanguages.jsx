import { PublicLanguagesProvider } from "../publicLanguages/PublicLanguagesContext.jsx";
import { PreferencesProvider } from "./PreferencesContext.jsx";

/** Test wrapper: public language activation must wrap preferences. */
export function PreferencesWithPublicLanguages({ children }) {
  return (
    <PublicLanguagesProvider>
      <PreferencesProvider>{children}</PreferencesProvider>
    </PublicLanguagesProvider>
  );
}
