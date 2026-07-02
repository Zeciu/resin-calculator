import { Route, Routes } from "react-router-dom";
import ManualTutorialsPage from "../modules/ManualTutorialsPage.jsx";
import ProjectsPage from "../modules/ProjectsPage.jsx";
import MyAccountPage from "../account/MyAccountPage.jsx";
import LoginPage from "../auth/LoginPage.jsx";
import PasswordRecoveryPage from "../auth/PasswordRecoveryPage.jsx";
import RegisterPage from "../auth/RegisterPage.jsx";
import ApplicationWorkspace from "./ApplicationWorkspace.jsx";
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

const WORKSPACE_ROUTE_PLACEHOLDERS = [
  { path: ROUTES.GLOSSARY, title: "Glossary" },
  { path: ROUTES.KNOWLEDGE_BASE, title: "Knowledge Base" },
  { path: ROUTES.NEW_PROJECT, title: "New Project" },
];

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
