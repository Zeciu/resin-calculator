import { Route, Routes } from "react-router-dom";
import ResinCalculator from "../calculator/ResinCalculator.jsx";
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
        <Route path={workspaceRoutePath(ROUTES.LOGIN)} element={<LoginPage />} />
        <Route path={workspaceRoutePath(ROUTES.REGISTER)} element={<RegisterPage />} />
        <Route
          path={workspaceRoutePath(ROUTES.PASSWORD_RECOVERY)}
          element={<PasswordRecoveryPage />}
        />
        <Route path={workspaceRoutePath(ROUTES.ACCOUNT)} element={<MyAccountPage />} />
        <Route path={workspaceRoutePath(ROUTES.PROJECTS)} element={<ProjectsPage />} />
        <Route path={workspaceRoutePath(ROUTES.MANUAL)} element={<ManualTutorialsPage />} />
        <Route path={workspaceRoutePath(ROUTES.GLOSSARY)} element={<GlossaryPage />} />
        <Route path={workspaceRoutePath(ROUTES.KNOWLEDGE_BASE)} element={<KnowledgeBasePage />} />
        <Route
          path={workspaceRoutePath(ROUTES.NEW_PROJECT)}
          element={
            <AuthRouteGuard>
              <ResinCalculator showHeader={false} />
            </AuthRouteGuard>
          }
        />
        {WORKSPACE_ROUTE_PLACEHOLDERS.map(({ path, title }) => (
          <Route
            key={path}
            path={workspaceRoutePath(path)}
            element={<RoutePlaceholder title={title} />}
          />
        ))}
      </Route>
    </Routes>
  );
}
