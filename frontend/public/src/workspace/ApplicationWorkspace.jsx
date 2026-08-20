import { Outlet } from "react-router-dom";
import { CapabilitiesProvider } from "../capabilities/CapabilitiesContext.jsx";
import DocumentChrome from "../i18n/DocumentChrome.jsx";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { PublicLanguagesProvider } from "../publicLanguages/PublicLanguagesContext.jsx";
import { WorkspaceNavigationProvider } from "./useWorkspaceNavigation.js";

export default function ApplicationWorkspace() {
  return (
    <CapabilitiesProvider>
      <PublicLanguagesProvider>
        <PreferencesProvider>
          <I18nProvider>
            <WorkspaceNavigationProvider>
              <div className="application-workspace">
                <DocumentChrome />
                <Outlet />
              </div>
            </WorkspaceNavigationProvider>
          </I18nProvider>
        </PreferencesProvider>
      </PublicLanguagesProvider>
    </CapabilitiesProvider>
  );
}
