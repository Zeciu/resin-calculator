# Phase 2 Implementation Plan

Status: In Progress (Task 43 complete)

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
## Task 45 — New Project Opens Application Workspace

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Configure the New Project action to open the application's dedicated project workspace, where users perform the complete resin estimation workflow.                                                                                                                                                                                                                                                                                 |
| Files likely modified | Project workspace page/components, routing, shared module layout, navigation components, shared styles if needed                                                                                                                                                                                                                                                                                                                    |
| Dependencies          | Task 44                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Expected result       | Selecting **New Project** from the Logged-in Home page opens the application's full-screen working environment. The user enters the existing resin estimation workspace directly, without any intermediate page.                                                                                                                                                                                                                    |
| Acceptance criteria   | Selecting **New Project** immediately opens the application workspace. The Home sidebar is hidden and replaced by the dedicated module layout. The application workspace maximizes the available working area for image upload, calibration, polygon creation and volume estimation. A clear Home navigation element is available. Project saving, project naming and project management are intentionally excluded from this task. |
## Task 46 — Unsaved Changes Protection

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Objective             | Protect users from accidentally losing their work when leaving the Application Workspace.                                                                                                                                                                                                                                                                                                                                                        |
| Files likely modified | Application workspace components, navigation components, confirmation dialog components, routing logic if needed                                                                                                                                                                                                                                                                                                                                 |
| Dependencies          | Task 45                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Expected result       | When a user attempts to leave the Application Workspace with unsaved changes, the application requires an explicit decision before allowing navigation.                                                                                                                                                                                                                                                                                          |
| Acceptance criteria   | Attempting to navigate to Home or another module while the current project contains unsaved changes displays a confirmation dialog with the options **Save Project**, **Discard Changes**, and **Cancel**. **Save Project** continues to the project save flow. **Discard Changes** leaves the workspace without saving. **Cancel** returns the user to the Application Workspace. No project naming or persistence is implemented in this task. |
## Task 47 — Save Project Flow

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Implement the user-facing flow for saving a project from the Application Workspace.                                                                                                                                                                                                                                                                                                 |
| Files likely modified | Application workspace components, save project dialog/modal components, project state utilities, navigation logic, shared styles if needed                                                                                                                                                                                                                                          |
| Dependencies          | Task 46                                                                                                                                                                                                                                                                                                                                                                             |
| Expected result       | The user can choose **Save Project** from the Application Workspace or from the unsaved changes dialog, enter a project name, save the project, and return to the Logged-in Home page after the save is completed.                                                                                                                                                                  |
| Acceptance criteria   | A **Save Project** action is available in the Application Workspace. Saving requires a project name. The same save dialog is used when the user chooses **Save Project** from the unsaved changes dialog. After a successful save, the user is returned to the Logged-in Home page. The task does not implement the Projects list, reopening projects or advanced project metadata. |
## Task 48 — Projects Page and Project List

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Build the dedicated Projects page where users can view and manage their saved projects.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Files likely modified | Projects page/component, project list components, project state utilities, routing, shared module layout, shared styles if needed                                                                                                                                                                                                                                                                                                                                                                                                            |
| Dependencies          | Task 47                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Expected result       | Selecting **Projects** from the Logged-in Home page opens a dedicated Projects page displaying the user's saved projects in a clear visual layout that makes it easy to identify and continue previous work.                                                                                                                                                                                                                                                                                                                                 |
| Acceptance criteria   | The Home sidebar is hidden. The dedicated module layout is used. A clear Home navigation element is visible. Saved projects are displayed using a visual card or list layout containing a project thumbnail, project name, project status, creation date and last modified date. Projects are ordered by **Last Modified** in descending order so that the most recently edited project appears first. The page provides a clear empty state when no projects exist. Reopening an existing project is intentionally excluded from this task. |

## Task 49 — Reopen Existing Project

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Allow users to reopen a saved project from the Projects page and continue working in the Application Workspace.                                                                                                                                                                                                                                                                                                                       |
| Files likely modified | Projects page/components, project list/card components, Application Workspace components, project state utilities, routing, shared module layout if needed                                                                                                                                                                                                                                                                            |
| Dependencies          | Task 48                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Expected result       | Selecting a saved project from the Projects page opens that project in the Application Workspace with its saved state restored.                                                                                                                                                                                                                                                                                                       |
| Acceptance criteria   | Saved projects can be selected from the Projects page. Selecting a project opens the Application Workspace without the Home sidebar. The workspace restores the saved project name, image, calibration data, polygon data and relevant calculation state available at the time of saving. A clear Home navigation element remains available. This task does not implement project editing history, versioning, archiving or deletion. |
## Task 50 — Update Existing Project

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Objective             | Allow users to save changes made to an already existing project after it has been reopened.                                                                                                                                                                                                                                                                        |
| Files likely modified | Application Workspace components, save project logic, project state utilities, project persistence utilities, routing/navigation logic if needed                                                                                                                                                                                                                   |
| Dependencies          | Task 49                                                                                                                                                                                                                                                                                                                                                            |
| Expected result       | When a user reopens a saved project, makes changes and saves again, the existing project is updated instead of creating an unintended duplicate.                                                                                                                                                                                                                   |
| Acceptance criteria   | Reopened projects retain their project identity. Saving a reopened project updates the existing saved project. The project name, image thumbnail, calibration data, polygon data and calculation state are preserved after update. Unsaved changes protection still applies. The task does not implement version history, duplicate-as-new, archiving or deletion. |
## Task 51 — Manual and Tutorials Module

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Build the dedicated Manual and Tutorials module as the main educational area of the product.                                                                                                                                                                                                                                                              |
| Files likely modified | Manual and Tutorials page/component, chapter navigation components, content rendering components, shared module layout, routing, shared styles if needed                                                                                                                                                                                                  |
| Dependencies          | Task 44                                                                                                                                                                                                                                                                                                                                                   |
| Expected result       | Selecting **Manual and Tutorials** from the Logged-in Home page opens a dedicated reading layout with chapter navigation and central manual content.                                                                                                                                                                                                      |
| Acceptance criteria   | The Home sidebar is hidden. The dedicated module layout is used. A clear Home navigation element is visible. A chapter navigation area is displayed. Manual content is displayed in the main reading area. Tutorial videos can be embedded directly inside the manual content where relevant. This task does not require final production manual content. |
## Task 52 — Manual Reading Layout and Chapter Experience

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Define and implement the detailed reading experience for the Manual and Tutorials module.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Files likely modified | Manual layout components, chapter sidebar components, content section components, video embed components, shared styles if needed                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Dependencies          | Task 51                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Expected result       | The Manual and Tutorials module presents a stable, comfortable reading layout with chapter navigation on the left and rich manual content on the right, where instructional videos are embedded directly between the relevant sections of the written documentation.                                                                                                                                                                                                                                                                                                                                 |
| Acceptance criteria   | The manual page uses a dedicated layout with a clear Home navigation element at the top. A chapter list is visible on the left side. Clicking a chapter displays or scrolls to the corresponding manual section. The main content area supports headings, paragraphs, images and embedded tutorial videos placed directly within the manual at the points where they best support the written explanation, creating a single integrated learning experience rather than separate documentation and video sections. The layout should prioritize readability and avoid unnecessary interface clutter. |
## Task 53 — Glossary Module

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Build the dedicated Glossary module as a searchable reference for terminology used throughout HFZWood.                                                                                                                                                                                                                                                                                                                                            |
| Files likely modified | Glossary page/component, search components, glossary list components, glossary entry components, shared module layout, routing, shared styles if needed                                                                                                                                                                                                                                                                                           |
| Dependencies          | Task 44                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Expected result       | Selecting **Glossary** from the Logged-in Home page opens a dedicated reference page where users can quickly find definitions of technical terms used in the application and the manual.                                                                                                                                                                                                                                                          |
| Acceptance criteria   | The Home sidebar is hidden. The dedicated module layout is used. A clear Home navigation element is visible. A prominent search field is displayed at the top of the page. Glossary entries are organized alphabetically and can be filtered using the search function. Each entry supports a term, definition and optional supporting media such as images or embedded videos. The task does not implement AI-powered search or semantic search. |
## Task 54 — Knowledge Base FAQ Module

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Build the initial Knowledge Base as a structured FAQ-style module with expandable questions and answers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Files likely modified | Knowledge Base page/component, FAQ/accordion components, search components, content data/source file, shared module layout, routing, shared styles if needed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Dependencies          | Task 44                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Expected result       | Selecting **Knowledge Base** from the Logged-in Home page opens a dedicated reference module where users can browse practical questions and expand each question to read the answer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Acceptance criteria   | The Home sidebar is hidden. The dedicated module layout is used. A clear Home navigation element is visible. The page displays a list of practical questions such as resin curing problems, bubbles, sanding marks and other recurring issues. Clicking a question expands the answer below it. Content is stored in a simple editable source structure so new questions and answers can be added later without redesigning the module. A prominent search field is available at the top and is designed to search across Knowledge Base, Manual content and Glossary terms. No AI-powered question answering or semantic retrieval is implemented in this task. |
## Task 55 — Module Integration and Navigation Consistency

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Integrate all Phase 2 modules into a single, consistent user experience with predictable navigation and behavior.                                                                                                                                                                                                                                                           |
| Files likely modified | Shared navigation components, routing configuration, shared layouts, module wrappers, shared styles if needed                                                                                                                                                                                                                                                               |
| Dependencies          | Tasks 43–54                                                                                                                                                                                                                                                                                                                                                                 |
| Expected result       | All Phase 2 modules work together as a coherent product with consistent navigation, layout behavior and transitions between modules.                                                                                                                                                                                                                                        |
| Acceptance criteria   | Navigation between Home, Application Workspace, Projects, Manual and Tutorials, Glossary and Knowledge Base is fully functional. Each module uses the correct dedicated layout. Every module provides an explicit Home navigation element. Layout transitions are consistent throughout the application. No duplicate navigation patterns or inconsistent behaviors remain. |
## Task 56 — Phase 2 Manual QA Checklist

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Create and execute a manual QA checklist covering the full Phase 2 user experience.                                                                                                                                                                                                                                                                                                                                                                     |
| Files likely modified | QA checklist documentation, roadmap/status documentation if needed, minor fixes only if discovered during QA                                                                                                                                                                                                                                                                                                                                            |
| Dependencies          | Task 55                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Expected result       | The complete Phase 2 flow is manually verified from the user's perspective before the phase is considered complete.                                                                                                                                                                                                                                                                                                                                     |
| Acceptance criteria   | The checklist verifies login-to-Home behavior, Home navigation, New Project opening the Application Workspace, unsaved changes protection, Save Project flow, Projects list, reopening projects, updating existing projects, Manual and Tutorials layout, Glossary search, Knowledge Base FAQ behavior and explicit Home navigation from every dedicated module. Any issue discovered during QA is either fixed or documented before Phase 2 is closed. |
## Task 57 — Documentation and Roadmap Alignment

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective             | Ensure that all project documentation accurately reflects the completed Phase 2 implementation.                                                                                                                                                                                                                                             |
| Files likely modified | Phase 2 implementation plan, project roadmap, application design documentation, README or other supporting documentation if needed                                                                                                                                                                                                          |
| Dependencies          | Task 56                                                                                                                                                                                                                                                                                                                                     |
| Expected result       | Documentation is fully synchronized with the implemented product and no completed work remains undocumented.                                                                                                                                                                                                                                |
| Acceptance criteria   | The Phase 2 implementation plan is updated where necessary. The project roadmap reflects the completed tasks. Application documentation matches the implemented behavior. Obsolete notes are removed or updated. Future phases clearly identify any intentionally deferred functionality, including AI-powered Knowledge Base capabilities. |
## Task 58 — Phase 2 Completion and Release Validation

| Field                 | Detail                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Objective             | Complete the official closure of Phase 2 by validating the final product, ensuring repository integrity and preparing the project for Phase 3 development.                                                                                                                                                                                                                                 |
| Files likely modified | None, unless final corrections are required following validation.                                                                                                                                                                                                                                                                                                                          |
| Dependencies          | Task 57                                                                                                                                                                                                                                                                                                                                                                                    |
| Expected result       | Phase 2 is officially completed with a stable application, synchronized documentation and a clean repository ready for the next development phase.                                                                                                                                                                                                                                         |
| Acceptance criteria   | The application builds successfully without errors. All automated tests pass. Manual QA has been completed successfully. Project documentation and roadmap are synchronized with the implemented product. The repository is clean and synchronized with the main branch. A final Phase 2 commit and push have been completed. Phase 3 can begin without requiring additional Phase 2 work. |
# Phase 2 Data Persistence Decision

During Phase 2, saved projects will use browser localStorage as a temporary client-side persistence layer.

This decision allows the project workflow to be implemented and tested without introducing production backend persistence too early.

Saved project data should include, where available:
- project id;
- project name;
- thumbnail;
- status;
- creation date;
- last modified date;
- uploaded image reference or serialized image data;
- calibration data;
- polygon data;
- calculation state.

Backend/database persistence, user-specific cloud storage and synchronization are intentionally deferred to a future phase.
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

**Phase 2 status:** In progress (2026-07-02). Task 43 of 16 (Tasks 43–58) implemented and verified. Next: Task 44 — Dedicated Module Layout Pattern.

