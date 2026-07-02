# Phase 1 Implementation Plan — Application Workspace

This plan implements **Phase 1 – Foundation / Application Workspace** per the finalized documentation. It wraps the existing calculator without replacing it, delivers Guest + Authenticated UI modes with **mock/session auth** (production Cognito wiring deferred), and uses the current stack: **React 18 + Vite + Vitest** frontend, **FastAPI** backend (unchanged for Phase 1 UI work).

---

## Current baseline (relevant to sequencing)

| Existing asset | Implication |
|----------------|-------------|
| `frontend/src/App.jsx` (~3,400 lines) | Full calculator; must be extracted, not rewritten |
| `frontend/src/main.jsx` | Gates app: unauthenticated → `LandingPage`, authenticated → `App` |
| `LandingPage.jsx` + Amplify/Cognito | Conflicts with doc Guest Mode workspace; must be reconciled in Phase 1 |
| `AppHeader.jsx` | Hero branding exists; workspace hero should reuse/adapt it |
| `App.test.jsx` | Tests assume `App` is root; must be updated after extraction |
| No `react-router` | Routing layer must be added |
| Backend Cognito middleware | Optional when env vars unset; no backend work required for Phase 1 UI |

---

## Execution principles

- One task = one verifiable outcome.
- Calculator regression tests run after extraction (Task 34+).
- Mock auth in Phase 1; Cognito preserved behind an adapter for a later phase.
- No CDK/infra changes in Phase 1 (no new AWS dependencies).

---

## Phase 1A — Foundation & Workspace (Tasks 1–10)

### Task 1 — Add client-side routing dependency

| Field | Detail |
|-------|--------|
| **Objective** | Enable module-based navigation inside the workspace |
| **Files likely modified** | `frontend/package.json`, `frontend/package-lock.json` |
| **Dependencies** | None |
| **Expected result** | `react-router-dom` installed; `npm run build` succeeds |
| **Acceptance criteria** | Dependency resolves; no breaking changes to existing entry point |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Installed `react-router-dom@^7.18.1` with `npm install react-router-dom` in `frontend/`
- Only `package.json` and `package-lock.json` changed; no application source files modified
- `npm run build` succeeded after install

---

### Task 2 — Define workspace navigation configuration

| Field | Detail |
|-------|--------|
| **Objective** | Single source of truth for sidebar items, routes, and lock rules |
| **Files likely modified** | `frontend/src/workspace/navigation.js` (new) |
| **Dependencies** | Task 1 |
| **Expected result** | Config exports nav items: New Project, Projects, Manual & Tutorials, Glossary, Knowledge Base, Login/Register, My Account; each with `id`, `label`, `path`, `requiresAuth` |
| **Acceptance criteria** | Config matches all three docs; importable without React |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `frontend/src/workspace/navigation.js` exporting `WORKSPACE_NAV_ITEMS` only (no helper functions)
- Seven nav items with `id`, `label`, `path`, `requiresAuth`; New Project uses user-oriented path `/new-project`
- `npm run build` succeeded; no application logic or other files modified

---

### Task 3 — Define workspace route map

| Field | Detail |
|-------|--------|
| **Objective** | Map URL paths to workspace modules |
| **Files likely modified** | `frontend/src/workspace/routes.js` (new) |
| **Dependencies** | Task 2 |
| **Expected result** | Constants for `/`, `/login`, `/register`, `/password-recovery`, `/account`, `/projects`, `/manual`, `/glossary`, `/knowledge-base`, `/calculator` |
| **Acceptance criteria** | No duplicate path strings across codebase after adoption |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `frontend/src/workspace/routes.js` exporting `ROUTES` with ten path constants; `/new-project` used instead of `/calculator` per Task 2
- Updated `navigation.js` to import path values from `ROUTES`; no duplicate path literals remain in `frontend/src/workspace/`
- `npm run build` succeeded; `main.jsx`, calculator files, and `/callback` route left unchanged

---

### Task 4 — Create Phase 1 mock authentication context

| Field | Detail |
|-------|--------|
| **Objective** | Provide `isAuthenticated`, `user`, `login()`, `logout()` without Cognito |
| **Files likely modified** | `frontend/src/auth/AuthContext.jsx`, `frontend/src/auth/useAuth.js` (new) |
| **Dependencies** | None |
| **Expected result** | Auth state persists in `sessionStorage`; login/register set authenticated stub user |
| **Acceptance criteria** | Unit-testable; no Amplify calls; logout clears session |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `AuthContext.jsx` with `AuthProvider`, `login()`, `logout()`, and `sessionStorage` persistence under key `hfzwood.mockAuth`
- Created `useAuth.js` hook exposing `isAuthenticated`, `user`, `login`, and `logout`
- No Amplify imports in `frontend/src/auth/`; `npm run build` succeeded; entry point and calculator files left unchanged

---

### Task 5 — Create auth adapter interface stub for future Cognito

| Field | Detail |
|-------|--------|
| **Objective** | Isolate existing Amplify/Cognito code behind a swappable boundary |
| **Files likely modified** | `frontend/src/auth/authAdapter.js` (new), optionally move logic from `LandingPage.jsx` |
| **Dependencies** | Task 4 |
| **Expected result** | `mockAuthAdapter` used in Phase 1; `cognitoAuthAdapter` stub exports same interface, not wired |
| **Acceptance criteria** | `AuthContext` depends on adapter interface only; `amplify-config.js` untouched for now |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `frontend/src/auth/authAdapter.js` with `mockAuthAdapter` and a non-wired `cognitoAuthAdapter` stub sharing the same interface
- Updated `AuthContext.jsx` to use an injected adapter interface, defaulting to `mockAuthAdapter` for Phase 1
- Confirmed no Amplify imports in `frontend/src/auth/` and verified with `npm run build` passing

---

### Task 6 — Create ApplicationWorkspace shell component

| Field | Detail |
|-------|--------|
| **Objective** | Three-area layout: hero, sidebar, central content |
| **Files likely modified** | `frontend/src/workspace/ApplicationWorkspace.jsx` (new) |
| **Dependencies** | Tasks 1, 4 |
| **Expected result** | Shell renders hero + sidebar + `<Outlet />` or children slot |
| **Acceptance criteria** | Renders without errors; no module content yet |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `frontend/src/workspace/ApplicationWorkspace.jsx` with a three-area shell: hero placeholder, sidebar placeholder, and central content area
- Implemented `children` fallback with `children ?? <Outlet />` using `react-router-dom` without wiring routes yet
- Verified with `npm run build`; no changes to `main.jsx`, `App.jsx`, `LandingPage.jsx`, or calculator files

---

### Task 7 — Implement WorkspaceHero section

| Field | Detail |
|-------|--------|
| **Objective** | Top brand area per dashboard spec |
| **Files likely modified** | `frontend/src/workspace/WorkspaceHero.jsx` (new), possibly refactor `AppHeader.jsx` |
| **Dependencies** | Task 6 |
| **Expected result** | Logo, HFZWood name, headline, subtitle, background image |
| **Acceptance criteria** | Matches spec copy; reuses existing brand assets (`/hefzech-logo.png`, header background) |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `WorkspaceHero.jsx` with dashboard-spec copy and workspace-specific classes (`workspace-hero`, `workspace-hero__*`)
- Wired `WorkspaceHero` into `ApplicationWorkspace.jsx`; added minimal `workspace-hero*` styles in `styles.css` without reusing `.app-header`
- Reused `/hefzech-logo.png` and `/header-wood-epoxy.png`; `AppHeader.jsx` and calculator files left unchanged

---

### Task 8 — Implement WorkspaceSidebar navigation

| Field | Detail |
|-------|--------|
| **Objective** | Persistent left nav from config |
| **Files likely modified** | `frontend/src/workspace/WorkspaceSidebar.jsx` (new) |
| **Dependencies** | Tasks 2, 6, 4 |
| **Expected result** | All nav items render; active item highlighted; lock icon when guest + `requiresAuth` |
| **Acceptance criteria** | Sidebar visible on all workspace routes; Login/Register never locked in guest mode |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `WorkspaceSidebar.jsx` rendering all seven items from `WORKSPACE_NAV_ITEMS` with workspace-specific class names
- Added optional `isAuthenticated = false` prop for guest lock display; no direct `AuthContext` import or router active-state handling yet
- Wired sidebar into `ApplicationWorkspace.jsx`; lock icon shown for guest + `requiresAuth`; Login/Register never locked; `npm run build` passed

---

### Task 9 — Add workspace layout CSS

| Field | Detail |
|-------|--------|
| **Objective** | Visual structure consistent with existing warm ivory theme |
| **Files likely modified** | `frontend/src/styles.css` or `frontend/src/workspace/workspace.css` (new) |
| **Dependencies** | Tasks 6–8 |
| **Expected result** | Hero + sidebar + content grid; calm spacing; responsive baseline (sidebar stacks on narrow viewport) |
| **Acceptance criteria** | Layout usable at desktop width; no horizontal overflow in shell |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Added workspace layout and sidebar styles to `frontend/src/styles.css`, scoped to `.application-workspace`, `.workspace-*`, and `.workspace-sidebar*`
- Implemented desktop sidebar-left grid, warm ivory surfaces, responsive stacked layout below 768px, and overflow-safe content column
- `npm run build` succeeded; no JSX or calculator file changes; existing `.app-header` and calculator workspace classes left untouched

---

### Task 10 — Wire workspace router shell

| Field | Detail |
|-------|--------|
| **Objective** | Connect router to ApplicationWorkspace as layout route |
| **Files likely modified** | `frontend/src/workspace/WorkspaceRouter.jsx` (new), `frontend/src/main.jsx` |
| **Dependencies** | Tasks 1, 3, 6 |
| **Expected result** | All workspace routes render inside shell |
| **Acceptance criteria** | Browser navigation works; back/forward preserves shell |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `WorkspaceRouter.jsx` with `ApplicationWorkspace` as a layout route and `RoutePlaceholder` for each workspace path; exported `WORKSPACE_ROUTE_PATHS` and `isWorkspacePath()`
- Updated `main.jsx` with `BrowserRouter`, workspace-path branching to `WorkspaceRouter`, and legacy `/` unchanged (`LandingPage` / `App` calculator)
- Updated `WorkspaceSidebar.jsx` to use `NavLink` with active styling and `preventDefault` on locked items
- Added `.workspace-sidebar__link--active` in `styles.css`; `ROUTES.HOME` excluded from workspace paths; `GuestIntro` wiring deferred to Task 37
- `npm run build` succeeded

---

## Phase 1B — Guest & Authentication (Tasks 11–23)

### Task 11 — Create GuestIntro central content

| Field | Detail |
|-------|--------|
| **Objective** | Default guest/authenticated landing content per spec |
| **Files likely modified** | `frontend/src/workspace/GuestIntro.jsx` (new) |
| **Dependencies** | Task 6 |
| **Expected result** | Positioning statement, supporting line, video placeholder, account-required message |
| **Acceptance criteria** | Copy matches dashboard-spec suggested text |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `GuestIntro.jsx` with approved positioning statement, supporting line, video placeholder, and account message
- Added minimal scoped `guest-intro*` styles in `styles.css`; component not wired into routing yet (deferred to Task 37)
- `npm run build` succeeded; `WorkspaceRouter.jsx`, `main.jsx`, and calculator files left unchanged

---

### Task 12 — Create LockedModuleMessage component

| Field | Detail |
|-------|--------|
| **Objective** | Friendly locked-feature message for guest nav clicks |
| **Files likely modified** | `frontend/src/workspace/LockedModuleMessage.jsx` (new) |
| **Dependencies** | Task 11 |
| **Expected result** | Shows spec message when guest selects locked module |
| **Acceptance criteria** | Message appears in central area; does not navigate away from workspace |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `LockedModuleMessage.jsx` with approved title, explanatory text, and text-only action line
- Added scoped `locked-module-message*` styles in `styles.css`; component not wired into navigation yet (deferred to Task 13)
- `npm run build` succeeded; `WorkspaceSidebar.jsx`, `WorkspaceRouter.jsx`, `main.jsx`, and calculator files left unchanged

---

### Task 13 — Implement guest navigation guard logic

| Field | Detail |
|-------|--------|
| **Objective** | Locked modules show LockedModuleMessage; auth routes remain accessible |
| **Files likely modified** | `frontend/src/workspace/useWorkspaceNavigation.js` (new), `WorkspaceSidebar.jsx` |
| **Dependencies** | Tasks 4, 8, 12 |
| **Expected result** | Guest clicking New Project / Projects / Manual / Glossary / KB → locked message; Login/Register → auth pages |
| **Acceptance criteria** | Behavior matches application-design §6 Guest Mode |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `useWorkspaceNavigation.js` with `WorkspaceNavigationProvider`, locked-view state, and guest lock helpers
- Updated `ApplicationWorkspace.jsx` with workspace-scoped `AuthProvider`, navigation provider, and conditional `LockedModuleMessage` vs `<Outlet />`
- Updated `WorkspaceSidebar.jsx` to render locked items as clickable buttons (show locked message) and Login / Register as `NavLink`
- Adjusted `styles.css` for clickable locked sidebar items; direct URL guards deferred; `main.jsx` and calculator files left unchanged
- Manual verification passed on `/login`; `npm run build` succeeded

---

### Task 14 — Guest Mode smoke test

| Field | Detail |
|-------|--------|
| **Objective** | Verify guest behavior independently |
| **Files likely modified** | `frontend/src/workspace/GuestMode.test.jsx` (new) |
| **Dependencies** | Tasks 10, 13 |
| **Expected result** | Tests: guest sees all nav items; locked click shows message; intro video area present |
| **Acceptance criteria** | `npm run test` passes |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `GuestMode.test.jsx` with three smoke tests: all sidebar nav items visible for guests, locked click shows `LockedModuleMessage`, and `GuestIntro` video placeholder present
- Tests render `WorkspaceRouter` in `MemoryRouter` at `/login` with cleared `sessionStorage`; no production source changes
- `npm run test` passed (12 tests: 9 existing + 3 new)

---

### Task 15 — Create Login page UI

| Field | Detail |
|-------|--------|
| **Objective** | In-app login interface (UI shell, not Cognito Hosted UI) |
| **Files likely modified** | `frontend/src/auth/LoginPage.jsx` (new) |
| **Dependencies** | Tasks 4, 10 |
| **Expected result** | Email/username + password fields, submit button, link to Register and Password Recovery |
| **Acceptance criteria** | Renders inside workspace central area; accessible from sidebar |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `LoginPage.jsx` with email/username field, password field, Log in button, and links to Register and Password Recovery (UI only; submit prevents default, no `login()` call)
- Updated `WorkspaceRouter.jsx` so `/login` renders `LoginPage` inside the workspace shell; added scoped `login-page*` styles in `styles.css`
- Manual verification passed; `npm run build` and `npm run test` succeeded; `AuthContext`, calculator files, and `main.jsx` left unchanged

---

### Task 16 — Create Registration page UI

| Field | Detail |
|-------|--------|
| **Objective** | In-app registration interface |
| **Files likely modified** | `frontend/src/auth/RegisterPage.jsx` (new) |
| **Dependencies** | Task 15 |
| **Expected result** | Registration form with validation messages (client-side only) |
| **Acceptance criteria** | Successful submit calls mock `login()` and redirects to workspace |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `RegisterPage.jsx` with email, username, password, and confirm-password fields plus link back to Login
- Client-side validation on submit (required fields, email format, password length, password match); valid submit resets form only — no `login()` or redirect (deferred to Task 18)
- Updated `WorkspaceRouter.jsx` so `/register` renders `RegisterPage`; added scoped `register-page*` styles in `styles.css`
- Manual verification passed; `npm run build` and `npm run test` succeeded

---

### Task 17 — Create Password Recovery page UI

| Field | Detail |
|-------|--------|
| **Objective** | Password recovery interface (UI only) |
| **Files likely modified** | `frontend/src/auth/PasswordRecoveryPage.jsx` (new) |
| **Dependencies** | Task 15 |
| **Expected result** | Email field + submit; confirmation message (no real email sent) |
| **Acceptance criteria** | Page reachable from Login; no backend dependency |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `PasswordRecoveryPage.jsx` with email field, submit button, link back to Login, and client-side email validation
- Valid submit shows a confirmation message (no API call or email sent); invalid submit shows field errors
- Updated `WorkspaceRouter.jsx` so `/password-recovery` renders `PasswordRecoveryPage`; added scoped `password-recovery-page*` styles in `styles.css`
- Manual verification passed; `npm run build` and `npm run test` succeeded

---

### Task 18 — Wire mock login/logout flow

| Field | Detail |
|-------|--------|
| **Objective** | Complete Phase 1 auth UX without production services |
| **Files likely modified** | `AuthContext.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`, `WorkspaceSidebar.jsx` |
| **Dependencies** | Tasks 4, 15–17 |
| **Expected result** | Login/Register authenticates user; sidebar switches to Authenticated Mode |
| **Acceptance criteria** | Refresh preserves session; logout returns to Guest Mode |
| **Completion date** | 2026-06-30 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- `LoginPage.jsx` calls mock `login()` on valid submit and navigates to `/projects`; `RegisterPage.jsx` calls `login({ email, username })` after valid registration submit and navigates to `/projects`
- Session persists via existing `AuthContext` + `sessionStorage` (`hfzwood.mockAuth`); no `AuthContext` changes required
- Added temporary sidebar **Log out** button for Task 18 verification — clears session, returns to `/login`, and guest lock behavior is restored
- Manual verification passed; `npm run build` and `npm run test` succeeded

---

### Task 19 — Auth UI smoke tests

| Field | Detail |
|-------|--------|
| **Objective** | Verify mock auth flows |
| **Files likely modified** | `frontend/src/auth/AuthFlow.test.jsx` (new) |
| **Dependencies** | Task 18 |
| **Expected result** | Tests: login unlocks nav; logout re-locks modules; session restore works |
| **Acceptance criteria** | `npm run test` passes |
| **Completion date** | 2026-07-01 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `AuthFlow.test.jsx` with three smoke tests using `MemoryRouter` + `WorkspaceRouter` and `sessionStorage` setup/teardown
- Login flow test: submit login form unlocks **New Project** navigation and shows **Log out**
- Logout flow test: **Log out** re-locks navigation, returns to login page, and clears `hfzwood.mockAuth`
- Session restoration test: pre-seeded `sessionStorage` restores authenticated nav without submitting login
- No production source changes; `npm run test` passed (15 tests)

---

### Task 20 — Implement Authenticated Mode nav unlock

| Field | Detail |
|-------|--------|
| **Objective** | All module nav items active when authenticated |
| **Files likely modified** | `WorkspaceSidebar.jsx`, `useWorkspaceNavigation.js` |
| **Dependencies** | Task 18 |
| **Expected result** | No lock icons; module routes navigable |
| **Acceptance criteria** | Guest vs authenticated behavior clearly distinct |
| **Completion date** | 2026-07-01 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Existing Tasks 13 and 18 already satisfied authenticated nav unlock via `isNavItemLocked()` and `useAuth().isAuthenticated`; no production source changes required
- Added `AuthenticatedNav.test.jsx` to verify guest locked navigation, authenticated unlocked links without lock icons, and sidebar navigation to protected module routes
- Manual review confirmed guest vs authenticated behavior remains distinct; Login / Register still visible (Task 21 deferred); `npm run build` and `npm run test` passed (18 tests)

---

### Task 21 — Replace Login/Register with My Account nav item

| Field | Detail |
|-------|--------|
| **Objective** | Sidebar shows My Account when authenticated |
| **Files likely modified** | `WorkspaceSidebar.jsx`, `navigation.js` |
| **Dependencies** | Task 20 |
| **Expected result** | `Login / Register` hidden after auth; `My Account` shown |
| **Acceptance criteria** | Matches dashboard-spec Authenticated Mode |
| **Completion date** | 2026-07-01 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Added `getVisibleWorkspaceNavItems(isAuthenticated)` in `navigation.js` to hide Login / Register when authenticated while keeping My Account in the config
- Guest sidebar: Login / Register link visible; My Account remains locked; `WorkspaceSidebar.jsx` renders filtered items
- Authenticated sidebar: Login / Register hidden; My Account shown as a normal link; temporary Log out button retained; `/account` still uses `RoutePlaceholder` (Task 22)
- Manual verification passed; `npm run build` and `npm run test` succeeded (19 tests)

---

### Task 22 — Create My Account page UI

| Field | Detail |
|-------|--------|
| **Objective** | Profile, subscription status placeholder, settings placeholder |
| **Files likely modified** | `frontend/src/account/MyAccountPage.jsx` (new) |
| **Dependencies** | Tasks 10, 21 |
| **Expected result** | Sections for profile info, subscription status (static placeholder), settings links |
| **Acceptance criteria** | Logout control present; no real billing integration |
| **Completion date** | 2026-07-01 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `MyAccountPage.jsx` with profile section (mock `username` and `email` from `useAuth()`), subscription free-plan placeholder, and settings coming-soon placeholders
- Updated `WorkspaceRouter.jsx` so `/account` renders `MyAccountPage`; added scoped `my-account-page*` styles in `styles.css`
- Page **Log out** button calls mock `logout()`, clears locked-module state, and navigates to `/login`; sidebar logout retained
- Manual verification passed; no profile editing or billing/backend integration; `npm run build` and `npm run test` succeeded (19 tests)

---

### Task 23 — My Account page test

| Field | Detail |
|-------|--------|
| **Objective** | Verify account page and logout |
| **Files likely modified** | `frontend/src/account/MyAccountPage.test.jsx` (new) |
| **Dependencies** | Task 22 |
| **Expected result** | Renders profile stub; logout works |
| **Acceptance criteria** | `npm run test` passes |
| **Completion date** | 2026-07-01 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `MyAccountPage.test.jsx` with four tests using `MemoryRouter` + `WorkspaceRouter` at `/account` and seeded `sessionStorage`
- Verifies mock profile username/email, subscription placeholder, and settings placeholder text
- Verifies account-page logout clears session and returns to guest login mode with locked navigation restored
- No production source changes required; `npm run test` passed (23 tests)

---

## Phase 1C — Platform Modules (Tasks 24–28)

### Task 24 — Create shared ModulePlaceholder component

| Field | Detail |
|-------|--------|
| **Objective** | Reusable placeholder for Phase 2+ modules |
| **Files likely modified** | `frontend/src/workspace/ModulePlaceholder.jsx` (new) |
| **Dependencies** | Task 6 |
| **Expected result** | Title + short description + “Coming in a future phase” message |
| **Acceptance criteria** | Styling consistent with workspace |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `ModulePlaceholder.jsx` accepting `title` and `description` props with shared **Coming in a future phase.** message
- Added scoped `module-placeholder*` styles in `styles.css` consistent with workspace content panels
- Routing intentionally left unchanged; component not wired into `WorkspaceRouter` yet (Tasks 25–28)
- `npm run build` and `npm run test` succeeded (23 tests)

---

### Task 25 — Projects module placeholder page

| Field | Detail |
|-------|--------|
| **Objective** | Routed Projects destination for authenticated users |
| **Files likely modified** | `frontend/src/modules/ProjectsPage.jsx` (new) |
| **Dependencies** | Tasks 10, 20, 24 |
| **Expected result** | Placeholder explaining future project list |
| **Acceptance criteria** | Reachable only when authenticated |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `ProjectsPage.jsx` using `ModulePlaceholder` with Projects title and description of future saved resin estimation projects
- Updated `WorkspaceRouter.jsx` so `/projects` renders `ProjectsPage` inside the workspace shell
- No project list, save/load, persistence, or backend integration; manual verification passed; `npm run build` and `npm run test` succeeded (23 tests)

---

### Task 26 — Manual & Tutorials placeholder page

| Field | Detail |
|-------|--------|
| **Objective** | Educational module stub |
| **Files likely modified** | `frontend/src/modules/ManualTutorialsPage.jsx` (new) |
| **Dependencies** | Tasks 10, 20, 24 |
| **Expected result** | Placeholder with module description from docs |
| **Acceptance criteria** | Authenticated route works |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `ManualTutorialsPage.jsx` using `ModulePlaceholder` with Manual & Tutorials title and description of future user manual, tutorials, learning resources, and best practices
- Updated `WorkspaceRouter.jsx` so `/manual` renders `ManualTutorialsPage` inside the workspace shell
- No manual content, tutorials, search, markdown rendering, or document loading; manual verification passed; `npm run build` and `npm run test` succeeded (23 tests)

---

### Task 27 — Glossary placeholder page

| Field | Detail |
|-------|--------|
| **Objective** | Glossary module stub |
| **Files likely modified** | `frontend/src/modules/GlossaryPage.jsx` (new) |
| **Dependencies** | Tasks 10, 20, 24 |
| **Expected result** | Placeholder page routed from sidebar |
| **Acceptance criteria** | Authenticated route works |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `GlossaryPage.jsx` using `ModulePlaceholder` with Glossary title and description covering woodworking/resin terminology, material definitions, tool descriptions, and common HFZWood concepts
- Updated `WorkspaceRouter.jsx` so `/glossary` renders `GlossaryPage` inside the workspace shell
- No glossary entries, search, alphabetical navigation, filtering, or other glossary functionality; manual verification passed; `npm run build` and `npm run test` succeeded (23 tests)

---

### Task 28 — Knowledge Base placeholder page

| Field | Detail |
|-------|--------|
| **Objective** | Knowledge Base module stub |
| **Files likely modified** | `frontend/src/modules/KnowledgeBasePage.jsx` (new) |
| **Dependencies** | Tasks 10, 20, 24 |
| **Expected result** | Placeholder page routed from sidebar |
| **Acceptance criteria** | Authenticated route works |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `KnowledgeBasePage.jsx` using `ModulePlaceholder` with Knowledge Base title and description covering technical articles, troubleshooting guides, resin calculation techniques, woodworking workflows, FAQs, and advanced reference documentation
- Updated `WorkspaceRouter.jsx` so `/knowledge-base` renders `KnowledgeBasePage` inside the workspace shell
- No knowledge base articles, categories, search, filtering, markdown rendering, or other knowledge base functionality; manual verification passed; `npm run build` and `npm run test` succeeded (23 tests)

---

## Phase 1D — Calculator Integration & Verification (Tasks 29–42)

### Task 29 — Extract calculator into dedicated component

| Field | Detail |
|-------|--------|
| **Objective** | Preserve calculator logic without rewriting |
| **Files likely modified** | Rename/move `App.jsx` → `frontend/src/calculator/ResinCalculator.jsx`; update imports |
| **Dependencies** | None (can parallelize after Task 1, but do before routing integration) |
| **Expected result** | All existing calculator behavior unchanged; export `ResinCalculator` |
| **Acceptance criteria** | `npm run build` succeeds; existing `App.test.jsx` still passes against extracted component |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Extracted calculator implementation from `App.jsx` into `frontend/src/calculator/ResinCalculator.jsx` and exported `ResinCalculator`
- Updated `App.jsx` to a thin wrapper that imports and renders `ResinCalculator`
- Applied minimal path adjustment for `AppHeader` import after extraction (`./AppHeader` to `../AppHeader`)
- Calculator behavior was preserved with no intentional changes to UI flow, calculations, upload/save/import, or PDF export

---

### Task 30 — Remove duplicate AppHeader from calculator when inside workspace

| Field | Detail |
|-------|--------|
| **Objective** | Avoid double hero when calculator loads in workspace |
| **Files likely modified** | `ResinCalculator.jsx`, `WorkspaceHero.jsx` |
| **Dependencies** | Tasks 7, 29 |
| **Expected result** | Calculator renders without top `AppHeader`; workspace hero provides branding |
| **Acceptance criteria** | Calculator UI intact below workspace shell; no duplicate headers |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Added optional `showHeader` prop to `ResinCalculator` with default `true` so header rendering can be controlled per usage context
- Preserved legacy calculator behavior at root by keeping default header-visible rendering through `App.jsx`
- Prepared calculator for Task 31 workspace integration by allowing future usage with `showHeader={false}` to avoid duplicate headers without changing calculator logic

---

### Task 31 — Route New Project to calculator (authenticated only)

| Field | Detail |
|-------|--------|
| **Objective** | Connect primary action to existing workflow |
| **Files likely modified** | `WorkspaceRouter.jsx`, `navigation.js` |
| **Dependencies** | Tasks 20, 29, 30 |
| **Expected result** | Authenticated user selecting New Project opens `ResinCalculator` in central area |
| **Acceptance criteria** | Upload, draw, calculate, save/import, PDF export still work |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Integrated `ResinCalculator` into `WorkspaceRouter` so authenticated New Project navigation renders calculator in the workspace central area
- Routed `/new-project` to `ResinCalculator` and replaced the previous New Project placeholder route
- Rendered calculator with `showHeader={false}` to keep the workspace hero as the only top branding header
- Preserved legacy root `/` behavior where `App.jsx` still renders calculator with its original header

---

### Task 32 — Guest blocked from calculator route

| Field | Detail |
|-------|--------|
| **Objective** | Direct URL to `/calculator` guarded in guest mode |
| **Files likely modified** | `frontend/src/workspace/AuthRouteGuard.jsx` (new), `WorkspaceRouter.jsx` |
| **Dependencies** | Tasks 13, 31 |
| **Expected result** | Guest navigating to calculator URL sees LockedModuleMessage or redirect |
| **Acceptance criteria** | No calculator access without authentication |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Created `AuthRouteGuard.jsx`.
- Protected the `/new-project` calculator route with `AuthRouteGuard`.
- Guests accessing the calculator route directly now see `LockedModuleMessage`.
- Authenticated users continue to access `ResinCalculator` with `showHeader={false}`.
- No redirect logic introduced.
- No future tasks implemented.

---

### Task 33 — Calculator integration regression tests

| Field | Detail |
|-------|--------|
| **Objective** | Ensure calculator still works after extraction and routing |
| **Files likely modified** | `frontend/src/calculator/ResinCalculator.test.jsx` (migrate from `App.test.jsx`) |
| **Dependencies** | Tasks 29, 31 |
| **Expected result** | Existing smoke tests pass against `ResinCalculator` |
| **Acceptance criteria** | `npm run test` passes; key workflows (upload UI, save error, PDF disabled) covered |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Added `frontend/src/calculator/ResinCalculator.test.jsx`.
- Added regression tests for the extracted `ResinCalculator` component.
- Verified calculator rendering, upload UI, workflow entry, Import Project, Save Project, Export PDF initial state, save-without-image validation, and AppHeader behavior.
- `App.test.jsx` remained unchanged and continues to pass.
- No production behavior changed.
- No future tasks implemented.

---

### Task 34 — Refactor main.jsx to workspace-first entry

| Field | Detail |
|-------|--------|
| **Objective** | All users land in Application Workspace (Guest or Authenticated) |
| **Files likely modified** | `frontend/src/main.jsx` |
| **Dependencies** | Tasks 10, 18 |
| **Expected result** | No more `LandingPage` gate; `AuthProvider` + `WorkspaceRouter` at root |
| **Acceptance criteria** | App loads workspace in guest mode by default |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Refactored `main.jsx` so the application is workspace-first.
- Removed the legacy `LandingPage` authentication gate from `main.jsx`.
- Preserved `AuthCallback` handling.
- Added a minimal index route in `WorkspaceRouter` so `/` renders `GuestIntro` inside `ApplicationWorkspace`.
- `LandingPage` remains unchanged and is no longer used by `main.jsx`.
- No redirect from `/` to `/projects`.
- No future tasks implemented.

---

### Task 35 — Retire or redirect legacy LandingPage

| Field | Detail |
|-------|--------|
| **Objective** | Align with doc Guest Mode (workspace replaces separate landing) |
| **Files likely modified** | `LandingPage.jsx` (delete or redirect stub), `main.jsx` |
| **Dependencies** | Task 34 |
| **Expected result** | `LandingPage` no longer primary entry; guest intro lives in workspace |
| **Acceptance criteria** | No dead routes; no duplicate login UX |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Retired the legacy `LandingPage` by replacing it with a minimal stub component.
- `LandingPage` now returns `null` and is clearly marked as a legacy component.
- Removed the legacy embedded login UX while preserving file/module stability.
- `LandingPage` is no longer reachable through the application entry or routing flow.
- Workspace-first entry remains unchanged from Task 34.
- No future tasks implemented.

---

### Task 36 — Preserve /callback route for future Cognito (non-blocking)

| Field | Detail |
|-------|--------|
| **Objective** | Keep OAuth callback path available without activating production auth |
| **Files likely modified** | `WorkspaceRouter.jsx`, `AuthCallback.jsx` |
| **Dependencies** | Tasks 5, 34 |
| **Expected result** | `/callback` renders `AuthCallback` with message or future hook; does not break mock auth flow |
| **Acceptance criteria** | Route exists; Phase 1 does not require Cognito env vars |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Verified that the existing `/callback` route already satisfies the Phase 1 requirements.
- `AuthCallback` remains reachable and functional.
- No Cognito activation or Amplify login wiring was introduced.
- Mock authentication flow remains unaffected.
- No code changes were required.
- No future tasks implemented.

---

### Task 37 — Default workspace home route behavior

| Field | Detail |
|-------|--------|
| **Objective** | Define what `/` shows in each mode |
| **Files likely modified** | `WorkspaceRouter.jsx` |
| **Dependencies** | Tasks 11, 18 |
| **Expected result** | Guest → `GuestIntro`; Authenticated → `GuestIntro` or redirect to Projects (document choice: intro OK for Phase 1) |
| **Acceptance criteria** | Consistent, predictable home behavior |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Confirmed `/` renders `GuestIntro` inside `ApplicationWorkspace` for both Guest and Authenticated users.
- No production code changes were required.
- Added `HomeRouteBehavior.test.jsx` covering guest and authenticated home behavior.
- Confirmed no redirect from `/` to `/projects`.
- No future tasks implemented.

---

### Task 38 — Emphasize New Project as primary action (authenticated)

| Field | Detail |
|-------|--------|
| **Objective** | Visual emphasis per application-design §6 |
| **Files likely modified** | `WorkspaceSidebar.jsx`, `workspace.css` |
| **Dependencies** | Task 20 |
| **Expected result** | New Project uses primary-action styling when authenticated |
| **Acceptance criteria** | Visually distinct from other nav items |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Added primary-action styling for the authenticated New Project navigation item.
- Primary styling is applied only when the user is authenticated and the item is not locked.
- Guest mode remains unchanged and New Project stays locked.
- Existing active-state behavior is preserved.
- No routing, authentication, calculator, or backend behavior changed.
- No future tasks implemented.

---

### Task 39 — End-to-end workspace navigation test

| Field | Detail |
|-------|--------|
| **Objective** | Verify full Phase 1 navigation matrix |
| **Files likely modified** | `frontend/src/workspace/WorkspaceNavigation.test.jsx` (new) |
| **Dependencies** | Tasks 25–31, 34 |
| **Expected result** | Tests cover: guest locked modules, auth pages, authenticated module routes, calculator via New Project |
| **Acceptance criteria** | `npm run test` passes |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Added `WorkspaceNavigation.test.jsx`.
- Added full Phase 1 workspace navigation matrix coverage.
- Covered guest locked navigation, Login/Register access, direct guest `/new-project` protection, authenticated module navigation, My Account, and New Project calculator access.
- Verified New Project primary-action styling for authenticated users.
- No production code changes were required.
- No future tasks implemented.

---

### Task 40 — Production build verification

| Field | Detail |
|-------|--------|
| **Objective** | Confirm deployable artifact |
| **Files likely modified** | None (verification only) |
| **Dependencies** | All prior tasks |
| **Expected result** | `npm run build` succeeds; bundle loads in browser |
| **Acceptance criteria** | No console errors on initial load; workspace renders |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Verified successful production build.
- Verified all frontend tests pass.
- Confirmed no production code changes were required.
- Observed only the existing non-blocking Vite chunk-size warning.
- No production build issues requiring code changes were found.
- No future tasks implemented.

---

### Task 41 — Backend regression check

| Field | Detail |
|-------|--------|
| **Objective** | Ensure Phase 1 frontend changes do not break API |
| **Files likely modified** | None (verification only) |
| **Dependencies** | Task 31 |
| **Expected result** | `uv run --project backend pytest` (or existing test command) passes |
| **Acceptance criteria** | Calculator API calls still work when auth middleware disabled locally |
| **Completion date** | 2026-07-02 |
| **Implementation status** | Completed |
| **Verification status** | Passed |

**Implementation notes:**
- Ran backend regression suite with `uv run --project backend pytest backend/test_app.py -v`.
- Backend regression suite passed: 34 tests.
- Verified frontend build and frontend tests still pass.
- Confirmed calculator API paths and backend endpoints remain unchanged.
- Confirmed mock auth/workspace routing changes do not affect backend communication.
- Observed only a non-blocking FastAPI/Starlette/httpx deprecation warning.
- No production code changes were required.
- No future tasks implemented.

---

### Task 42 — Phase 1 completion checklist review

| Field | Detail |
|-------|--------|
| **Objective** | Map implementation to roadmap Phase 1 objectives |
| **Files likely modified** | None |
| **Dependencies** | Task 40 |
| **Expected result** | Written confirmation each roadmap objective is met |
| **Acceptance criteria** | All Phase 1 completion items from `implementation-roadmap.md` checked off |

---

## Dependency overview (critical path)

```
Task 1 → 2 → 3 → 6 → 10 → 13 → 18 → 20 → 31 → 34 → 40
              ↓
              4 → 5 → 15–17 → 18
              ↓
              29 → 30 → 31 → 33
```

**Parallelizable after Task 6:** Tasks 11–12, 24, 29  
**Parallelizable after Task 20:** Tasks 25–28  
**Tests:** Tasks 14, 19, 23, 33, 39 after their feature blocks

---

## Phase 1 completion mapping (roadmap objectives)

| Roadmap objective | Covered by tasks |
|-------------------|------------------|
| Application Workspace implemented | 6–10, 9 |
| Guest + Authenticated modes defined | 11–14, 18–20 |
| All nav modules routable | 2–3, 10, 25–28 |
| Login, Register, Password Recovery UI | 15–17 |
| My Account UI | 21–22 |
| Calculator via New Project | 29–32 |
| Stable navigation | 10, 34, 39 |
| Ready for backend auth integration | 4–5, 36 |

---

## Out of scope for Phase 1 (explicit)

- AWS Cognito production wiring
- DynamoDB / S3 project persistence
- CDK stack changes
- Real subscription/billing
- Educational content CMS
- Backend API changes (unless auth guard breaks local dev — verify Task 41)

---

## Recommended execution order (summary)

Execute tasks **1 → 42 sequentially** by number, allowing parallel work only where noted. Do not start Task 31 until Task 29 calculator extraction is complete and tested. Do not refactor `main.jsx` (Task 34) until workspace shell and mock auth are functional in isolation.

This checklist is ready to execute one task at a time.
