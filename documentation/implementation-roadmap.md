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
