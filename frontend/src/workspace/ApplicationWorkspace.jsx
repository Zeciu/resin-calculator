import { Outlet } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext.jsx";
import { WorkspaceNavigationProvider } from "./useWorkspaceNavigation.js";

export default function ApplicationWorkspace() {
  return (
    <AuthProvider>
      <WorkspaceNavigationProvider>
        <div className="application-workspace">
          <Outlet />
        </div>
      </WorkspaceNavigationProvider>
    </AuthProvider>
  );
}
