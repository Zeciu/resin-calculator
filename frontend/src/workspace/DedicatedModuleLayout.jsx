import { Outlet, useLocation } from "react-router-dom";
import ModuleHeader from "./ModuleHeader.jsx";
import { getDedicatedModuleTitle } from "./navigation.js";

export default function DedicatedModuleLayout() {
  const { pathname } = useLocation();
  const productName = getDedicatedModuleTitle(pathname);

  return (
    <div className="dedicated-module-layout">
      <ModuleHeader productName={productName} />
      <main className="dedicated-module-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
