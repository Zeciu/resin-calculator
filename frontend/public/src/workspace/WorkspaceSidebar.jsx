import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import DemoProjectNavLink from "../demo/DemoProjectNavLink.jsx";
import { useI18n } from "../i18n/I18nContext.jsx";
import QuickPreferences from "../preferences/QuickPreferences.jsx";
import PublicLanguageSelector from "../preferences/PublicLanguageSelector.jsx";
import { getLoggedInHomeNavItems, getVisibleWorkspaceNavItems, isWorkspaceNavItemActive } from "./navigation.js";
import { ROUTES } from "./routes.js";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation.js";

const NARROW_NAV_QUERY = "(max-width: 767px)";

function LockedNavItem({ label, lockLabel, onShowLockedMessage }) {
  return (
    <button
      type="button"
      className="workspace-sidebar__link workspace-sidebar__link--locked"
      onClick={onShowLockedMessage}
    >
      <span className="workspace-sidebar__label">{label}</span>
      <span className="workspace-sidebar__lock" aria-label={lockLabel}>
        <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </button>
  );
}

function GuestAuthActions({ t, pathname, onNavigate }) {
  return (
    <div className="workspace-sidebar__guest-auth">
      <DemoProjectNavLink
        className={() => "guest-home-onboarding__demo"}
        onClick={onNavigate}
      />
      <PublicLanguageSelector />
      <Link
        className="guest-home-onboarding__primary"
        to={ROUTES.REGISTER}
        aria-current={pathname === ROUTES.REGISTER ? "page" : undefined}
        onClick={onNavigate}
      >
        {t("home.onboardingRegister")}
      </Link>
      <Link
        className="guest-home-onboarding__secondary"
        to={ROUTES.LOGIN}
        aria-current={
          pathname === ROUTES.LOGIN || pathname === ROUTES.PASSWORD_RECOVERY ? "page" : undefined
        }
        onClick={onNavigate}
      >
        {t("home.onboardingLogin")}
      </Link>
    </div>
  );
}

export default function WorkspaceSidebar() {
  const { isAuthenticated, logout } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const detailsRef = useRef(null);
  const [isDisclosureOpen, setIsDisclosureOpen] = useState(true);
  const { isNavItemLocked, showLockedModuleMessage, clearLockedModuleMessage } =
    useWorkspaceNavigation();

  const isLoggedInHome = isAuthenticated && location.pathname === ROUTES.HOME;
  const navItems = isLoggedInHome
    ? getLoggedInHomeNavItems()
    : getVisibleWorkspaceNavItems(isAuthenticated);
  const workspaceItems = navItems.filter((item) => item.id !== "login-register");
  const lockedInventoryItems = workspaceItems.filter((item) => isNavItemLocked(item));

  useEffect(() => {
    if (isAuthenticated || typeof window.matchMedia !== "function") {
      return undefined;
    }
    const media = window.matchMedia(NARROW_NAV_QUERY);
    const syncOpenState = () => {
      const nextOpen = !media.matches;
      if (detailsRef.current) {
        detailsRef.current.open = nextOpen;
      }
      setIsDisclosureOpen(nextOpen);
    };
    syncOpenState();
    media.addEventListener("change", syncOpenState);
    return () => media.removeEventListener("change", syncOpenState);
  }, [isAuthenticated]);

  function handleLogout() {
    logout();
    clearLockedModuleMessage();
    navigate(ROUTES.HOME, { replace: true });
  }

  function renderWorkspaceItem(item) {
    const label = t(item.labelKey);
    const isLocked = isNavItemLocked(item);
    const isPrimaryAction = item.id === "new-project" && !isLocked;
    const isGuestExplore = item.id === "knowledge-preview";
    const isItemActive = isWorkspaceNavItemActive(item, location.pathname);

    return (
      <li key={item.id} className="workspace-sidebar__item">
        {isLocked ? (
          <LockedNavItem
            label={label}
            lockLabel={t("locked.featureAria")}
            onShowLockedMessage={showLockedModuleMessage}
          />
        ) : (
          <NavLink
            to={item.path}
            end={item.id !== "my-account" && item.id !== "knowledge-preview"}
            className={() =>
              [
                "workspace-sidebar__link",
                isPrimaryAction ? "workspace-sidebar__link--primary-action" : "",
                isGuestExplore ? "workspace-sidebar__link--guest-explore" : "",
                isItemActive ? "workspace-sidebar__link--active" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
            aria-current={isItemActive ? "page" : undefined}
            onClick={clearLockedModuleMessage}
          >
            <span className="workspace-sidebar__label">{label}</span>
          </NavLink>
        )}
      </li>
    );
  }

  const workspaceList = (
    <ul className="workspace-sidebar__list" hidden={isAuthenticated ? undefined : !isDisclosureOpen}>
      {workspaceItems.map((item) => renderWorkspaceItem(item))}
      {isLoggedInHome ? (
        <li className="workspace-sidebar__item workspace-sidebar__item--quick-preferences">
          <QuickPreferences variant="sidebar" />
        </li>
      ) : null}
      {isAuthenticated ? (
        <li className="workspace-sidebar__item">
          <DemoProjectNavLink
            labeled
            className={({ isActive }) =>
              [
                "workspace-sidebar__link",
                isActive ? "workspace-sidebar__link--active" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
            onClick={clearLockedModuleMessage}
          />
        </li>
      ) : null}
      {isAuthenticated ? (
        <li className="workspace-sidebar__item">
          <button
            type="button"
            className="workspace-sidebar__link workspace-sidebar__logout"
            onClick={handleLogout}
          >
            <span className="workspace-sidebar__label">{t("nav.logout")}</span>
          </button>
        </li>
      ) : null}
    </ul>
  );

  if (isAuthenticated) {
    return (
      <nav className="workspace-sidebar" aria-label="Workspace navigation">
        {workspaceList}
      </nav>
    );
  }

  return (
    <nav className="workspace-sidebar" aria-label="Workspace navigation">
      <details
        ref={detailsRef}
        className="workspace-sidebar__disclosure"
        defaultOpen
        onToggle={(event) => setIsDisclosureOpen(event.currentTarget.open)}
      >
        <summary className="workspace-sidebar__disclosure-summary">
          <span className="workspace-sidebar__disclosure-title">{t("nav.workspaceDisclosure")}</span>
          <span className="workspace-sidebar__disclosure-inventory">
            {lockedInventoryItems.map((item) => (
              <span key={item.id} className="workspace-sidebar__disclosure-module">
                <Lock size={12} strokeWidth={1.8} aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </span>
            ))}
          </span>
        </summary>
        {workspaceList}
      </details>
      <GuestAuthActions
        t={t}
        pathname={location.pathname}
        onNavigate={clearLockedModuleMessage}
      />
    </nav>
  );
}
