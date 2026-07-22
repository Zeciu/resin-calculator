import { Outlet, useLocation, useOutletContext } from "react-router-dom";
import PublicWebsiteFooter from "../website/PublicWebsiteFooter.jsx";
import { resolvePublishedHomeBody } from "../website/homePublicUtils.js";
import { usePublishedWebsitePage } from "../website/usePublishedWebsitePage.js";
import { WEBSITE_PAGE_KEYS } from "../website/websitePublicConstants.js";
import LockedModuleMessage from "./LockedModuleMessage.jsx";
import WorkspaceHero from "./WorkspaceHero.jsx";
import WorkspaceSidebar from "./WorkspaceSidebar.jsx";
import { ROUTES } from "./routes.js";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation.js";

function WorkspaceMainContent({ cmsHome }) {
  const { showLockedMessage } = useWorkspaceNavigation();

  return (
    <main className="workspace-content">
      {showLockedMessage ? (
        <LockedModuleMessage />
      ) : (
        <Outlet context={{ cmsHome }} />
      )}
    </main>
  );
}

export default function HomeHubLayout() {
  const location = useLocation();
  const { payload, loadState } = usePublishedWebsitePage(WEBSITE_PAGE_KEYS.HOME);
  const cmsHome = resolvePublishedHomeBody(payload, loadState);
  const showWebsiteFooter = location.pathname === ROUTES.HOME;

  return (
    <div className="home-hub-layout">
      <header className="workspace-hero-slot" aria-label="Workspace hero">
        <WorkspaceHero marketing={cmsHome} />
      </header>

      <div className="workspace-body">
        <aside className="workspace-sidebar-slot" aria-label="Workspace navigation">
          <WorkspaceSidebar />
        </aside>

        <WorkspaceMainContent cmsHome={cmsHome} />
      </div>

      {showWebsiteFooter ? <PublicWebsiteFooter /> : null}
    </div>
  );
}

/**
 * @returns {{ cmsHome: Record<string, unknown> | null }}
 */
export function useHomeHubOutletContext() {
  return useOutletContext() ?? { cmsHome: null };
}
