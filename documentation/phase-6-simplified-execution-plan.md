# HFZWood — Phase 6 Simplified Execution Plan

## 1. Purpose

This document defines the simplified execution path for the remainder of HFZWood Phase 6.

It exists because HFZWood is not an application being built from zero.

The application is already substantially functional and validated. The Resin Calculator works. Local Project Save/Open workflows work. Recent Projects work. The Manual, Glossary, Knowledge Base, editorial administration, preferences, roles, and capability foundations already exist. Automated tests and production builds provide an established regression safety net.

The purpose of the remaining Phase 6 work is therefore not to redesign or rebuild HFZWood.

It is to preserve the working product, complete only what is genuinely required for commercial release, and establish the minimum justified foundations necessary to activate future Cloud Workspace functionality without a foundational rewrite.

The governing principle is:

**Preserve what works. Add what is missing. Prepare only what must be prepared now. Defer functionality that does not yet need to operate.**

---

## 2. Why the Execution Model Was Simplified

The original Phase 6 implementation plan established valuable architectural discipline, safety rules, milestone dependencies, testing requirements, and traceability.

However, during early Milestone 1 execution, the task decomposition and documentation process became more granular and complex than necessary for the actual size and maturity of HFZWood.

After M1.2 closure, implementation was deliberately paused before M1.3.

The review established that:

* the existing application must remain the foundation;
* working functionality should not be rewritten without a concrete reason;
* future cloud preparation must not become premature implementation of the complete future cloud system;
* architecture must guide implementation rather than automatically generate implementation work;
* task boundaries must reflect real risk and practical outcomes rather than theoretical separability;
* documentation must record decisions and evidence once, without unnecessary repetition;
* every implementation task must have a clear present purpose.

M1.3 was analyzed but not implemented.

No further implementation begins until the already completed M1.1 and M1.2 work is audited against this simplified execution model.

---

## 3. Current Reality

At the beginning of this simplified execution plan:

### Completed and validated application foundations

HFZWood already includes:

* a functional Resin Calculator;
* image-based reference measurement;
* formwork, wood, and cavity geometry workflows;
* resin volume calculation;
* Project Save;
* Project Open;
* Update Existing Project;
* Recent Projects;
* dirty-state detection;
* unsaved-changes protection;
* Manual and Tutorials;
* Glossary;
* Knowledge Base;
* editorial administration;
* Draft/Publish workflows;
* multilingual content foundations;
* user preferences;
* roles and authorization foundations;
* Product Capability foundations;
* automated frontend and backend tests;
* production build validation.

### Completed Phase 6 work

The following Phase 6 work is complete:

* Milestone 0 — implementation baseline and safety net;
* M1.1 — canonical `.hfzproject` v2 schema foundation;
* M1.2 — Project creation threshold, canonical identity, and primary-image hash.

M1.3 was analyzed but not implemented.

### Current implementation principle

Completed work is not automatically considered either correct or unnecessary merely because it already exists.

M1.1 and M1.2 will receive one focused code audit to determine:

* what should be retained unchanged;
* what may be simplified;
* what, if anything, should be removed;
* what should be integrated directly into the practical `.hfzproject` v2 Save/Open path.

After that audit, completed work should not be repeatedly reopened without concrete evidence of a problem.

---

## 4. Release-Critical, Cloud-Preparation, and Deferred Work

Every remaining Phase 6 responsibility must belong to one of three categories.

### 4.1 Release-Critical

Work without which HFZWood cannot be safely and professionally released as the approved initial commercial product.

This includes, where applicable:

* safe `.hfzproject` v2 Save/Open;
* production authentication;
* stable authenticated identity;
* Project ownership;
* Product Capability enforcement;
* subscription entitlement foundations;
* production persistence for launch-critical server data;
* deployment readiness;
* security proportional to actual product risk;
* backup and recovery;
* operational observability;
* final integrated QA and release certification.

### 4.2 Minimum Cloud Preparation

Work that does not activate Cloud Workspace now but is demonstrably necessary to prevent a foundational rewrite when Cloud Workspace is activated later.

This preparation must remain minimal and justified.

Examples may include:

* stable `projectId`;
* stable `ownerId`;
* a canonical Project format;
* portable primary-image persistence;
* sufficient Project metadata to recognize the same logical Project across future local and cloud representations;
* repository or service boundaries that prevent avoidable future restructuring.

A future requirement is not sufficient justification by itself.

The question must always be:

**Will deferring this work force a foundational rewrite of real user data, Project identity, ownership, persistence, or a major system boundary?**

If the answer is no, the work should normally be deferred.

### 4.3 Deferred Operational Functionality

Functionality that is not required for the initial release and does not need to operate yet.

This includes, unless a concrete dependency proves otherwise:

* user-facing Cloud Workspace;
* Project upload to cloud;
* Open from Cloud;
* automatic synchronization;
* cloud restore workflows;
* operational branching;
* conflict-resolution screens;
* collaboration;
* ownership transfer;
* marketplace functionality;
* Global Search;
* semantic search;
* AI Project assistance;
* advanced abuse detection;
* permanent historical retention of every Project save.

Deferred functionality may influence minimum data-model preparation only when necessary to prevent a genuine future foundational rewrite.

It must not be implemented merely because it exists in the long-term architecture.

---

## 5. Simplified Execution Blocks

The remaining Phase 6 work is organized into six understandable outcome-oriented blocks.

These blocks replace mechanical adherence to unnecessarily fragmented task decomposition.

Detailed tasks are created only when the active block is reached and only after inspecting the real repository state.

### Block 1 — Complete the Local Project v2 Foundation

**Outcome:**

A Project can be safely created, saved, reopened, updated, and validated through the canonical `.hfzproject` v2 format without changing the proven user experience unnecessarily.

This block includes only the minimum required for:

* canonical Project identity;
* safe v2 persistence;
* Save/Open round-trip integrity;
* preservation of existing calculator data;
* stable ownership metadata;
* minimum cloud-ready Project metadata;
* safe invalid-file rejection;
* existing dirty-state and unsaved-changes behavior.

Advanced version-control machinery must not be implemented unless the M1.1–M1.2 audit or practical Save/Open requirements demonstrate that it is necessary now.

### Block 2 — Production Identity, Ownership, and Commercial Access

**Outcome:**

HFZWood knows who the authenticated user is, which Projects belong to that user, and which product capabilities the user may access.

This block includes:

* production authentication;
* stable production user identity;
* Project ownership;
* safe foreign-owned Project behavior;
* free/subscriber/administrator capability enforcement;
* subscription entitlement foundations;
* the minimum commercial access architecture required for Stripe integration and launch.

### Block 3 — Complete the Local Workspace Experience

**Outcome:**

Users can confidently manage their local Projects through a clear and safe desktop-quality workflow.

This block includes only missing or required Local Workspace behavior and device-local settings necessary for the approved launch experience.

Existing working Save/Open, Recent Projects, and workspace behavior must be reused wherever possible.

### Block 4 — Production Backend and Durable Data

**Outcome:**

Launch-critical server-side data is stored durably and safely in production rather than depending on development-only filesystem persistence.

This includes, where required:

* editorial content;
* published snapshots;
* media metadata;
* user-related server data;
* entitlements and capability-related data;
* necessary backend boundaries;
* production-safe persistence.

Validated calculator algorithms must not be rewritten unless a concrete correctness or deployment requirement makes it necessary.

### Block 5 — AWS, Stripe, and Minimum Cloud Foundation

**Outcome:**

HFZWood can run as a commercial production product, accept subscription-based access, and later activate Cloud Workspace without foundational redesign.

This block includes:

* production deployment;
* environment configuration;
* AWS infrastructure required for launch;
* Stripe integration required for commercial access;
* minimum cloud-ready Project infrastructure justified by future activation needs.

It does not include operational Cloud Workspace unless separately approved.

### Block 6 — Security, Recovery, QA, and Release

**Outcome:**

HFZWood is demonstrably safe, recoverable, supportable, tested, and ready for commercial release.

This block includes:

* proportional security hardening;
* input and payload validation;
* backup and recovery;
* observability and logging;
* cost-awareness checks;
* integrated regression testing;
* Product Owner manual QA;
* code hygiene;
* documentation alignment;
* final independent audit;
* release certification.

---

## 6. Mandatory Control Questions

Before any future implementation task is approved, it must answer six questions clearly:

1. **What real problem does this task solve?**
2. **What concretely changes in the application, release readiness, data safety, or future cloud readiness?**
3. **Why must this be implemented now rather than when the future functionality becomes operational?**
4. **What existing working code does it preserve and reuse?**
5. **What real future foundational rewrite does it prevent, if future preparation is part of the justification?**
6. **What is intentionally deferred?**

If these questions cannot be answered simply and convincingly, implementation must not begin.

The existence of an item in an earlier architecture or implementation document does not automatically justify immediate implementation.

---

## 7. Immediate Next Step

**Block 2 — Production Identity, Ownership, and Commercial Access**

See §201 for scope. Block 1 canonical v2 Save/Open cutover is complete (§12).

---

## 8. Authoritative Execution Rule

The governing rule for the remainder of Phase 6 is:

**HFZWood is already a working application. Preserve that application. Complete what is genuinely missing for release. Prepare future cloud capability only to the minimum extent necessary to avoid a real foundational rewrite. Do not implement speculative mechanisms, create abstractions without present consumers, or allow process and documentation to become more complex than the product itself.**
## 9. M1.1–M1.2 Audit Decision

A focused code audit was performed before any further Phase 6 implementation.

The audit reviewed the actual production code, runtime wiring, Git history, and tests introduced by M1.1 and M1.2.

The resulting decision is:

### 9.1 M1.1 — Retained

The M1.1 canonical `.hfzproject` v2 foundation is retained.

This includes:

* the canonical v2 envelope and factories;
* the separation between technical content, descriptive metadata, derived data, and Project metadata;
* the v1 snapshot-to-v2 mapper;
* the canonical format-version constant;
* the structural v2 envelope guard.

These components are directly relevant to the imminent canonical v2 Save/Open path and represent justified minimum preparation for a stable portable Project format.

Version-related fields may remain in the canonical schema as inert placeholders where they do not create runtime machinery or operational complexity.

Their presence in the schema does not authorize implementation of advanced versioning, ancestry, branching, conflict resolution, or change-classification machinery before a concrete requirement justifies it.

### 9.2 M1.2 — Partially Retained and Simplified

The M1.2 audit confirmed that the underlying Project rules and pure utilities are useful, but the live pre-Save canonical lifecycle mechanism is disproportionate to current product needs.

The following concepts are retained:

* Project creation-threshold validation;
* completed-reference validation;
* authenticated `ownerId` resolution;
* stable `projectId` generation;
* `createdAt`;
* deterministic SHA-256 `primaryImageHash`;
* Save-time canonical identity construction in `buildPersistableCanonicalV2.js`.

The following runtime approach is not retained as the default execution model:

* asynchronous canonical identity creation during live calculator interaction;
* live pre-Save canonical lifecycle state in the workspace;
* generation and operation tokens required only by threshold-time asynchronous hashing;
* calculator-to-workspace threshold callback wiring used only by that mechanism;
* unused production APIs introduced solely for that mechanism;
* production DOM attributes introduced solely for testing the unused lifecycle state.

These components may be removed or simplified as part of the immediate canonical v2 Save/Open work.

### 9.3 First-Save Identity Decision

HFZWood adopts the **First-Save Identity** model for the initial Local-Only release.

Before first Save, the calculator remains ordinary unsaved working state.

Existing dirty-state detection and unsaved-changes protection remain responsible for protecting meaningful unsaved work.

On first Save of a valid Project:

1. validate that the Project creation threshold is satisfied;
2. resolve the authenticated `ownerId`;
3. generate a stable `projectId`;
4. establish `createdAt`;
5. compute the deterministic SHA-256 `primaryImageHash`;
6. build the canonical `.hfzproject` v2 envelope;
7. persist the file;
8. adopt successfully persisted lifecycle state only after confirmed persistence success.

A failed or cancelled Save must not be treated as successful persistence.

After a successful first Save, the workspace navigates Home. There is no in-session `currentProject` lifecycle adoption on first Save because the user leaves the workspace immediately and no operational consumer requires it. Authoritative persisted lifecycle for opened Projects will be restored from canonical v2 files in Checkpoint C. Update Existing Project adopts lifecycle into `currentProject` only after a confirmed in-place write, because the opened Project session remains active until navigation.

### 9.4 Cloud-Readiness Boundary

Moving identity creation from threshold time to first Save does not remove the minimum cloud-ready foundation.

A successfully persisted canonical v2 Project will still contain the stable metadata necessary for later cloud recognition:

* `projectId`;
* `ownerId`;
* `createdAt`;
* `primaryImageHash`;
* canonical format identity and version.

Future Cloud Workspace activation must not require a foundational rewrite of these identities.

However, the initial Local-Only release does not require live pre-Save canonical identity merely to prepare for future cloud functionality.

### 9.5 Advanced Versioning Decision

M1.3 was analyzed but not implemented.

The proposed advanced machinery for:

* technical vs metadata-only vs mixed change classification;
* candidate version transitions;
* `parentVersionId`;
* ancestry evolution;
* conflict-oriented version semantics;

will not be implemented automatically at this stage.

Version-related fields may remain as inert schema placeholders.

Any operational versioning logic introduced during Block 1 must be limited to the minimum demonstrably required for:

* safe canonical v2 Save;
* safe Update Existing Project;
* safe Open;
* round-trip integrity;
* preservation of stable Project identity;
* avoidance of a genuine future foundational rewrite.

No advanced versioning mechanism may be added solely because it exists in earlier architecture documentation.

### 9.6 Immediate Block 1 Direction

The next implementation objective is:

**Simplify the disproportionate M1.2 pre-Save runtime machinery and complete the practical canonical `.hfzproject` v2 Save/Open path using the retained M1.1 and M1.2 foundations.**

This work must preserve:

* existing calculator behavior;
* existing user-visible Save/Open workflow unless a change is genuinely required;
* Update Existing Project;
* Recent Projects;
* dirty-state behavior;
* unsaved-changes protection;
* validated calculator algorithms;
* existing unrelated functionality.

Before implementation, the real current Save/Open paths must be inspected to determine the smallest safe integration boundary.

The next action is therefore a focused Block 1 pre-implementation analysis, not immediate coding.
## 10. Block 1 Pre-Implementation Decision

A focused practical analysis of the current Save/Open implementation confirmed the smallest safe path for completing the Local Project v2 foundation.

The approved direction is:

**Preserve the existing working Save/Open user experience, remove disproportionate pre-Save identity machinery, and move canonical identity creation to the first successful Save.**

### 10.1 Retained foundations

The following existing foundations are retained:

* the M1.1 canonical `.hfzproject` v2 schema and mapper;
* `primaryImageHash.js`;
* Project creation-threshold validation;
* completed-reference validation;
* authenticated `ownerId` resolution;
* stable `projectId`;
* `createdAt`;
* deterministic SHA-256 `primaryImageHash`;
* minimum canonical lifecycle construction required for persistence.

### 10.2 Pre-Save runtime simplification

The following mechanisms are not required by current runtime behavior, imminent v2 Save/Open, or minimum future cloud readiness and may therefore be removed or simplified:

* asynchronous canonical identity creation during live calculator interaction;
* `ensureCanonicalProjectIdentity.js`;
* `useCanonicalProjectIdentity.js`;
* generation and operation tokens required solely by that asynchronous path;
* live pre-Save canonical lifecycle state in the workspace;
* `onCreationThresholdInputsChange`;
* `getCreationThresholdInputs()`;
* production DOM attributes introduced solely for testing the removed lifecycle;
* tests that exist only to validate race conditions of the removed mechanism.

Pure utilities and tests for behavior that remains part of the product contract must be preserved.

### 10.3 Canonical v2 persistence decision

The practical Block 1 outcome is:

* first Save writes a canonical `.hfzproject` v2 envelope;
* Project identity is created at first Save;
* Update Existing Project preserves stable identity;
* Open restores canonical v2 Project data;
* Save → Open → Update → Open round-trip integrity is verified;
* Recent Projects continues to work;
* existing dirty-state and unsaved-changes behavior is preserved;
* v1 development Project files are rejected rather than migrated.

The initial Local-Only release does not require dual v1/v2 compatibility because no external production users depend on v1 Project files.

### 10.4 Minimum version metadata

Block 1 will use only minimum version metadata:

* `versionId` is created once at first Save;
* the same `versionId` is preserved during Update Existing Project;
* `lastModifiedAt` is updated on successful writes;
* `parentVersionId` remains `null`;
* `ancestorVersionIds` remains empty;
* `metadataModifiedAt` remains `null`.

This does not activate version advancement, ancestry evolution, change classification, branching, or conflict resolution.

Those mechanisms remain deferred until a concrete operational requirement justifies them.

### 10.5 Implementation structure

Block 1 is treated as one practical implementation objective:

**Canonical v2 Save/Open Simplification and Cutover**

It has three internal checkpoints:

* **Checkpoint A — Runtime simplification:** remove the disproportionate pre-Save M1.2 machinery while retaining useful pure utilities.
* **Checkpoint B — Canonical v2 Save and Update:** create identity at first Save, write canonical v2, and preserve stable identity on Update.
* **Checkpoint C — Canonical v2 Open and round-trip:** restore v2 files, reject v1 files, preserve Recent Projects, and prove full round-trip integrity.

Checkpoints A and B should be implemented together because removal of the pre-Save mechanism and introduction of its real Save-time consumer are one logical transition.

Checkpoint C follows after A+B validation.

The implementation must remain focused on adapting the existing working Save/Open paths rather than designing a new Project system.

### 10.6 Expected result

At Block 1 completion:

* the user-visible Project workflow remains substantially unchanged;
* `.hfzproject` files use the canonical v2 format;
* saved Projects contain stable identity and minimum justified cloud-ready metadata;
* Update Existing Project preserves identity;
* Open restores the same Project correctly;
* unnecessary pre-Save asynchronous lifecycle complexity is removed;
* no advanced versioning, cloud synchronization, branching, or conflict machinery is introduced.

The governing implementation rule is:

**Adapt the working application. Remove unnecessary complexity. Add only the minimum persistence metadata required for safe release and genuine future cloud readiness.**

---

## 11. Block 1 Checkpoints A+B Closure

**Status:** CLOSED (approved Keep All)

### Delivered

* **Checkpoint A — Runtime simplification:** removed pre-Save canonical identity machinery (`ensureCanonicalProjectIdentity`, `useCanonicalProjectIdentity`, threshold callback wiring, generation/operation tokens, live lifecycle DOM attributes).
* **Checkpoint B — Canonical v2 Save and Update:** First-Save Identity via `buildPersistableCanonicalV2.js`; canonical v2 first Save and Update Existing Project; persisted lifecycle adoption after confirmed Update success only; Recent Projects v2 field shim.
* **Retained utilities:** threshold validation, `primaryImageHash`, authenticated `ownerId` resolution, M1.1 canonical v2 schema and mapper.
* **Minimum version metadata:** one `versionId` at first Save, preserved on Update; `lastModifiedAt` updated on write; `parentVersionId = null`; `ancestorVersionIds = []`; `metadataModifiedAt = null`.
* **Persistence-success boundary:** lifecycle returned and adopted only after confirmed write success; cancelled and failed saves do not adopt.
* **First-Save lifecycle:** no in-session `currentProject` adoption after first Save (workspace navigates Home); authoritative lifecycle restore deferred to Checkpoint C Open.

### Validation

* Backend: 115 passed
* Frontend: 294 passed (54 files)
* Frontend production build: success

### Implementation commit

`91b36d8`

### Next step

**Checkpoint C — Canonical v2 Open and round-trip** (completed; see §12).

---

## 12. Block 1 Checkpoint C and Block 1 Closure

**Block 1 status:** CLOSED (approved Keep All)

**Checkpoint C status:** CLOSED (approved Keep All)

### Delivered

* **Canonical v2 Open:** strict v2-only parse via shared `projectFileParse.js`; identity validation; v1 flat payloads rejected with `unsupported format version`.
* **Reverse mapping:** `mapCanonicalV2ToCalculatorSnapshot.js` restores calculator snapshot (session zoom omitted).
* **Persisted lifecycle restoration:** Open returns `persistedLifecycle` for workspace adoption on Update Existing Project.
* **Direct Open and Recent Projects:** Projects hub, locate/rebind, and in-workspace import use the shared parser; Recent Projects read-permission handling via `ensureFileHandleReadPermission` before `getFile()`.
* **Round-trip integrity:** Save → Open → Update → Open verified by automated tests and Product Owner manual QA.

### Product Owner manual QA

Passed: v2 Save, direct Open, Update Existing Project, round-trip data preservation, v1 rejection, Recent Projects metadata, Recent Projects direct-open after permission fix, in-app unsaved-changes protection.

### Validation

* Backend: 115 passed
* Frontend: 406 passed (57 files)
* Frontend production build: success

### Implementation commit

`1610c79`

### Next step

**Block 2 — Production Identity, Ownership, and Commercial Access** (production authentication, Project ownership, capability enforcement, subscription foundations).
## 13. Block 2 Execution Decision

Repository analysis confirmed that Block 2 is primarily a wiring and enforcement phase, not a greenfield architecture phase.

Existing foundations already include:

- frontend authentication adapter and mock authentication;
- login, registration, recovery, logout, and route guards;
- Cognito CDK infrastructure and backend JWT middleware;
- canonical v2 `ownerId` persistence and restoration;
- backend capability catalog and resolver;
- frontend `CapabilitiesProvider`;
- `EntitlementsRepository` abstraction.

Block 2 will therefore use the smallest implementation sequence:

1. **Task 2.1 — Local Project Ownership Enforcement** — CLOSED (see §14)
2. **Task 2.2 — Production Cognito Authentication**
3. **Task 2.3 — Product Capability Enforcement**

### Task 2.1 — Ownership rule

For canonical v2 Projects:

- `authenticated user.id === Project ownerId` → normal editable Project;
- `authenticated user.id !== Project ownerId` → foreign-owned read-only Project.

Foreign-owned Projects may be opened and inspected but may not be edited, updated, overwritten, saved as a new Project, or have ownership changed.

No sharing, collaboration, ownership transfer, duplication, cloud permissions, or migration is introduced.

### Task 2.2 — Cognito boundary

Production Cognito authentication will extend the existing authentication adapter rather than create a new identity system.

The target production identity is the immutable Cognito `sub`, exposed as canonical `user.id`.

Mock authentication remains available for local development and tests.

Final production activation depends on actual Cognito infrastructure and environment configuration. A task must not be declared fully production-validated without real end-to-end authentication verification.

### Task 2.3 — Capability enforcement

Existing Product Capability foundations will be reused and enforced.

The application will consume resolved tiers and capabilities through the existing capability boundary.

Do not introduce speculative billing infrastructure.

Specifically deferred:

- Stripe integration;
- Stripe webhook stubs;
- new entitlement admin APIs without a current consumer;
- manual entitlement write tooling unless concretely required for testing or release;
- DynamoDB entitlement storage;
- `structuralCapabilitySnapshot` population;
- Cloud Workspace capability enforcement.

Backend capability enforcement will be added only where a real protected server-side resource or paid computation can otherwise be bypassed directly through the API.

### Development Project files

Pre-production `.hfzproject` files with development owner IDs such as `stub-user` are disposable development artifacts.

Under real Cognito identity, non-matching files open as foreign-owned read-only.

No migration or ownership rewrite system will be built.

### Governing rule

**Reuse existing foundations. Enforce real current product rules. Do not build billing, cloud, migration, or future infrastructure before it has a concrete operational consumer.**

---

## 14. Block 2 Task 2.1 — Local Project Ownership Enforcement

**Task 2.1 status:** CLOSED (approved Keep All; Product Owner manual QA passed)

### Ownership rule

For canonical v2 Projects:

- `authenticated user.id === Project ownerId` → normal editable Project workflow;
- `authenticated user.id !== Project ownerId` → foreign-owned read-only inspection mode.

Foreign-owned Projects may be opened and inspected but may not be edited, deleted from, saved, updated in place, duplicated, reassigned, or indexed into the authenticated user's Recent Projects.

Administrator role does not bypass ownership.

### Delivered

* **Ownership resolution:** `projectOwnership.js` derives `owned` vs `foreign_read_only` from authenticated `user.id` and persisted `projectMetadata.ownerId`.
* **Read-only workspace:** foreign-owned notice; single `readOnly` authority through calculator and workspace; persistent delete/clear/remove/reset paths guarded at handler level.
* **Save/Update enforcement:** authoritative guards in workspace and `projectFileSave.js`; blocked writes do not open Save dialog, write files, or mutate Recent Projects.
* **Recent Projects:** deduplication by canonical `projectMetadata.projectId`; foreign-owned direct Open excluded from new index entries and IndexedDB handle storage; owned Open/Save/Update/locate/rebind reuse one entry per `projectId`.
* **Read permission:** existing `ensureFileHandleReadPermission` behavior preserved for owned Recent Projects.

### Product Owner manual QA

Passed: owned Project editable; foreign-owned read-only with notice; Save/Update blocked; reference/cavity/wood/mold delete and clear blocked; vertex edit blocked; session-only zoom/pan/fit available; foreign Projects not newly indexed; repeated owned Open does not duplicate Recent cards.

### Validation

* Backend: 115 passed
* Frontend: 475 passed (59 files)
* Frontend production build: success

### Implementation commit

`fa256ac`

### Next step

**Task 2.2 — Production Cognito Authentication**