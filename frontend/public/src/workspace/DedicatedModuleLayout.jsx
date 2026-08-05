import { Outlet, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import ModuleHeader from "./ModuleHeader.jsx";
import { getDedicatedModuleTitle } from "./navigation.js";

export default function DedicatedModuleLayout() {
  const { pathname } = useLocation();
  const { language } = useI18n();
  const productName = getDedicatedModuleTitle(pathname, language);

  return (
    <div className="dedicated-module-layout">
      <ModuleHeader productName={productName} />
      <main className="dedicated-module-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
