import { Route, Routes } from "react-router-dom";
import LoginPage from "../auth/LoginPage.jsx";
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
  { path: ROUTES.PASSWORD_RECOVERY, title: "Password Recovery" },
  { path: ROUTES.ACCOUNT, title: "My Account" },
  { path: ROUTES.PROJECTS, title: "Projects" },
  { path: ROUTES.MANUAL, title: "Manual & Tutorials" },
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
