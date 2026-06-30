import { Outlet } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext.jsx";
import LockedModuleMessage from "./LockedModuleMessage.jsx";
import WorkspaceHero from "./WorkspaceHero.jsx";
import WorkspaceSidebar from "./WorkspaceSidebar.jsx";
import {
  useWorkspaceNavigation,
  WorkspaceNavigationProvider,
} from "./useWorkspaceNavigation.js";

function WorkspaceMainContent({ children }) {
  const { showLockedMessage } = useWorkspaceNavigation();

  return (
    <main className="workspace-content">
      {showLockedMessage ? <LockedModuleMessage /> : (children ?? <Outlet />)}
    </main>
  );
}

export default function ApplicationWorkspace({ children }) {
  return (
    <AuthProvider>
      <WorkspaceNavigationProvider>
        <div className="application-workspace">
          <header className="workspace-hero-slot" aria-label="Workspace hero">
            <WorkspaceHero />
          </header>

          <div className="workspace-body">
            <aside className="workspace-sidebar-slot" aria-label="Workspace navigation">
              <WorkspaceSidebar />
            </aside>

            <WorkspaceMainContent children={children} />
          </div>
        </div>
      </WorkspaceNavigationProvider>
    </AuthProvider>
  );
}
