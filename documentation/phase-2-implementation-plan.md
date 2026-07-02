# Phase 2 Implementation Plan

Status: In Progress (Tasks 43–49 complete)

Version: 1.0
# Product Principles

The following principles define the overall philosophy of HFZWood during Phase 2. They are intended to guide every design and implementation decision throughout the development process.

## 1. Home is the primary navigation hub

After authentication, every user enters the Logged-in Home page. This page acts as the central navigation hub of the application and provides access to all major modules.

The Home page is intentionally simple, presenting only the primary navigation menu together with a short product presentation consisting of an introductory video and concise explanatory text.

## 2. One task, one workspace

Each major module is presented in its own dedicated workspace.

When a user enters a module such as New Project, Projects, Manual and Tutorials, Glossary or Knowledge Base, the Home navigation layout is replaced by a module-specific interface optimized for the current task.

The interface should always maximize the available working area and minimize unnecessary distractions.

## 3. Navigation must always be explicit

Users must always have a clear and obvious way to return to the Logged-in Home page.

Navigation should never rely solely on conventions such as clicking the application logo.

Every dedicated module must provide an explicit Home navigation element.

## 4. Protect user work

The application must never allow users to accidentally lose their work.

Whenever a user attempts to leave a project containing unsaved changes, the application must require an explicit decision to save, discard or continue editing before navigation is allowed.

## 5. Learning is integrated into the product

Educational content is considered a core feature of HFZWood rather than separate documentation.

The Manual and Tutorials module combines written documentation with embedded instructional videos, allowing users to learn concepts and immediately see them demonstrated in context.

## 6. Knowledge grows over time

The Knowledge Base is designed as a long-term knowledge system.

Phase 2 establishes only its structural foundation. Future phases will extend it into an intelligent question-and-answer system powered by a private knowledge source maintained alongside the product documentation.

## 7. Simplicity over feature density

Every interface should remain focused on the user's current objective.

Additional functionality should only be introduced when it clearly improves the user experience.

Whenever two solutions provide similar functionality, the simpler and more intuitive solution should be preferred.

## 8. Product-first development

Implementation tasks must always follow the product architecture rather than define it.

Product behavior, user experience and navigation are designed first; technical implementation exists only to support those decisions.
# Technical Context

Phase 2 continues the existing Phase 1 technical stack and architecture.

The current application uses a React + Vite frontend, Vitest for frontend testing, and a FastAPI backend where backend functionality is required.

Phase 2 should not introduce a new framework, routing strategy, state management library or backend architecture unless explicitly required by a task.

Implementation should extend the existing Phase 1 structure and conventions.
# Phase 2 Implementation Structure

Phase 2 transforms HFZWood from a completed application shell into a usable product experience.

The goal of this phase is not to add advanced AI, payments, subscriptions or production-grade backend infrastructure. The goal is to build the core logged-in product flow: a clear Home hub, dedicated workspaces, project creation and saving, project reopening, Manual and Tutorials, Glossary and a placeholder foundation for the future Knowledge Base.

Phase 2 will be implemented in controlled tasks, larger than the Phase 1 tasks but still clearly bounded. Each task must remain focused on one coherent product capability.

## Phase 2A — Logged-in Product Shell

This section defines the logged-in Home page, the main navigation model and the dedicated module layout pattern.

Tasks in this section establish the structural rules for the rest of Phase 2.

## Phase 2B — Project Workflow

This section defines how users start a new project, work on it, save it, name it, return to Home and reopen previous projects.

Tasks in this section turn the application into a usable project-based tool.

## Phase 2C — Manual and Tutorials

This section defines the educational area of the product.

The Manual and Tutorials module combines written documentation and embedded videos inside a dedicated reading layout.

## Phase 2D — Glossary and Knowledge Base Foundation

This section defines the product reference area.

The Glossary is implemented as a usable searchable reference module. The Knowledge Base is introduced only as a structural placeholder for future AI-powered expansion.

## Phase 2E — Final Integration and Stabilization

This section verifies that all Phase 2 modules work together consistently.

It focuses on navigation, layout consistency, manual testing, cleanup and final documentation alignment.
## Task 43 — Logged-in Home Hub

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Objective             | Build the logged-in Home page as the primary navigation hub of the application.                                                                                                                                                                                                                                                                                    |
| Files likely modified | Existing logged-in layout/page components, workspace navigation components, route configuration if needed, shared styles if needed                                                                                                                                                                                                                                 |
| Dependencies          | Phase 1 complete; Product Principles defined                                                                                                                                                                                                                                                                                                                       |
| Expected result       | After login, the user lands on a clean Home page with the main left navigation visible, New Project visually emphasized, and a central product presentation area containing an introductory video placeholder and concise explanatory text.                                                                                                                        |
| Acceptance criteria   | The Home page displays the main navigation items: New Project, Projects, Manual and Tutorials, Glossary, Knowledge Base and Logout. New Project is visually emphasized. The central area contains a video placeholder and short product explanation. No Start New Project button is added. The Home page remains visually simple and acts only as the primary hub. |
| Completion date       | 2026-07-02                                                                                                                                                                                                                                                                                                                                                         |
| Implementation status | Completed                                                                                                                                                                                                                                                                                                                                                          |
| Verification status   | Passed                                                                                                                                                                                                                                                                                                                                                             |

**Implementation notes:**
- Added `HomeRoute.jsx` to render `GuestIntro` for guests and `LoggedInHome` for authenticated users at `/`
- Added `LoggedInHome.jsx` with welcome text, supporting copy, and a platform overview video placeholder (no Start New Project button)
- Updated `WorkspaceRouter.jsx` index route to use `HomeRoute`
- Added `getLoggedInHomeNavItems()` in `navigation.js`; `WorkspaceSidebar.jsx` uses it on authenticated `/` (hides My Account on the home hub only)
- Updated `LoginPage.jsx` and `RegisterPage.jsx` to redirect to `/` after successful auth instead of `/projects`
- Added `.logged-in-home*` styles in `styles.css`
- Updated `HomeRouteBehavior.test.jsx`, `AuthFlow.test.jsx`, and `WorkspaceNavigation.test.jsx` for the new home hub behavior
## Task 44 — Dedicated Module Layout Pattern

| Field                 | Detail                                                                                                                                                                                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Establish the shared layout pattern used by all dedicated modules outside the logged-in Home page.                                                                                                                                                                                                                          |
| Files likely modified | Shared layout components, module wrapper components, navigation components, route configuration if needed, shared styles if needed                                                                                                                                                                                          |
| Dependencies          | Task 43                                                                                                                                                                                                                                                                                                                     |
| Expected result       | Dedicated modules such as New Project, Projects, Manual and Tutorials, Glossary and Knowledge Base open in their own focused layout instead of using the Home sidebar layout.                                                                                                                                               |
| Acceptance criteria   | The main Home sidebar is not displayed inside dedicated modules. Each dedicated module has a clear and explicit Home navigation element. The layout provides maximum usable space for the active module. The pattern is reusable across all Phase 2 modules. No module-specific business logic is implemented in this task. |
| Completion date       | 2026-07-02                                                                                                                                                                                                                                                                                                                |
| Implementation status | Completed                                                                                                                                                                                                                                                                                                                 |
| Verification status   | Passed                                                                                                                                                                                                                                                                                                                    |

**Implementation notes:**
- Added `DedicatedModuleLayout`, `ModuleHeader`, `ModuleHomeNav`, and `HomeHubLayout`; refactored `ApplicationWorkspace` to nest layout routes
- Applied `DedicatedModuleLayout` **only** to `/new-project`; Projects, Manual, Glossary, Knowledge Base, and My Account remain on `HomeHubLayout`
- Added `DEDICATED_MODULE_PATHS`, `DEDICATED_MODULE_TITLES`, and `getDedicatedModuleTitle()` in `navigation.js`
- Compact module header (logo + product title + Home) replaces home sidebar inside dedicated modules
- Updated `WorkspaceNavigation.test.jsx` and `AuthenticatedNav.test.jsx` for dedicated layout on New Project
## Task 45 — New Project Opens Application Workspace

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Configure the New Project action to open the application's dedicated project workspace, where users perform the complete resin estimation workflow.                                                                                                                                                                                                                                                                                 |
| Files likely modified | Project workspace page/components, routing, shared module layout, navigation components, shared styles if needed                                                                                                                                                                                                                                                                                                                    |
| Dependencies          | Task 44                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Expected result       | Selecting **New Project** from the Logged-in Home page opens the application's full-screen working environment. The user enters the existing resin estimation workspace directly, without any intermediate page.                                                                                                                                                                                                                    |
| Acceptance criteria   | Selecting **New Project** immediately opens the application workspace. The Home sidebar is hidden and replaced by the dedicated module layout. The application workspace maximizes the available working area for image upload, calibration, polygon creation and volume estimation. A clear Home navigation element is available. Project saving, project naming and project management are intentionally excluded from this task. |
| Completion date       | 2026-07-02                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Implementation status | Completed                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Verification status   | Passed                                                                                                                                                                                                                                                                                                                                                                                                                             |

**Implementation notes:**
- Added `NewProjectWorkspace.jsx` wrapper; `/new-project` renders calculator inside existing `DedicatedModuleLayout` from Task 44
- Added `workspaceVariant="dedicated"` to `ResinCalculator` (presentation-only) to omit duplicate product title when `ModuleHeader` already identifies the workspace
- Workspace CSS: full-width calculator (removes `.container` 1100px cap), widened shell (up to 1760px), reduced card-in-card nesting, progressive taller `.work-area` for the image canvas
- Preserved all calculator workflow, logic, and Phase 1 Save/Import/PDF behavior unchanged
- Added `NewProjectWorkspace.test.jsx`; updated `ResinCalculator.test.jsx`, `WorkspaceNavigation.test.jsx`, and `AuthenticatedNav.test.jsx`
## Task 46 — Unsaved Changes Protection

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Objective             | Protect users from accidentally losing their work when leaving the Application Workspace.                                                                                                                                                                                                                                                                                                                                                        |
| Files likely modified | Application workspace components, navigation components, confirmation dialog components, routing logic if needed                                                                                                                                                                                                                                                                                                                                 |
| Dependencies          | Task 45                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Expected result       | When a user attempts to leave the Application Workspace with unsaved changes, the application requires an explicit decision before allowing navigation.                                                                                                                                                                                                                                                                                          |
| Acceptance criteria   | Attempting to navigate to Home or another module while the current project contains unsaved changes displays a confirmation dialog with the options **Save Project**, **Discard Changes**, and **Cancel**. **Save Project** continues to the project save flow. **Discard Changes** leaves the workspace without saving. **Cancel** returns the user to the Application Workspace. No project naming or persistence is implemented in this task. |
| Completion date       | 2026-07-02                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Implementation status | Completed                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Verification status   | Passed                                                                                                                                                                                                                                                                                                                                                                                                                                             |

**Implementation notes:**
- Added `projectDirtyState.js` — dirty state reflects meaningful project work only (upload alone does not mark dirty)
- Added `UnsavedChangesDialog.jsx` with Save Project, Discard Changes, and Cancel actions
- Updated `NewProjectWorkspace.jsx` with `useBlocker` navigation guard and save-flow handoff via `saveProjectRequestRef`
- Migrated `main.jsx` to `createBrowserRouter` + `RouterProvider` (required for `useBlocker`)
- Added `renderWorkspaceRouter.jsx` test helper using `createMemoryRouter`
- Added `UnsavedChangesDialog.test.jsx` and `UnsavedChangesProtection.test.jsx`
- Updated router-dependent tests to use `RouterProvider`
## Task 47 — Save Project Flow

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Implement the user-facing flow for saving a project from the Application Workspace.                                                                                                                                                                                                                                                                                                 |
| Files likely modified | Application workspace components, save project dialog/modal components, project state utilities, navigation logic, shared styles if needed                                                                                                                                                                                                                                          |
| Dependencies          | Task 46                                                                                                                                                                                                                                                                                                                                                                             |
| Expected result       | The user can choose **Save Project** from the Application Workspace or from the unsaved changes dialog, enter a project name, save the project, and return to the Logged-in Home page after the save is completed.                                                                                                                                                                  |
| Acceptance criteria   | A **Save Project** action is available in the Application Workspace. Saving requires a project name. The same save dialog is used when the user chooses **Save Project** from the unsaved changes dialog. After a successful save, the user is returned to the Logged-in Home page. The task does not implement the Projects list, reopening projects or advanced project metadata. |
| Completion date       | 2026-07-02                                                                                                                                                                                                                                                                                                                                                                              |
| Implementation status | Completed                                                                                                                                                                                                                                                                                                                                                                           |
| Verification status   | Passed                                                                                                                                                                                                                                                                                                                                                                                |

**Implementation notes:**
- Added `SaveProjectDialog.jsx` — project name input with Cancel and Save only
- Added `projectFileSave.js` and `projectFileTypes.js` — complete `.hfzproject` file generation, safe filename slug, native save picker with download fallback
- Updated `NewProjectWorkspace.jsx` to own save orchestration: dialog, snapshot retrieval, file save, dirty clearing, and Home navigation
- Updated `ResinCalculator.jsx` with `forwardRef` exposing `getProjectSnapshot()` only; dedicated workspace Save delegates to workspace via `onSaveProjectRequest`
- Saved project files include full calculator snapshot with original image data; import-compatible with existing Import Project flow
- Updated Import Project `accept` filter to include `.hfzproject`, `application/vnd.hfzwood.project+json`, and legacy `.json` / `application/json`
- Added save-dialog and save-flow styles in `styles.css`
- Added `SaveProjectDialog.test.jsx`, `SaveProjectFlow.test.jsx`, and `projectFileSave.test.js`; updated `ResinCalculator.test.jsx` and integration tests
## Task 48 — Projects Hub and Open Project

| Field                 | Detail |
| --------------------- | ------ |
| Objective             | Build the dedicated Projects Hub and allow users to open existing `.hfzproject` files from their device. |
| Files likely modified | Projects page/components, dedicated module layout, shared navigation components, project file open/import utilities, recent projects metadata utilities, routing configuration, shared styles if needed |
| Dependencies          | Task 47 |
| Expected result       | Selecting **Projects** from the Logged-in Home page opens a dedicated Projects Hub. The page provides an **Open Project** action, displays recently accessed projects using lightweight local metadata, allows users to start a new project, and opens valid project files into the Application Workspace with their saved state restored. |
| Acceptance criteria   | The Home sidebar is hidden and the dedicated module layout is used. A clear Home navigation element is visible. The Projects Hub contains: **(1)** a prominent **Open Project** action allowing the user to browse for any `.hfzproject` or legacy `.json` file using the operating system file picker; **(2)** a **Recent Projects** section showing recently opened or saved projects using lightweight local metadata only; **(3)** a clear empty state when no recent projects exist; **(4)** an easy way to start a **New Project**. Selecting a valid project from either **Open Project** or **Recent Projects** opens the Application Workspace and restores the complete saved project state. Recent Projects entries are interactive. The application does not automatically scan the user's filesystem and does not maintain a complete library of all existing projects. Updating an already opened project file remains Task 49. |
| Completion date       | 2026-07-02 |
| Implementation status | Completed |
| Verification status   | Passed |

**Implementation notes:**
- Added `ProjectsPage.jsx` — Projects Hub with **Open Project**, **Recent Projects**, empty state, and **New Project** link
- Added `projectFileParse.js` — shared `.hfzproject` / legacy JSON parse and validation (used by calculator import and hub open flow)
- Added `recentProjectsIndex.js` — lightweight recent-project metadata in `localStorage` (name, timestamps, filename; no snapshot or `image.dataUrl`)
- Added `recentProjectHandles.js` — optional `FileSystemHandle` storage in IndexedDB keyed by recent entry id
- Added `projectFileOpen.js` — OS file picker open, `loadProjectFromFile`, `loadRecentProject`, and `recordSavedProjectInRecentIndex` after successful save
- Moved `/projects` to `DedicatedModuleLayout` with `AuthRouteGuard`; added `ROUTES.PROJECTS` to `DEDICATED_MODULE_PATHS` in `navigation.js`
- Updated `NewProjectWorkspace.jsx` to restore opened projects via `pendingProjectRestore` router state and `restoreProjectSnapshot()`
- Updated `ResinCalculator.jsx` with shared `parseProjectFileText` and ref API `restoreProjectSnapshot()`; updated `projectFileSave.js` to return save metadata for recent-index updates
- Successful Task 47 save also upserts a lightweight Recent entry (handle stored only when the native save picker provides one)
- Added `.projects-hub*` styles; added `ProjectsPage.test.jsx`, `OpenProjectFlow.test.jsx`, `projectFileParse.test.js`, and `recentProjectsIndex.test.js`; updated navigation and save-flow tests


## Task 49 — Update Existing Project

| Field                 | Detail |
| --------------------- | ------ |
| Objective             | Introduce the concept of a **Current Project** and make the existing **Save Project** command behave intelligently when a project has been reopened from Projects Hub. When a valid Current Project identity exists, saving updates the opened project file in place. Task 47 first-save behavior for brand-new projects remains unchanged. |
| Files likely modified | Application Workspace components, save project logic, project state utilities, project persistence utilities, routing/navigation logic if needed |
| Dependencies          | Task 48 |
| Expected result       | When a user reopens a saved project, makes changes, and chooses **Save Project**, the application updates the same project file and the same Recent Projects entry instead of creating an unintended duplicate. Brand-new projects continue to use the existing Task 47 save flow unchanged. |
| Acceptance criteria   | Task 49 introduces **Current Project** identity for reopened projects. When a valid Current Project identity exists, **Save Project** updates the currently opened project file with no project name dialog, no file picker, and a silent save operation; Current Project identity is preserved; the corresponding Recent Projects entry is updated; and the project becomes clean (not dirty). Reopened projects retain their project identity. The project name, image thumbnail, calibration data, polygon data and calculation state are preserved after update. Unsaved changes protection still applies. Task 47 behavior for brand-new projects remains completely unchanged. Task 49 does not introduce a Save As workflow, Save As user interface, version history, duplicate-as-new, archiving, or deletion. |
| Completion date       | 2026-07-03 |
| Implementation status | Completed |
| Verification status   | Passed |

**Implementation notes:**
- For an already opened project, **Save Project** behaves like the Save command in a traditional desktop application.
- Added `currentProject.js` — workspace-scoped **Current Project** identity (`new` vs `opened`) with recent entry id, project name, filename, and optional writable `FileSystemHandle`.
- Added `updateProjectFile()` in `projectFileSave.js` — in-place write to a known handle; `saveProjectFile()` (Task 47) semantics unchanged.
- Updated `NewProjectWorkspace.jsx` — save branching, Current Project hydration from IndexedDB, baseline snapshot dirty detection, silent save for bound opened projects.
- Updated `ProjectsPage.jsx` — passes `openContext` when opening projects; **Locate Project File** rebinds the existing recent entry via `loadProjectIntoRecentEntry()` instead of creating a duplicate.
- Added `projectSnapshotCompare.js` — baseline equality ignores volatile fields (`savedAt`, image dimensions) so restored projects start clean.
- Added `updateRecentProjectOnSave()` and `refreshRecentProjectOnOpen()` in `recentProjectsIndex.js`; added `recordUpdatedProjectInRecentIndex()` and `loadProjectIntoRecentEntry()` in `projectFileOpen.js`.
- Updated `ResinCalculator.jsx` with `onProjectRestored` callback; removed blanket `importedProject → dirty` from `projectDirtyState.js`.
- Recent entries without a stored handle (older entries or download-only saves) still require manual locate once; after locate, the handle is stored and direct reopen works when the browser allows.
- No Save As UI, cloud persistence, version history, or project management features were added.
## Task 50 — Manual and Tutorials Module

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Build the dedicated Manual and Tutorials module as the main educational area of the product.                                                                                                                                                                                                                                                              |
| Files likely modified | Manual and Tutorials page/component, chapter navigation components, content rendering components, shared module layout, routing, shared styles if needed                                                                                                                                                                                                  |
| Dependencies          | Task 44                                                                                                                                                                                                                                                                                                                                                   |
| Expected result       | Selecting **Manual and Tutorials** from the Logged-in Home page opens a dedicated reading layout with chapter navigation and central manual content.                                                                                                                                                                                                      |
| Acceptance criteria   | The Home sidebar is hidden. The dedicated module layout is used. A clear Home navigation element is visible. A chapter navigation area is displayed. Manual content is displayed in the main reading area. Tutorial videos can be embedded directly inside the manual content where relevant. This task does not require final production manual content. |
## Task 51 — Manual Reading Layout and Chapter Experience

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Define and implement the detailed reading experience for the Manual and Tutorials module.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Files likely modified | Manual layout components, chapter sidebar components, content section components, video embed components, shared styles if needed                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Dependencies          | Task 50                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Expected result       | The Manual and Tutorials module presents a stable, comfortable reading layout with chapter navigation on the left and rich manual content on the right, where instructional videos are embedded directly between the relevant sections of the written documentation.                                                                                                                                                                                                                                                                                                                                 |
| Acceptance criteria   | The manual page uses a dedicated layout with a clear Home navigation element at the top. A chapter list is visible on the left side. Clicking a chapter displays or scrolls to the corresponding manual section. The main content area supports headings, paragraphs, images and embedded tutorial videos placed directly within the manual at the points where they best support the written explanation, creating a single integrated learning experience rather than separate documentation and video sections. The layout should prioritize readability and avoid unnecessary interface clutter. |
## Task 52 — Glossary Module

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Build the dedicated Glossary module as a searchable reference for terminology used throughout HFZWood.                                                                                                                                                                                                                                                                                                                                            |
| Files likely modified | Glossary page/component, search components, glossary list components, glossary entry components, shared module layout, routing, shared styles if needed                                                                                                                                                                                                                                                                                           |
| Dependencies          | Task 44                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Expected result       | Selecting **Glossary** from the Logged-in Home page opens a dedicated reference page where users can quickly find definitions of technical terms used in the application and the manual.                                                                                                                                                                                                                                                          |
| Acceptance criteria   | The Home sidebar is hidden. The dedicated module layout is used. A clear Home navigation element is visible. A prominent search field is displayed at the top of the page. Glossary entries are organized alphabetically and can be filtered using the search function. Each entry supports a term, definition and optional supporting media such as images or embedded videos. The task does not implement AI-powered search or semantic search. |
## Task 53 — Knowledge Base FAQ Module

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Build the initial Knowledge Base as a structured FAQ-style module with expandable questions and answers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Files likely modified | Knowledge Base page/component, FAQ/accordion components, search components, content data/source file, shared module layout, routing, shared styles if needed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Dependencies          | Task 44                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Expected result       | Selecting **Knowledge Base** from the Logged-in Home page opens a dedicated reference module where users can browse practical questions and expand each question to read the answer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Acceptance criteria   | The Home sidebar is hidden. The dedicated module layout is used. A clear Home navigation element is visible. The page displays a list of practical questions such as resin curing problems, bubbles, sanding marks and other recurring issues. Clicking a question expands the answer below it. Content is stored in a simple editable source structure so new questions and answers can be added later without redesigning the module. A prominent search field is available at the top and is designed to search across Knowledge Base, Manual content and Glossary terms. No AI-powered question answering or semantic retrieval is implemented in this task. |
## Task 54 — Module Integration and Navigation Consistency

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Integrate all Phase 2 modules into a single, consistent user experience with predictable navigation and behavior.                                                                                                                                                                                                                                                           |
| Files likely modified | Shared navigation components, routing configuration, shared layouts, module wrappers, shared styles if needed                                                                                                                                                                                                                                                               |
| Dependencies          | Tasks 43–53                                                                                                                                                                                                                                                                                                                                                                 |
| Expected result       | All Phase 2 modules work together as a coherent product with consistent navigation, layout behavior and transitions between modules.                                                                                                                                                                                                                                        |
| Acceptance criteria   | Navigation between Home, Application Workspace, Projects, Manual and Tutorials, Glossary and Knowledge Base is fully functional. Each module uses the correct dedicated layout. Every module provides an explicit Home navigation element. Layout transitions are consistent throughout the application. No duplicate navigation patterns or inconsistent behaviors remain. |
## Task 55 — Phase 2 Manual QA Checklist

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Create and execute a manual QA checklist covering the full Phase 2 user experience.                                                                                                                                                                                                                                                                                                                                                                     |
| Files likely modified | QA checklist documentation, roadmap/status documentation if needed, minor fixes only if discovered during QA                                                                                                                                                                                                                                                                                                                                            |
| Dependencies          | Task 54                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Expected result       | The complete Phase 2 flow is manually verified from the user's perspective before the phase is considered complete.                                                                                                                                                                                                                                                                                                                                     |
| Acceptance criteria   | The checklist verifies login-to-Home behavior, Home navigation, New Project opening the Application Workspace, unsaved changes protection, Save Project flow, Projects list, reopening projects, updating existing projects, Manual and Tutorials layout, Glossary search, Knowledge Base FAQ behavior and explicit Home navigation from every dedicated module. Any issue discovered during QA is either fixed or documented before Phase 2 is closed. |
## Task 56 — Documentation and Roadmap Alignment

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Ensure that all project documentation accurately reflects the completed Phase 2 implementation.                                                                                                                                                                                                                                             |
| Files likely modified | Phase 2 implementation plan, project roadmap, application design documentation, README or other supporting documentation if needed                                                                                                                                                                                                          |
| Dependencies          | Task 55                                                                                                                                                                                                                                                                                                                                     |
| Expected result       | Documentation is fully synchronized with the implemented product and no completed work remains undocumented.                                                                                                                                                                                                                                |
| Acceptance criteria   | The Phase 2 implementation plan is updated where necessary. The project roadmap reflects the completed tasks. Application documentation matches the implemented behavior. Obsolete notes are removed or updated. Future phases clearly identify any intentionally deferred functionality, including AI-powered Knowledge Base capabilities. |
## Task 57 — Phase 2 Completion and Release Validation

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Objective             | Complete the official closure of Phase 2 by validating the final product, ensuring repository integrity and preparing the project for Phase 3 development.                                                                                                                                                                                                                                 |
| Files likely modified | None, unless final corrections are required following validation.                                                                                                                                                                                                                                                                                                                          |
| Dependencies          | Task 56                                                                                                                                                                                                                                                                                                                                                                                    |
| Expected result       | Phase 2 is officially completed with a stable application, synchronized documentation and a clean repository ready for the next development phase.                                                                                                                                                                                                                                         |
| Acceptance criteria   | The application builds successfully without errors. All automated tests pass. Manual QA has been completed successfully. Project documentation and roadmap are synchronized with the implemented product. The repository is clean and synchronized with the main branch. A final Phase 2 commit and push have been completed. Phase 3 can begin without requiring additional Phase 2 work. |
# Phase 2 Data Persistence Decision

During Phase 2 Task 47, **Save Project** writes a complete project file to the user's device (`.hfzproject` JSON format). The file includes project metadata, the full calculator snapshot, and the original uploaded image data so the user can reopen the project later without re-uploading the image.

The native file save picker is used when supported; otherwise the browser falls back to a standard download.

Task 48 adds a lightweight **Recent Projects** index in browser storage for hub convenience only. Recent entries store metadata and an optional file handle when available; they never store the project snapshot or original image. Project files on disk remain the source of truth.

Backend/database persistence, user-specific cloud storage, synchronization, and a complete in-app project library are intentionally deferred to later Phase 2 tasks and future phases.

A complete saved project file should include, where available:
- project name and save timestamp;
- original uploaded image data;
- calibration/reference data;
- polygon and boundary data;
- mold, wood, and cavity data;
- depth and calculation state;
- results where available.
# Out of Scope for Phase 2

The following features have been intentionally excluded from Phase 2. Their absence is a deliberate product decision rather than an omission, and they are expected to be evaluated in future development phases.

* AI-powered Knowledge Base.
* Semantic search across documentation.
* Natural language question answering.
* Automatic project saving (Auto Save).
* Project version history.
* Project duplication.
* Project archiving.
* Project deletion.
* Advanced project metadata and organization.
* User preferences and personalized settings.
* Administrative interface for content management.
* Direct editing of Manual, Glossary and Knowledge Base content from within the application.
* Cloud collaboration and project sharing.
* Notifications and activity history.
* Offline mode.
* Mobile-specific interface optimization.
* Production-grade analytics and usage reporting.
* Multi-language content management.
* Subscription, licensing and payment features.

Future phases may introduce any of these capabilities after the core user experience established in Phase 2 has been completed and validated.
* Knowledge Base AI integration. During Phase 2, the Knowledge Base will be implemented as a structured FAQ module with searchable expandable questions and answers, providing the foundation for a future AI-powered knowledge system.

---

**Phase 2 status:** In progress (2026-07-03). Tasks 43–49 of 15 (Tasks 43–57) implemented and verified. Next: Task 50 — Manual and Tutorials Module.

