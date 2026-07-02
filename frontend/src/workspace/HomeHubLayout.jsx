import { Outlet } from "react-router-dom";
import LockedModuleMessage from "./LockedModuleMessage.jsx";
import WorkspaceHero from "./WorkspaceHero.jsx";
import WorkspaceSidebar from "./WorkspaceSidebar.jsx";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation.js";

function WorkspaceMainContent() {
  const { showLockedMessage } = useWorkspaceNavigation();

  return (
    <main className="workspace-content">
      {showLockedMessage ? <LockedModuleMessage /> : <Outlet />}
    </main>
  );
}

export default function HomeHubLayout() {
  return (
    <div className="home-hub-layout">
      <header className="workspace-hero-slot" aria-label="Workspace hero">
        <WorkspaceHero />
      </header>

      <div className="workspace-body">
        <aside className="workspace-sidebar-slot" aria-label="Workspace navigation">
          <WorkspaceSidebar />
        </aside>

        <WorkspaceMainContent />
      </div>
    </div>
  );
}
