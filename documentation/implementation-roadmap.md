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

At this stage, some sections may still display placeholder content while future phases are under development.

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

> Active Phase 2 scope and task tracking live in [`documentation/phase-2-implementation-plan.md`](phase-2-implementation-plan.md) (Tasks 43–58). The calculator workflow was delivered in Phase 1; Phase 2 builds the logged-in product shell, project workflow, and educational modules.

## Progress (2026-07-02)

| Task | Name | Status |
|------|------|--------|
| 43 | Logged-in Home Hub | Complete |
| 44 | Dedicated Module Layout Pattern | Complete |
| 45 | New Project Workspace | Complete |
| 46 | Unsaved Changes Protection | Complete |
| 47 | Save Project Flow | Complete |
| 48–58 | Remaining Phase 2 tasks | Pending |

## Objective

The objective of Phase 2 is to transform HFZWood from a completed application shell into a usable logged-in product experience.

At the end of this phase, users should be able to create a project, upload an image, define reference measurements, draw resin areas and calculate the required resin volume.

This phase focuses only on the essential calculator functionality.

Advanced features such as Computer Vision, PDF reports, payments, admin tools and AI assistance are not included in this phase.

## Main Components

Phase 2 includes:

* create new project;
* upload project image;
* image display;
* zoom and pan;
* image rotation when needed;
* reference measurements;
* minimum four reference measurements;
* polygon drawing;
* multiple resin zones;
* depth input;
* different depths for different zones;
* resin volume calculation;
* basic result display.

## Reference Measurements

The user must provide a minimum of four reference measurements before the calculation can continue.

The application should not allow the user to calculate resin volume until the required reference measurements are completed.

Reference measurements are essential for converting image dimensions into real-world dimensions and improving calculation accuracy.

## Polygon Drawing

Users should be able to draw one or more polygons over the uploaded image.

Each polygon represents a resin area.

The user should be able to:

* add polygon points;
* adjust polygon points;
* delete polygon points;
* clear a polygon;
* create multiple polygons;
* assign depth to each polygon.

## Depth Input

The user must manually enter depth information.

The application should support:

* one main casting depth;
* separate depths for different resin zones;
* cavity depths when required.

Computer Vision is not responsible for determining depth.

## Calculation Results

The application should calculate and display:

* resin volume for each polygon;
* total resin volume;
* optional safety margin;
* estimated final quantity.

The result should be clear, easy to understand and ready for workshop use.

## Objectives for Completion

Phase 2 is considered complete when:

* a user can create a project;
* a user can upload an image;
* the image can be zoomed, moved and rotated;
* the user can add at least four reference measurements;
* the user can draw one or more resin polygons;
* the user can enter depth values;
* the application calculates resin volume correctly;
* the result is displayed clearly.

## Success Criteria

Before moving to Phase 3, the calculator workflow must be stable and usable from start to finish.

A user should be able to complete a basic resin calculation without developer assistance.
