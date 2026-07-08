# HFZWood – Implementation Roadmap

## Purpose

This document defines the implementation strategy for the HFZWood platform.

While the Application Design document describes the complete vision of the platform, this roadmap defines the recommended development order.

The objective is to build a stable, functional and scalable application by implementing one module at a time.

Each phase should produce a working version of the application before moving to the next stage.

---

# Development Philosophy

Development should follow these principles:

* Build one feature at a time.
* Every phase should produce a usable application.
* Stability is more important than speed.
* New features should not break existing functionality.
* Test every module before continuing.
* Keep the architecture scalable from the beginning.

The implementation order may change if technical requirements evolve, but the general philosophy should remain unchanged.
# Phase 1 – Foundation

## Objective

The objective of Phase 1 is to build a stable technical foundation for the HFZWood platform.

At the end of this phase, users should be able to create an account, access the application and reach the main dashboard.

No resin calculation features are implemented during this phase.

The focus is entirely on establishing the infrastructure required for future development.

## Main Components

Phase 1 includes:

* project setup;
* application architecture;
* database configuration;
* user authentication;
* user registration;
* login and logout;
* password recovery;
* user profile;
* dashboard;
* basic application settings.

## Dashboard

The Dashboard should become the central entry point of the application.

From here, users should be able to:

* create a new project;
* open an existing project;
* access the Manual;
* access Tutorials;
* access the Knowledge Base;
* access the Glossary;
* view subscription status;
* manage account settings.

At the end of Phase 1, some module routes displayed placeholder content. Phase 2 (Tasks 50–53) replaced the Manual, Glossary, and Knowledge Base placeholders with functional modules.

## Objectives for Completion

Phase 1 is considered complete when:

* users can register successfully;
* users can log in and log out;
* password recovery is functional;
* user profiles are operational;
* the Dashboard is fully navigable;
* the application architecture supports future modules.

No calculation functionality is required before Phase 1 is completed.

## Success Criteria

Before moving to Phase 2, the application should provide a stable, secure and reliable user experience.

Every component introduced in this phase should be fully tested before additional functionality is implemented.

# Phase 2 – Logged-in Product Experience

> Active Phase 2 scope and task tracking live in [`documentation/phase-2-implementation-plan.md`](phase-2-implementation-plan.md) (Tasks 43–57). The calculator workflow was delivered in Phase 1; Phase 2 builds the logged-in product shell, project workflow, and educational modules.

## Progress (2026-07-03)

**Phase 2 status:** Complete (certified Task 57, 2026-07-03).

| Task | Name | Status |
|------|------|--------|
| 43 | Logged-in Home Hub | Complete |
| 44 | Dedicated Module Layout Pattern | Complete |
| 45 | New Project Workspace | Complete |
| 46 | Unsaved Changes Protection | Complete |
| 47 | Save Project Flow | Complete |
| 48 | Projects Hub and Open Project | Complete |
| 49 | Update Existing Project | Complete |
| 50 | Manual and Tutorials Module | Complete |
| 51 | Manual Reading Layout and Chapter Experience | Complete |
| 52 | Glossary Module | Complete |
| 53 | Knowledge Base Module | Complete |
| 54 | Phase 2 Integration Polish | Complete |
| 55 | Phase 2 Release Candidate Validation | Complete |
| 56 | Documentation and Roadmap Alignment | Complete |
| 57 | Phase 2 Release Certification | Complete |

## Objective

The objective of Phase 2 is to transform HFZWood from a completed application shell into a usable logged-in product experience.

The resin estimation calculator was delivered in Phase 1. Phase 2 adds the logged-in Home hub, dedicated module layouts, the full project file workflow, and the educational modules (Manual and Tutorials, Glossary, Knowledge Base).

Advanced features such as Computer Vision, cloud project sync, payments, admin tools, global documentation search, and AI assistance are not included in this phase. See the Phase 2 out-of-scope list in [`phase-2-implementation-plan.md`](phase-2-implementation-plan.md).

## Main Components

Phase 2 includes:

* logged-in Home hub with primary navigation;
* dedicated module layout for New Project, Projects, Manual and Tutorials, Glossary, and Knowledge Base;
* New Project workspace (Phase 1 calculator in a focused layout);
* unsaved changes protection;
* Save Project to `.hfzproject` files on the user's device;
* Projects hub with Open Project and Recent Projects (local metadata only);
* update existing project (in-place save for reopened projects);
* Manual and Tutorials as a continuous document with table of contents;
* Glossary as a searchable dictionary with A–Z navigation;
* Knowledge Base as a searchable troubleshooting library;
* integration polish across module headers, navigation, search behavior, and empty states.

## Objectives for Completion

Phase 2 is considered complete when:

* an authenticated user can navigate the Home hub and all dedicated modules;
* a user can create a project, save it, reopen it, update it, and return Home without losing work unexpectedly;
* Manual, Glossary, and Knowledge Base are usable as integrated product modules;
* Release Candidate validation (Task 55) and documentation alignment (Task 56) are complete;
* the repository builds, tests pass, and Task 57 closure criteria are met.

## Success Criteria

Before moving beyond Phase 2, the logged-in product experience must feel like one coherent application from Home through project work and educational modules.

A user should be able to complete a basic project session and find help in the Manual, Glossary, or Knowledge Base without developer assistance.

# Phase 3 – Product Maturity

> Active Phase 3 scope and task tracking live in [`documentation/phase-3-implementation-plan.md`](phase-3-implementation-plan.md) (Tasks 58–66). Technical implementation guidance is defined in [`documentation/phase-3-technical-architecture.md`](phase-3-technical-architecture.md).

## Progress (2026-07-08)

**Phase 3 status:** **COMPLETE** (certified 2026-07-08; baseline commit `e1fe554`).

| Task | Name | Status |
|------|------|--------|
| 58 | Admin Panel Foundation | Complete |
| 59 | Manual Content Management | Complete |
| 60 | Glossary Content Management | Complete |
| 61 | Knowledge Base Content Management | Complete |
| 62 | Shared Editorial Infrastructure | Complete |
| 63 | Application Preferences | Complete (accepted) |
| 64 | Roles, Authorization & Product Capability Foundation | Complete (accepted) |
| 65 | Phase 3 Integration, QA & Documentation Alignment | Complete (accepted) |
| 66 | Phase 3 Release Certification | Complete |

## Current baseline

Task 58 is complete and approved. Task 59 (Manual Content Management) is complete and approved. Task 60 (Glossary Content Management) is complete and approved. Task 61 (Knowledge Base Content Management) is complete and approved. Task 62 (Editorial Infrastructure) is complete and approved. Task 63 (Application Preferences) is complete, passed Product Owner manual QA, and is accepted. The repository baseline now includes:

* dedicated `/admin` route branch with administrator-only guard;
* admin Manual workspace at `/admin/manual` with chapter list, TipTap chapter editor, EN/RO locale switching, and explicit Save/Publish controls (no autosave);
* backend admin Manual API under `/api/admin/manual/chapters` with filesystem JSON persistence for local development;
* per-locale draft save/load and publish with published snapshot generation;
* static Phase 2 manual migration script and public Manual API (`/api/content/manual/{locale}`);
* public `/manual` served from admin-published snapshots when available, with legacy static fallback only when no admin snapshot exists;
* local manual image upload and public image serving for editor-inserted illustrations;
* admin Glossary workspace at `/admin/glossary` with entry list, TipTap definition editor, relationship pickers, EN/RO locale switching, and explicit Save/Publish controls;
* backend admin Glossary API under `/api/admin/glossary/entries` with filesystem JSON persistence, relationship validation, and published snapshot rebuild on delete;
* static Phase 2 glossary migration script and public Glossary API (`/api/content/glossary?locale=`);
* public `/glossary` served from admin-published snapshots when available, with legacy static fallback only when no admin snapshot exists;
* local glossary image upload and discreet public rendering of related terms, synonyms, and see-also references;
* admin Knowledge Base workspace at `/admin/knowledge-base` with entry list, structured troubleshooting template editor (list fields per section), relationship pickers, EN/RO locale switching, and explicit Save/Publish controls;
* backend admin Knowledge Base API under `/api/admin/knowledge-base/entries` with filesystem JSON persistence, category/difficulty metadata on ContentItem, relationship validation, and published snapshot rebuild on delete;
* static Phase 2 knowledge base migration script and public Knowledge Base API (`/api/content/knowledge-base?locale=`);
* public `/knowledge-base` served from admin-published snapshots when available, with legacy static fallback only when no admin snapshot exists;
* local knowledge base image upload, search-keyword discoverability (keywords never displayed publicly), and discreet public rendering of related articles, glossary terms, and manual chapters;
* category and difficulty remain administrator-only metadata (not exposed in the public Knowledge Base interface);
* shared editorial platform (`frontend/src/editorial/`) used by all three admin content modules: management shell, top toolbar, sidebar, locale switcher, status banner, unsaved-changes dialog, cross-reference picker, media panel, and workspace state hook;
* consistent editorial status model across Manual, Glossary and Knowledge Base: Unsaved, Draft, Live, and Draft changes (stale), with **Save draft** and **Publish** / **Update public** controls that never conflate draft save with public update;
* `editorialVisibility` field on admin variant API responses, computed server-side from `status`, `updatedAt`, and `publishedAt`;
* shared backend editorial services: image upload validation, global reference search (`GET /api/admin/references/search`), cross-reference validation, snapshot publish helpers, and editorial identity helpers;
* module-specific editors (TipTap manual, glossary definition, KB structured template) unchanged; only management pages consolidated onto the shared shell;
* per-user application preferences API (`GET/PUT /api/preferences`) with filesystem storage for local development and DynamoDB-ready repository interface;
* `PreferencesProvider` and Application Preferences page (`/account/preferences`) for interface language (en/ro), length unit, and volume unit;
* browser-language detection on first launch only (before first saved preference);
* i18n infrastructure (`frontend/src/i18n/`) for high-visibility user surfaces;
* display-unit conversion in the calculator (`frontend/src/units/conversion.js`) without changing canonical project data or backend calculations;
* public Manual, Glossary, and Knowledge Base modules request content by interface language with localized unavailable messaging and explicit English fallback;
* Application Preferences reachable by normal authenticated users — My Account is linked from the Home hub sidebar and from every dedicated module header, and surfaces Application Preferences as a prominent card — and interface language switching localizes navigation, Home, workspace hero, My Account, Preferences, dialogs, and the locked-module surface;
* compact quick-preference controls (interface language, length unit, volume unit) on the authenticated Home sidebar and the New Project workspace, reusing the shared `PreferencesProvider` and persisting immediately via `updatePreferences`;
* Manual admin chapter creation writes the variant in the admin's active locale (EN or RO); the admin sidebar lists only chapters with a saved variant in the active locale, with a per-locale empty state; deleting a chapter warns that it removes the chapter in all languages;
* calculator display units (length and volume labels, inputs, and outputs) reflect user preferences without changing canonical project data;
* secure administrator authorization (`user` / `administrator` roles; Cognito `administrators` group);
* backend-owned product capability catalog (`free`, `subscriber`, `administrator_unlimited`) with `GET /api/me/capabilities`;
* frontend `CapabilitiesProvider` with `useCapability()` / `useCapabilityLimit()` — infrastructure only, no visible commercial gating.

**Official baseline:** `e1fe554` on `main` (Task 65 release audit). All Phase 3 development builds on this commit.

---

# Phase 4 – Cloud Platform

> Phase 4 scope is defined at a high level in [`documentation/chatgpt-project-handover.md`](chatgpt-project-handover.md). A detailed Phase 4 implementation plan will be created before implementation begins.

## Status

**Phase 4 status:** Not started (planning baseline established 2026-07-08).

## Objective

Move HFZWood from the Phase 3 local-development model (mock auth, filesystem CMS storage) to a production cloud platform while preserving all Phase 3 product behavior.

## Expected scope (high level)

* real Cognito authentication on the frontend;
* cloud project storage and synchronization;
* online project library;
* project sharing;
* DynamoDB persistence for CMS content, preferences, and entitlements (replacing filesystem dev repos);
* AWS CDK updates for new data stores and services.

## Out of scope for Phase 4

Subscriptions, Stripe, billing, commercial capability gating UI, AI, and semantic search remain in Phase 5+ per the long-term roadmap.

## Phase 3 foundation to preserve

* single calculator philosophy;
* single CMS / editorial platform;
* role vs access-tier separation;
* product capability catalog (`free` / `subscriber` / `administrator_unlimited`);
* Draft / Live editorial workflow;
* EN / RO independent locale variants;
* Application Preferences and Quick Preferences.

## Next step

Product Owner approval of Phase 4 scope, followed by Phase 4 Product Architecture and Technical Architecture documents before any implementation.
