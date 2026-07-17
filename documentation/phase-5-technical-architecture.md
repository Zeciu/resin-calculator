# HFZWood — Phase 5 Technical Architecture

## 1. Purpose

This document defines the Technical Architecture for the HFZWood platform.

Its purpose is to translate the approved Phase 4 Product Architecture into a concrete implementation architecture without reopening product decisions.

Phase 5 does not define what HFZWood is as a product. That responsibility belongs to the approved Product Architecture.

Phase 5 defines how the approved product behavior will be implemented through frontend architecture, backend architecture, data models, persistence rules, synchronization strategy, security model, APIs, infrastructure, and implementation constraints.

## 2. Relationship with Product Architecture

The Phase 4 Product Architecture is the authoritative source of truth for product behavior.

Technical Architecture must implement the approved product model without changing it.

No technical decision may redefine:

* what constitutes a Project;
* when a Project comes into existence;
* the immutability of the primary image;
* the distinction between Project refinement and new Project creation;
* the mandatory HFZWood workflow;
* authenticated Project ownership;
* the independence of Learning from Projects;
* the relationship between Local Workspace and Cloud Workspace;
* the rule that conflicts are never resolved silently;
* the distinction between Identity, Subscription, and Settings;
* the role of Export and Search as cross-cutting capabilities;
* the status of AI as a future assistant rather than a core product module.

If a technical constraint appears to require changing any approved product decision, implementation must stop and the issue must be escalated as a Product Architecture question.

## 3. Phase 5 Scope

Phase 5 defines the technical architecture required to implement the approved HFZWood product model.

This includes:

* system architecture;
* frontend architecture;
* backend architecture;
* data model;
* Project persistence architecture;
* local storage architecture;
* cloud storage architecture;
* synchronization architecture;
* conflict detection and resolution architecture;
* authentication and ownership architecture;
* subscription capability architecture;
* settings architecture;
* search architecture;
* export architecture;
* security principles;
* infrastructure principles;
* implementation sequencing constraints.

## 4. Out of Scope

Phase 5 does not include:

* production implementation;
* feature coding;
* UI redesign;
* commercial launch;
* Stripe integration details;
* AWS deployment execution;
* marketing content;
* tutorial production;
* new product features;
* AI implementation;
* reopening Phase 4 product decisions.

## 5. Technical Architecture Principle

The core principle of Phase 5 is:

**Technical Architecture must make the approved Product Architecture implementable without changing its product meaning.**

Every technical decision must preserve:

* project-centric architecture;
* Local-First behavior;
* authenticated Project ownership;
* explicit user control over conflict resolution;
* modular separation of responsibilities;
* incremental implementation safety;
* testability;
* future scalability;
* simplicity where possible.

The architecture should be strong enough to guide implementation, but not so over-engineered that it delays a stable first release.
## 6. Technical Architecture Structure

The HFZWood Technical Architecture will be defined through the following architectural areas:

1. **Current System Baseline**

   * existing frontend architecture;
   * existing backend architecture;
   * existing persistence mechanisms;
   * existing authentication and authorization foundations;
   * existing capability system;
   * existing editorial infrastructure;
   * technical debt and transitional components relevant to Phase 6.

2. **Target System Architecture**

   * overall application structure;
   * architectural boundaries;
   * responsibility distribution;
   * communication between major technical components;
   * Local-First system model.

3. **Project Data Model**

   * Project identity;
   * authenticated ownership;
   * Project creation threshold;
   * immutable primary image;
   * Project metadata and content;
   * Project version representation;
   * lifecycle states.

4. **Project Persistence Architecture**

   * canonical Project representation;
   * local persistence;
   * cloud persistence;
   * serialization and file compatibility;
   * persistence guarantees;
   * migration and backward compatibility.

5. **Local Workspace Architecture**

   * local Project discovery;
   * local Project metadata;
   * opening and saving Projects;
   * recent Projects;
   * local deletion;
   * protection of the last remaining copy.

6. **Cloud Workspace Architecture**

   * cloud Project representation;
   * backup and continuity;
   * cloud limits;
   * restore to local device;
   * cloud deletion;
   * interaction with Subscription capabilities.

7. **Synchronization Architecture**

   * synchronization model;
   * connectivity states;
   * safe automatic synchronization;
   * divergent version detection;
   * conflict identification;
   * explicit conflict resolution;
   * prevention of silent data loss.

8. **Frontend Architecture**

   * application structure;
   * module boundaries;
   * state management;
   * providers and shared services;
   * routing;
   * capability enforcement;
   * offline behavior;
   * error handling.

9. **Backend Architecture**

   * application structure;
   * service boundaries;
   * repository interfaces;
   * business rules;
   * authorization enforcement;
   * background operations;
   * error model.

10. **API Architecture**

    * API responsibility boundaries;
    * authentication requirements;
    * ownership enforcement;
    * Project endpoints;
    * content endpoints;
    * preferences endpoints;
    * subscription and capability endpoints;
    * synchronization endpoints;
    * versioning strategy.

11. **Identity and Ownership Architecture**

    * authenticated identity;
    * Project ownership;
    * offline authenticated workflows;
    * authorization boundaries;
    * relationship with Local Workspace and Cloud Workspace.

12. **Subscription and Capability Architecture**

    * subscription tiers;
    * backend-owned capability catalog;
    * enforcement boundaries;
    * free and paid limits;
    * administrator capabilities;
    * future extensibility.

13. **Settings Architecture**

    * account-level preferences;
    * device-specific preferences;
    * persistence ownership;
    * offline availability;
    * synchronization behavior.

14. **Learning and Editorial Architecture**

    * Manual;
    * Tutorials;
    * Glossary;
    * Knowledge Base;
    * draft and publish model;
    * published snapshots;
    * media storage;
    * cross-references;
    * authenticated Learning access.

15. **Cross-Cutting Capabilities**

    * Search;
    * Export;
    * logging;
    * observability;
    * validation;
    * error handling.

16. **Security Architecture**

    * authentication;
    * authorization;
    * ownership validation;
    * input validation;
    * media security;
    * API protection;
    * secrets and configuration;
    * data protection.

17. **Infrastructure Architecture**

    * local development environment;
    * production environment;
    * cloud services;
    * storage services;
    * deployment boundaries;
    * environment configuration;
    * backup and recovery principles.

18. **Migration and Phase 6 Implementation Strategy**

    * current-to-target architecture transition;
    * incremental implementation;
    * compatibility constraints;
    * testing requirements;
    * migration order;
    * rollback and reversibility;
    * architecture completion criteria.
The architectural responsibilities listed above do not necessarily require one dedicated standalone section each.

Where a responsibility is inherently cross-cutting, including security, it may be defined across the relevant architectural boundaries rather than duplicated in a separate consolidated section.

Search functionality must be proportionate to actual approved product scope.

Module-specific search within Manual & Tutorials, Glossary, Knowledge Base, or other approved modules may use mechanisms appropriate to those individual modules.

A unified Global Search architecture is not required for the initial Local-Only launch and must not be treated as a Phase 6 implementation blocker unless explicitly introduced through a later approved product decision.

HFZWood must not introduce a dedicated search service, global index, semantic-search system, vector infrastructure, or other search complexity without a concrete product requirement.

If unified Global Search is introduced later, its architecture must respect authenticated identity, ownership, Product Capabilities, authorization boundaries, content visibility, and any other applicable access restrictions. Search results must never expose Project data, editorial content, administrative content, or other resources that the requesting user is not authorized to access.

The authoritative rule is:

**Architectural responsibilities may be defined either in dedicated sections or across the relevant system boundaries. Security is a cross-cutting responsibility, while Global Search remains deferred unless explicitly approved as a product requirement and is not a prerequisite for the initial Local-Only launch.**

This structure defines the scope of the Technical Architecture work. Individual sections may be refined, merged, or expanded during Phase 5 when necessary, but no technical section may introduce unauthorized product behavior or reopen approved Phase 4 decisions.
## 7. Current System Baseline

HFZWood enters Phase 5 with a substantial working application rather than an empty technical foundation.

The existing system already includes a React/Vite frontend, a FastAPI backend, local Project file persistence, authentication and authorization foundations, a capability catalog, user preferences, a mature editorial content platform, automated tests, and initial AWS infrastructure.

Phase 5 must therefore distinguish between architecture that should be preserved, architecture that requires migration or refactoring, and architecture that does not yet exist.

### 7.1 Frontend Baseline

The frontend is built with React and Vite and uses React Router for application routing.

The application is organized around clearly separated functional areas, including:

* workspace and application shell;
* Project workflow;
* Resin Calculator;
* authentication;
* account and preferences;
* product capabilities;
* administration;
* editorial infrastructure;
* Manual and Tutorials;
* Glossary;
* Knowledge Base;
* internationalization;
* unit conversion.

Shared application state is managed primarily through React Context providers and component-local state. The current provider hierarchy includes authentication, capabilities, preferences, internationalization, and workspace navigation.

No external global state management library is currently required.

The existing frontend module boundaries, provider composition, route guards, relative API communication pattern, and Project file I/O layer provide a strong architectural foundation and should be preserved unless a specific Phase 5 decision requires otherwise.

### 7.2 Backend Baseline

The backend is built with FastAPI.

The current backend combines two different architectural maturity levels:

* editorial, preferences, and capabilities functionality already use structured router, service, schema, and repository patterns;
* calculator endpoints and calculator domain logic remain concentrated in the main application module.

The existing calculator algorithms represent valuable working domain logic and should be preserved. Future modularization must not rewrite or alter validated calculation behavior without an explicit reason and dedicated verification.

The editorial platform already provides a mature architectural pattern with:

* routers;
* services;
* repositories;
* schemas;
* draft and publish workflows;
* published snapshots;
* media handling;
* cross-reference validation.

This architecture should be preserved and evolved rather than replaced without necessity.

### 7.3 Current Project Persistence

Projects are currently persisted as `.hfzproject` JSON files on the user's device.

The existing Project persistence workflow supports:

* creating and saving a Project file;
* opening a Project file;
* reopening recent Projects;
* updating an existing Project in place when a valid file handle is available;
* download fallback when native filesystem access is unavailable;
* dirty-state detection;
* unsaved-changes protection.

The complete Project snapshot currently includes the primary image, reference measurements, geometry, calculator state, notes, and calculation results.

Recent Project metadata is stored separately in browser local storage, while native file handles may be retained through IndexedDB.

This existing local Project file workflow is a major architectural asset and should be preserved as the starting point for the future Local Workspace architecture.

### 7.4 Current Project Architecture Gaps

The current implementation predates the approved Phase 4 Product Architecture and therefore does not yet enforce several approved product rules.

The current system does not yet provide:

* a stable authoritative Project identifier suitable for local and cloud representations;
* technical enforcement of authenticated Project ownership;
* the approved Project creation threshold of one primary image plus at least one reference measurement;
* optional Project naming with automatic generated fallback;
* immutable primary image enforcement after Project creation;
* a complete Local Workspace with the approved management responsibilities;
* Cloud Workspace;
* synchronization;
* conflict detection and user-controlled conflict resolution.

These are expected architectural gaps, not evidence that the existing application foundation is invalid.

Phase 5 must define the target architecture required to close these gaps without unnecessarily rewriting working functionality.

### 7.5 Identity and Authentication Baseline

The current application uses mock-first authentication during local development.

The frontend and backend already contain foundations for:

* authenticated routes;
* user and administrator roles;
* administrator authorization;
* Cognito integration;
* JWT validation;
* authenticated preferences;
* authenticated capability resolution.

However, production authentication is not yet complete end to end.

Projects are currently local files and do not contain or enforce an authenticated ownership relationship.

Phase 5 must define the production Identity and Project ownership architecture while preserving the approved Phase 4 rule that every Project belongs to an authenticated user.

### 7.6 Subscription and Capability Baseline

HFZWood already contains a backend-owned product capability catalog with three access tiers:

* free;
* subscriber;
* administrator unlimited.

The architecture already includes:

* capability definitions;
* capability validation;
* entitlement resolution;
* a capabilities API;
* frontend capability context and hooks.

However, capability enforcement is not yet applied consistently to product functionality.

Phase 5 must define where each capability is authoritatively enforced and how frontend experience, backend protection, local functionality, and cloud functionality cooperate without creating contradictory access rules.

### 7.7 Settings Baseline

The existing application provides preferences for:

* interface language;
* length units;
* volume units.

These preferences are currently persisted as authenticated user-level preferences through the backend.

Recent Project metadata and file handles are device-specific by nature.

Phase 5 must define the authoritative boundary between account-level and device-specific settings, consistent with the approved Product Architecture.

### 7.8 Learning and Editorial Baseline

HFZWood already includes a substantial editorial architecture for:

* Manual;
* Tutorials embedded within Manual content;
* Glossary;
* Knowledge Base.

The existing platform provides:

* administrator editing interfaces;
* draft and publish workflows;
* published snapshots;
* locale variants;
* media handling;
* cross-references;
* public content delivery.

The current filesystem-backed persistence is suitable for local development but not for durable production cloud deployment.

Phase 5 must define the production persistence architecture while preserving the existing editorial behavior and workflow wherever practical.

### 7.9 Cloud and Synchronization Baseline

No production Cloud Workspace or Project synchronization architecture currently exists.

There is currently no:

* cloud Project store;
* Project synchronization engine;
* divergent-version detection;
* conflict-resolution mechanism;
* cloud Project metadata model.

These areas must be defined during Phase 5 according to the approved Local-First and hybrid synchronization principles established during Phase 4.

### 7.10 Infrastructure Baseline

The repository already contains foundations for:

* AWS CDK;
* Amazon Cognito;
* ECS Fargate;
* Application Load Balancer deployment;
* Docker-based production packaging.

However, production persistence and deployment architecture remain incomplete.

The current filesystem-backed server data would not provide appropriate production durability in the existing Fargate model, and the current production container packaging requires correction to include the complete backend application.

Phase 5 must define the production storage and deployment model before Phase 6 implementation begins.

### 7.11 Testing Baseline

The application already has substantial frontend and backend automated test coverage.

Particularly strong coverage exists around:

* Project save, open, and update workflows;
* Recent Projects;
* dirty-state detection;
* unsaved-changes protection;
* authentication flows;
* editorial administration;
* public content delivery;
* capabilities and preferences.

However, the current default combined test command does not execute the complete backend test suite.

Phase 5 must define unified validation requirements for Phase 6 so that architectural migration cannot silently bypass existing tests.

### 7.12 Architecture Worth Preserving

The following existing foundations should be preserved unless a later Phase 5 decision identifies a concrete reason to change them:

* the Project file I/O layer;
* `.hfzproject` as the existing local Project persistence concept;
* the Resin Calculator snapshot and restore mechanism;
* validated backend calculation algorithms;
* the editorial router/service/repository architecture;
* the draft, publish, and snapshot content model;
* the product capability catalog and resolver;
* repository abstractions for preferences and entitlements;
* the frontend provider hierarchy;
* route guard patterns;
* preferences API and shared schemas;
* relative API URL conventions;
* existing automated tests.

### 7.13 Architecture Requiring Migration or Refactoring

The following areas require migration, completion, or refactoring during Phase 6 according to the architecture defined in Phase 5:

* mock-first authentication to production authentication;
* Project creation semantics to match the approved Product Architecture;
* Project identity and authenticated ownership;
* primary image immutability enforcement;
* Local Workspace completion;
* Cloud Workspace implementation;
* synchronization and conflict handling;
* capability enforcement;
* filesystem-backed production persistence;
* backend application modularization;
* production container packaging;
* complete automated test execution;
* removal of obsolete or transitional legacy paths when safe.

### 7.14 Baseline Principle

The current HFZWood codebase must not be treated as disposable legacy code.

It contains substantial working functionality, validated behavior, useful abstractions, and tested workflows.

Phase 5 must preserve what is structurally sound, explicitly identify what must change, and avoid unnecessary rewrites.

The target architecture should evolve the existing application into the approved product model through controlled, incremental, testable, and reversible changes.
## 8. Project Identity Architecture

### 8.1 Technical Project Identity

Each valid HFZWood Project has a unique and permanent technical identifier called `projectId`.

The `projectId` is the authoritative technical identity of the Project.

It is independent of:

* the Project name;
* the Project file name;
* the Project file path;
* the device on which the Project is stored;
* the storage location;
* the current Project version.

A Project may be renamed, moved, copied, restored, synchronized, or edited without changing its `projectId`.

### 8.2 Project ID Creation

A `projectId` is created when the user input first satisfies the approved Project creation threshold:

* one primary image exists;
* at least one reference measurement exists.

Before this threshold is reached, the user is inside the Project creation workflow, but no technical Project identity exists.

The `projectId` is generated locally on the user's device using a standard UUID mechanism.

Project identity creation must not depend on server availability.

This preserves the approved Local-First product model and allows authenticated users to continue creating Projects in approved offline workflows after initial authentication.

### 8.3 Project ID Storage

The `projectId` is stored inside the `.hfzproject` file.

This ensures that Project identity travels with the Project when the file is moved, copied, backed up, restored, or opened on another device.

Cloud representations of the same Project must preserve the same `projectId`.

The same `projectId` must be used to connect local and cloud representations of one logical Project.

### 8.4 Copies of the Same Project

Two `.hfzproject` files that contain the same `projectId` represent the same logical Project.

This remains true regardless of:

* different file names;
* different local paths;
* different devices;
* different storage locations;
* different modification times.

Manual file copying does not create a new Project.

If two copies with the same `projectId` evolve differently, they become divergent versions of the same Project, not separate Projects.

Conflict detection and synchronization architecture must treat them accordingly.

### 8.5 Pre-Launch Project Identity Transition

Existing pre-launch `.hfzproject` v1 development files without `projectId` are explicitly disposable and do not require compatibility, upgrade, or identity-assignment support.

Phase 6 must therefore establish stable Project identity directly through the authoritative `.hfzproject` v2 architecture.

Every newly created valid v2 Project receives its permanent `projectId` when the approved Project creation threshold is first satisfied:

* one primary image exists;
* at least one reference measurement exists.

No temporary legacy identity path is required for disposable pre-launch v1 Project files.

This policy avoids introducing transitional identity behavior solely to preserve development artifacts that the Product Owner has explicitly confirmed may be discarded.

After production launch, any future Project format transition affecting real user data must define appropriate compatibility, migration, identity preservation, rollback, and recovery guarantees before implementation.


### 8.6 Identity Rule

The technical rule is:

**Same `projectId` means same Project. Different `projectId` means different Project.**

No other property may override this rule.
## 9. Project Version Architecture

### 9.1 Version Identity

Each persistent version of an HFZWood Project has a unique technical identifier called `versionId`.

The `versionId` identifies the exact persisted version of the Project content.

The distinction is:

* `projectId` identifies which logical Project this is;
* `versionId` identifies which exact persisted version of that Project this is.

The `projectId` remains permanent throughout the Project lifecycle.

The `versionId` changes whenever a save operation persists a real modification to Project content.

### 9.2 Local Version Generation

The `versionId` is generated locally on the user's device using a standard UUID mechanism.

Version creation must not depend on server availability.

This preserves Local-First behavior and allows authenticated users to continue editing and saving Projects during approved offline workflows.

### 9.3 Real Project Modifications

A new `versionId` is generated when a save operation persists a real change to Project content.

Real Project modifications include changes to persistent technical or informational Project data, including:

* reference measurement points;
* reference measurement values;
* formwork geometry;
* wood geometry;
* cavity geometry;
* depth information;
* pour layers;
* calculation-related Project data;
* future Project cost information;
* any other information classified as technical Project content under the Project Data Separation and Technical Versioning Rules defined in Section 12.

A new `versionId` is not generated solely because of:

* renaming the file outside HFZWood;
* moving the file to another local folder;
* copying the file without modifying its Project content;
* opening and closing the Project without persistent changes;
* temporary UI state that is not part of persisted Project data;
* changing display units when the canonical Project data remains unchanged.

The authoritative rule is:

**If a save operation changes persistent Project content, it creates a new `versionId`. If no persistent Project content has changed, the Project version remains unchanged.**
> **Phase 6 implementation note (Block 1):**
>
> The initial commercial implementation intentionally simplifies this rule. `versionId` is generated only once, when a Project is first saved, and remains stable for subsequent **Update Existing Project** operations. This decision was made because no implemented feature currently consumes per-save version progression. Future synchronization or Cloud Workspace work must define its own content-change detection strategy if per-edit version tracking becomes necessary.

### 9.4 Direct Version Ancestry

Each persistent Project version contains a `parentVersionId`.

The `parentVersionId` identifies the exact version from which the current version directly evolved.

For example:

* version A may have no parent;
* version B created by modifying A has `parentVersionId = A`;
* version C independently created by modifying A also has `parentVersionId = A`.

In this case, B and C are divergent versions of the same Project.

Direct ancestry information provides a technical foundation for detecting divergence without requiring Project identity to depend on timestamps, file names, file paths, or storage locations.

### 9.5 Last Modification Timestamp

Each persistent Project version contains a `lastModifiedAt` timestamp representing the time at which that version was persisted.

This timestamp may be shown to the user to provide useful context when comparing different versions of the same Project.

For example, HFZWood may inform the user which version was modified most recently and display the relevant date and time.

However, `lastModifiedAt` must never be treated as sufficient authority for automatic conflict resolution.

A newer timestamp does not automatically mean that one divergent version should overwrite another.

Timestamps inform the user. They do not silently decide which Project data survives.

### 9.6 Divergent Versions

Two persistent Project representations are divergent when they:

* have the same `projectId`;
* contain different Project content represented by different `versionId` values;
* have evolved independently rather than one being the known direct continuation of the other.

Divergent versions remain versions of the same logical Project.

They do not become separate Projects merely because their content differs.

The synchronization architecture must detect such cases and preserve the approved Phase 4 rule that potentially destructive conflicts are never resolved silently.

### 9.7 Version History Policy

HFZWood is not designed as a complete version-control or historical archival system.

Normal Project saves update the current Project representation and do not create a permanent user-visible archive of every previous save.

The `parentVersionId` provides direct ancestry information required for version reasoning and divergence detection, but HFZWood does not guarantee permanent retention of the complete history of every saved Project version.

The exact technical retention required for synchronization safety may be defined later in the persistence and synchronization architecture.

Any such retention should remain minimal and justified by data integrity requirements rather than by an assumption that every historical save must be permanently preserved.

### 9.8 Version Architecture Rule

The technical rule is:

**`projectId` establishes Project identity. `versionId` establishes exact version identity. `parentVersionId` establishes direct ancestry. `lastModifiedAt` provides user-facing temporal context but never silently resolves conflicts.**

This model must remain compatible with Local-First work, offline editing, cloud backup, safe automatic synchronization, and explicit user-controlled conflict resolution.
## 10. Project Ownership Architecture

### 10.1 Authenticated Ownership

Every valid HFZWood Project belongs to exactly one authenticated user.

When the Project first satisfies the approved Project creation threshold and receives its permanent `projectId`, it also receives an `ownerId` associated with the authenticated user who created it.

Anonymous Project ownership is not supported.

The Project creation threshold remains:

* one primary image exists;
* at least one reference measurement exists.

Authentication is a prerequisite for entering the Project creation workflow, but it is not part of the Project creation threshold itself.

### 10.2 Owner Identity

The `ownerId` is the stable technical identifier of the authenticated user who owns the Project.

The exact production identity source and representation of `ownerId` will be defined in the Identity Architecture.

The ownership architecture must not depend on:

* username;
* display name;
* email address;
* Project name;
* file name;
* local file path;
* device identity.

The selected `ownerId` must remain stable enough to preserve Project ownership across devices, authentication sessions, local storage locations, and cloud representations.

### 10.3 Owner ID Storage

The `ownerId` is stored as persistent Project metadata.

It must be preserved in:

* the local `.hfzproject` representation;
* cloud representations of the same Project;
* synchronization metadata where required.

Moving, copying, renaming, backing up, restoring, or synchronizing a Project does not change its `ownerId`.

### 10.4 Ownership Immutability

In the current HFZWood product architecture, `ownerId` is immutable through normal product workflows.

A user cannot:

* replace the Project owner;
* transfer ownership through normal Project editing;
* claim another user's Project as their own;
* change `ownerId` by renaming, copying, moving, or editing the local Project file.

Future ownership transfer, collaboration, account migration, administrative recovery, or support-assisted ownership correction would require explicit product and technical architecture decisions.

Such future possibilities must not be implicitly introduced by the current architecture.

### 10.5 Local Ownership Metadata Is Not Trusted Authorization

The `ownerId` stored inside a local `.hfzproject` file is persistent Project metadata, but it is not authoritative proof of authorization.

A local file may be copied or manually modified outside HFZWood.

Therefore, protected operations must not trust the local `ownerId` alone.

For cloud operations and other protected server-side actions, the backend must independently validate that the authenticated user is authorized to act on the Project.

Client-provided ownership metadata must never override authoritative server-side ownership validation.

### 10.6 Foreign-Owned Local Project Files

An authenticated user may open a local `.hfzproject` file whose `ownerId` belongs to another user.

In this situation, HFZWood must open the Project in read-only mode.

The user may inspect the Project and its persisted information but may not modify its content or treat it as their own Project.

For a foreign-owned Project, HFZWood must not allow:

* Project editing;
* Project content modification;
* saving changes to the Project;
* updating the original Project file through HFZWood;
* changing the Project's `ownerId`;
* synchronizing the Project to the current user's cloud workspace;
* claiming the Project as belonging to the current user.

The interface must clearly inform the user that the Project belongs to another account and has been opened for viewing only.

This read-only behavior allows legitimate inspection and discussion of another user's Project without weakening ownership boundaries.

### 10.7 Ownership and Future Account Protection

Stable Project ownership may provide useful signals for future account protection, abuse detection, account-sharing prevention, or other commercial security mechanisms.

However, those mechanisms are not defined in the current Project Ownership Architecture.

Advanced account protection remains deferred according to the approved Phase 4 Product Architecture.

The current architecture must preserve enough stable identity information to support future protection mechanisms without prematurely implementing or defining them.

### 10.8 Ownership Architecture Rule

The technical rule is:

**Every valid Project has exactly one stable `ownerId`. Local ownership metadata travels with the Project but is not trusted as authoritative authorization. Protected operations require independent server-side ownership validation. A Project belonging to another user may be inspected locally in read-only mode but cannot be modified, claimed, or synchronized as the current user's Project.**
## 11. Primary Image Architecture

### 11.1 Primary Image Role

Each valid HFZWood Project contains exactly one primary image.

The primary image represents the visual foundation of the Project and is part of the Project's technical identity.

The primary image defines the physical configuration documented by the Project together with the Project's measurements, geometry, calculations, materials, and notes.

### 11.2 Primary Image Storage and Input Boundary

The local `.hfzproject` representation must contain the primary image required by the Project.

The Project must not depend on an external image file path remaining available on the user's device.

The original image file may be moved, renamed, reorganized, or deleted outside HFZWood without making the saved Project invalid.

The stored Project representation must remain portable across folders, drives, devices, backups, and future cloud restore operations.

Because `.hfzproject` v2 remains a single JSON-based file, the primary image must use a JSON-safe serialized representation that can be persisted and restored without relying on an external file reference.

Phase 6 must inspect the existing validated primary-image serialization mechanism and preserve it when it remains compatible with:

* `.hfzproject` v2;
* browser portability;
* complete Project restoration;
* primary-image integrity verification;
* acceptable memory and file-size behavior;
* future cloud persistence.

A different image-encoding mechanism must not be introduced merely for architectural preference.

It may be introduced only when the existing mechanism is demonstrably unsuitable or unsafe.

Before `.hfzproject` v2 is considered launch-ready, HFZWood must define and enforce explicit image-import boundaries, including:

* supported image formats;
* maximum accepted source-file size;
* maximum safely decoded image dimensions;
* validation that the selected file is a genuine decodable image;
* safe rejection of malformed, corrupted, unsupported, or misleading image input;
* clear user-facing feedback when an image cannot be accepted.

The exact supported formats and numerical thresholds are Phase 6 implementation configuration decisions.

They must be established through:

* inspection of the current image-import and serialization behavior;
* realistic testing with modern phone photographs;
* browser memory and performance testing;
* `.hfzproject` Save and Open testing;
* evaluation of future cloud-storage and transfer implications.

The architecture must not invent arbitrary limits without evidence.

HFZWood may accept, reject, compress, or downscale an imported image according to the approved implementation policy.

However, any automatic transformation must preserve sufficient visual fidelity for accurate reference measurement, geometry placement, calculation, and later Project inspection.

HFZWood must not silently perform an image transformation that materially compromises the technical usefulness of the primary image.

Where a transformation is necessary, the resulting image stored inside the Project becomes the authoritative immutable primary image and the `primaryImageHash` must be calculated from that stored representation.

The authoritative rule is:

**The primary image must be stored inside the portable Project representation through a validated JSON-safe serialization mechanism. HFZWood must enforce explicit supported-format, file-size, decoded-dimension, and image-validity boundaries before launch, while preserving sufficient image fidelity for accurate Project work and avoiding unnecessary replacement of the existing validated serialization workflow.**


### 11.3 Primary Image Hash

When a Project becomes valid and receives its projectId, HFZWood calculates a primaryImageHash from the content of the authoritative stored primary-image representation using SHA-256.
The same byte representation and SHA-256 computation rules must be used consistently across local Project creation, Project reopening, integrity verification, future cloud persistence, and any server-side verification.

The hash is based on image content, not on:

* file name;
* local file path;
* folder;
* drive or partition;
* device;
* upload location;
* original source location.

Moving or renaming the original image file does not change the `primaryImageHash`.

### 11.4 Primary Image Immutability

For a given `projectId`, the `primaryImageHash` is immutable.

All later versions of the same Project must preserve the same `primaryImageHash`.

If the user needs to use a different primary image, HFZWood must create a new Project with a new `projectId`.

A different photograph, a different crop, a different angle, or another replacement image must not silently continue the same Project identity.

### 11.5 Image Integrity Verification

When HFZWood opens or synchronizes a Project, it may verify that the stored primary image still matches the Project's `primaryImageHash`.

If the stored image and the recorded hash do not match, HFZWood must not silently treat the Project as a valid continuation of the existing Project.

The application should warn the user that the primary image integrity cannot be confirmed.

The exact user-facing recovery flow for corrupted or tampered Project files may be defined later in persistence and error-handling architecture.

### 11.6 Thumbnail Representation

HFZWood may generate and persist a thumbnail derived from the primary image.

The thumbnail may be used for:

* Recent Projects;
* Local Workspace project lists;
* Cloud Workspace project lists;
* search results;
* project selection screens;
* visual identification.

The thumbnail is derived metadata.

It does not define Project identity, does not replace the primary image, and must not be used as the authoritative image for calculations or Project validation.

If the thumbnail is missing or invalid, it may be regenerated from the primary image.

### 11.7 Primary Image Architecture Rule

The technical rule is:

**The primary image is stored inside the Project representation, identified by content through `primaryImageHash`, and immutable for the lifetime of a `projectId`. The image's original file name or location on the user's device has no authority over Project identity.**
## 12. Project Data Separation and Technical Versioning Rules

### 12.1 Project Data Separation

Each HFZWood Project must maintain a clear conceptual separation between:

* technical metadata required to identify, own, version, and manage the Project;
* technical Project content used by Project Tools for calculation, validation, and execution-related behavior;
* descriptive and organizational information that helps users identify, understand, or manage the Project without changing its technical state.

This is a conceptual architectural separation.

The exact serialized JSON structure of `.hfzproject` files will be defined later in the Project Persistence Architecture and must not be assumed solely from this conceptual model.

### 12.2 Technical Project Metadata

Technical Project metadata includes information required to establish identity, ownership, versioning, integrity, and lifecycle management.

This includes, where applicable:

* `projectId`;
* `ownerId`;
* `versionId`;
* `parentVersionId`;
* `createdAt`;
* `lastModifiedAt`;
* `primaryImageHash`;
* Project Structural Capability Snapshot;
* Project format and schema version information.

These fields serve different architectural purposes and must not be treated as ordinary user-editable Project content.
The Project Structural Capability Snapshot is classified as technical Project metadata.

It defines the structural capability boundary associated with the persisted Project representation but is not itself technical Project content used for calculation, technical validation, or execution-related behavior.

A change to the Project Structural Capability Snapshot:

* must be persisted only through a successful explicit Save;
* does not by itself generate a new `versionId`;
* does not by itself update `lastModifiedAt`;
* updates `metadataModifiedAt`;
* must still be recognized as a persistent metadata change by the Save pipeline.

If the same Save also persists a real technical Project-content change, the normal technical versioning rules apply and a new `versionId` is generated.


### 12.3 Technical Project Content

Technical Project content consists of persistent data whose modification changes the technical state of the Project.

This includes:

* reference measurement points;
* reference measurement values;
* formwork geometry;
* wood geometry;
* cavity geometry;
* depth information;
* pour-layer configuration;
* calculation inputs;
* calculation-affecting parameters;
* mix ratio;
* other future Project Tool data that directly affects calculation, technical validation, or execution-related technical behavior.

When a save operation persists a real change to technical Project content, HFZWood generates a new `versionId`.

### 12.4 Descriptive and Organizational Project Information

Not every persistent change to a Project creates a new technical version.

Descriptive and organizational information may change without generating a new `versionId`.

This includes, where applicable:

* `projectName`;
* free-form notes;
* descriptive material information;
* resin product description when it does not affect calculation logic;
* pigment or color information;
* wood species;
* thumbnail regeneration;
* local file name;
* local file path;
* last-opened timestamp;
* workspace sorting information;
* favorite or pinned state, if introduced in the future;
* organizational tags, if introduced in the future and not used by technical Project logic.

Such information may still be persisted and synchronized where appropriate, but it does not by itself create a new technical Project version.

### 12.5 Free-Form Notes

Free-form Project notes do not by themselves generate a new technical `versionId`.

Users may add, correct, expand, or remove general notes without creating a new technical Project version.

If a future structured field is introduced specifically as a calculation input, technical validation parameter, or execution-critical technical value, that field must be classified as technical Project content rather than as a free-form note.

The classification depends on the field's architectural function, not merely on whether information is entered as text.

### 12.6 Material Information

Descriptive material information does not automatically create a new technical Project version.

Changing information such as:

* resin product description;
* pigment;
* color choice;
* wood species;

does not generate a new `versionId` unless the specific field is actually consumed by Project Tools as a technical input that affects calculation or technical validation.

The mix ratio is explicitly classified as technical Project content because changing it may alter calculation results.

Therefore, changing and saving the mix ratio generates a new `versionId`.

### 12.7 Project Name

The Project name is organizational metadata.

Changing `projectName` does not:

* change `projectId`;
* change Project ownership;
* change the primary image;
* create a new technical `versionId`;
* create a new Project.

If different representations of the same Project contain different names, this is a metadata difference rather than a technical Project-content divergence.

The synchronization architecture must define how metadata differences are reconciled without incorrectly treating every rename as a technical Project conflict.

### 12.8 Derived Metadata

Derived information such as thumbnails may be generated from authoritative Project data.

Derived metadata:

* does not define Project identity;
* does not create a new technical `versionId` when regenerated;
* may be recreated when missing or invalid;
* must not override authoritative Project content.

### 12.9 Technical Version Boundary

The authoritative versioning rule is:

**A new `versionId` is generated only when a save operation persists a change to data that Project Tools uses for calculation, technical validation, or execution-related technical behavior. Descriptive, organizational, display, and free-form informational changes do not by themselves generate a new technical `versionId`.**

This boundary must be explicitly preserved by future Project schema design, persistence logic, synchronization behavior, and Phase 6 implementation.
## 13. Project Persistence Lifecycle

### 13.1 Project Validity and Persistence

A Project becomes technically valid when the approved Project creation threshold is first satisfied:

* one primary image exists;
* at least one reference measurement exists.

At that moment, the Project receives:

* `projectId`;
* `ownerId`;
* `primaryImageHash`;
* `createdAt`.

The Project exists as a valid Project in application memory, but it is not yet necessarily persisted on the user's device.

HFZWood must not automatically and silently create a `.hfzproject` file on the user's local filesystem merely because the Project creation threshold has been reached.

Initial local persistence requires an explicit Save operation initiated by the user.

### 13.2 Valid but Unsaved Project

A valid Project may temporarily exist in application memory without having been persisted as a `.hfzproject` file.

In this state:

* the Project has a permanent `projectId`;
* the Project has an `ownerId`;
* the primary image has a `primaryImageHash`;
* the Project has a `createdAt` timestamp;
* no persistent `versionId` exists yet;
* no persistent `parentVersionId` exists yet.

If the user attempts to leave, close, replace, or otherwise abandon a valid but unsaved Project, HFZWood must use unsaved-changes protection to warn against accidental data loss.

### 13.3 First Successful Save

The first successful Save creates the first persistent version of the Project.

At that moment:

* a new local `versionId` is generated;
* `parentVersionId` is `null`;
* `lastModifiedAt` is established for the first persistent technical version;
* the complete Project representation is persisted;
* the `.hfzproject` representation contains the primary image and required Project metadata and content.

The first `versionId` must not be generated merely because the Project became valid in memory.

A `versionId` identifies a successfully persisted technical Project version.

### 13.4 Subsequent Save with Technical Changes

When a previously persisted Project is saved after technical Project content has changed:

* a new `versionId` is generated locally;
* the previous `versionId` becomes the new version's `parentVersionId`;
* `lastModifiedAt` is updated;
* the changed technical Project content is persisted.

Technical changes are determined according to the approved Technical Version Boundary.

Examples include changes to:

* reference measurements;
* reference measurement values;
* geometry;
* depth information;
* pour-layer configuration;
* calculation inputs;
* mix ratio;
* other data used by Project Tools for calculation, technical validation, or execution-related technical behavior.

### 13.5 Save with Metadata-Only Changes

A Save operation that persists only descriptive or organizational changes does not create a new technical `versionId`.

In this case:

* `projectId` remains unchanged;
* `versionId` remains unchanged;
* `parentVersionId` remains unchanged;
* `lastModifiedAt` for the technical version remains unchanged;
* the metadata changes are persisted;
* `metadataModifiedAt` is updated.

Metadata-only changes may include:

* Project name;
* free-form notes;
* descriptive material information;
* pigment or color choice;
* wood species;
* other organizational or descriptive information that does not affect technical Project behavior.

This separation allows HFZWood to distinguish between technical Project divergence and metadata differences.

### 13.6 Save with Both Technical and Metadata Changes

A single Save operation may persist both technical changes and metadata changes.

In this situation:

* a new `versionId` is generated;
* the previous technical `versionId` becomes `parentVersionId`;
* `lastModifiedAt` is updated;
* `metadataModifiedAt` is also updated;
* all changed Project data is persisted together as one successful Save operation.

HFZWood must not require separate user Save operations for technical content and metadata.

The distinction exists for architectural reasoning, versioning, synchronization, and conflict detection, not to complicate the user's workflow.

### 13.7 Save with No Changes

If the user initiates Save when neither technical Project content nor persistent metadata has changed:

* no new `versionId` is generated;
* `parentVersionId` does not change;
* `lastModifiedAt` does not change;
* `metadataModifiedAt` does not change;
* no false Project version is created.

HFZWood may inform the user that the Project is already up to date or otherwise complete the action without unnecessary persistence.

A Save action alone must never create artificial version history or misleading timestamps.

### 13.8 Successful Persistence and Persisted-State Adoption

HFZWood must distinguish between:

* successful persistence that can be technically confirmed by the application;
* initiation of a browser-managed download that the application cannot independently confirm as successfully stored on the user's device.

When HFZWood uses a persistence mechanism that can report successful completion of the write operation, the Project may adopt the resulting persisted state only after that operation has completed successfully.

After technically confirmed successful persistence:

* the resulting persisted `versionId` becomes the current persisted technical version;
* the persisted Project state becomes the new baseline for dirty-state comparison;
* applicable unsaved technical-content state may be cleared;
* applicable unsaved metadata state may be cleared;
* the application may report the Project as successfully saved.

Initiation of a browser-managed download does not, by itself, constitute technically confirmed persistence.

When direct write confirmation is unavailable and HFZWood uses a browser download fallback:

* HFZWood may generate and initiate download of a complete valid `.hfzproject` representation;
* the application must not treat download initiation alone as proof that the file was successfully stored;
* the application must not clear the relevant unsaved state solely because the download was initiated;
* the application must not adopt the resulting Project representation as the new persisted baseline solely because the download was initiated;
* the application must request explicit user confirmation that the file was successfully saved before adopting the resulting state as persisted within the active session.

If the user explicitly confirms successful saving:

* HFZWood may adopt the resulting Project representation as the current persisted baseline for the active session;
* the corresponding persisted `versionId` becomes the current persisted technical version where applicable;
* the relevant unsaved state may be cleared;
* the application may report the Project as saved.

If the user does not confirm successful saving, cancels the confirmation, or indicates that the file was not saved:

* the Project remains unsaved within the active session;
* the previous persisted baseline remains authoritative;
* unsaved-changes protection continues to apply.

User confirmation is an explicit informed statement about the outcome of a browser-managed download. It is not equivalent to technical verification by HFZWood and must not be represented as such.

The authoritative rule is:

**A Project state becomes the adopted persisted baseline only after either technically confirmed successful persistence or explicit user confirmation of successful storage when browser limitations prevent technical confirmation. Browser download initiation alone is never sufficient to clear unsaved state, advance the persisted baseline, or report a successful Save.**


### 13.9 Persistence Lifecycle Rule

The technical rule is:

**A Project receives permanent identity when it becomes valid, but receives its first `versionId` only after the first successful Save. Later technical changes create new technical versions; metadata-only changes do not. Save without changes creates no artificial version or timestamp, and failed persistence must never be represented as a successful Save.**
## 14. Project File Format and Migration Architecture

### 14.1 Local Project Representation

The `.hfzproject` file is the complete, portable local representation of an HFZWood Project.

A valid persisted `.hfzproject` file must contain sufficient information for the Project to be opened, inspected, and, when ownership and authentication rules permit, edited and continued without dependency on cloud availability.

The Project file must preserve, directly or through a defined internal structure:

* Project identity;
* ownership metadata;
* technical version identity and ancestry;
* creation and modification timestamps;
* the primary image;
* the primary image hash;
* reference measurements;
* Project geometry;
* calculation inputs;
* calculation results where applicable;
* technical Project parameters;
* descriptive and organizational metadata;
* free-form notes;
* other Project information defined by the approved Project schema.

Cloud availability must not be required to reconstruct a valid locally persisted Project.

### 14.2 Single-File Format

For the Phase 6 target architecture, `.hfzproject` remains a single portable JSON file.

HFZWood does not require a multi-file Project folder, ZIP archive, or package-based Project representation for the current target architecture.

This decision preserves:

* portability;
* simple user-managed local storage;
* straightforward backup and copying;
* compatibility with the existing Project workflow;
* incremental migration from the current implementation.

A more complex package format must not be introduced without a concrete technical need that cannot be reasonably satisfied by the single-file representation.

### 14.3 Format Versioning

Every `.hfzproject` file must contain an explicit `formatVersion`.

The target Project file format for Phase 6 is:

`formatVersion: 2`

The existing Project format is treated as:

`formatVersion: 1`

The v2 format introduces the architectural foundations required by the approved Product and Technical Architecture, including, where applicable:

* `projectId`;
* `ownerId`;
* `versionId`;
* `parentVersionId`;
* `createdAt`;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* `primaryImageHash`;
* explicit separation of technical Project data from descriptive and organizational metadata.

The exact serialized v2 schema will be defined before implementation and must preserve the approved architectural rules.

### 14.4 Pre-Launch v1 Project Policy

HFZWood is currently in pre-launch development.

The Product Owner has explicitly confirmed that existing `.hfzproject` v1 development files are disposable and do not require preservation, backward compatibility, or migration support.

Therefore, the Phase 6 target architecture does not require HFZWood to open, edit, upgrade, or migrate legacy `.hfzproject` v1 files.

Phase 6 may transition directly to `formatVersion: 2` and treat v2 as the authoritative Project file format for the launch-ready product.

Existing pre-launch v1 files may be discarded and recreated as new v2 Projects when required.

This decision intentionally avoids introducing unnecessary legacy compatibility code, migration paths, parallel persistence behavior, or additional testing obligations solely to preserve disposable pre-launch development artifacts.

This policy applies specifically to the existing pre-launch v1 development files explicitly confirmed as disposable.

It does not establish a general rule that future production Project data may be discarded. After production launch, compatibility, migration, integrity, rollback, and recovery requirements for real user data must be evaluated and protected according to the applicable architecture.


### 14.5 Direct Transition to `.hfzproject` v2

Phase 6 must implement `.hfzproject` v2 as the authoritative Project file format for the launch-ready HFZWood product.

No v1-to-v2 migration mechanism is required for the existing disposable pre-launch development files.

The transition must therefore prioritize a clean implementation of the approved v2 architecture, including, where applicable:

* `formatVersion: 2`;
* stable Project identity;
* authenticated ownership;
* version identity and ancestry metadata;
* primary-image integrity metadata;
* technical Project content;
* descriptive metadata;
* future cloud-readiness foundations.

The v2 implementation must evolve the existing validated Project snapshot and restore mechanisms without unnecessarily rewriting calculator domain logic.

After v2 implementation is complete, verification must use newly created v2 Projects to confirm, at minimum:

* creation of a new Project;
* primary-image import;
* reference measurement;
* geometry creation;
* calculation state;
* successful explicit Save;
* close and reopen behavior;
* complete restoration of persisted Project state;
* preservation of required v2 identity, ownership, versioning, integrity, technical, and descriptive data.

The absence of v1 migration support is an explicit pre-launch architecture decision and must not be treated as missing functionality or technical debt.


### 14.6 Invalid or Unsupported Project File Policy

HFZWood must fail safely when a Project file cannot be validated as a supported `.hfzproject` v2 file.

If a Project file is malformed, corrupted, incomplete, structurally invalid, or uses an unsupported `formatVersion`, HFZWood must:

* reject the file safely;
* not partially load invalid Project state into the active workspace;
* not silently repair or reinterpret unknown structures;
* not overwrite or modify the original file;
* preserve the currently active valid Project state, if one exists;
* display a clear user-facing error explaining that the Project file could not be opened.

A failed Open operation must never leave the application in an ambiguous partially loaded state.

If a future `.hfzproject` format version is encountered that the current HFZWood version does not understand, the application must reject it safely rather than guessing how to interpret it.

The authoritative rule is:

**Unsupported, malformed, corrupted, or invalid Project files must fail closed and must never silently compromise the active Project, the original file, or Project integrity.**


### 14.7 v2 Save and Persistence Semantics

All newly created Projects must use `.hfzproject` v2 as the authoritative persisted Project format.

Every Save attempt must produce, before persistence or browser-download initiation, a complete valid v2 Project representation according to the approved Project model, including all required identity, ownership, versioning, integrity, technical-content, descriptive-metadata, and Project Structural Capability Snapshot fields.

A Save operation must:

* validate the Project state before persistence;
* preserve the required `projectId`;
* persist the authenticated `ownerId` according to the approved ownership model;
* apply the approved version identity and ancestry semantics;
* preserve primary-image integrity metadata;
* persist the complete technical Project content required for accurate restoration;
* persist descriptive metadata according to the approved metadata model;
* persist the Project Structural Capability Snapshot according to the approved capability architecture;
* fail safely if a complete valid v2 Project representation cannot be produced.

HFZWood must distinguish between technically confirmed persistence and a browser-managed download fallback.

When the persistence mechanism can technically confirm successful completion of the write operation, the resulting v2 Project representation may become the adopted persisted baseline only after that operation succeeds.

When direct write confirmation is unavailable and HFZWood uses a browser-managed download fallback:

* initiating the download does not, by itself, constitute confirmed persistence;
* the application must not clear unsaved state solely because the download was initiated;
* the application must not adopt the generated Project representation as the new persisted baseline solely because the download was initiated;
* the application must request explicit user confirmation that the file was successfully saved before adopting the resulting Project representation as persisted within the active session.

If the user explicitly confirms successful saving after a browser-managed download:

* HFZWood may adopt the resulting Project representation as the current persisted baseline for the active session;
* the corresponding persisted `versionId` becomes the current persisted technical version where applicable;
* the relevant unsaved state may be cleared;
* the application may report the Project as saved.

If the user does not confirm successful saving, cancels the confirmation, or indicates that the file was not saved:

* the previous persisted baseline remains authoritative;
* the Project remains unsaved within the active session;
* unsaved-changes protection continues to apply.

A failed Save or failed Project-representation generation must not:

* corrupt the previously valid persisted Project file;
* leave a partially written Project file presented as valid;
* silently discard required Project state;
* falsely report success;
* advance the adopted persisted baseline;
* clear unsaved state.

After technically confirmed successful persistence, or after explicit user confirmation where browser limitations prevent technical confirmation, reopening the resulting `.hfzproject` v2 file must restore the complete persisted Project state according to the approved architecture.

User confirmation of a browser-managed download outcome is an explicit informed statement used when technical confirmation is unavailable. It must not be represented as independent technical verification by HFZWood.

The authoritative rule is:

**A Save must first produce a complete valid `.hfzproject` v2 representation. That representation becomes the adopted persisted baseline only after technically confirmed successful persistence or explicit user confirmation of successful storage when browser limitations prevent technical confirmation. Browser download initiation alone must never clear unsaved state, advance the persisted baseline, or be reported as a successful Save.**



### 14.8 No Guaranteed Backward Compatibility

HFZWood does not guarantee that an older application version can open a `.hfzproject` file created or upgraded by a newer application version.

Therefore, the following compatibility direction is not guaranteed:

**older HFZWood version → newer `.hfzproject` format**

The target architecture must not be unnecessarily constrained merely to preserve compatibility with application versions that do not understand newer Project identity, ownership, versioning, integrity, or persistence rules.

### 14.9 Unsupported Future Format

If HFZWood encounters a `.hfzproject` file whose `formatVersion` is newer than the maximum version understood by the running application, it must fail safely.

The application must not:

* guess the unknown schema;
* silently ignore unknown required data;
* open the Project for editing as if fully understood;
* save over the Project using an older schema;
* downgrade the file;
* otherwise risk destroying information introduced by the newer format.

The application must clearly inform the user that the Project was created or upgraded by a newer version of HFZWood and requires a compatible application version.

The original file must remain unmodified.

### 14.10 Project File Authority

The local `.hfzproject` file is the complete portable representation of a locally persisted Project.

Its internal identity is determined by Project metadata such as `projectId`, not by:

* the file name;
* the local folder;
* the absolute file path;
* the drive or partition;
* the device on which the file currently exists.

Moving, renaming, or copying a `.hfzproject` file does not by itself create a new Project or a new technical version.

### 14.11 File Format Architecture Rule

The technical rule is:

**`.hfzproject` remains a single portable JSON file and the complete local representation of a Project. Phase 6 targets `formatVersion: 2` as the authoritative Project format for the launch-ready product and does not require backward compatibility or migration support for explicitly disposable pre-launch v1 development files. HFZWood does not guarantee that older application versions can read newer Project formats and must refuse unsupported future formats safely, without modifying or risking the user's Project data.**

## 15. Local Project Persistence Architecture

### 15.1 Authoritative Local Project Data

For a persisted local HFZWood Project, the `.hfzproject` file is the authoritative source of Project data.

The authoritative local Project representation includes the Project's:

* identity;
* ownership metadata;
* technical version information;
* primary image;
* primary image hash;
* technical Project content;
* descriptive and organizational metadata;
* other persisted Project information defined by the Project schema.

Local Workspace indexes, browser storage, cached metadata, thumbnails, file handles, and similar supporting mechanisms are auxiliary.

They must not become competing authoritative copies of Project content.

### 15.2 Auxiliary Local Workspace Data

HFZWood may use auxiliary local storage mechanisms for:

* Project discovery;
* Recent Projects;
* Local Workspace listings;
* thumbnail display;
* last-opened information;
* known local file locations;
* retained file handles;
* fast reopening;
* sorting and organizational state.

These mechanisms may include, where technically appropriate:

* browser local storage;
* IndexedDB;
* File System Access API handles;
* rebuildable local indexes;
* other device-specific caches.

Auxiliary data may be rebuilt, refreshed, or discarded without changing Project identity, ownership, or technical content.

If auxiliary metadata conflicts with authoritative data inside the `.hfzproject` file, the Project file remains authoritative for persisted Project data.

### 15.3 Missing Local Project File

A Project known to Local Workspace must not automatically be considered deleted merely because its `.hfzproject` file is no longer available at the previously known location.

The file may have been:

* moved;
* renamed;
* reorganized into another folder;
* placed on another drive;
* temporarily unavailable because removable storage is disconnected;
* otherwise relocated outside HFZWood.

In such cases, Local Workspace should mark the known local representation as unavailable or missing rather than silently treating the Project as deleted.

### 15.4 Project Relocation

HFZWood should allow the user to locate a missing `.hfzproject` file manually.

When the user selects a candidate file, HFZWood must verify its internal `projectId`.

The existing Local Workspace link may be repaired only when:

**selected file `projectId` = expected Local Workspace `projectId`**

If the identifiers match:

* the Project remains the same logical Project;
* the known local location or file handle may be updated;
* Project identity does not change;
* no new Project is created merely because the file was moved.

### 15.5 Incorrect File Selected During Relocation

If the user selects a `.hfzproject` file whose `projectId` differs from the expected Project identity, HFZWood must not use that file to repair the missing Project link.

The application must:

* preserve the existing missing Project entry;
* avoid replacing its identity;
* avoid pretending that the selected file is the expected Project;
* inform the user that the selected file belongs to a different Project.

The differently identified file may be opened separately according to normal Project opening and ownership rules.

### 15.6 Multiple Local Representations of the Same Project

Multiple `.hfzproject` files containing the same `projectId` represent the same logical Project.

Local Workspace must not treat them as separate Projects merely because they have:

* different file names;
* different local paths;
* different folders;
* different drives;
* different file-system modification times.

Local Workspace groups Project identity by `projectId`.

Multiple files with the same `projectId` are multiple local representations of one Project.

### 15.7 Identical, Successive, and Divergent Representations

When multiple local representations share the same `projectId`, HFZWood must evaluate their version information.

They may be:

* **identical** — the same `versionId`;
* **successive** — one known technical version evolved from another;
* **divergent** — separate technical versions evolved independently.

The exact ancestry evaluation, conflict detection, reconciliation, and user-resolution behavior will be defined in the Synchronization and Conflict Architecture.

Local Workspace must not silently discard a representation merely because another representation of the same Project exists.

### 15.8 Local Project Authority Rule

The technical rule is:

**The `.hfzproject` file is authoritative for persisted local Project data. Local Workspace metadata and caches are auxiliary and rebuildable. Missing files are not automatically treated as deleted, relocation requires matching `projectId`, and multiple files with the same `projectId` remain representations of one logical Project rather than becoming separate Projects.**
### 15.9 Local Deletion and Last Known Copy Protection

HFZWood must protect users against accidental deletion of the last known managed copy of a Project without preventing a deliberate, informed decision to delete that Project permanently.

For the purpose of this architecture, the **last known managed copy** means the last Project representation that HFZWood can currently identify and verify within storage locations managed or known by the application.

HFZWood does not claim to know about unmanaged copies that may exist outside its visibility, including:

* manually copied `.hfzproject` files;
* files stored on removable media;
* files transferred by email or messaging services;
* files stored on another device that is not currently known or verifiable by HFZWood;
* any other external copy outside application-managed or application-verifiable storage.

Therefore, last-copy protection applies only to known managed representations.

During the Local-Only launch phase, if a user attempts to delete the last known local representation of a Project and no confirmed cloud representation exists, HFZWood must:

* clearly inform the user that this is the last known copy of the Project;
* warn that permanent deletion may result in irreversible loss of the Project and its data;
* state clearly that the action cannot be undone through HFZWood;
* require explicit confirmation before deletion proceeds;
* provide a clear cancellation path;
* never perform such deletion silently or through an ambiguous confirmation.

The user retains final authority over deliberate permanent deletion.

HFZWood must not absolutely block deletion of the last known managed copy when the authenticated user explicitly confirms the destructive action after receiving the required warning.

The confirmation must be stronger and more explicit than an ordinary low-risk action, but it does not require artificial friction such as typing the Project name, entering the word `DELETE`, or completing multiple redundant confirmation steps unless future evidence demonstrates a concrete need for such measures.

A suitable confirmation model is:

> **This is the last known copy of this Project. Deleting it may permanently destroy the Project and its data. This action cannot be undone. Are you sure you want to continue?**

with clearly distinguishable actions such as:

* **Cancel**
* **Delete permanently**

When operational Cloud Workspace functionality is introduced later, the same protection principle extends across known local and cloud representations:

* deletion of a local representation does not constitute deletion of the last known managed copy when a confirmed valid cloud representation exists;
* deletion of a cloud representation does not constitute deletion of the last known managed copy when another valid managed representation is confirmed to exist;
* if the representation being deleted is the last known managed copy across the storage locations HFZWood can verify, the explicit warning and strong-confirmation rule applies;
* HFZWood must not infer the existence of a safe remaining copy from stale, unverified, incomplete, or failed persistence state.

The authoritative rule is:

**HFZWood protects the last known managed copy of a Project against accidental deletion through explicit warning and strong confirmation, but does not prevent the authenticated user from deliberately deleting that copy after being clearly informed of the risk. Last-copy protection applies only to Project representations that HFZWood can actually identify and verify, and no unverified or merely assumed copy may be treated as sufficient protection against irreversible data loss.**

## 16. Cloud Project Persistence and Branching Architecture

### 16.1 Complete Cloud Project Representation

The cloud must preserve a complete and autonomous representation of an HFZWood Project.

The cloud representation must contain sufficient authoritative Project data to reconstruct a complete and valid local `.hfzproject` file even when no local copy remains available.

This includes, where applicable:

* `projectId`;
* `ownerId`;
* `versionId`;
* `parentVersionId`;
* creation and modification timestamps;
* the primary image;
* `primaryImageHash`;
* technical Project content;
* descriptive and organizational metadata;
* free-form notes;
* other persisted Project information defined by the approved Project schema.

The internal cloud storage structure is not required to be physically identical to the single-file local `.hfzproject` representation.

Cloud storage may use a different internal structure when justified by durability, scalability, retrieval efficiency, storage efficiency, security, or infrastructure requirements.

However, the cloud representation must remain capable of reconstructing a complete valid local Project.

### 16.2 No Universal Local or Cloud Authority

Neither the local representation nor the cloud representation is universally authoritative over the other.

The fact that a Project version exists:

* locally;
* in cloud storage;
* on a particular device;
* with a newer timestamp;

does not by itself give that representation authority to overwrite another representation.

HFZWood must evaluate:

* `projectId`;
* `versionId`;
* `parentVersionId`;
* known version ancestry;
* relevant synchronization state.

These signals determine whether Project representations are:

* identical;
* successive;
* divergent.

A newer timestamp may provide useful context but must not independently authorize destructive overwrite.

### 16.3 Opening a Cloud-Only Project

When a Project exists in cloud storage but has no available local representation on the current device, **Open from Cloud** creates a complete local representation of the same logical Project.

The restored local Project preserves:

* the same `projectId`;
* the same `ownerId`;
* the same `versionId`;
* the same `parentVersionId`;
* the same primary image;
* the same `primaryImageHash`;
* the same technical Project content;
* the same persisted metadata.

Opening or restoring a Project from cloud storage does not:

* create a new logical Project;
* generate a new `projectId`;
* generate a new technical `versionId`;
* change ownership;
* create technical divergence merely because the Project now exists on another device.

A new technical version is created only after technical Project content is modified and successfully persisted according to the approved Project Persistence Lifecycle.

### 16.4 First Local-to-Cloud Persistence

When a locally persisted Project has no existing cloud representation, the first successful cloud persistence creates a cloud representation of the same logical Project.

The cloud representation preserves the existing:

* `projectId`;
* `ownerId`;
* `versionId`;
* `parentVersionId`;
* Project content and metadata.

Creating the first cloud representation does not itself constitute a technical Project modification and does not generate a new `versionId`.

Before creating the cloud representation, the backend must independently validate that the authenticated user is authorized to persist the Project as its owner.

The `ownerId` supplied by the local file alone is not sufficient authorization.

### 16.5 Safe Automatic Local-to-Cloud Synchronization

HFZWood may automatically synchronize a newer local technical version to cloud storage when the relationship is demonstrably safe and non-divergent.

For example:

```text
Cloud:
versionId = A

Local:
versionId = B
parentVersionId = A
```

In this case, local version B is a known continuation of cloud version A.

Automatic Local → Cloud synchronization is permitted only when:

* the authenticated user is authorized as the Project owner;
* the local and cloud representations have the same `projectId`;
* the version relationship is known and non-divergent;
* the cloud version still matches the expected ancestor version at the moment of the write;
* no other integrity or authorization rule blocks synchronization.

The backend must use conditional persistence semantics.

The update must succeed only if the current cloud version still equals the expected version.

### 16.6 Cloud Change During Automatic Update

If the cloud representation changes between synchronization evaluation and attempted persistence, HFZWood must fail safely.

For example:

```text
Expected cloud version: A
Local continuation: B

But current cloud version at write time: C
```

HFZWood must not overwrite C with B.

Instead:

* the automatic update fails without destructive overwrite;
* the existing cloud representation remains preserved;
* the local representation remains preserved;
* the Project is reevaluated using current version information;
* possible divergence is detected and handled according to the approved conflict rules.

This prevents race conditions and silent data loss.

### 16.7 Cloud-to-Local Update Requires Explicit User Action

When cloud storage contains a newer known continuation of the current local Project version, HFZWood may detect this situation automatically and inform the user.

For example:

```text
Local:
versionId = A

Cloud:
versionId = B
parentVersionId = A
```

Although the relationship is non-divergent, HFZWood must not silently overwrite the user's local `.hfzproject` file.

The user must explicitly choose to update the local representation.

Before any local replacement occurs, HFZWood must still verify that:

* the local file represents the expected `projectId`;
* the local version remains the expected version;
* no unsaved local changes would be lost;
* required filesystem permissions are available;
* the cloud representation passes integrity and ownership validation.

The approved synchronization asymmetry is therefore intentional:

* **Local → Cloud may occur automatically when demonstrably safe.**
* **Cloud → Local may be detected automatically, but updating the local Project requires explicit user action.**

### 16.8 Divergent Project Versions

A Project is divergent when multiple representations with the same `projectId` have evolved independently and cannot safely be treated as one known continuation of the other.

For example:

```text
Project ABC
        A
       / \
      B   C

B = local branch
C = cloud branch
```

B and C are not separate Projects.

They are divergent branches of the same logical Project because they share the same `projectId`.

Each branch has its own `versionId` and version ancestry.

HFZWood must not silently overwrite either branch.

### 16.9 Preservation of Divergent Branches

When divergence is detected, HFZWood must preserve all affected branches until the user makes an explicit decision.

The architecture must allow, where appropriate:

* preservation of the local branch;
* preservation of the cloud branch;
* persistence of the local branch in cloud storage as an alternate branch of the same Project;
* restoration of the cloud branch as an alternate local representation;
* comparison of available branch information;
* explicit selection of a principal branch;
* explicit deletion of an unwanted branch.

No divergent branch may be silently discarded merely because another branch is newer, stored in cloud, stored locally, or selected as principal.

### 16.10 Principal Branch Selection

The user may explicitly select one divergent branch as the principal version from which continued work should proceed.

Selecting a principal branch does not automatically delete other divergent branches.

For example:

```text
Project ABC
        A
       / \
      B   C
      ↑
   principal
```

B may become the principal working branch while C remains preserved as an alternate branch.

The principal designation determines the branch selected for continued normal work. It does not erase the existence or content of other preserved branches.

The exact user interface and workflow for branch comparison and principal selection will be defined later, but the architecture must preserve explicit user control.

### 16.11 Divergent Branch Retention

A divergent branch is retained until the user explicitly deletes it.

HFZWood must not automatically delete a divergent branch merely because it is:

* old;
* inactive;
* not selected as principal;
* less recently modified;
* stored only locally;
* stored only in cloud;
* superseded for normal continued work.

Divergent branches represent independently evolved user data and must therefore be preserved unless the user explicitly chooses deletion.

This rule is distinct from normal technical version history.

HFZWood does not preserve every ordinary Save as a permanent historical version, but a divergent branch is not merely an old Save. It represents independently evolved Project content that may otherwise be lost.

### 16.12 Cloud Branch Storage

The cloud architecture must be capable of representing more than one preserved branch for the same `projectId` when real divergence exists.

Cloud persistence must therefore not assume that:

**one `projectId` = exactly one stored `versionId` under all circumstances**

Instead, the architecture must support:

* one logical Project identity;
* one principal branch where designated;
* zero or more preserved divergent branches;
* independent version identity for each branch.

The exact physical cloud schema will be defined later and must support these requirements without redefining Project identity.

### 16.13 Branching Architecture Rule

The technical rule is:

**Cloud storage preserves a complete autonomous Project representation. Neither local nor cloud is universally authoritative. Safe Local → Cloud synchronization may occur automatically through conditional writes, while Cloud → Local replacement requires explicit user action. Divergence creates branches of the same Project, never new Projects. All divergent branches are preserved until the user explicitly deletes them, and selecting a principal branch never silently destroys the others.**
## 17. Synchronization and Conflict Detection Architecture

### 17.1 Purpose

HFZWood must determine the relationship between multiple representations of a Project before allowing synchronization, replacement, or other operations that could affect persisted Project data.

The architecture must distinguish between:

* different Projects;
* identical versions of the same Project;
* known successive versions of the same Project;
* divergent branches of the same Project.

This classification must rely on explicit Project identity and version ancestry rather than on assumptions based on file names, file paths, storage locations, devices, or timestamps.

### 17.2 Version Relationship Metadata

Each persistent technical Project version contains sufficient metadata to identify both its exact version and its known technical ancestry.

This includes:

* `projectId`;
* `versionId`;
* `parentVersionId`;
* `ancestorVersionIds`.

The roles of these fields are:

* `projectId` identifies the logical Project;
* `versionId` identifies the exact technical version;
* `parentVersionId` identifies the direct parent version;
* `ancestorVersionIds` preserves the complete known technical ancestry of the current branch.

The `lastModifiedAt` timestamp may provide useful temporal context but does not determine ancestry and must not independently authorize destructive overwrite.

### 17.3 Different Projects

Two representations with different `projectId` values are different Projects.

They must not be compared as versions or branches of the same Project.

The technical rule is:

**Different `projectId` means different Project.**

No similarity in:

* Project name;
* primary image appearance;
* file name;
* file path;
* content;
* timestamp;
* owner;

may override this identity rule.

### 17.4 Identical Technical Versions

Two representations are technically identical versions when they have:

* the same `projectId`;
* the same `versionId`.

In this case, no technical Project-content conflict exists.

The representations may still contain differences in non-versioned metadata, such as:

* `projectName`;
* free-form notes;
* descriptive material information;
* other organizational metadata.

Such differences must be handled as metadata differences rather than falsely classified as technical divergence.

### 17.5 Known Successive Versions

Two representations of the same Project are successive when one can be demonstrated to descend from the other.

For Project versions A and B with the same `projectId`, B is a known descendant of A when A's `versionId` appears in B's `ancestorVersionIds`.

The same rule applies in the opposite direction.

Therefore:

* if A appears in B's ancestry, B is the newer known descendant;
* if B appears in A's ancestry, A is the newer known descendant.

A direct parent relationship is a special case of known succession.

For example:

```text
A → B → C
```

Version C may contain:

```text
versionId = C
parentVersionId = B
ancestorVersionIds = [A, B]
```

Even if the complete persisted representation of B is no longer retained, HFZWood can still prove that C descends from A.

### 17.6 Divergent Versions

Two representations are divergent when:

* they have the same `projectId`;
* they have different `versionId` values;
* neither version can be demonstrated to descend from the other.

For example:

```text
    A
   / \
  B   C
```

Both B and C may contain:

```text
ancestorVersionIds = [A]
```

HFZWood can therefore determine that:

* B and C belong to the same logical Project;
* B and C share a known ancestor;
* B is not a descendant of C;
* C is not a descendant of B.

They are divergent branches of the same Project.

Divergence must not create new Project identity.

Both branches preserve the same `projectId`.

### 17.7 Unknown or Unprovable Succession

HFZWood must never assume that one version is the continuation of another merely because:

* one has a newer timestamp;
* one was opened more recently;
* one exists in cloud storage;
* one exists locally;
* one has a newer file-system modification date;
* one has a higher apparent sequence or naming pattern.

If HFZWood cannot prove known succession through version ancestry, it must not silently treat one version as the continuation of the other.

The safe rule is:

**Unprovable succession must never authorize automatic destructive overwrite.**

Where appropriate, the situation must be treated as divergence or as an unresolved version relationship requiring explicit user control.
The initial architecture does not impose an arbitrary fixed maximum on ancestorVersionIds, because truncating ancestry without a proven safe replacement mechanism could destroy information required for correct succession and divergence detection.

Phase 6 must nevertheless verify realistic serialization, parsing, and comparison behavior for long ancestry chains.

No ancestry pruning, checkpointing, compression, or compaction mechanism is required for the initial Local-Only launch or for initial cloud readiness unless codebase inspection or realistic testing demonstrates a concrete technical need.

If measured production usage later demonstrates material storage, parsing, comparison, transfer, or performance impact caused by ancestry growth, a bounded ancestry, checkpointing, compression, or other compaction mechanism may be introduced only if it preserves correct succession detection, divergence detection, Project integrity, and synchronization safety.

The authoritative rule is:

HFZWood does not introduce premature ancestry-compaction complexity for a theoretical scale problem. Ancestry remains complete unless measured evidence demonstrates a material need for optimization, and any future optimization must preserve the correctness of succession and divergence detection.

### 17.8 Complete Known Ancestry

Each technical Project version preserves its complete known ancestry through `ancestorVersionIds`.

The ancestry list is not arbitrarily truncated during the lifetime of a branch.

HFZWood does not need to preserve the complete content of every historical version.

Instead, it preserves only the technical version identifiers necessary to determine ancestry.

For example:

```text
A → B → C → D → E
```

Version E may contain:

```text
versionId = E
parentVersionId = D
ancestorVersionIds = [A, B, C, D]
```

The complete historical Project content for A, B, C, and D does not need to remain permanently stored merely for ancestry determination.

### 17.9 Ancestry Construction

When a new technical Project version is created from an existing parent version, the new version inherits the parent's complete known ancestry and appends the direct parent's `versionId`.

Conceptually:

```text
newVersion.ancestorVersionIds =
    parentVersion.ancestorVersionIds
    + [parentVersion.versionId]
```

For example:

```text
A → B
```

B contains:

```text
versionId = B
parentVersionId = A
ancestorVersionIds = [A]
```

If C is then created from B:

```text
A → B → C
```

C contains:

```text
versionId = C
parentVersionId = B
ancestorVersionIds = [A, B]
```

This construction rule preserves enough technical history to determine succession without retaining every complete historical Project version.

### 17.10 First Persistent Version

The first persistent technical version of a Project has no technical ancestor.

Therefore:

```text
parentVersionId = null
ancestorVersionIds = []
```

This applies to the first successful persistent version created according to the approved Project Persistence Lifecycle.



### 17.11 Relationship Classification Algorithm

For two Project representations A and B, HFZWood applies the following conceptual classification:

1. If `A.projectId != B.projectId`:

   * different Projects.

2. If `A.projectId == B.projectId` and `A.versionId == B.versionId`:

   * identical technical version.

3. If `A.versionId` appears in `B.ancestorVersionIds`:

   * B is a known descendant of A.

4. If `B.versionId` appears in `A.ancestorVersionIds`:

   * A is a known descendant of B.

5. Otherwise:

   * succession is not proven;
   * automatic destructive overwrite is forbidden;
   * the representations must be handled as divergent or unresolved according to applicable safety rules.

This classification must remain independent of timestamps.

### 17.12 Relationship to Synchronization

Version relationship classification determines which synchronization behaviors are permitted.

When versions are identical:

* no technical-content synchronization is required.

When one version is a known descendant of the other:

* safe synchronization may be permitted according to the approved direction-specific synchronization rules.

When versions are divergent or succession cannot be proven:

* neither representation may silently overwrite the other;
* both representations must be preserved;
* explicit user control is required.

The synchronization rules already approved remain:

* safe Local → Cloud synchronization may occur automatically when ancestry, authorization, integrity, and conditional-write requirements are satisfied;
* Cloud → Local replacement requires explicit user action;
* divergent branches are preserved until explicit deletion by the user.

### 17.13 Conditional Write Protection

Even when version ancestry proves that a local version is a safe continuation of the known cloud version, cloud persistence must use conditional-write protection.

For example:

```text
Expected cloud version: A
Local version: B
B ancestorVersionIds includes A
```

The cloud update may succeed only if the current cloud version is still A at the moment of persistence.

If the cloud version has changed, the write must fail safely.

HFZWood must then retrieve or evaluate the current state again before determining whether the relationship remains successive or has become divergent.

This prevents race conditions and silent data loss.

### 17.14 Timestamps as Context, Not Authority

`lastModifiedAt` may be used to:

* inform the user which technical version was modified more recently;
* provide useful context during branch comparison;
* support sorting and display.

`metadataModifiedAt` may similarly provide context for descriptive or organizational metadata changes.

Neither timestamp may independently determine:

* Project identity;
* version identity;
* ancestry;
* conflict resolution;
* branch authority;
* overwrite permission.

The technical rule is:

**Timestamps inform. Identity and ancestry decide version relationships.**

### 17.15 Conflict Detection Architecture Rule

The technical rule is:

**HFZWood determines Project relationships through `projectId`, exact version identity through `versionId`, direct ancestry through `parentVersionId`, and complete known branch ancestry through `ancestorVersionIds`. Identical versions share the same `versionId`; known succession must be provable through ancestry; and when succession cannot be proven, automatic destructive overwrite is forbidden. Timestamps provide context but never replace explicit identity and ancestry evidence.**
## 18. Conflict Resolution Architecture

### 18.1 Purpose

When HFZWood detects divergent branches of the same Project, it must preserve user control while keeping the resolution workflow simple and understandable.

Conflict resolution must not become a complex version-control interface.

HFZWood must provide enough information for the user to choose which branch to open and continue working on without silently deleting, overwriting, or discarding another branch.

### 18.2 Simple Branch Selection

When HFZWood detects two or more divergent branches of the same Project, the user is presented with a simple branch-selection interface.

The interface should communicate clearly:

**You have multiple branches of the same Project. Which one do you want to open?**

Each available branch should display only the information necessary for practical identification, including:

* branch location or source, where useful, such as Local or Cloud;
* `lastModifiedAt`;
* principal or alternate branch status, where applicable.

The interface must remain simple and must not expose unnecessary technical identifiers such as `versionId`, `parentVersionId`, or `ancestorVersionIds` to ordinary users.

### 18.3 Most Recently Modified Recommendation

HFZWood may visually recommend the branch with the most recent `lastModifiedAt`.

For example:

**Recommended — Most recently modified**

This recommendation is informational only.

The most recently modified branch must not automatically:

* become principal;
* overwrite another branch;
* delete another branch;
* be opened without user choice;
* gain technical authority over another branch.

The user explicitly chooses which branch to open.

The authoritative rule remains:

**Timestamps inform. They do not resolve conflicts.**

### 18.4 Branch Selection Actions

The branch-selection interface should remain intentionally simple.

The user may:

* explicitly open one available branch;
* cancel the operation.

A separate **Keep both** action is not required because preservation of divergent branches is the default behavior.

Opening one branch does not delete, overwrite, merge, or discard any other branch.

Advanced operations such as automatic merge, detailed content comparison, branch renaming, branch duplication, or archival workflows are not part of the current target architecture.

### 18.5 Selected Working Branch

When the user explicitly opens one divergent branch for continued work, that branch becomes the principal working branch for the current Project workflow.

Subsequent technical saves continue the ancestry of the selected branch.

For example:

```text
        A
       / \
      B   C
      ↑
   selected
```

If the user modifies technical Project content on B and successfully saves it, a new version D is created:

```text
        A
       / \
      B   C
      |
      D
```

The new version follows the approved ancestry rules:

```text
D.parentVersionId = B
D.ancestorVersionIds = B.ancestorVersionIds + [B]
```

The alternate branch C remains unchanged and preserved.

### 18.6 Preservation Notice

After the user selects and opens one divergent branch, HFZWood should clearly inform the user that the other branch or branches remain preserved.

A simple message may communicate:

**You are now working on this branch. The other branch has been kept and can be opened or deleted later.**

The purpose of this message is to make clear that selecting one branch did not destroy the others.

HFZWood must not require the user to make an immediate deletion decision merely to continue working.

### 18.7 Workspace Representation of Branched Projects

A Project with multiple divergent branches must appear as one logical Project in Local Workspace or Cloud Workspace, not as multiple independent Projects.

The Project may display a simple branch indicator, such as:

**2 branches available**

or:

**This Project has alternate branches**

The principal branch may be opened through the normal Project workflow.

Alternate branches may be accessed through Project actions or another simple branch-management entry point.

The exact interface may be defined during implementation, but it must preserve the architectural rule:

**Multiple branches with the same `projectId` remain one logical Project.**

### 18.8 Alternate Branch Access

A preserved alternate branch may be opened later by explicit user action.

Opening an alternate branch must not automatically delete or overwrite the current principal branch.

If the user chooses to continue technical work from an alternate branch, subsequent technical versions continue from that branch's existing ancestry.

HFZWood must preserve branch identity and ancestry rather than pretending that independently evolved branches are a single linear version history.

### 18.9 Alternate Branch Deletion

Deleting an alternate branch is always an explicit user action.

HFZWood must require a clear confirmation before permanently deleting the selected branch.

The confirmation must clearly distinguish branch deletion from complete Project deletion.

For example:

**Delete this alternate branch?**

**This will permanently delete this branch of the Project. The main Project and its other branches will not be affected.**

One clear confirmation is sufficient.

HFZWood does not require multiple confirmation dialogs or manual typing of the Project name for ordinary branch deletion.

### 18.10 Principal Branch Deletion

A branch designated as principal cannot be deleted while it remains the principal branch.

If alternate branches exist, the user must first explicitly designate another preserved branch as principal before deleting the current principal branch.

For example:

**This is the principal branch of the Project. Select another branch as principal before deleting this one.**

Changing the principal designation does not create:

* a new `projectId`;
* a new technical `versionId`;
* a new Project;
* a technical content modification.

It changes only which preserved branch is designated for normal continued work.

### 18.11 Principal Branch Replacement

When another preserved branch is explicitly designated as principal:

* the Project keeps the same `projectId`;
* the selected branch keeps its existing `versionId`;
* its ancestry remains unchanged;
* the previously principal branch remains preserved unless explicitly deleted;
* no branch is silently merged or overwritten.

Principal designation is a branch-management decision, not a technical Project-content modification.

### 18.12 Branch Retention

Divergent branches remain preserved until explicitly deleted by the user.

HFZWood must not automatically remove a branch because it is:

* older;
* inactive;
* not principal;
* less recently modified;
* stored only locally;
* stored only in cloud.

This rule preserves independently evolved Project data and prevents silent loss.

### 18.13 No Automatic Merge

The current HFZWood architecture does not require automatic merging of divergent technical Project branches.

HFZWood must not attempt to silently combine:

* measurements;
* geometry;
* depth data;
* pour layers;
* calculation inputs;
* mix ratios;
* other technical Project content;

from independently evolved branches.

Such automatic merging could create a technical Project state that the user never explicitly created or validated.

If advanced merge or detailed branch comparison is introduced in the future, it requires separate product and technical architecture decisions.

### 18.14 Conflict Resolution Architecture Rule

The technical rule is:

**When divergent branches exist, HFZWood presents a simple user-controlled branch-selection workflow. The most recently modified branch may be recommended but is never automatically authoritative. Opening one branch preserves all others. The selected branch becomes the principal working branch, alternate branches remain accessible until explicitly deleted, and deleting the principal branch requires another branch to be designated as principal first. HFZWood does not silently merge, overwrite, or discard divergent Project data.**
## 19. Identity and Authentication Architecture

### 19.1 Purpose

HFZWood requires authenticated ownership for all Projects while preserving the approved Local-First architecture.

The authentication architecture must:

* provide stable Project ownership identity;
* prevent client-side ownership claims from becoming security authority;
* preserve local work when authentication sessions expire;
* protect unsaved changes during explicit logout;
* separate Local Workspace discovery by authenticated owner;
* allow foreign-owned local Projects to be inspected only under the approved read-only rules;
* keep production authentication separate from development and testing mechanisms.

### 19.2 Authoritative User Identity

In production, `ownerId` derives from the unique, stable, and immutable user identifier supplied by the authoritative authentication system.

The architectural rule is:

**`ownerId` derives from the authoritative authenticated identity provider's stable immutable user identifier.**

Project ownership must not depend on mutable user-facing attributes such as:

* email address;
* username;
* display name;
* subscription tier;
* device identity.

A user may change mutable profile information without changing Project ownership.

The architecture should not be unnecessarily coupled to a specific identity provider. If a provider such as AWS Cognito is used, its stable immutable user identifier may serve as the source of `ownerId`, but the architectural requirement remains provider-independent.

### 19.3 Backend-Derived Authenticated Identity

For protected backend operations, the backend derives the authenticated user's identity from the validated authentication context.

The backend must not trust an `ownerId` supplied by the frontend, local Project file, request body, query parameter, or other client-controlled source as proof of ownership.

A local `.hfzproject` file may contain an `ownerId` as persisted Project metadata, but that value alone does not authorize protected operations.

The backend independently determines:

* who the authenticated user is;
* whether that user owns the Project;
* whether that user has the required capability or entitlement;
* whether the requested operation is authorized.

### 19.4 Backend as Security Authority

The backend is the final authority for ownership validation and protected operations.

This includes, where applicable:

* cloud Project creation;
* cloud save;
* cloud synchronization;
* cloud restore;
* cloud Project deletion;
* cloud branch deletion;
* cloud branch management;
* protected capability enforcement;
* subscription-tier enforcement;
* other backend-mediated protected actions.

The frontend may hide, disable, or prevent unavailable actions for user experience purposes.

However:

**Frontend gating is not a security boundary.**

A protected operation must not succeed merely because the frontend allowed the request.

### 19.5 Mock Authentication

Mock authentication is permitted only for:

* local development;
* automated tests;
* controlled non-production testing environments where explicitly configured.

Mock authentication is not a valid production authentication mechanism.

Production deployment must not silently fall back to mock authentication when real authentication is unavailable, misconfigured, or failing.

A production authentication failure must fail safely rather than granting mock access.

### 19.6 Authentication Expiration During Local Work

Authentication-session expiration must not cause loss of local Project work.

If the user's authentication session expires while a Project is already open, the user may continue:

* viewing the open local Project;
* editing the open local Project;
* performing local Project work;
* saving the Project locally.

Operations requiring authenticated backend or cloud access are suspended until successful reauthentication.

This may include:

* cloud synchronization;
* cloud restore;
* cloud branch management;
* protected backend operations.

Local unsaved changes must remain preserved.

The architectural rule is:

**Session expiration suspends protected remote operations; it does not invalidate or destroy local Project work already in progress.**

### 19.7 Reauthentication

After successful reauthentication, suspended backend and cloud operations may resume only after current authorization, ownership, version, integrity, and synchronization conditions are reevaluated.

HFZWood must not assume that a previously valid remote operation remains safe merely because authentication has been restored.

For example, during the expired session:

* the cloud Project may have changed;
* another branch may have appeared;
* entitlement state may have changed;
* synchronization assumptions may no longer be valid.

Therefore, reauthentication restores authenticated identity but does not bypass current-state validation.

### 19.8 Explicit Logout and Unsaved Changes

Explicit logout must trigger unsaved-changes protection when the current Project contains unsaved changes.

The user must be able to:

* save locally and then continue logout;
* continue logout without saving after explicit confirmation;
* cancel logout and return to the Project.

HFZWood must not silently discard unsaved Project changes merely because the user initiated logout.

If no unsaved changes exist, logout may proceed normally.

### 19.9 Local Files After Logout

Completing logout must not:

* delete local `.hfzproject` files;
* modify their technical content;
* change their `projectId`;
* change their `ownerId`;
* change their version ancestry;
* silently transfer ownership.

The files remain on the user's device.

However, after explicit logout completes, Project editing and protected Project operations require authentication again, according to the approved authenticated-ownership rules.

### 19.10 Session Expiration vs Explicit Logout

HFZWood distinguishes between passive authentication expiration and explicit user logout.

When a session expires passively while a Project is already open:

* local viewing may continue;
* local editing may continue;
* local saving may continue;
* remote protected operations are suspended.

When the user explicitly logs out:

* unsaved-changes protection applies where necessary;
* logout ends the authenticated application session;
* Project editing requires authentication again.

This distinction preserves uninterrupted Local-First work during ordinary session expiration while respecting the user's explicit decision to end the authenticated session.

### 19.11 Owner-Scoped Local Workspace

Local Workspace discovery and indexing are logically scoped by authenticated `ownerId`.

Projects owned by another user must not automatically appear as ordinary Projects in the current user's normal Local Workspace merely because their files exist on the same device.

This prevents Projects belonging to different authenticated users from being automatically mixed into one normal Workspace view.

Auxiliary Local Workspace data should therefore preserve sufficient ownership context to associate known local Project representations with the correct authenticated owner.

### 19.12 Foreign-Owned Local Projects

If the authenticated user explicitly opens a local `.hfzproject` whose persisted `ownerId` belongs to another user, HFZWood applies the approved foreign-ownership behavior.

The Project may be opened for read-only inspection.

The current user must not be allowed to:

* edit the foreign-owned Project;
* overwrite it as though they were the owner;
* synchronize it to their own cloud account;
* claim ownership;
* silently change its `ownerId`;
* use ordinary Save behavior to convert it into their own Project.

The purpose of read-only access is inspection, not ownership transfer.

### 19.13 Read-Only Foreign Project Integrity

Opening a foreign-owned Project in read-only mode must not modify the Project merely because it was opened.

HFZWood must preserve:

* `projectId`;
* `ownerId`;
* `versionId`;
* `parentVersionId`;
* `ancestorVersionIds`;
* Project technical content;
* Project metadata.

No new technical version is created by read-only opening.

No ownership change occurs.

No synchronization to the current user's cloud account is permitted.

### 19.14 Authentication and Project Creation

Authentication is required before entering the Project creation workflow.

A Project must not be created or owned anonymously.

When the approved Project creation threshold is reached, the Project receives the authenticated user's stable `ownerId` according to the authoritative identity rules defined in this architecture.

Authentication is a prerequisite for entering Project creation, but it remains distinct from the Project creation threshold itself.

The threshold remains defined by the approved Product Architecture.

### 19.15 Authentication Architecture Rule

The technical rule is:

**HFZWood derives `ownerId` from the stable immutable identifier of the authoritative authenticated identity system. The backend independently validates identity, ownership, capabilities, and protected operations and never trusts client-supplied ownership as authorization. Mock authentication is restricted to non-production use. Passive session expiration does not interrupt local work already in progress, while explicit logout applies unsaved-changes protection and ends Project editing until reauthentication. Local Workspace discovery is scoped by authenticated owner, and foreign-owned local Projects may be opened only in read-only mode without ownership transfer, editing, or synchronization.**
## 20. AI-Assisted Editorial Translation Architecture

### 20.1 Purpose and Scope

HFZWood must support a multilingual product experience without requiring the administrator to manually translate every editorial item and interface string into every supported language.

AI-assisted translation is therefore a controlled administrative capability designed to support the translation of:

* Manual chapters;
* Tutorial metadata and associated textual content;
* Glossary entries;
* Knowledge Base entries;
* application interface strings;
* image captions and alternative text;
* video titles, descriptions, captions, and other translatable metadata where applicable.

AI translation is not an autonomous publishing system.

The AI provider may generate translation drafts, but it must never:

* publish content automatically;
* modify canonical source content;
* silently overwrite administrator corrections;
* alter document structure;
* change protected technical references;
* activate languages for public users;
* determine final editorial approval.

Human administrative authority remains final.

---

### 20.2 Independent Canonical Source Languages

HFZWood uses different canonical source languages for different content domains.

#### Editorial content

Romanian is the canonical source language for:

* Manual;
* Tutorials;
* Glossary;
* Knowledge Base;
* other administrator-authored educational or editorial content.

The normal editorial workflow is:

> Romanian canonical source → AI-assisted target-language drafts → structural validation → administrative approval → explicit publication

#### Application interface

English is the canonical source language for:

* navigation;
* buttons;
* labels;
* dialogs;
* hints;
* validation messages;
* error messages;
* tooltips;
* other user-facing interface strings.

The normal interface localization workflow is:

> English canonical interface string → target-language translation → readiness tracking → language activation

The two domains remain independent while sharing the same general translation infrastructure.

English being the product fallback language does not make English the canonical source language for editorial content.

Romanian being the canonical editorial source language does not require the application interface source to be rewritten in Romanian.

---

### 20.3 Public Language Selection and Browser Preference

HFZWood must maintain a central registry of configured languages.

The initial configured language set may include, without being limited to:

* Romanian;
* English;
* German;
* French;
* Italian;
* Spanish;
* Portuguese;
* Bulgarian;
* Czech;
* Polish;
* Croatian;
* other languages added later.

A configured language is not automatically exposed to users.

For the initial public release:

* Romanian is the canonical editorial source language;
* English is the canonical interface source language and product fallback language;
* Romanian and English are expected to be the first publicly available languages.

On first use, before an explicit language preference exists:

1. HFZWood reads the browser's preferred language list.
2. If a supported and publicly active language matches the browser preference, HFZWood uses that language.
3. Otherwise, HFZWood starts in English.

An explicit user-selected language preference takes precedence over browser detection.

Geolocation is not required for language selection. Browser language preference is sufficient and avoids unnecessary location permissions and incorrect assumptions about a user's preferred language.

---

### 20.4 Language Configuration, Readiness, Activation, and Deactivation

Languages must be centrally configured and administratively controlled.

A language may exist internally while still being prepared. The administrator must be able to work on its translations without exposing it publicly.

Conceptually, a language may progress through states such as:

* configured but inactive;
* incomplete;
* ready to activate;
* active and publicly available;
* inactive after previous public activation.

The user-facing administrative experience should remain simple. The primary public distinction is:

* **Inactive** — not visible to users;
* **Active** — visible and selectable by users.

Internal readiness tracking may provide additional information without unnecessarily complicating the administrative interface.

A language may be publicly activated for the first time only when the complete required HFZWood experience is available in that language.

This includes, where applicable:

* application interface;
* Manual;
* Tutorials;
* Glossary;
* Knowledge Base;
* critical dialogs;
* error states;
* other mandatory user-facing content.

For initial activation, all required interface strings and mandatory editorial content must be current and complete.

Partially completed languages must not appear in the public language selector.

After a language has been activated, later source changes may temporarily create outdated translations without automatically removing the language from public availability.

A configured language is not deleted through the normal administrative workflow.

Deactivation:

* removes the language from the public selector;
* preserves all translations;
* preserves manual administrator corrections;
* preserves publication state;
* preserves translation metadata;
* permits later reactivation after readiness is re-evaluated.

Permanent destructive deletion of a complete language and all associated translation data is not required for the initial implementation.

---

### 20.5 Translation Granularity

HFZWood must use translation units appropriate to the real structure and expected editorial workflow of each content domain.

The default translation units are:

* **Manual:** one complete chapter;
* **Knowledge Base:** one complete entry or question-and-answer item;
* **Glossary:** one complete term entry;
* **Tutorials:** one complete translatable tutorial metadata item or associated editorial item;
* **Application interface:** one stable UI translation key.

Manual chapters are intentionally compact. Therefore, when a Romanian Manual chapter changes, the default behavior is to regenerate the complete affected chapter rather than implement paragraph-level incremental translation complexity.

This provides:

* simpler architecture;
* better linguistic context;
* greater translation consistency;
* lower implementation complexity;
* easier status tracking;
* negligible practical cost impact for compact chapters.

HFZWood may preserve stable internal content blocks for structure, media placement, YouTube embeds, warnings, notes, and other semantic elements. However, these blocks are not required to function as independent translation units.

When a canonical source item changes, only that editorial item becomes outdated.

The entire Manual, Knowledge Base, or Glossary must not be regenerated because one individual item changed.

---

### 20.6 Translation Status Model

Translation status must be tracked independently for each target-language translation unit.

Relevant states include:

* **Missing** — no target-language translation exists for the current source item;
* **AI Generated** — a structurally valid AI-generated draft exists;
* **Needs Attention** — a generated result exists but deterministic structural validation detected an anomaly;
* **Approved for Publication** — the administrator has explicitly accepted the translation for publication;
* **Published** — the translation is publicly available;
* **Outdated** — the translation was generated from an earlier canonical source revision;
* **Failed** — no usable translation was produced because of a technical or processing failure.

`Failed` must not be used merely because a translation contains a linguistic imperfection.

If AI generates a usable translation that requires a manual wording correction, the translation remains a generated draft and may be manually edited by the administrator.

Technical failure in one target language must never invalidate, roll back, or delete successful translations for other languages.

---

### 20.7 Source Revision Tracking and Outdated Translations

Every translatable canonical item must have a stable identity and a trackable source revision.

Every generated target-language translation must record the exact source revision from which it was produced.

When a canonical source item changes:

* existing target-language translations derived from an earlier source revision become `Outdated`;
* existing translations are not deleted;
* existing administrator corrections are not overwritten;
* already published translations remain publicly available until explicitly replaced;
* new AI-generated updates are created as drafts.

For example:

> Romanian Chapter 5 revision 4 → German translation generated from revision 4

If the Romanian source becomes revision 5:

> German translation from revision 4 → Outdated

The German published version may remain publicly visible until a new German translation is generated, approved, and explicitly published.

No source revision change may silently replace published translated content.

---

### 20.8 New Content and Cross-Language Visibility

New Romanian canonical editorial content may be published independently of translations.

For example, when a new Manual chapter, Glossary entry, or Knowledge Base item is published in Romanian:

* it becomes immediately available to Romanian-language users;
* it becomes `Missing` for target languages that do not yet have a corresponding translation;
* it does not automatically deactivate those languages;
* it does not block publication of the Romanian source.

HFZWood does not use cross-language fallback for newly published editorial items.

If a new Romanian item has no published German version:

* German-language users do not see that item temporarily;
* the application does not substitute the English or Romanian version;
* the item becomes visible automatically after the German translation is approved and published.

This creates a clear distinction:

* **Missing:** no published translation exists in the selected language, so the new item remains hidden;
* **Outdated:** an older published translation exists and remains visible until explicitly replaced.

Cross-language fallback is intentionally avoided for editorial content because new translations are expected to become available within a short editorial cycle, and mixed-language experiences would reduce coherence and trust.

---

### 20.9 AI Translation Actions

The administrative translation interface must support both broad and selective translation actions.

Primary actions should include:

* **Generate all translations**;
* **Generate selected languages**;
* **Update outdated translations**;
* **Retry failed translation**;
* **Regenerate entire item**, when explicitly requested.

`Generate all translations` must not mean blindly retranslating all existing content.

It means generating the required translation work for all selected or enabled target languages, according to current translation state.

Existing current translations must not be unnecessarily regenerated.

Administrator corrections must not be silently overwritten.

When regeneration would replace an existing manually edited draft or other valuable translation state, the administrator must receive an explicit warning or the new generation must be preserved separately until accepted.

---

### 20.10 Sequential Translation Queue

Translation generation is expected to be an infrequent administrative workflow involving a limited number of languages.

Maximum throughput is therefore less important than:

* predictability;
* visibility;
* controlled API consumption;
* simple error handling;
* easy retry behavior.

`Generate all translations` creates an ordered translation queue.

Target languages are processed sequentially, one at a time.

The next target language begins automatically after the current language reaches a terminal result such as:

* completed;
* needs attention;
* failed.

Manual confirmation between every language is not required.

The Admin Panel must display progress clearly, for example:

> English — Completed
> French — Completed
> German — Generating
> Spanish — Waiting
> Portuguese — Waiting
> Bulgarian — Waiting
> Czech — Waiting
> Polish — Waiting

The administrator may:

* monitor progress;
* pause after the current language;
* stop remaining queued work;
* retry failed items;
* regenerate selected languages.

Every successful translation must be saved immediately as an independent draft.

The queue must not wait for all languages to complete before preserving successful results.

A failed target language must not block the remaining queue.

For the initial local implementation, a lightweight backend job mechanism is sufficient.

The initial architecture does not require enterprise-scale queue infrastructure.

If the local backend is stopped while a translation is actively running:

* already completed translations remain preserved;
* the interrupted language may require retry;
* token-level or partial-response recovery is not required.

The architecture must permit more durable production job execution later without redesigning the editorial translation workflow.

---

### 20.11 Structural Validation

Every AI-generated translation must pass deterministic structural validation before it is treated as a normal generated draft.

Structural validation does not attempt to judge whether a Bulgarian, French, German, or other translation is stylistically perfect.

It verifies objective integrity.

Validation may verify:

* required fields are present;
* expected translatable content has not disappeared;
* the result is not empty;
* the result is not obviously truncated;
* required structural elements remain present;
* protected URLs remain intact;
* YouTube references remain intact;
* internal references remain intact;
* media references remain intact;
* stable identifiers are unchanged;
* other protected technical elements have not been removed or unexpectedly modified.

If the source contains, for example:

* one title;
* five paragraphs;
* one warning;
* one YouTube embed;
* one caption;

and the AI result unexpectedly omits required content, the result must not be treated as a normal completed translation without warning.

Instead, the result is preserved and marked:

> **Needs Attention**

The administrator must be shown the detected issue and may:

* retry the translation;
* correct the result manually;
* inspect the source and target;
* approve it after the issue is resolved.

A `Needs Attention` result must not participate accidentally in bulk approval or bulk publication.

Structural validation must remain appropriately scoped. The initial implementation does not require a highly complex semantic validator attempting to prove the linguistic correctness of every sentence.

---

### 20.12 Protected Technical Content

AI may transform linguistic content only.

The following remain under HFZWood system control and must not be arbitrarily modified by the AI provider:

* stable identifiers;
* internal references;
* cross-references;
* URLs;
* media references;
* image asset identifiers;
* YouTube video identifiers;
* document structure;
* editorial metadata;
* publication state;
* other protected technical elements.

Numerical values, formulas, dimensions, temperatures, percentages, and units must preserve their semantic meaning during translation.

AI translation must not independently convert:

* millimeters to inches;
* Celsius to Fahrenheit;
* liters to gallons;
* metric values to imperial values;
* other measurement systems.

Unit conversion belongs to HFZWood preferences, calculator logic, and display systems, not to the translation provider.

The translation provider may receive sufficient structural context to produce natural language, but it must not become authoritative over document identity, media placement, references, or technical values.

---

### 20.13 Editorial Structure, Images, and YouTube Embeds

Editorial structure and media references are shared across language variants.

The canonical editorial item defines the ordered structure of:

* headings;
* paragraphs;
* warnings;
* notes;
* images;
* image captions;
* YouTube embeds;
* other semantic blocks.

Adding, removing, moving, or replacing a structural media element in the canonical editorial item propagates that structural change across language variants.

AI does not control the position of images or YouTube embeds.

#### Images

Editorial images are represented through stable media asset identifiers rather than local filesystem paths or hard-coded storage URLs.

A local path such as a Windows filesystem path must never become the permanent production reference stored in editorial content.

The expected production flow is:

> Admin selects image → HFZWood backend uploads image → durable object storage stores image → stable asset identifier is created → editorial content references asset identifier

Local development may use local media storage.

Production media is expected to use durable object storage such as Amazon S3 or an equivalent production storage mechanism.

The editorial content must reference a stable logical asset identity rather than depend directly on a permanent physical storage URL.

The initial HFZWood public release is not expected to contain editorial image assets.

Therefore:

* no initial image migration workflow is required for launch preparation;
* production media upload architecture must nevertheless be available for later use;
* images may be added progressively after launch through the AWS-hosted production Admin Panel;
* adding images after launch must not require Git commits or application redeployment.

When an image is added after launch:

* the image is uploaded through the production Admin Panel;
* the backend stores it in production object storage;
* its structural position propagates across language variants;
* language-specific captions and alternative text may be translated independently.

By default, all language variants inherit the same image.

A language-specific image override may be supported in exceptional cases, such as:

* an image containing localized text;
* a language-specific screenshot;
* a genuinely different media requirement.

Such overrides are exceptional, explicit, and must not alter the canonical source or unrelated language variants.

#### YouTube embeds

YouTube videos may remain English-only for all users.

The same YouTube video reference is shared across language variants and appears in the same structural position.

The video itself does not need to be translated.

Translatable associated metadata may include:

* title;
* caption;
* description;
* explanatory surrounding text.

YouTube embeds may be added:

* before initial launch;
* after initial launch;
* directly through the production Admin Panel.

Adding or updating a YouTube embed must not require a Git commit or application redeployment.

---

### 20.14 Media and Structural Changes Versus Translation Changes

HFZWood must distinguish between linguistic changes and non-linguistic structural or media changes.

Examples:

* changing translatable paragraph text may make target-language translations outdated;
* adding a new paragraph to a Manual chapter makes that chapter outdated in target languages;
* changing a caption or alternative text makes the corresponding translation state outdated;
* replacing a shared image without changing translatable metadata does not necessarily require linguistic regeneration;
* adding a YouTube embed propagates the shared structural reference across language variants;
* changing translatable video metadata may require translation updates.

The system must not trigger unnecessary AI translation merely because a non-linguistic shared asset reference changed.

---

### 20.15 Glossary-Guided Terminology

Approved multilingual Glossary terminology must be used as authoritative translation context wherever relevant.

When translating Manual, Tutorial, or Knowledge Base content, the translation system should identify relevant approved Glossary terminology and provide it as context to the AI provider.

For example:

> source technical term → approved target-language term

The complete Glossary does not need to be sent with every translation request.

Only relevant approved terms or a compact set of essential domain terminology should be included.

This reduces:

* unnecessary token consumption;
* prompt size;
* irrelevant context.

It improves:

* terminology consistency;
* technical accuracy;
* cross-module coherence.

If no approved translation exists for a technical term, AI may propose a translation.

However:

* the proposal does not automatically become authoritative;
* AI must not silently modify the official Glossary;
* official terminology remains administrator-controlled.

If an approved Glossary translation changes later, already published content is not silently rewritten.

The system may identify affected content for future review, but automatic rewriting of published translations is prohibited.

---

### 20.16 Translation Context Profile

HFZWood must maintain a controlled Translation Context Profile designed specifically for AI-assisted translation.

The Translation Context Profile is not raw ChatGPT conversation history.

It is a compact, curated, translation-specific representation of relevant HFZWood knowledge.

It may include:

* what HFZWood is;
* the woodworking and epoxy-resin domain;
* the application's purpose;
* the target audience;
* the distinction between professionals and beginners;
* expected editorial tone;
* clarity and concision requirements;
* technical terminology rules;
* preservation of warnings and safety-critical meaning;
* prohibition against inventing information;
* rules for values, dimensions, temperatures, formulas, and units;
* instructions to produce natural target-language prose rather than mechanical word-for-word translation;
* other translation-relevant HFZWood conventions.

A translation request may therefore contain:

> Translation Context Profile
>
> * translation rules
> * relevant approved Glossary terminology
> * canonical source item
> * target language

The system must not send entire historical ChatGPT conversations to the translation provider.

The Translation Context Profile should be versioned.

For example:

> `translationProfileVersion: 1`

If the profile later changes:

> `translationProfileVersion: 2`

the new version applies prospectively to translations generated from that point forward.

Changing the Translation Context Profile:

* does not automatically mark existing translations as outdated;
* does not require already published translations to be regenerated;
* does not silently alter existing content.

Every generated translation should record the Translation Context Profile version used.

This provides traceability without invalidating earlier approved content.

---

### 20.17 Provider-Agnostic AI Architecture

HFZWood must not hard-code the editorial translation workflow to one permanent AI provider.

The architecture must remain provider-agnostic.

The initial implementation may use one provider, such as an OpenAI or Gemini model, but translation workflow contracts must not depend on one vendor-specific model identity.

The architecture should conceptually support:

* a translation provider;
* future provider replacement;
* future model replacement;
* future independent translation review provider.

The initial implementation requires only AI-assisted translation generation and administrative approval.

Independent second-AI review is deferred.

The architecture should nevertheless leave a clear extension point so that a future workflow may support:

> AI Provider A generates translation → AI Provider B independently reviews translation → structured review findings → administrator decision

A future review provider must not silently overwrite translations.

It should produce structured findings such as:

* omission detected;
* terminology inconsistency;
* meaning changed;
* numerical discrepancy;
* possible invented information;
* review recommended.

The initial release does not require this second-AI review integration.

It should be added only if real editorial volume justifies the additional:

* implementation complexity;
* provider configuration;
* API costs;
* review state management;
* operational handling.

---

### 20.18 AI Provider Credentials and Execution Environment

AI provider credentials must never be exposed to the frontend or browser.

AI requests must flow through the HFZWood backend.

The logical flow is:

> Admin Panel → HFZWood backend → AI provider → HFZWood backend → translation draft

For initial launch preparation, AI translation may be enabled only in the local administrative development environment.

The initial flow may be:

> Local Admin Panel → local HFZWood backend → AI provider → local translation drafts

The API credential is:

* private;
* stored outside the Git repository;
* never committed;
* never exposed to frontend code.

Production AWS enablement is optional for the initial release.

However, the architecture must permit future server-side production enablement without redesigning the translation system.

The future production flow may be:

> Production Admin Panel → production HFZWood backend → AI provider → production editorial draft

This permits post-launch content updates and translation without:

* local development synchronization;
* Git commits;
* developer intervention;
* application redeployment.

The concrete AI provider and model are intentionally deferred until implementation.

Provider selection should consider:

* translation quality;
* domain accuracy;
* cost;
* API reliability;
* latency;
* supported languages;
* operational simplicity.

AI API usage is expected to be consumption-based.

Given the expected HFZWood editorial workflow—initial content generation followed by relatively infrequent updates—translation API cost is not expected to require a permanently high-volume infrastructure.

Cost controls may be introduced if actual usage later justifies them.

---

### 20.19 Data Minimization for AI Requests

HFZWood must follow data-minimization principles when communicating with AI providers.

Translation requests should contain only what is necessary:

* selected canonical source content;
* source language;
* target language;
* necessary structural context;
* relevant approved Glossary terminology;
* Translation Context Profile;
* required translation instructions.

The system must not send unrelated data such as:

* user identities;
* user account information;
* subscription data;
* user Projects;
* project images;
* unrelated editorial content;
* authentication information;
* internal secrets;
* unrelated application metadata.

Media files do not need to be sent to the AI provider for normal text translation.

Only translatable associated text may be sent, such as:

* captions;
* alternative text;
* titles;
* descriptions.

Translation requests should be scoped to individual editorial translation units or controlled batches.

The entire editorial corpus must not be sent merely to translate one compact chapter or one Glossary entry.

---

### 20.20 Minimal AI Translation Audit Metadata

HFZWood should preserve minimal metadata for AI-generated translations.

Relevant metadata may include:

* source language;
* target language;
* source item identity;
* exact source revision;
* generation timestamp;
* AI provider;
* AI model;
* Translation Context Profile version;
* generation status;
* simplified failure information where applicable.

The initial implementation does not require permanent storage of:

* complete prompts;
* raw provider responses;
* verbose provider diagnostics;
* unnecessary internal reasoning artifacts.

The goal is traceability, not exhaustive AI telemetry.

---

### 20.21 Administrative Approval and Bulk Publication

Because the administrator may not understand every supported target language, administrative approval must not be represented as a claim of native-speaker linguistic verification.

For example, the administrator may not be able to independently verify every Bulgarian, Czech, Portuguese, or Polish translation.

Therefore, the workflow should distinguish:

* AI generation;
* structural validation;
* administrative approval for publication;
* publication.

The preferred state is:

> **Approved for Publication**

rather than a misleading implication that every translation has received full linguistic review.

The administrator may:

* inspect selected translations;
* perform spot checks;
* use external AI tools for additional verification;
* correct individual translations manually;
* accept the generated batch for publication.

Bulk actions should be supported.

After a translation queue completes, the administrator may explicitly:

1. approve an entire eligible generated batch for publication;
2. publish all approved translations through a separate explicit action.

Approval and publication should remain separate actions to protect against accidental immediate publication.

Translations marked `Needs Attention` or `Failed` must not be included automatically in bulk approval or bulk publication.

Administrator manual corrections are authoritative.

They must not be silently overwritten by later AI regeneration.

---

### 20.22 Translation Update Behavior

When canonical Romanian editorial content changes:

1. the canonical source receives a new revision;
2. affected target-language translations become `Outdated`;
3. already published target-language content remains available;
4. the administrator may request updates for all or selected languages;
5. translations are generated sequentially;
6. each result is structurally validated;
7. successful results are saved as new drafts;
8. existing published translations and manual corrections remain preserved;
9. the administrator approves eligible translations;
10. publication explicitly replaces the previous public versions.

For Manual content, the complete affected chapter is regenerated by default.

For Knowledge Base content, the affected entry is regenerated.

For Glossary content, the affected term entry is regenerated.

For UI localization, only affected interface keys require translation updates.

Full regeneration of unrelated current content is prohibited by default.

---

### 20.23 Interface Translation Tracking

Application interface translation is tracked independently from editorial content translation.

Every stable UI translation key must be classified for each configured target language as:

* `Missing`;
* `Current`;
* `Outdated`.

When a new English canonical UI key is introduced:

* it becomes `Missing` for target languages without a translation.

When an existing English canonical UI string changes:

* dependent target-language translations become `Outdated`.

The administrator may generate:

* missing translations;
* outdated translations;
* selected translations.

Because HFZWood interface text volume is relatively small compared with editorial content, the system does not require unnecessarily complex interface translation machinery.

The existing English interface remains the canonical interface source.

For first public activation of a language:

* all required UI translation keys must be current;
* required editorial content must be complete.

After activation, later UI source changes may temporarily create outdated keys without automatically removing the language from public availability.

Interface translation may be approved at package level rather than requiring mandatory manual confirmation of every individual button, hint, label, or generic UI string.

---

### 20.24 Initial Implementation Boundary

The initial implementation should include:

* central configured-language registry;
* active/inactive public language control;
* Romanian canonical editorial source;
* English canonical interface source;
* browser-language detection with English fallback;
* translation status tracking;
* source revision tracking;
* missing and outdated detection;
* AI translation through one provider;
* local-backend AI execution for launch preparation;
* sequential target-language processing;
* generate-all and selective generation;
* isolated retry behavior;
* structural validation;
* `Needs Attention` handling;
* administrative editing of generated drafts;
* batch approval for publication;
* explicit bulk publication of approved translations;
* Translation Context Profile;
* relevant Glossary terminology context;
* minimal AI audit metadata;
* stable preservation of document structure and YouTube embeds;
* production-ready architectural path for later image uploads;
* architectural support for later production AWS AI enablement.

The initial implementation does not require:

* simultaneous unrestricted translation requests;
* paragraph-level incremental translation for compact Manual chapters;
* automated linguistic quality scoring;
* automatic publication;
* automatic rewriting of published translations;
* automatic second-AI review;
* permanent destructive language deletion;
* complex semantic validation of every numerical statement;
* full historical prompt storage;
* image migration for initial launch;
* enterprise-scale distributed translation queue infrastructure.

These boundaries are deliberate.

The architecture must solve the real HFZWood editorial workflow without introducing unnecessary complexity before real usage justifies it.

---

### 20.25 Architectural Invariants

The following invariants are mandatory:

1. Romanian is the canonical source language for HFZWood editorial content.
2. English is the canonical source language for the HFZWood application interface.
3. English remains the product fallback language when no supported browser-preferred or explicitly selected language applies.
4. AI-generated translations are always drafts until explicitly approved and published.
5. AI never publishes content automatically.
6. AI never silently overwrites canonical source content.
7. AI never silently overwrites administrator corrections.
8. AI does not control document structure, media placement, stable identifiers, or protected technical references.
9. A language is not publicly selectable at first activation until the complete required product experience is ready.
10. Later outdated content does not automatically deactivate an already public language.
11. Missing newly published editorial items remain hidden in target languages until translated and published.
12. Cross-language editorial fallback is not used for missing new content.
13. Existing outdated published translations remain available until explicitly replaced.
14. Failure in one target language never rolls back successful work in another.
15. Translation processing is sequential by default.
16. Successful translation results are preserved immediately.
17. Structural anomalies are surfaced as `Needs Attention` rather than silently accepted or automatically discarded.
18. Manual chapters are regenerated as complete chapter-level translation units by default.
19. Glossary terminology is authoritative when an approved target-language term exists.
20. Translation Context Profile changes apply prospectively and do not invalidate existing published translations.
21. AI provider credentials are never exposed to the frontend.
22. Translation requests follow data-minimization principles.
23. Images and YouTube embeds retain stable structural placement across language variants.
24. Production editorial updates must not require Git commits or application redeployment.
25. Independent second-AI review remains a future extension point, not an initial implementation requirement.

---

### 20.26 Deferred Decisions

The following remain intentionally deferred until implementation or real operational need:

* exact initial AI provider;
* exact AI model;
* exact provider SDK;
* exact API pricing plan;
* exact production secret-storage mechanism;
* exact durable production job infrastructure, if later required;
* exact production media delivery layer beyond durable object storage;
* exact future second-AI review provider;
* exact review-report schema for future independent AI verification;
* exact UI design of translation dashboards and progress indicators;
* exact Translation Context Profile wording;
* exact initial complete configured-language list beyond the confirmed starting languages and expected expansion set.

These decisions must be made only when implementation evidence, actual provider capabilities, real costs, or real editorial usage justify them.

---

### 20.27 Final Architectural Rule

The AI-assisted translation system exists to multiply editorial reach without surrendering editorial control.

HFZWood must use AI to reduce repetitive translation work while preserving:

* canonical source authority;
* administrator control;
* structural integrity;
* technical accuracy;
* terminology consistency;
* explicit publication boundaries;
* predictable failure handling;
* future provider flexibility.

The governing rule is:

> **AI may generate. The system validates. The administrator approves. Publication remains explicit.**
## 21. Subscription and Capability Architecture

### 21.1 Purpose

The Subscription and Capability Architecture defines how HFZWood determines, resolves, preserves, enforces, and evolves user access to product functionality.

Its purpose is to separate commercial access models from application behavior so that product modules do not depend directly on subscription names, pricing models, payment mechanisms, or future commercial changes.

The core architectural rule is:

**Application modules consume effective capabilities. They do not infer access directly from subscription tiers or commercial product names.**

This allows HFZWood to evolve from Free and recurring subscription access toward possible future lifetime purchases, promotions, administrative grants, separately purchased capabilities, or other entitlement models without requiring the Resin Calculator or other product modules to be rewritten.

### 21.2 Separation of Identity, Role, Subscription, Entitlements, and Capabilities

HFZWood maintains a strict separation between:

* **Identity** — who the authenticated user is;
* **Role** — the user's system authority, such as `user` or `administrator`;
* **Subscription** — one possible commercial access state, such as Free or Subscriber;
* **Entitlements** — valid sources of commercial or administrative access;
* **Capabilities** — the final resolved permissions, limits, and product behaviors available to the user.

These concepts must not be collapsed into one another.

For example, a user may have:

* the `user` role;
* a Free subscription state;
* a temporary promotional entitlement;
* an effective capability allowing a specific premium function.

Similarly, a future permanent purchase may provide capabilities independently of a recurring subscription.

The architecture must therefore support the general resolution model:

**Role + valid entitlements → effective capabilities**

### 21.3 Backend Authority

The backend is the authoritative source for account-level subscription state, entitlements, and effective capabilities.

The frontend must not independently infer product permissions from a tier name.

For example, application modules must not contain logic such as:

`if tier == free, allow four polygon points`

Instead, the frontend consumes resolved capabilities such as:

* `calculator.maxPolygonPoints`;
* `calculator.layerCalculation`;
* `calculator.pdfExport`;
* `projects.maxCloudProjects`;
* other current or future capability values.

This preserves commercial flexibility and prevents product modules from becoming coupled to specific pricing models.

### 21.4 Capability Resolution

The backend capability resolver combines:

* authenticated role;
* active recurring subscriptions;
* permanent entitlements, if introduced;
* temporary promotional entitlements, if introduced;
* administrative grants, if introduced;
* other future valid entitlement sources.

The result is one effective capability set consumed by the application.

When multiple valid entitlement sources provide different values for the same capability, the effective result should normally be the most permissive valid value for the user.

For example:

* a boolean capability is enabled if any valid entitlement enables it;
* a quantitative limit uses the highest valid limit;
* unlimited access overrides lower numerical limits.

Explicit administrative or security restrictions may override normal permissive combination rules.

The application must not assume that recurring subscription is the only possible source of product access.

### 21.5 Administrator Capabilities

Administrator authority remains separate from commercial subscription state.

An administrator receives unlimited administrative and product capabilities according to backend resolution rules, independently of whether the account has a commercial subscription.

Product modules still consume capabilities rather than checking directly for administrator status unless administrator identity itself is specifically required for an administrative workflow.

### 21.6 Capability Catalog Versioning

The backend-owned capability catalog must be explicitly versioned.

Capability responses should include sufficient version information to determine whether locally cached capability data is current or stale.

When HFZWood reconnects successfully, newer authoritative capability information replaces older cached account-level capability information.

Catalog versioning must allow new capabilities to be introduced without requiring application modules to depend on commercial plan names.

Project structural capability snapshots remain separate from the current account-level capability catalog and are governed by Project continuation rules.

### 21.7 Offline Capability Validation

HFZWood may cache the last successfully validated account-level capability set on the local device.

For time-sensitive commercial access, such as an active recurring subscription, the cached capability set may remain usable offline for up to seven days from the last successful backend validation.

The seven-day window is based on elapsed time since successful validation, not on how long the application has been actively open.

If the user does not open HFZWood for several weeks and later returns while online, the application may immediately revalidate current capabilities.

If the user returns without connectivity after the seven-day validation window has expired:

* existing Projects remain available according to their legitimate Project structural capability snapshots;
* cached recurring-subscription capabilities must not be treated as indefinitely current;
* creation of new premium Projects may require successful revalidation;
* premium services requiring current account-level authorization may remain unavailable until revalidation succeeds.

The seven-day offline window applies to time-sensitive entitlements.

A future permanent or lifetime entitlement must not become invalid merely because seven days have passed without connectivity.

### 21.8 Permanent Entitlements and Future Commercial Models

HFZWood may in the future support permanent one-time purchases, lifetime access, promotions, separately purchased capabilities, or other commercial models.

A permanent entitlement must be modeled as a durable entitlement rather than as a recurring subscription with an artificial expiration period.

Permanent commercial access does not imply unlimited account sharing or unlimited device activation.

Future mechanisms may include:

* trusted devices;
* device activation limits;
* reauthentication;
* email verification codes;
* device revocation;
* account-sharing detection;
* license-abuse prevention.

The exact mechanism is intentionally deferred to a future Business Platform and account-protection architecture.

The current architecture establishes only the following principle:

**Permanent entitlements remain permanent, but HFZWood may protect them against unauthorized account sharing or serious abuse without redefining the underlying purchased entitlement.**

### 21.9 Project Structural Capability Snapshot

Each valid Project stores a minimal snapshot of the structural capabilities required to continue that Project legitimately.

This Project-level snapshot is separate from:

* the user's current subscription state;
* the current account-level capability set;
* the commercial source from which access originated.

Its purpose is to ensure that a Project legitimately created with broader structural capabilities does not become unusable or artificially degraded after a normal subscription downgrade or expiration.

The Project structural capability snapshot must include only capabilities required to create, modify, and continue the technical structure of the Project.

Examples include:

* maximum polygon complexity;
* layer calculation availability;
* other future capabilities that directly control technical Project structure or Project Tool behavior.

The snapshot must not include independent commercial services such as:

* PDF export;
* Cloud Workspace access;
* cloud storage limits;
* AI services;
* other independent online or account-level services.

These remain governed by the user's current effective account-level capabilities.

### 21.10 Existing Project Continuation After Normal Downgrade

Normal subscription expiration or downgrade must not degrade Projects that were legitimately created with broader structural capabilities.

If a Project was created while the user had premium structural capabilities:

* the Project remains editable;
* existing premium structures remain valid;
* the user may continue modifying the Project within the structural capability set legitimately associated with that Project;
* HFZWood must not delete, simplify, invalidate, or force-convert premium Project structures merely because the account later becomes Free.

The Project inherits the complete set of structural capabilities available to it when its structural capability snapshot is established.

The Project is not limited only to the exact premium features that happened to be used before downgrade.

For example, if layer calculation was available to the Project but had not yet been used, the Project may still use layers later according to its preserved structural capability snapshot.

The architectural rule is:

**Normal downgrade may restrict new Project creation and current account-level services, but it does not remove legitimately acquired structural continuation rights from existing Projects.**

### 21.11 New Projects After Downgrade

New Projects are governed by the user's current effective capabilities at the time the Project becomes valid and receives its `projectId`.

A user who has returned to Free access may therefore continue existing premium Projects according to their structural snapshots while new Projects follow current Free restrictions.

The immutable primary image rule prevents an existing premium Project from being reused as a different Project merely to bypass current capability restrictions.

A different primary image requires a new Project and a new `projectId`.

Copying, renaming, or moving an existing `.hfzproject` file does not create a new Project when the `projectId` remains unchanged.

### 21.12 Project Capability Expansion After Upgrade

A Project structural capability snapshot may expand but must not contract after a normal commercial downgrade.

If a Free user upgrades and later opens an existing Free Project while broader structural capabilities are currently valid:

* the Project may use the broader structural capabilities;
* the Project snapshot may be expanded accordingly;
* no bulk mutation of all existing local Project files occurs.

Expansion is lazy and Project-specific.

Only the Project currently opened under broader valid capabilities is eligible for snapshot expansion.

Projects that remain unopened are not modified.

The architectural rule is:

**Project structural entitlements may expand through legitimate upgrade, but normal downgrade does not reduce them.**

### 21.13 Successful Save Requirement for Snapshot Expansion

Opening a Project under broader valid capabilities does not, by itself, permanently modify the Project file.

The Project Structural Capability Snapshot is technical Project metadata according to the Project Data Separation and Technical Versioning Rules defined in Section 12.

A structural capability snapshot expansion becomes persistent only after a successful explicit Save.

A snapshot-only expansion:

* must be recognized by the Save pipeline as a persistent metadata change;
* does not by itself generate a new `versionId`;
* does not by itself change `parentVersionId`;
* does not by itself update `lastModifiedAt`;
* updates `metadataModifiedAt`;
* must be included in the resulting persisted `.hfzproject` representation.

If the same Save also persists a real technical Project-content change:

* the normal technical versioning rules apply;
* a new `versionId` is generated;
* the previous technical `versionId` becomes `parentVersionId`;
* `lastModifiedAt` is updated;
* `metadataModifiedAt` is also updated because the structural capability snapshot changed.

If the user attempts to leave the Project before the expanded snapshot has been successfully saved:

* the existing unsaved-changes protection applies;
* **Save** persists the expanded snapshot;
* **Discard** abandons the unpersisted expansion together with any other discarded unsaved changes;
* **Cancel** keeps the user in the Project.

The application must never report a Project Structural Capability Snapshot expansion as permanently stored unless persistence has completed successfully.

The authoritative rule is:

**A Project Structural Capability Snapshot expansion is a persistent technical-metadata change. It becomes durable only through a successful explicit Save, updates `metadataModifiedAt`, and does not by itself create a new technical Project version.**


### 21.14 Newly Introduced Structural Capabilities

A new structural capability introduced in a future capability catalog is not automatically granted to every historical Project.

An existing Project may acquire the new structural capability when:

* the authenticated user currently holds the corresponding effective entitlement;
* the Project is opened under that entitlement;
* the expanded Project snapshot is successfully persisted.

Historical Projects preserve capabilities already acquired, but future capabilities are acquired only through current legitimate entitlement.

This prevents old premium Projects from automatically becoming permanent holders of every premium capability introduced in the future.

### 21.15 Local Snapshot Trust Boundary

The Project structural capability snapshot stored inside a local `.hfzproject` file supports legitimate local and offline Project continuation.

However, local Project metadata is not authoritative proof of commercial authorization for protected backend or cloud operations.

A local JSON file may be copied or manually modified outside HFZWood.

Therefore:

* local Project continuation may use the persisted structural snapshot;
* protected server operations require independent backend validation;
* manually changing a local Project file must not grant unauthorized cloud access, premium services, or account-level capabilities.

The architecture should not introduce unnecessary complexity solely to prevent users from editing their own local files.

The security boundary is simple:

**Local Project continuity may rely on local Project state; protected server operations rely on backend authority.**

### 21.16 Frontend and Backend Enforcement

Capability enforcement occurs in both frontend and backend, with different responsibilities.

The frontend is responsible for:

* presenting only appropriate available functionality;
* disabling or hiding unavailable actions where appropriate;
* preventing invalid interactions early;
* explaining capability limits clearly to the user;
* enforcing local-only functionality according to validated account capabilities and legitimate Project structural snapshots.

The backend is responsible for:

* authoritative account-level capability resolution;
* independent authorization of protected operations;
* rejecting manipulated or unauthorized requests;
* enforcing cloud limits;
* enforcing protected service access;
* preventing frontend manipulation from bypassing server-side rules.

The frontend improves user experience.

The backend remains the final authority for protected operations.

### 21.17 Cloud Project Limit After Downgrade

The Free access state permits a maximum of five Projects in Cloud Workspace.

If a Subscriber downgrades to Free while storing more than five cloud Projects:

* no immediate deletion occurs;
* a 60-day grace period begins;
* all existing cloud Projects remain accessible during the grace period;
* the user may open, edit, synchronize, and download those Projects locally;
* the user may delete Projects manually;
* the user may choose which Projects should remain in cloud storage;
* no new cloud Project may be added while the account remains above the Free limit.

The purpose of the grace period is to give the user sufficient time to preserve excess Projects locally as `.hfzproject` files.

If the user restores a qualifying subscription or other sufficient entitlement before the grace period expires, scheduled downgrade deletion is cancelled.

### 21.18 Automatic Cloud Retention After Grace Period

If the 60-day grace period expires and the Free user still has more than five Projects in Cloud Workspace, HFZWood automatically preserves the five Projects with the most recent real Project modification timestamps.

Projects exceeding the Free limit may then be deleted from cloud storage.

The retention order must not be changed merely because a Project was opened, viewed, or accessed.

The relevant ordering must reflect real persisted Project modification rather than last-opened time.

The user must receive clear warning that:

* the Free plan permits only five cloud Projects;
* excess Projects are scheduled for deletion;
* the deletion deadline is known;
* Projects may be downloaded locally before deletion.

Warnings should become appropriately prominent as the deadline approaches.

### 21.19 Local Preservation and Later Cloud Restoration

Cloud deletion does not redefine Project identity.

A Project downloaded locally during the grace period remains the same logical Project and preserves its original `projectId`.

If the user later acquires sufficient cloud entitlement again, the local Project may be uploaded to Cloud Workspace while preserving the same Project identity.

Local and cloud representations remain representations of the same logical Project rather than separate Projects.

### 21.20 Independent Services Follow Current Capabilities

Project continuation rights do not automatically preserve access to independent commercial services.

Capabilities such as:

* PDF export;
* Cloud Workspace access;
* cloud storage capacity;
* AI services;
* other future independent online services;

are evaluated according to the user's current effective account-level capabilities.

For example, a user may continue editing a premium Project after downgrade while being unable to generate a new premium PDF until the relevant current capability is restored.

### 21.21 Normal Expiration and Downgrade

Normal expiration, cancellation, or downgrade follows the standard continuation rules defined in this architecture.

Normal commercial downgrade must not be treated as fraud, abuse, or security revocation.

It may:

* change current account-level capabilities;
* restrict new Project creation;
* restrict independent premium services;
* trigger the cloud grace-period process when storage exceeds the Free limit.

It must not silently destroy, corrupt, or structurally degrade legitimate local Project data.

### 21.22 Confirmed Fraud and Serious Abuse

Confirmed fraud or serious abuse is an exceptional security condition and must not be treated as a normal commercial downgrade.

Examples may include:

* confirmed fraudulent payment;
* confirmed use of stolen payment credentials;
* serious license abuse;
* other explicitly validated security violations.

An authoritative fraud or serious-abuse revocation may:

* immediately remove account-level premium entitlements;
* invalidate locally cached account-level capabilities upon the next successful server contact;
* override normal Project structural continuation entitlements for that account;
* block all Cloud Workspace access;
* remove the normal Free cloud allowance and downgrade grace period;
* suspend cloud Projects pending internal retention and security policy;
* prevent access to protected premium services.

HFZWood cannot remotely modify a device that remains completely offline and has not received the revocation state.

Therefore, local revocation becomes technically effective when the device next receives authoritative server information.

Local Project files must not be remotely deleted, corrupted, or silently destroyed.

The exact internal retention period for fraud-suspended cloud data, appeals, payment disputes, or administrative recovery may be defined later as an operational security policy.

### 21.23 Capability Resolution Failure

A technical failure must never be interpreted as a downgrade, expiration, revocation, or fraud decision.

Examples include:

* backend unavailability;
* AWS service disruption;
* network timeout;
* HTTP 5xx response;
* capability resolver failure;
* malformed or incomplete capability response;
* temporary infrastructure failure.

In such cases:

* previously validated account capabilities may continue within their valid offline window;
* legitimate Project structural capability snapshots remain available according to Project continuation rules;
* no user data is degraded, deleted, or structurally modified because of the technical failure;
* if no valid capability state is available, HFZWood must not invent premium access;
* operations requiring current online authorization may remain temporarily unavailable;
* the user must receive a clear message that capability verification is temporarily unavailable.

An authoritative backend response stating that an entitlement has expired or been revoked is different from a technical failure.

The architecture must preserve this distinction explicitly.

### 21.24 Capability Classification Rule

The authoritative classification rule is:

**A capability belongs in the Project structural capability snapshot only when it is required to create, modify, or continue the technical structure of that specific Project.**

Capabilities governing independent services, cloud resources, exports, AI, or other account-level commercial functionality remain current account-level capabilities.

This distinction must be preserved in:

* Project schema design;
* capability catalog design;
* frontend enforcement;
* backend enforcement;
* offline behavior;
* downgrade handling;
* future commercial evolution.

### 21.25 Architecture Rule

The technical rule is:

**HFZWood resolves product access through backend-owned effective capabilities rather than direct subscription checks. Existing Projects preserve legitimately acquired structural continuation rights through Project-specific capability snapshots. These snapshots may expand through valid upgrades but do not contract through normal downgrade. Independent commercial services follow current account-level capabilities. Temporary infrastructure failures never masquerade as entitlement loss, while confirmed fraud or serious abuse may trigger exceptional security revocation.**

This architecture must remain compatible with:

* Free access;
* recurring subscriptions;
* possible permanent purchases;
* future promotional or administrative entitlements;
* Local-First Project work;
* offline continuation;
* cloud limits and downgrade grace periods;
* future commercial evolution without rewriting product modules.
## 22. Production Persistence and Infrastructure Architecture

### 22.1 Purpose

The production persistence and infrastructure architecture defines where HFZWood production data is stored, how different categories of data are separated, and how production durability, security, recovery, scalability, and operational visibility are achieved.

The architecture must preserve the approved Local-First Project model while providing durable cloud persistence for:

* authenticated identity-related application data;
* Project ownership and cloud metadata;
* complete cloud Project representations;
* Project synchronization state;
* subscription and capability information;
* account-level preferences;
* editorial content;
* editorial media;
* publication and translation state;
* operational recovery information.

Production persistence must use managed AWS services rather than relying on the local filesystem of an application container.

The local filesystem remains appropriate for local development and temporary runtime operations, but it must not be treated as authoritative durable production storage.

### 22.2 AWS Production Persistence Model

HFZWood production persistence uses a clear separation between:

* structured application data and authoritative metadata;
* large binary files and complete portable representations.

Structured data is stored in Amazon DynamoDB.

Large files and binary assets are stored in private Amazon S3 object storage.

The core production model is:

```text
HFZWood Production
│
├── Amazon DynamoDB
│   ├── Project metadata
│   ├── Project ownership
│   ├── Project version pointers
│   ├── synchronization metadata
│   ├── subscription and entitlement data
│   ├── preferences
│   ├── editorial content structure
│   ├── publication state
│   └── translation state
│
└── Amazon S3
    ├── complete cloud Project representations
    ├── primary Project images
    ├── Project thumbnails
    ├── limited technical recovery versions
    ├── editorial images and media
    ├── generated exports
    └── operational backup objects where required
```

The database and object storage remain separate services with separate responsibilities.

They are connected through stable internal identifiers and object keys.

Permanent local filesystem paths and client-provided public URLs must never be treated as authoritative production references.

### 22.3 DynamoDB Responsibility

Amazon DynamoDB stores structured, authoritative, and indexable application information.

This includes, where applicable:

* `projectId`;
* `ownerId`;
* current `versionId`;
* Project version ancestry information required by synchronization;
* Project name and indexable metadata;
* cloud Project state;
* synchronization state;
* deletion state;
* storage usage metadata;
* subscription and entitlement state;
* capability-related account information;
* account-level preferences;
* Manual chapter and section structure;
* Glossary entries;
* Knowledge Base entries;
* locale variants;
* Draft and Published states;
* published snapshot metadata;
* cross-reference data;
* AI-assisted translation state;
* editorial asset metadata;
* stable references to objects stored in S3.

DynamoDB must not be used to store large images, media files, or complete large Project payloads when those objects are more appropriately stored in S3.

### 22.4 S3 Responsibility

Amazon S3 stores large, portable, or binary production objects.

This includes:

* complete cloud Project representations;
* primary Project images;
* Project thumbnails;
* technical recovery copies of previous Project representations;
* Manual images;
* Glossary images;
* Knowledge Base images;
* other editorial media;
* generated PDF exports;
* future generated files;
* temporary export artifacts where required.

A stored S3 object is referenced through an internal object key or stable asset identifier.

Application records must not persist temporary signed URLs as durable identifiers.

### 22.5 Complete Cloud Project Representation

Each authoritative cloud Project version must have a complete and self-contained Project representation stored in S3.

The representation must contain sufficient data to reconstruct a valid local `.hfzproject` file.

The cloud representation must preserve:

* Project identity;
* authenticated ownership metadata;
* technical version identity;
* direct version ancestry;
* Project timestamps;
* primary image;
* primary image hash;
* reference measurements;
* geometry;
* calculator state;
* calculation-related Project data;
* descriptive metadata;
* notes;
* all other information required by the approved Project schema.

DynamoDB stores the authoritative metadata and the reference to the current complete Project object in S3.

Cloud persistence must not depend on rebuilding the Project by combining incomplete fragments whose consistency cannot be guaranteed.

The internal cloud storage structure does not have to be byte-for-byte identical to the local `.hfzproject` file, but it must preserve enough information to reconstruct the complete local representation without loss.

### 22.6 Current Cloud Version and Limited Technical Retention

For normal product behavior, each Project has one authoritative current cloud version.

When a valid new cloud version is successfully committed:

* it becomes the authoritative current cloud version;
* the previous version is logically replaced;
* the user is not presented with a permanent history of every save.

HFZWood may retain a small and automatically managed set of previous technical versions solely for:

* recovery;
* synchronization safety;
* conflict investigation;
* protection against accidental overwrite;
* protection against incomplete or failed cloud operations.

This retention is not a user-facing version-control feature.

HFZWood must not be designed as a permanent archive of every historical Project save.

The precise number of retained versions, retention duration, and transition to lower-cost storage remain configurable operational parameters.

They must be selected according to measured storage usage, recovery requirements, and production cost considerations.

### 22.7 Safe Cloud Commit Sequence

A new Project version must not become authoritative until its complete S3 representation has been stored successfully.

The required cloud commit sequence is:

1. authenticate the request;
2. validate Project ownership;
3. validate subscription capabilities and storage limits;
4. validate the synchronization base version;
5. upload the complete new Project representation under a new S3 object key;
6. verify that the object was stored successfully;
7. atomically update the authoritative DynamoDB metadata to reference the new version and S3 object;
8. classify the former current version as a temporary technical recovery version;
9. clean up uncommitted temporary objects according to lifecycle rules.

HFZWood must not overwrite the only authoritative S3 Project object before the replacement has been successfully stored and verified.

If upload, verification, authorization, validation, or DynamoDB update fails:

* the previous cloud version remains authoritative;
* the Project must not be reported as successfully synchronized;
* the user must be informed that the cloud operation did not complete;
* partial or uncommitted objects must not become visible as current Project data.

The authoritative DynamoDB pointer is updated only after the complete replacement exists successfully in S3.

### 22.8 Editorial Persistence Migration

The existing editorial workflow is considered validated product behavior and must be preserved.

Phase 6 changes the production persistence implementation without redesigning the editorial experience.

Structured editorial data migrates from filesystem-backed repositories to durable DynamoDB repositories.

Editorial media migrates to private S3 storage.

The following behavior must remain unchanged except where minimal persistence integration changes are technically necessary:

* Manual Chapter → Section → Content Block hierarchy;
* Glossary entry behavior;
* Knowledge Base article behavior;
* Draft and Publish workflow;
* published snapshots;
* locale-specific variants;
* independent publication state per language;
* AI-assisted translation state;
* semantic content blocks;
* cross-references;
* asset reuse;
* media metadata;
* asset protection;
* administrative editing workflow.

Migration must preserve identifiers, relationships, locale variants, publication state, and existing valid content.

The persistence mechanism changes.

The validated editorial product behavior does not.

### 22.9 Editorial Asset References

Editorial records stored in DynamoDB contain stable internal asset identifiers.

The binary image or media content is stored in S3.

Editorial documents must not embed the full binary asset directly into DynamoDB records.

Temporary delivery URLs may be generated when required, but they must not replace stable asset identity.

A missing temporary URL does not make the asset invalid.

A missing or deleted authoritative S3 object must be treated as an asset integrity problem and surfaced appropriately.

### 22.10 Private S3 Architecture

All HFZWood S3 buckets remain private.

S3 objects must not be exposed through permanent anonymous public access.

Browser clients must not receive unrestricted access to buckets.

The backend remains responsible for:

* authenticating the user;
* authorizing the requested operation;
* validating Project ownership;
* validating capabilities;
* resolving stable internal object identifiers;
* issuing temporary access only when appropriate.

For efficient upload and download operations, the backend may issue short-lived signed URLs after authorization.

Signed URLs:

* are temporary;
* are operation-specific;
* expire automatically;
* must not become durable application identifiers;
* must not bypass ownership or capability validation.

Published editorial content may be delivered through Amazon CloudFront or another controlled delivery layer while S3 remains private behind it.

Private Project data must never become publicly cacheable through the editorial delivery path.

### 22.11 Storage Separation

HFZWood production storage must separate data according to responsibility, access model, and retention policy.

At minimum, the architecture distinguishes:

1. **Project storage**

   * complete cloud Project representations;
   * primary images;
   * thumbnails;
   * limited technical recovery versions.

2. **Editorial media storage**

   * Manual assets;
   * Glossary assets;
   * Knowledge Base assets;
   * other administrator-managed media.

3. **Generated and temporary exports**

   * PDF exports;
   * temporary generated files;
   * future export formats.

4. **Operational recovery storage**

   * protected backup or restore objects where required.

Project storage and editorial media should use separate S3 buckets or equivalently isolated storage boundaries with distinct access and lifecycle policies.

Temporary exports and operational recovery data must not be mixed indiscriminately with authoritative active Project data.

Exact bucket names and resource identifiers are deployment configuration, not architectural product decisions.

### 22.12 Backup and Recovery

Production persistence must include managed recovery mechanisms.

DynamoDB tables containing authoritative production data must use point-in-time recovery or an equivalent managed continuous recovery mechanism.

Critical S3 buckets must use:

* S3 Versioning where appropriate;
* lifecycle-managed retention;
* protection against accidental overwrite and deletion;
* controlled transition or expiration of obsolete technical versions.

Recovery operations must restore data into separate resources or isolated recovery locations for validation.

Recovery must not silently overwrite the currently authoritative production state.

The recovery workflow should follow this pattern:

```text
Production incident
        ↓
Restore to isolated recovery resource
        ↓
Validate integrity and scope
        ↓
Identify required records or objects
        ↓
Perform controlled production recovery
        ↓
Record and verify the recovery operation
```

Operational backups are not a substitute for normal Project synchronization, last-copy protection, or user-facing Project management.

### 22.13 Encryption and Data Protection

All production data must be encrypted:

* in transit;
* at rest.

Communication between the browser and HFZWood backend must use HTTPS.

Communication between application services and AWS-managed services must use secure AWS-supported connections.

DynamoDB tables and S3 objects must use AWS-managed encryption with centrally controlled key management.

AWS Key Management Service may be used where centralized key control is required.

The initial production architecture does not require separate user-managed encryption keys for each HFZWood account.

Per-user cryptographic key management would add substantial complexity to synchronization, recovery, support, and account restoration and must not be introduced without a separate architectural decision.

Secrets, credentials, service tokens, and encryption keys must never be stored in:

* application source code;
* committed configuration files;
* `.hfzproject` files;
* browser-accessible state;
* logs;
* editorial content;
* database fields not intended for secret storage.

### 22.14 Secrets and Production Configuration

Production secrets and sensitive configuration are managed outside source code and deployed application artifacts.

HFZWood should use AWS-managed services such as:

* AWS Secrets Manager;
* AWS Systems Manager Parameter Store;
* AWS Identity and Access Management roles.

Application services must use IAM roles and least-privilege permissions rather than embedded long-lived AWS access keys.

Each service receives only the permissions required for its responsibility.

Examples include:

* the backend may read and write authorized Project objects;
* the editorial service may manage editorial assets;
* the frontend receives no direct infrastructure credentials;
* development credentials cannot access production resources by default.

No production secret may be:

* committed to the repository;
* exposed to the browser;
* stored in a Project file;
* reused as a local-development secret;
* included in application logs;
* hard-coded in Docker images or deployment scripts.

### 22.15 Primary Production Region

HFZWood launches with a single primary AWS production region located within the European Union.

Core production services and authoritative data should remain in that region whenever technically practical.

This includes, where applicable:

* backend infrastructure;
* DynamoDB;
* S3 storage;
* Cognito;
* CloudWatch;
* related production services.

A single-region launch minimizes:

* infrastructure complexity;
* cross-region synchronization;
* additional cost;
* recovery complexity;
* unnecessary operational risk.

Multi-region replication is not required for the initial production architecture.

It may be introduced later if justified by:

* real scale;
* availability requirements;
* disaster-recovery objectives;
* legal or regulatory requirements;
* measured user distribution;
* explicit business continuity needs.

The exact EU AWS region remains a deployment decision and should consider the existing infrastructure already created for HFZWood.

### 22.16 Environment Separation

Local development and production must use strictly separated:

* data;
* AWS resources;
* credentials;
* configuration;
* storage;
* identity configuration;
* secrets;
* service boundaries.

Local development and automated tests must not implicitly access or modify real production user data.

Mock authentication remains a development mechanism and must not become a production authorization path.

Production credentials must not be stored in local development configuration files.

The initial architecture does not require a permanently active staging environment.

However, production infrastructure and deployment configuration must allow a staging environment to be introduced later without architectural redesign.

If staging is introduced, it must use separate:

* storage resources;
* databases;
* identity configuration;
* secrets;
* credentials;
* deployment boundaries.

### 22.17 Deletion and Recovery State

User-visible deletion does not necessarily require immediate irreversible physical destruction.

Where appropriate, HFZWood may use a short soft-deletion or recovery state before permanent removal.

During the recovery period:

* deleted data is removed from normal active use;
* the user cannot treat it as an active Project;
* backend rules continue to protect ownership and privacy;
* restoration may remain technically possible.

Project deletion must preserve the approved last-remaining-copy protection rules.

A Project must not be deleted from cloud storage through an ordinary deletion flow if doing so would violate the approved protection of the last known remaining copy.

Permanent deletion policies must distinguish between:

* active data;
* soft-deleted data;
* temporary technical recovery data;
* operational backups;
* legally required retention.

Account deletion requires a dedicated complete-data deletion workflow.

It must not be treated as a simple repetition of ordinary Project deletion.

Exact recovery periods and permanent-deletion timelines remain configurable and must be finalized before production launch according to product policy, legal requirements, and measured operational needs.

### 22.18 Storage Limits and Cost Control

HFZWood uses scalable AWS-managed infrastructure, but infrastructure cost must remain observable and controlled.

Production infrastructure must include:

* AWS cost visibility;
* budget alerts;
* anomaly detection where practical;
* storage usage monitoring;
* lifecycle policies;
* cleanup of abandoned temporary objects;
* cleanup of expired recovery versions;
* cleanup of expired generated exports.

Commercial storage limits are enforced by HFZWood application capabilities and authoritative backend rules.

The architecture must not rely on AWS account spending limits to enforce user subscription quotas.

When a user reaches an applicable storage limit:

* new uploads or cloud persistence operations may be restricted according to capabilities;
* existing data must not be silently deleted;
* the user must be informed clearly;
* downgrade and grace-period rules remain subject to the approved Subscription Architecture.

AWS budget thresholds should alert the operators.

They should not automatically disable production services or delete user data.

Phase 5 defines the architecture for:

* storage limits;
* cost monitoring;
* budget alerts;
* anomaly detection;
* lifecycle retention.

It does not fix arbitrary numerical values.

Exact values such as:

* free storage quota;
* subscriber storage quota;
* budget warning threshold;
* budget critical threshold;
* number of retained technical versions;
* recovery retention duration;
* temporary export lifetime;

remain configurable.

They must be finalized before production launch using:

* measured average Project size;
* measured image and media size;
* AWS pricing;
* expected user volume;
* commercial subscription policy;
* recovery requirements.

### 22.19 Production Observability

Production infrastructure must provide enough observability to diagnose failures affecting persistence, synchronization, authorization, recovery, and availability.

The initial production architecture may use AWS-native observability services, primarily Amazon CloudWatch.

HFZWood must record or measure, where appropriate:

* backend application failures;
* S3 upload failures;
* S3 download failures;
* missing-object failures;
* DynamoDB read failures;
* DynamoDB write failures;
* conditional-write failures;
* authorization failures;
* ownership-validation failures;
* synchronization failures;
* unexpected synchronization conflicts;
* failed cloud commits;
* recovery operations;
* repeated infrastructure errors;
* storage consumption;
* service health.

CloudWatch may provide:

* centralized logs;
* metrics;
* alarms;
* operational dashboards where useful;
* notification triggers.

The initial architecture does not require a separate external observability platform.

A separate monitoring platform may be introduced later only if AWS-native tooling becomes insufficient.

### 22.20 Observability Data Protection

Logs and metrics must contain enough context for diagnosis without unnecessarily exposing private user data.

Observability data must not include:

* primary Project images;
* complete Project file contents;
* private Project notes;
* full editorial payloads unless explicitly required for a safe administrative audit;
* authentication tokens;
* authorization headers;
* AWS credentials;
* secrets;
* signed URLs;
* complete personal data payloads;
* encryption keys.

Where useful, logs may contain safe technical identifiers such as:

* request correlation identifiers;
* `projectId`;
* `versionId`;
* non-secret object keys or derived references;
* service operation names;
* status and error categories;
* timestamps;
* authenticated account identifiers in a protected operational form.

Sensitive identifiers should be minimized, protected, and retained only as long as operationally justified.

### 22.21 Production Persistence Failure Principle

Production persistence must fail safely.

A failure must not silently:

* replace a valid Project with incomplete data;
* advance DynamoDB metadata before the S3 object exists;
* report an unsaved Project as synchronized;
* delete the previous authoritative cloud version;
* expose private S3 data;
* change Project ownership;
* bypass capability limits;
* corrupt Draft or Published editorial state;
* overwrite current production data during recovery.

When a production persistence operation cannot complete safely:

* the previous authoritative state remains valid;
* the failed operation is reported clearly;
* diagnostic information is recorded without exposing sensitive payloads;
* retry or recovery is explicit;
* no partial state is presented as successful.

### 22.22 Implementation Constraint

Phase 6 must implement production persistence incrementally.

The migration must preserve existing validated behavior and use repository and service boundaries so that persistence mechanisms can change without unnecessary changes to UI and product workflows.

Phase 6 must not:

* replace validated calculator behavior;
* redesign the editorial workflow;
* remove local `.hfzproject` ownership;
* make cloud availability a requirement for local Project work;
* expose S3 publicly;
* trust browser-provided ownership metadata;
* store production data on ephemeral container storage;
* introduce arbitrary storage quotas without measurement;
* create a permanent user-facing version-control system;
* combine development and production resources;
* embed production credentials into the application.

### 22.23 Production Persistence Architecture Rule

The authoritative rule is:

**HFZWood production persistence uses DynamoDB for structured authoritative data and private Amazon S3 storage for complete cloud Project representations, images, media, and large generated objects. Cloud writes become authoritative only after complete object persistence succeeds. Managed AWS security, recovery, configuration, observability, and lifecycle services protect production data without changing the approved Local-First, Project-centric, editorial, ownership, synchronization, or subscription behavior of the product.**
### 22.24 External Input and API Boundary Protection

HFZWood must treat data received from browsers, local files, upload workflows, external services, and other client-controlled sources as untrusted until validated by the component responsible for consuming it.

Frontend validation may improve user experience, but it is not authoritative security enforcement.

Where an operation reaches the backend or production infrastructure, the backend must independently validate the request according to the relevant schema, authorization rules, ownership rules, Product Capabilities, and configured operational limits.

Production boundaries must define and enforce, where applicable:

* accepted request content types;
* request and payload size limits;
* uploaded-file size limits;
* file-format and media-type validation;
* structured-schema validation;
* rejection of malformed, incomplete, unsupported, or unexpected payloads;
* authentication requirements;
* ownership and authorization requirements;
* Product Capability requirements;
* safe handling of repeated or abusive requests;
* cross-origin access policy;
* safe error responses that do not expose secrets or unnecessary internal details.

A declared file extension or client-supplied MIME type must not, by itself, be treated as proof that uploaded content is valid.

Where practical, the consuming service must validate that the content can actually be decoded or interpreted according to its expected format.

Payload and upload limits must be applied consistently across relevant layers, including, where applicable:

* browser import workflows;
* frontend request construction;
* backend application validation;
* reverse proxy or load-balancer configuration;
* signed-upload policies;
* S3 upload constraints;
* downstream processing services.

One layer must not accept a payload that another required layer cannot safely process.

Rate limiting, throttling, abuse protection, and cross-origin rules must be proportionate to the actual HFZWood product surface and threat model.

The initial architecture does not require enterprise-scale web application security infrastructure merely for theoretical completeness.

However, before production launch, Phase 6 must establish and verify a practical baseline for:

* authentication-sensitive endpoints;
* administrative endpoints;
* media and file operations;
* password and account-recovery operations;
* entitlement and capability endpoints;
* expensive or abuse-prone operations;
* future AI-assisted operations where applicable.

Exact numerical thresholds, allowed-origin lists, rate-limit values, proxy settings, and service-specific implementation mechanisms are Phase 6 configuration decisions.

They must be determined through:

* inspection of the actual request flows;
* realistic payload and media testing;
* browser and backend performance testing;
* infrastructure service limits;
* expected legitimate usage;
* measured abuse risk;
* production cost considerations.

Validation failure must fail safely.

An invalid or rejected request must not:

* partially modify authoritative data;
* advance Project or synchronization state;
* bypass ownership or Product Capability rules;
* expose private media or Project content;
* create a partially committed upload;
* overwrite a previously valid representation;
* reveal credentials, secrets, tokens, signed URLs, or unnecessary internal implementation detail.

The authoritative rule is:

**HFZWood validates untrusted input at every relevant consumption boundary. Client-side validation supports usability but never replaces backend authorization, schema validation, payload limits, media validation, or infrastructure protection. Exact operational limits remain configurable Phase 6 decisions, but a tested production baseline is mandatory before launch.**

## 23. Settings Architecture

### 23.1 Settings Responsibility

HFZWood Settings manage user preferences that affect how the application behaves or presents information without redefining Project identity, Project ownership, subscription entitlements, authorization, or technical Project content.

Settings must remain architecturally separate from:

* Project data;
* authentication state;
* authorization;
* subscription status;
* Product Capabilities;
* cloud Project ownership;
* Project synchronization.

A setting must not be used as an indirect mechanism for granting permissions or commercial capabilities.

The authoritative principle is:

**Settings manage preferences. They do not define identity, ownership, permissions, subscription entitlements, or Product Capabilities.**

### 23.2 Settings Classification

HFZWood recognizes two architectural categories of settings:

* device-specific settings;
* account-level settings.

Every new setting must be explicitly classified according to its product meaning and required behavior.

Device-specific settings belong to the local browser or device environment and do not automatically follow the user across devices.

Account-level settings belong to the authenticated user account and may follow the user across devices through authoritative backend persistence.

The same setting must not exist simultaneously as competing local and account-level authorities unless an explicit precedence, synchronization, and fallback rule has been defined.

### 23.3 Current Device-Specific Preferences

The current HFZWood preferences are:

* interface language;
* length units;
* volume units.

These preferences are device-specific by default.

They are not automatically synchronized across devices.

Changing one of these preferences on one browser or device must not automatically modify the corresponding preference on another browser or device.

In a browser-based application, device-specific persistence is technically associated with the relevant browser profile. Different browsers or browser profiles on the same physical device may therefore maintain different local preferences.

### 23.4 Device-Local Persistence Authority

For interface language, length units, and volume units, device-local browser storage is the single authoritative persistence source.

These preferences must not depend on backend availability for normal loading or modification.

The current backend user-preference persistence for these three preferences is transitional architecture inherited from the existing implementation.

During Phase 6, this transitional persistence must be retired in a controlled manner rather than preserved as a competing second authority.

Migration must avoid ambiguous precedence between backend values and device-local values.

### 23.5 New Device Initialization

When HFZWood is used on a new browser or device without valid persisted local preferences:

* the interface language should be initialized from the supported browser or system locale where possible;
* length and volume units should be initialized from an appropriate regional default;
* unsupported locale or regional information must fall back to safe supported defaults;
* the user may immediately modify these preferences through Quick Preferences or another approved Settings interface.

After initialization or explicit user modification, the selected values persist locally for that browser or device.

HFZWood should not require unnecessary manual configuration before normal product use.

### 23.6 Future Account-Level Settings

The current classification of interface language and measurement units as device-specific preferences does not imply that all future HFZWood settings must be device-specific.

Future settings may legitimately belong to the authenticated account when their product meaning requires consistent behavior across devices.

Examples may include future preferences related to:

* communication permissions;
* notification preferences;
* privacy choices;
* account-wide behavior;
* future messaging or support interactions;
* other preferences whose meaning is inherently associated with the user account rather than one local device.

The existence of such future functionality is not established by this section.

Any future feature requiring new settings must first be approved at the appropriate Product Architecture level.

The classification rule is:

**Settings that define account-wide behavior, privacy, communication permissions, or cross-device preferences belong to the account. Settings that control only the local presentation or behavior of one browser or device remain device-specific.**

### 23.7 Connected Application and Offline Boundary

HFZWood is a connected application with Local-First Project ownership.

It is not an Offline-First application.

Internet connectivity is expected for normal product use, including, where applicable:

* authentication renewal;
* subscription entitlement verification;
* cloud services;
* Project synchronization;
* synchronized or remotely delivered content;
* other online capabilities.

Temporary connectivity loss must not endanger locally stored Project data or unnecessarily interrupt work already in progress.

However, HFZWood does not guarantee indefinite full product functionality while offline.

Device-specific settings must remain available and modifiable without backend dependency.

This local availability does not imply indefinite offline validity of authentication, subscription entitlements, Product Capabilities, cloud functionality, or other server-authoritative state.

### 23.8 Offline Subscription Entitlement Boundary

Subscription entitlements must not remain valid offline indefinitely based solely on a previously cached state.

Premium capabilities may continue during a limited and configurable offline grace period following the last successful entitlement verification.

After that period expires, renewed server verification is required to retain premium capabilities.

The exact duration of the offline grace period is a product and commercial policy decision and is not fixed by this section.

Failure to verify subscription entitlements must not delete, corrupt, or otherwise endanger existing Project data.

Loss or temporary suspension of premium capabilities must remain separate from Project data preservation.

### 23.9 Canonical Project Values and Display Preferences

Measurement and volume preferences affect input and presentation only.

Projects persist canonical technical values independently of device-specific display settings.

Changing display units must not:

* modify technical Project content;
* change `projectId`;
* generate a new `versionId`;
* create an unsaved Project state;
* trigger a Project Save;
* create synchronization divergence;
* trigger a Project synchronization event solely because the display preference changed.

When the user enters a value using the currently selected display unit, HFZWood must convert that value into the appropriate canonical technical representation before calculation and persistence where required.

The same Project may therefore be opened on different devices using different display units without migration, technical modification, or Project divergence.

### 23.10 Interface Language and Learning Content

The device-specific interface language determines both:

* the application UI language;
* the requested language for Learning content.

If a requested Learning content variant is unavailable, HFZWood must not silently switch to another language.

The application may explicitly inform the user that the requested language variant is unavailable and offer an available English version when appropriate.

Opening another language variant must remain an explicit user choice.

This preserves the approved multilingual content architecture and prevents unexpected silent language switching.

### 23.11 Immediate Preference Application

Device-specific preference changes should apply immediately without requiring application reload or Project reopening.

When a user changes interface language, length units, or volume units while a Project is open:

* the Project remains open;
* its working state is preserved;
* the primary image remains unchanged;
* geometry remains unchanged;
* reference measurements remain unchanged;
* canonical technical values remain unchanged;
* displayed values are updated according to the new preference;
* no false unsaved state is created;
* no new technical Project version is generated;
* no Project Save is triggered solely by the preference change;
* no synchronization event is triggered solely by the preference change.

Preference changes must affect presentation without being misclassified as Project modifications.

### 23.12 Settings Validation and Recovery

Device-specific settings must be validated when loaded.

Invalid, corrupted, unsupported, or obsolete values must never prevent application startup.

When a stored setting can be migrated unambiguously to a supported current value, HFZWood should perform that migration automatically.

When unambiguous migration is not possible, HFZWood should fall back to a safe supported regional or application default.

Routine technical recovery should remain silent when no user decision is required.

The user should be interrupted only when meaningful user action is genuinely necessary.

### 23.13 Preference Persistence Failure

If a device-specific preference change applies successfully in the current application session but local persistence fails:

* the current session may continue using the selected preference;
* HFZWood must not falsely represent the preference as durably saved;
* the failure must not affect Project data;
* the failure must not create a Project version or Project synchronization event.

The user may be informed through proportionate, non-disruptive feedback when the preference cannot be retained for future sessions.

### 23.14 Resetting Device-Specific Settings

HFZWood may support resetting device-specific preferences to their defaults.

A reset operation affects only the relevant local preference category.

It must not modify:

* Projects;
* Project identity;
* Project versions;
* authentication state;
* subscription entitlements;
* Product Capabilities;
* account-level settings;
* cloud Project data.

Reset values should be recalculated from the current supported browser, system, and regional defaults where appropriate.

Reset preferences should apply immediately.

This architecture defines the safe behavior of a reset operation but does not require Phase 6 to introduce dedicated reset UI unless a genuine UX need exists.

### 23.15 Settings and Exported Artifacts

Exports use the active device-specific display units at the time of export unless a future approved export workflow explicitly allows the user to select different output units.

Exported artifacts must contain explicit unit labels where technical values are presented.

Once created, an exported artifact is independent of later Settings changes.

For example, changing HFZWood from metric to imperial units after generating a PDF must not alter the already generated PDF.

Exports are persistent output artifacts, not dynamic representations of current device preferences.

### 23.16 Settings Architecture Rule

The authoritative Settings Architecture rule is:

**HFZWood separates device-specific preferences from account-level settings according to product meaning. Current interface language, length units, and volume units are device-specific and use device-local browser storage as their single persistence authority. Settings affect presentation and local behavior without redefining Project data, identity, ownership, technical versioning, subscription entitlements, or Product Capabilities. HFZWood is a connected application with Local-First Project ownership, not an Offline-First application, and temporary offline operation must never imply indefinite offline validity of server-authoritative commercial rights.**
## 24. Phase 6 Implementation and Migration Strategy

### 24.1 Purpose

Phase 6 transforms the approved Product Architecture and Technical Architecture into production-ready implementation.

The purpose of this section is not to redefine product behavior, reopen settled architectural decisions, or specify every implementation task in advance.

It defines:

* mandatory implementation principles;
* major dependency boundaries;
* required milestone sequencing;
* migration constraints;
* rollback expectations;
* verification requirements;
* Local-Only launch criteria;
* the boundary between pre-launch cloud readiness and later operational Cloud Workspace activation.

The authoritative implementation principle is:

**Phase 6 must evolve the existing functional HFZWood application incrementally through small, reversible, independently testable steps while preserving a known stable application state after every completed implementation boundary.**

### 24.2 Local-Only Launch Strategy

The first release target of Phase 6 is a stable, production-ready, launch-capable Local-Only product.

Initial launch does not depend on operational Cloud Workspace functionality.

HFZWood must be capable of launching and providing its approved core product value through local Project workflows while required online services remain available for authentication, account identity, entitlement resolution, editorial content, and other launch-critical connected capabilities.

The Local-Only launch strategy must not require:

* operational Project cloud upload;
* Project synchronization;
* Open from Cloud;
* Update Cloud Version;
* cloud conflict detection;
* cloud conflict resolution;
* operational cloud branching;
* cloud Project restore;
* user-facing Cloud Workspace workflows.

These operational cloud capabilities are not initial launch blockers.

The authoritative launch principle is:

**Phase 6 must first deliver a stable launch-capable Local-Only product. Operational Cloud Workspace functionality is activated only after the Local-Only product has proven stable, while the pre-launch implementation must remain genuinely cloud-ready and avoid future foundational rewrites.**

### 24.3 Cloud Foundation Before Cloud Activation

Deferring operational Cloud Workspace functionality does not mean ignoring cloud architecture during the initial Phase 6 implementation.

Before Local-Only launch, HFZWood must implement the foundations required to support future Cloud Workspace activation without fundamental redesign.

These foundations include, where applicable:

* stable `projectId`;
* stable `ownerId`;
* `versionId`;
* `parentVersionId`;
* ancestry metadata;
* primary-image integrity metadata;
* canonical Project identity;
* authenticated ownership boundaries;
* capability-based authorization boundaries;
* clean separation between Local Workspace responsibilities and future Cloud Workspace responsibilities;
* Project structures compatible with later synchronization and conflict handling;
* technical interfaces and service boundaries that do not force future rewriting of the local Project foundation.

Cloud readiness must exist through stable technical architecture, not through partially exposed product functionality.

The Local-Only release must not display or depend on incomplete:

* Cloud Workspace;
* synchronization;
* cloud backup;
* cloud restore;
* cloud branching;
* conflict-resolution workflows.

No disabled cloud buttons, placeholder cloud menus, incomplete “Coming soon” workflows, or permanent mock cloud dependencies are required merely to demonstrate future readiness.

The authoritative boundary is:

**Cloud foundation belongs to the pre-launch Phase 6 implementation. Cloud activation and operational Cloud Workspace workflows are deferred until after Local-Only product stability has been demonstrated.**

### 24.4 Incremental Implementation Rule

Phase 6 must be implemented through small, controlled, independently verifiable steps.

Fundamental architectural changes must not be bundled together when they can reasonably be separated.

For example, the following must not be treated as one uncontrolled implementation block:

* `.hfzproject` v2;
* production authentication;
* ownership enforcement;
* Local Workspace;
* capability enforcement;
* production persistence;
* operational Cloud Workspace.

Each implementation step must:

* have a defined objective;
* identify affected architectural invariants;
* identify likely files and system boundaries;
* identify relevant risks;
* define acceptance criteria;
* define required automated tests;
* define required manual QA where applicable;
* preserve a known stable rollback boundary.

No implementation step may knowingly leave the application in an unsafe intermediate state that depends on an unfinished future task to become valid again.

### 24.5 Required High-Level Implementation Sequence

The Phase 6 Implementation Plan must respect the following dependency order unless a later codebase inspection demonstrates a concrete technical reason for a narrowly scoped adjustment.

The required high-level sequence is:

1. stabilize and verify the unified test and validation foundation required for Phase 6;
2. implement the Project model and `.hfzproject` v2 foundation;
3. implement production authentication, authenticated identity, ownership resolution, and Product Capability resolution;
4. implement Local Workspace using the stabilized Project model, authenticated ownership, and capability boundaries;
5. complete Local-Only capability enforcement and launch-critical workflow integration;
6. implement or migrate required production infrastructure and launch-critical online services incrementally;
7. complete Local-Only stabilization and release-readiness verification;
8. activate operational Cloud Workspace functionality only in a later milestone or release after Local-Only stability has been demonstrated.

The ordering principle is:

**A dependent architectural layer must not be treated as stable before the foundations it consumes are stable.**

### 24.6 `.hfzproject` v2 Before Local Workspace

The `.hfzproject` v2 model and persistence architecture must be implemented and validated independently before Local Workspace is expanded or rebuilt around it.

Local Workspace must consume the stabilized v2 Project model rather than being developed simultaneously with an unstable Project format.

The v2 implementation must establish the approved Project identity, ownership, versioning, integrity, metadata, and future cloud-readiness foundations before Local Workspace depends on them.

This separation exists to reduce implementation risk and prevent multiple fundamental changes from obscuring one another during verification.

### 24.7 Production Authentication and Ownership Before Local Workspace

Production authentication and ownership resolution must be completed before Local Workspace implementation is considered stable.

After authentication:

* HFZWood establishes the authenticated user identity;
* stable ownership boundaries can be enforced;
* the backend resolves Product Capabilities;
* Local Workspace can determine ownership behavior correctly;
* Projects belonging to another authenticated identity can be handled according to the approved read-only rules;
* local behavior can consume resolved capabilities without depending directly on commercial tier names.

Local Workspace must not inspect `free`, `subscriber`, or other subscription labels directly.

It consumes Product Capabilities.

The authoritative rule is:

**Production authentication and ownership resolution precede Local Workspace. Local Workspace uses authenticated identity for ownership boundaries and Product Capability results for permitted behavior.**

### 24.8 Capability Enforcement During Local Workspace Implementation

Capability enforcement must be integrated from the beginning of Local Workspace implementation rather than added later as a separate retrofit.

Local Workspace must be built directly on stable:

* Project identity;
* authenticated ownership;
* capability resolution.

Where capability enforcement applies:

* the UI must expose only permitted actions;
* internal logic must independently reject unauthorized actions;
* hidden or disabled UI alone is never sufficient enforcement;
* modules must consume capabilities rather than subscription-tier names.

This prevents Local Workspace from first being implemented as unrestricted behavior and later requiring structural rework to add commercial and authorization boundaries.

### 24.9 Preserve Validated Calculator Domain Logic

The `.hfzproject` v2 implementation must evolve the existing validated Project snapshot and restore mechanisms rather than rewrite calculator domain logic without necessity.

Identity, ownership, versioning, integrity, and metadata structures should be introduced around the existing technical Project state through clear orchestration, adapters, or persistence boundaries.

The v2 transition must not be used as an excuse to rewrite:

* resin calculation algorithms;
* validated geometry behavior;
* established calculator domain rules;
* unrelated working calculator functionality.

Any unrelated calculator refactor must be justified by a concrete problem and handled separately.

The authoritative rule is:

**Project-format modernization must not create unnecessary risk by rewriting validated calculator behavior that is not required to change.**

### 24.10 Pre-Launch Legacy Data Policy

HFZWood is currently pre-launch.

The Product Owner has explicitly confirmed that:

* existing `.hfzproject` v1 development files are disposable;
* current Manual demo content is disposable;
* current Glossary demo content is disposable;
* current Knowledge Base demo content is disposable.

Therefore, Phase 6 does not require production-grade migration guarantees for these explicitly disposable pre-launch artifacts.

Where a clean transition to the approved target architecture is simpler, safer, and more maintainable, Phase 6 should prefer that clean transition over preserving unnecessary parallel legacy paths.

The authoritative rule is:

**Disposable pre-launch development data and demo content must not force unnecessary legacy compatibility architecture.**

This rule applies only to explicitly confirmed disposable pre-launch data.

After production launch, real user data and production content require substantially stronger migration, compatibility, integrity, rollback, and recovery guarantees.

### 24.11 Transitional Compatibility Must Not Become Permanent Architecture

Where transitional compatibility is genuinely required, it must exist only as long as necessary to protect non-disposable data, preserve rollback safety, or enable controlled migration.

Legacy paths must not become permanent parallel architectures without explicit architectural justification.

A replacement path should first be proven stable.

Obsolete transitional paths may then be removed through a separate, validated implementation step after:

* replacement stability is demonstrated;
* relevant data is safe;
* rollback requirements are satisfied;
* regression verification passes.

New and old paths must not remain indefinitely as competing authorities merely because removal was postponed.

### 24.12 Stable Rollback Boundaries

Every Phase 6 implementation step must preserve a known stable rollback boundary.

Before a high-risk change is implemented, the workflow must identify the last known stable state to which the application can return if the change fails.

High-risk changes include, but are not limited to:

* Project-format changes;
* identity changes;
* authentication changes;
* ownership enforcement;
* capability enforcement;
* persistence changes;
* infrastructure migration;
* destructive data operations.

Fundamental migrations must be isolated whenever practical and validated independently.

The expected workflow is:

1. pre-implementation analysis;
2. implementation;
3. automated verification;
4. implementation and architecture review;
5. test adequacy review where risk requires it;
6. negative or adversarial verification where applicable;
7. manual QA where behavior is user-verifiable;
8. technical artifact inspection where required;
9. documentation alignment;
10. commit and push of the verified stable state;
11. only then proceed to the next implementation step.

No high-risk step should be committed as complete merely because the implementation agent reports success.

### 24.13 Implementation Evidence Is Not Final Authority

Cursor-generated implementation analysis, code, tests, and test results are evidence.

They are not sole final authority.

The same implementation agent must not be treated as the only verifier of its own work.

A passing test suite alone is not sufficient proof of correctness for high-risk areas such as:

* Project integrity;
* Project persistence;
* ownership enforcement;
* authorization;
* capability enforcement;
* migration safety;
* authentication;
* destructive operations;
* production persistence.

For high-risk implementation work, verification may require multiple layers:

* architectural review;
* implementation review;
* test adequacy review;
* regression verification;
* negative testing;
* adversarial testing;
* manual QA;
* inspection of saved artifacts;
* inspection of API behavior;
* inspection of persistence state;
* inspection of relevant logs or operational evidence.

The verification depth must be proportionate to the risk.

The authoritative rule is:

**Implementation success is established by converging evidence from code, tests, architecture, negative cases, user-visible behavior, and technical artifacts where relevant—not by a single agent's success declaration.**

### 24.14 Milestone Closure Criteria

A Phase 6 milestone is complete only when:

* all required implementation tasks for that milestone are complete;
* relevant automated tests pass;
* applicable regression suites pass;
* required manual QA is complete;
* high-risk behavior has received the additional verification appropriate to its risk;
* affected documentation is aligned;
* no known critical or blocking defect remains;
* the application remains in a stable, independently usable state;
* a clear committed rollback boundary exists.

Not every minor defect must automatically block milestone closure.

A documented cosmetic or low-impact imperfection may be deferred when it does not threaten:

* Project data;
* Project integrity;
* authentication;
* ownership;
* authorization;
* capability enforcement;
* essential workflows;
* security;
* release stability.

Any known defect capable of causing data loss, Project corruption, ownership violation, authorization bypass, capability bypass, or essential workflow failure blocks milestone closure until resolved or explicitly reclassified through documented architectural review.

### 24.15 Phase 6 Implementation Plan

Section 24 defines mandatory implementation sequencing, dependency boundaries, launch criteria, rollback principles, verification requirements, and migration constraints.

It does not replace the detailed Phase 6 Implementation Plan.

Before Phase 6 implementation begins, HFZWood must create and maintain a dedicated implementation plan, expected to be documented separately, for example as:

`phase-6-implementation-plan.md`

The complete high-level milestone sequence must be defined from the beginning.

However, detailed task-level specification may be elaborated progressively, one milestone at a time.

A milestone must be fully decomposed into small, testable implementation tasks before implementation of that milestone begins.

Future milestones do not require premature task-level specification before earlier dependencies have changed the codebase.

The authoritative planning rule is:

**Define the full milestone sequence early. Detail implementation tasks progressively, one milestone at a time, before each milestone begins.**

This preserves rigor without creating a large speculative implementation plan based on code that will materially change during earlier milestones.

### 24.16 Launch-Critical Online Services and Production Infrastructure

Local-Only does not mean that HFZWood is an offline product or that no online production infrastructure is required.

The Local-Only launch may still require production-ready online services for:

* authentication;
* account identity;
* ownership resolution;
* subscription entitlement resolution;
* Product Capability resolution;
* required editorial persistence;
* published Learning content;
* required media delivery;
* operational monitoring;
* other launch-critical connected services.

Production infrastructure migration must be incremental.

Launch-critical online services must be distinguished from deferred operational Cloud Workspace functionality.

Each infrastructure category should be introduced and verified independently where practical.

Disposable pre-launch demo data does not require production-grade migration guarantees.

The existence of deferred operational Project cloud functionality must not prevent launch-critical online infrastructure from becoming production-ready.

### 24.17 Local-Only Launch-Ready Milestone

The Local-Only product is not launch-ready merely because individual implementation tasks appear complete.

At minimum, launch readiness requires stable implementation and verification of all launch-critical areas, including:

* `.hfzproject` v2 Project creation and persistence;
* Project Save, close, reopen, and restore behavior;
* production authentication;
* authenticated identity;
* Project ownership;
* Product Capability resolution;
* Local Workspace;
* local capability enforcement;
* Project integrity;
* launch-critical online services;
* required production persistence;
* applicable automated tests;
* applicable regression suites;
* required manual QA;
* documentation alignment;
* rollback readiness.

Operational Cloud Workspace functionality is not an initial launch requirement.

Cloud foundations must nevertheless be sufficiently implemented that later Cloud Workspace activation does not require fundamental rewriting of the Local-Only Project architecture.

### 24.18 Final Release-Readiness Audit

After all required Local-Only milestones are complete, Phase 6 must perform a separate final release-readiness audit.

This audit must confirm, at minimum:

* functional correctness of essential user workflows;
* `.hfzproject` v2 stability;
* Project integrity;
* authentication correctness;
* ownership safety;
* authorization safety;
* capability enforcement;
* regression stability;
* required production infrastructure readiness;
* required operational monitoring readiness;
* documentation alignment;
* absence of known critical or blocking defects.

High-risk areas must not rely solely on the implementation agent's own test results.

The final audit should use the layered verification model established by this section.

The Local-Only Phase 6 implementation is launch-ready only when the evidence supports a reasonable conclusion that the application can be released safely within the approved launch scope.

### 24.19 Phase 6 Completion Boundary

Phase 6 Local-Only completion means that HFZWood is ready for initial production launch within the approved Local-Only scope.

It does not require operational Cloud Workspace activation.

After Local-Only launch readiness is achieved:

* the product may be released;
* real-world usage may validate stability;
* operational Cloud Workspace may be implemented and activated later;
* future capabilities may be added through separately approved architecture and implementation work.

No mandatory Phase 7 is required as a prerequisite for initial Local-Only launch under the currently approved architecture.

Future development does not redefine the completion of the initial launch milestone.

### 24.20 Phase 6 Implementation and Migration Rule

The authoritative Phase 6 implementation rule is:

**HFZWood must evolve from its current functional pre-launch application into a production-ready Local-Only product through small, reversible, independently verifiable implementation steps. The `.hfzproject` v2 foundation must precede Local Workspace; production identity, ownership, and Product Capability resolution must precede stable Local Workspace behavior; validated calculator domain logic must not be rewritten unnecessarily; disposable pre-launch legacy data must not force unnecessary compatibility architecture; every high-risk change must preserve a known rollback boundary and receive verification proportionate to its risk; Cursor-generated results are evidence rather than sole final authority; cloud foundations must be implemented under the hood before launch while incomplete operational Cloud Workspace functionality remains invisible and non-blocking; and initial launch readiness is achieved only after a separate final audit confirms the stability, integrity, security, capability enforcement, infrastructure readiness, and documentation alignment of the approved Local-Only product scope.**
