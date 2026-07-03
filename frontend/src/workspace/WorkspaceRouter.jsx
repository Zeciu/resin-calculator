import { Route, Routes } from "react-router-dom";
import GlossaryPage from "../modules/GlossaryPage.jsx";
import KnowledgeBasePage from "../modules/KnowledgeBasePage.jsx";
import ManualTutorialsPage from "../modules/ManualTutorialsPage.jsx";
import ProjectsPage from "../modules/ProjectsPage.jsx";
import MyAccountPage from "../account/MyAccountPage.jsx";
import LoginPage from "../auth/LoginPage.jsx";
import PasswordRecoveryPage from "../auth/PasswordRecoveryPage.jsx";
import RegisterPage from "../auth/RegisterPage.jsx";
import ApplicationWorkspace from "./ApplicationWorkspace.jsx";
import AuthRouteGuard from "./AuthRouteGuard.jsx";
import DedicatedModuleLayout from "./DedicatedModuleLayout.jsx";
import HomeHubLayout from "./HomeHubLayout.jsx";
import HomeRoute from "./HomeRoute.jsx";
import NewProjectWorkspace from "./NewProjectWorkspace.jsx";
import RoutePlaceholder from "./RoutePlaceholder.jsx";
import { ROUTES } from "./routes.js";

export const WORKSPACE_ROUTE_PATHS = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PASSWORD_RECOVERY,
  ROUTES.ACCOUNT,
  ROUTES.PROJECTS,
  ROUTES.MANUAL,
  ROUTES.GLOSSARY,
  ROUTES.KNOWLEDGE_BASE,
  ROUTES.NEW_PROJECT,
];

export function isWorkspacePath(pathname) {
  return WORKSPACE_ROUTE_PATHS.includes(pathname);
}

function workspaceRoutePath(route) {
  return route.replace(/^\//, "");
}

const WORKSPACE_ROUTE_PLACEHOLDERS = [];

export default function WorkspaceRouter() {
  return (
    <Routes>
      <Route element={<ApplicationWorkspace />}>
        <Route element={<HomeHubLayout />}>
          <Route index element={<HomeRoute />} />
          <Route path={workspaceRoutePath(ROUTES.LOGIN)} element={<LoginPage />} />
          <Route path={workspaceRoutePath(ROUTES.REGISTER)} element={<RegisterPage />} />
          <Route
            path={workspaceRoutePath(ROUTES.PASSWORD_RECOVERY)}
            element={<PasswordRecoveryPage />}
          />
          <Route path={workspaceRoutePath(ROUTES.ACCOUNT)} element={<MyAccountPage />} />
          {WORKSPACE_ROUTE_PLACEHOLDERS.map(({ path, title }) => (
            <Route
              key={path}
              path={workspaceRoutePath(path)}
              element={<RoutePlaceholder title={title} />}
            />
          ))}
        </Route>

        <Route element={<DedicatedModuleLayout />}>
          <Route
            path={workspaceRoutePath(ROUTES.NEW_PROJECT)}
            element={
              <AuthRouteGuard>
                <NewProjectWorkspace />
              </AuthRouteGuard>
            }
          />
          <Route
            path={workspaceRoutePath(ROUTES.PROJECTS)}
            element={
              <AuthRouteGuard>
                <ProjectsPage />
              </AuthRouteGuard>
            }
          />
          <Route
            path={workspaceRoutePath(ROUTES.MANUAL)}
            element={
              <AuthRouteGuard>
                <ManualTutorialsPage />
              </AuthRouteGuard>
            }
          />
          <Route
            path={workspaceRoutePath(ROUTES.GLOSSARY)}
            element={
              <AuthRouteGuard>
                <GlossaryPage />
              </AuthRouteGuard>
            }
          />
          <Route
            path={workspaceRoutePath(ROUTES.KNOWLEDGE_BASE)}
            element={
              <AuthRouteGuard>
                <KnowledgeBasePage />
              </AuthRouteGuard>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
