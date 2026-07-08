import { Outlet } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext.jsx";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { WorkspaceNavigationProvider } from "./useWorkspaceNavigation.js";

export default function ApplicationWorkspace() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <I18nProvider>
          <WorkspaceNavigationProvider>
            <div className="application-workspace">
              <Outlet />
            </div>
          </WorkspaceNavigationProvider>
        </I18nProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
