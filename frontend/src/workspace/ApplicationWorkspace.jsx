import { Outlet } from "react-router-dom";

export default function ApplicationWorkspace({ children }) {
  return (
    <div className="application-workspace">
      <header className="workspace-hero-slot" aria-label="Workspace hero">
        {/* Task 7 will render WorkspaceHero here. */}
      </header>

      <div className="workspace-body">
        <aside className="workspace-sidebar-slot" aria-label="Workspace navigation">
          {/* Task 8 will render WorkspaceSidebar here. */}
        </aside>

        <main className="workspace-content">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
