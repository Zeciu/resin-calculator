import { Route } from "react-router-dom";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import ManualManagementPage from "./admin/manual/ManualManagementPage.jsx";
import GlossaryManagementPage from "./admin/glossary/GlossaryManagementPage.jsx";
import KnowledgeBaseManagementPage from "./admin/knowledgeBase/KnowledgeBaseManagementPage.jsx";
import WebsiteManagementPage from "./admin/website/WebsiteManagementPage.jsx";
import AdminPlaceholderPage from "./admin/AdminPlaceholderPage.jsx";
import { getAdminPlaceholderNavItems } from "./admin/adminNavigation.js";
import { ADMIN_ROUTES } from "./admin/adminRoutes.js";

// This tree is only resolved by Vite's local serve/test configuration. It is
// deliberately not role or subscription gated: editorial access is local-only
// and is not a customer entitlement.
export const editorialRoutes = (
  <Route path="admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route
      path={ADMIN_ROUTES.MANUAL.replace(/^\/admin\//, "")}
      element={<ManualManagementPage />}
    />
    <Route
      path={ADMIN_ROUTES.GLOSSARY.replace(/^\/admin\//, "")}
      element={<GlossaryManagementPage />}
    />
    <Route
      path={ADMIN_ROUTES.KNOWLEDGE_BASE.replace(/^\/admin\//, "")}
      element={<KnowledgeBaseManagementPage />}
    />
    <Route
      path={ADMIN_ROUTES.WEBSITE.replace(/^\/admin\//, "")}
      element={<WebsiteManagementPage />}
    />
    {getAdminPlaceholderNavItems().map((item) => (
      <Route
        key={item.id}
        path={item.path.replace(/^\/admin\//, "")}
        element={
          <AdminPlaceholderPage
            title={item.placeholderTitle}
            message={item.placeholderMessage}
          />
        }
      />
    ))}
  </Route>
);
