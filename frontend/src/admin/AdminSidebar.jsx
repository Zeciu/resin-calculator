import { NavLink } from "react-router-dom";
import { ADMIN_NAV_ITEMS } from "./adminNavigation.js";

function adminNavLinkClassName({ isActive }) {
  return ["admin-sidebar__link", isActive ? "admin-sidebar__link--active" : ""]
    .filter(Boolean)
    .join(" ");
}

export default function AdminSidebar() {
  return (
    <nav className="admin-sidebar" aria-label="Administration navigation">
      <ul className="admin-sidebar__list">
        {ADMIN_NAV_ITEMS.map((item) => (
          <li key={item.id} className="admin-sidebar__item">
            <NavLink
              to={item.path}
              end={item.end}
              className={adminNavLinkClassName}
            >
              <span className="admin-sidebar__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
