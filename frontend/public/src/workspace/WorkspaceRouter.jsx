import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { editorialRoutes } from "@private-editorial-routes";
import { useI18n } from "../i18n/I18nContext.jsx";
import GlossaryPage from "../modules/GlossaryPage.jsx";
import KnowledgeBasePage from "../modules/KnowledgeBasePage.jsx";
import ManualTutorialsPage from "../modules/ManualTutorialsPage.jsx";
import ProjectsPage from "../modules/ProjectsPage.jsx";
import MyAccountPage from "../account/MyAccountPage.jsx";
import PreferencesPage from "../preferences/PreferencesPage.jsx";
import LoginPage from "../auth/LoginPage.jsx";
import PasswordRecoveryPage from "../auth/PasswordRecoveryPage.jsx";
import RegisterPage from "../auth/RegisterPage.jsx";
import NotFoundPage from "../website/NotFoundPage.jsx";
import PublicAboutPage from "../website/PublicAboutPage.jsx";
import PublicContactPage from "../website/PublicContactPage.jsx";
import PublicPricingPage from "../website/PublicPricingPage.jsx";
import PublicPrivacyPage from "../website/PublicPrivacyPage.jsx";
import PublicTermsPage from "../website/PublicTermsPage.jsx";
import PublicWebsiteLayout from "../website/PublicWebsiteLayout.jsx";
import ApplicationWorkspace from "./ApplicationWorkspace.jsx";
import AuthRouteGuard from "./AuthRouteGuard.jsx";
import DedicatedModuleLayout from "./DedicatedModuleLayout.jsx";
import HomeHubLayout from "./HomeHubLayout.jsx";
import HomeRoute from "./HomeRoute.jsx";
import PublicKnowledgePreviewLanding from "../publicPreview/PublicKnowledgePreviewLanding.jsx";
import ManualPreviewPage from "../publicPreview/ManualPreviewPage.jsx";
import KnowledgeBasePreviewPage from "../publicPreview/KnowledgeBasePreviewPage.jsx";
import GlossaryPreviewPage from "../publicPreview/GlossaryPreviewPage.jsx";
import { ROUTES } from "./routes.js";

// The calculator (and everything it pulls in) is split into its own chunk so
// public pages do not download it. It loads when /demo or /new-project opens.
const NewProjectWorkspace = lazy(() => import("./NewProjectWorkspace.jsx"));
const DemoWorkspace = lazy(() => import("./DemoWorkspace.jsx"));

function CalculatorRouteFallback() {
  const { t } = useI18n();
  return (
    <p className="new-project-workspace__status" role="status">
      {t("common.loading")}
    </p>
  );
}

function CalculatorRoute({ children }) {
  return <Suspense fallback={<CalculatorRouteFallback />}>{children}</Suspense>;
}

export const WORKSPACE_ROUTE_PATHS = [
  ROUTES.ABOUT,
  ROUTES.PRICING,
  ROUTES.PRIVACY,
  ROUTES.TERMS,
  ROUTES.CONTACT,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.PASSWORD_RECOVERY,
  ROUTES.ACCOUNT,
  ROUTES.PREFERENCES,
  ROUTES.PROJECTS,
  ROUTES.MANUAL,
  ROUTES.GLOSSARY,
  ROUTES.KNOWLEDGE_BASE,
  ROUTES.NEW_PROJECT,
  ROUTES.DEMO,
  ROUTES.KNOWLEDGE_PREVIEW,
  ROUTES.KNOWLEDGE_PREVIEW_MANUAL,
  ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE,
  ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY,
];

export function isWorkspacePath(pathname) {
  return (
    WORKSPACE_ROUTE_PATHS.includes(pathname) ||
    pathname === ROUTES.KNOWLEDGE_PREVIEW ||
    pathname.startsWith(`${ROUTES.KNOWLEDGE_PREVIEW}/`)
  );
}

function workspaceRoutePath(route) {
  return route.replace(/^\//, "");
}

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
          <Route
            path={workspaceRoutePath(ROUTES.ACCOUNT)}
            element={
              <AuthRouteGuard>
                <MyAccountPage />
              </AuthRouteGuard>
            }
          />
          <Route
            path={workspaceRoutePath(ROUTES.PREFERENCES)}
            element={
              <AuthRouteGuard>
                <PreferencesPage />
              </AuthRouteGuard>
            }
          />
        </Route>

        <Route element={<PublicWebsiteLayout />}>
          <Route path={workspaceRoutePath(ROUTES.ABOUT)} element={<PublicAboutPage />} />
          <Route path={workspaceRoutePath(ROUTES.PRICING)} element={<PublicPricingPage />} />
          <Route path={workspaceRoutePath(ROUTES.PRIVACY)} element={<PublicPrivacyPage />} />
          <Route path={workspaceRoutePath(ROUTES.TERMS)} element={<PublicTermsPage />} />
          <Route path={workspaceRoutePath(ROUTES.CONTACT)} element={<PublicContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<DedicatedModuleLayout />}>
          <Route
            path={workspaceRoutePath(ROUTES.NEW_PROJECT)}
            element={
              <AuthRouteGuard>
                <CalculatorRoute>
                  <NewProjectWorkspace />
                </CalculatorRoute>
              </AuthRouteGuard>
            }
          />
          <Route
            path={workspaceRoutePath(ROUTES.DEMO)}
            element={
              <CalculatorRoute>
                <DemoWorkspace />
              </CalculatorRoute>
            }
          />
          <Route
            path={workspaceRoutePath(ROUTES.KNOWLEDGE_PREVIEW)}
            element={<PublicKnowledgePreviewLanding />}
          />
          <Route
            path={workspaceRoutePath(ROUTES.KNOWLEDGE_PREVIEW_MANUAL)}
            element={<ManualPreviewPage />}
          />
          <Route
            path={workspaceRoutePath(ROUTES.KNOWLEDGE_PREVIEW_KNOWLEDGE_BASE)}
            element={<KnowledgeBasePreviewPage />}
          />
          <Route
            path={workspaceRoutePath(ROUTES.KNOWLEDGE_PREVIEW_GLOSSARY)}
            element={<GlossaryPreviewPage />}
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

        {editorialRoutes}
      </Route>
    </Routes>
  );
}
