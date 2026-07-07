import { NavLink, Outlet } from "react-router-dom";
import { ROUTES } from "../workspace/routes.js";
import AdminSidebar from "./AdminSidebar.jsx";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <header className="admin-layout__header" aria-label="Administration header">
        <NavLink className="admin-layout__back-link" to={ROUTES.HOME}>
          ← Back to HFZWood
        </NavLink>
        <div className="admin-layout__brand">
          <img
            className="admin-layout__logo"
            src="/hefzech-logo.png"
            alt="HFZWood"
          />
          <p className="admin-layout__title">Admin Panel</p>
        </div>
      </header>

      <div className="admin-layout__body">
        <aside
          className="admin-layout__sidebar-slot"
          aria-label="Administration sidebar"
        >
          <AdminSidebar />
        </aside>

        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
