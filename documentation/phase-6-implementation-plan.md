# HFZWood — Phase 6 Implementation Plan

## 1. Purpose

This document defines the implementation plan for Phase 6 of the HFZWood platform.

Its purpose is to translate the approved Phase 5 Technical Architecture into a safe, incremental, testable, and reversible implementation sequence.

Phase 6 does not redefine the HFZWood Product Architecture and does not redesign the approved Technical Architecture.

Its responsibility is to determine how the existing working application will evolve toward the approved target architecture without unnecessary rewrites, uncontrolled migration, avoidable regressions, or unauthorized architectural decisions during implementation.

Phase 6 must preserve the fundamental implementation principle established by the Technical Architecture:

**HFZWood must evolve from its current working baseline toward the approved target architecture through small, controlled, independently verifiable steps.**

The implementation plan must therefore:

* preserve validated existing behavior wherever it remains compatible with the approved architecture;
* introduce architectural changes incrementally rather than through a big-bang rewrite;
* respect technical dependencies between implementation areas;
* keep the application in a functional and verifiable state after every completed task;
* define explicit acceptance criteria, automated validation, manual verification, and rollback boundaries for each implementation task;
* prevent implementation tools from inventing unresolved product or architectural decisions;
* stop and escalate any issue that reveals a genuine gap or contradiction in the approved architecture;
* distinguish launch-critical implementation from future functionality that is architecturally prepared but not yet activated;
* produce an initial Local-Only HFZWood product that is stable, secure, testable, operationally supportable, and ready for release.

The Phase 6 plan defines the complete milestone sequence from the current application baseline to release readiness.

However, detailed task decomposition is developed progressively, one milestone at a time.

This prevents speculative over-planning while preserving a clear end-to-end implementation direction.

The authoritative rule is:

**Phase 6 implements the approved architecture. It does not reinvent it. Every implementation step must be small enough to understand, safe enough to reverse, complete enough to verify independently, and disciplined enough to preserve the integrity of the working product.**
## 2. Relationship with Phase 5 Technical Architecture

The approved `phase-5-technical-architecture.md` document is the authoritative technical source of truth for Phase 6 implementation.

Phase 6 must implement the architecture defined in Phase 5 without silently changing its technical meaning, weakening its guarantees, or introducing contradictory behavior.

The Phase 6 Implementation Plan may:

* determine implementation order;
* divide architectural responsibilities into milestones and tasks;
* define task dependencies;
* identify safe migration boundaries;
* define acceptance criteria;
* define automated and manual verification requirements;
* define rollback boundaries;
* refine implementation sequencing when repository inspection reveals concrete technical dependencies.

The Phase 6 Implementation Plan must not independently redefine:

* Project identity;
* Project ownership;
* Project creation threshold;
* Project version semantics;
* primary-image immutability;
* Project data classification and technical versioning boundaries;
* `.hfzproject` v2 canonical persistence principles;
* Local-First behavior;
* Local Workspace responsibilities;
* future Cloud Workspace boundaries;
* synchronization and conflict-resolution principles;
* Identity, Subscription, Product Capability, and Settings separation;
* Learning and editorial behavior;
* security guarantees;
* infrastructure principles;
* initial Local-Only launch scope.

If implementation analysis reveals that an approved architectural decision is technically impossible, internally contradictory, unsafe, or materially incomplete, implementation must stop at that boundary.

The issue must then be explicitly identified and resolved at the appropriate architectural level before implementation continues.

A repository-specific implementation detail may be decided during Phase 6 when:

* it does not change approved product behavior;
* it does not contradict the Phase 5 Technical Architecture;
* it does not weaken data integrity, ownership, authorization, capability enforcement, security, or recovery guarantees;
* it remains proportionate to actual implementation needs;
* it does not introduce speculative future complexity.

The existing codebase is not disposable legacy code.

Phase 6 must preserve validated algorithms, workflows, abstractions, tests, and architectural foundations wherever they remain compatible with the approved target architecture.

Refactoring must be justified by a concrete implementation need, architectural requirement, safety concern, maintainability problem, or verified incompatibility.

The authoritative rule is:

**Phase 5 defines the approved Technical Architecture. Phase 6 defines the controlled implementation path toward that architecture. If implementation exposes a genuine architectural gap, the gap must be resolved explicitly rather than silently invented around in code.**
## 3. Phase 6 Scope

Phase 6 implements the architecture required to transform the current working HFZWood application into a stable, secure, testable, and release-ready initial Local-Only product.

The Phase 6 implementation scope includes:

* establishment of a verified implementation baseline and complete validation safety net;
* implementation of the canonical `.hfzproject` v2 Project representation;
* stable Project identity, ownership, technical versioning, metadata versioning, and ancestry;
* primary-image integrity, immutability, serialization, validation, and evidence-based import boundaries;
* production authentication and stable authenticated user identity;
* Project ownership enforcement and read-only handling of foreign-owned local Project files;
* Product Capability resolution and enforcement across local functionality, frontend experience, backend protection, and protected services where applicable;
* implementation of the Project Structural Capability Snapshot;
* completion of the Local Workspace architecture;
* safe Project Save, Open, Update, reopen, deletion, dirty-state, and unsaved-changes behavior;
* protection against accidental loss of the last known managed Project copy;
* migration of approved device-specific Settings to a single device-local authority;
* necessary backend modularization and API hardening without unnecessary rewriting of validated calculation logic;
* production-ready persistence for launch-critical editorial, identity-related, entitlement, capability, and infrastructure data;
* production deployment architecture and environment configuration;
* backup, recovery, observability, logging, operational safety, and cost-awareness foundations required for launch;
* cloud-ready architectural foundations required by the approved Technical Architecture without activating incomplete user-facing Cloud Workspace functionality;
* security enforcement, input validation, payload boundaries, abuse protection, and safe failure behavior proportionate to the initial product scope;
* integrated regression testing and Product Owner manual verification;
* final code hygiene, documentation alignment, release-readiness assessment, and independent final audit.

Phase 6 must preserve existing validated product behavior wherever that behavior remains compatible with the approved Product and Technical Architecture.

The implementation must remain incremental.

No milestone or task may intentionally leave the application in an unverified broken state with the assumption that a later task will repair it.

Each completed task must leave the repository in a known, reviewable, testable, and reversible state.

The initial Phase 6 release target is a Local-Only HFZWood product.

This means that Projects are created, persisted, opened, updated, and managed locally through the approved Local-First architecture.

Cloud-related foundations may be implemented where required for future compatibility, production persistence, ownership, capability enforcement, infrastructure readiness, or later Cloud Workspace evolution.

However, incomplete operational Cloud Workspace functionality must not be exposed to users and must not block the initial Local-Only launch.

The authoritative rule is:

**Phase 6 implements everything required to make the approved initial Local-Only HFZWood product release-ready while preserving the architectural foundations necessary for safe future evolution, without prematurely activating incomplete future product functionality.**
## 4. Out of Scope

Phase 6 does not include functionality that is not required for the approved initial Local-Only HFZWood release or for the minimum architectural foundations explicitly required by the Phase 5 Technical Architecture.

The following are out of scope for Phase 6 unless a concrete launch-critical dependency is explicitly identified and approved:

* operational user-facing Cloud Workspace functionality;
* automatic Project synchronization between local and cloud representations;
* manual Project upload to Cloud Workspace;
* Open from Cloud;
* Update Cloud Version;
* cloud Project restore workflows exposed to users;
* cloud conflict-resolution screens;
* cloud branching workflows;
* user-facing cloud Project management;
* collaboration between multiple Project owners;
* shared Project editing;
* Project ownership transfer;
* anonymous Project ownership;
* public Project sharing;
* marketplace functionality;
* Trusted Devices;
* advanced account-sharing prevention;
* license-abuse detection systems;
* advanced fraud detection;
* Global Search;
* semantic search;
* vector databases;
* AI-assisted Project functionality;
* AI-assisted geometry recognition;
* AI-powered Knowledge Base assistance;
* AI implementation beyond explicitly approved editorial translation assistance already belonging to the existing editorial architecture;
* detailed Stripe integration and payment workflows unless separately approved as necessary for the initial commercial launch;
* pricing-page redesign;
* marketing website implementation;
* mobile applications;
* native desktop applications;
* offline-first service-worker architecture beyond the approved Local-First Project behavior and authenticated offline continuity rules;
* multi-region AWS deployment;
* enterprise-scale security infrastructure not justified by actual product risk;
* permanent historical retention of every Project save;
* full version-control behavior;
* compatibility or migration support for disposable pre-launch `.hfzproject` v1 development files;
* rewriting validated Resin Calculator algorithms without a concrete architectural or correctness requirement;
* speculative abstractions, services, infrastructure, or frameworks introduced solely for possible future use.

Cloud-ready architecture must not be confused with operational Cloud Workspace implementation.

Phase 6 may establish the internal data models, repository boundaries, ownership rules, capability boundaries, persistence abstractions, ancestry metadata, infrastructure resources, and other foundations required for future cloud evolution.

However, incomplete cloud functionality must remain invisible to users.

Phase 6 must not expose:

* disabled cloud buttons;
* placeholder cloud screens;
* non-functional cloud controls;
* mock cloud behavior presented as real functionality;
* partially implemented synchronization workflows.

Future functionality may be prepared architecturally only where the approved Technical Architecture requires such preparation and where doing so prevents avoidable future redesign.

Architectural preparation must remain proportionate and must not become speculative implementation.

If a proposed implementation item is not required for:

* the approved Local-Only release;
* preservation of an approved architectural guarantee;
* production security;
* data integrity;
* authenticated ownership;
* Product Capability enforcement;
* production persistence;
* deployment readiness;
* recovery;
* observability;
* or an explicitly required future-compatible foundation;

it should normally be deferred.

The authoritative rule is:

**Phase 6 must implement what the initial Local-Only release requires, prepare only the future foundations explicitly justified by the approved architecture, and defer operational future functionality until its own product scope is approved.**
## 5. Implementation Principles

Phase 6 must be executed according to a disciplined implementation methodology designed to protect existing functionality, preserve architectural intent, reduce regression risk, and keep every change understandable and reversible.

The following principles are mandatory.

### 5.1 Incremental Implementation

Architectural migration must occur through small, controlled implementation steps.

No big-bang rewrite is permitted.

Each task must have one clearly defined primary responsibility and must be small enough to:

* understand before implementation;
* review after implementation;
* verify independently;
* reverse safely if necessary.

Large architectural responsibilities must be divided into smaller tasks when independent verification or rollback would otherwise become difficult.

### 5.2 Preserve Before Replace

Existing working functionality must be preserved wherever it remains compatible with the approved architecture.

Phase 6 must not rewrite code merely because a different implementation appears cleaner, newer, or more elegant.

Replacement or substantial refactoring requires a concrete reason, such as:

* incompatibility with the approved architecture;
* correctness risk;
* security weakness;
* data-integrity risk;
* maintainability problem that blocks safe implementation;
* verified duplication or obsolete behavior;
* inability to satisfy required testing or production guarantees.

Validated Resin Calculator algorithms must not be rewritten without a specific architectural or correctness requirement and dedicated regression verification.

### 5.3 Migration Before Deletion

Existing behavior, persistence paths, APIs, or implementation mechanisms must not be removed before their approved replacements are implemented and verified.

Where migration is required:

1. identify the existing behavior;
2. define the target behavior;
3. implement the replacement safely;
4. verify the replacement;
5. confirm that no required dependency still uses the old path;
6. remove obsolete code;
7. run regression validation.

Obsolete code must not remain indefinitely after successful migration, but premature deletion is equally unacceptable.

### 5.4 One Primary Responsibility per Task

Each task must address one primary implementation responsibility.

A task must not combine unrelated architectural changes merely because they touch nearby files or appear technically convenient to implement together.

Closely related changes may remain in one task only when separating them would create an artificial, unverifiable, or temporarily unsafe state.

Task boundaries must be determined by architectural responsibility, dependency, testability, and rollback safety rather than by file count.

### 5.5 Dependency-Driven Sequencing

Implementation order must follow real technical dependencies.

A later architectural layer must not be implemented on assumptions that an earlier required foundation will eventually exist.

For example:

* canonical Project identity must exist before stable Local Workspace behavior depends on it;
* authenticated ownership must exist before ownership enforcement can be considered complete;
* capability resolution must exist before capability-dependent behavior is considered authoritative;
* replacement persistence must be verified before obsolete persistence paths are removed.

Convenience must not override dependency order.

### 5.6 Functional State After Every Task

Every completed task must leave the application in a known, functional, reviewable, and testable state.

A task must not intentionally break existing approved functionality with the expectation that another future task will repair it.

Temporary implementation scaffolding is acceptable only when:

* it is explicitly identified;
* it does not create false product behavior;
* it does not weaken security or data integrity;
* it has a known removal point;
* the application remains verifiable.

### 5.7 Analysis Before Implementation

No implementation task begins directly with code changes.

Every task must begin with Pre-Implementation Analysis based on the real repository state.

The analysis must identify, where applicable:

* current implementation behavior;
* relevant files and modules;
* existing tests;
* architectural dependencies;
* behavior that must be preserved;
* behavior that must change;
* risks;
* likely migration boundaries;
* acceptance criteria;
* rollback boundary;
* potential future-scope temptations that must be avoided.

Implementation begins only after the analysis has been reviewed and approved.

### 5.8 Product and Architecture Decisions Are Not Delegated to Implementation Tools

Cursor or any other implementation tool may inspect code, identify repository facts, propose implementation details, and execute approved tasks.

It must not independently decide:

* product behavior;
* Product Architecture;
* major Technical Architecture changes;
* ownership semantics;
* Project identity rules;
* versioning semantics;
* capability policy;
* security guarantees;
* launch scope;
* future product functionality.

If implementation reveals a missing major decision, implementation must stop at that boundary.

The missing decision must be resolved explicitly before work continues.

### 5.9 Evidence Before Assumption

Implementation decisions must be based on evidence from:

* the approved architecture;
* the actual repository;
* existing tests;
* measured behavior;
* realistic performance testing;
* documented product decisions.

Arbitrary technical limits must not be invented when the architecture requires evidence-based configuration.

This is especially important for:

* image formats;
* source-file size limits;
* decoded image dimensions;
* browser memory behavior;
* payload limits;
* performance thresholds;
* storage assumptions.

### 5.10 Automated Testing Is Necessary but Not Sufficient

Every task must run the automated validation appropriate to its scope.

Depending on the task, this may include:

* targeted frontend tests;
* complete frontend test suite;
* targeted backend tests;
* complete backend test suite;
* production build;
* schema validation;
* migration tests;
* security tests;
* persistence tests;
* corrupted-input tests;
* performance measurements.

Passing automated tests does not by itself complete a task.

User-visible or workflow-sensitive behavior must also receive manual Product Owner verification where applicable.

### 5.11 Product Owner Manual QA

Manual verification is mandatory for behavior that affects:

* user workflows;
* navigation;
* Project creation;
* Save and Open;
* Local Workspace;
* authentication;
* ownership messaging;
* read-only behavior;
* capability restrictions;
* Settings;
* error messages;
* recovery behavior;
* other visible product interactions.

Manual QA must verify actual behavior rather than merely confirm that a screen renders.

If Product Owner QA identifies a defect, inconsistency, confusing interaction, or architectural mismatch, the task remains open until the issue is resolved or explicitly deferred as a documented non-blocking item.

### 5.12 Explicit Acceptance Criteria

Every task must define completion criteria before implementation.

Acceptance criteria must be concrete enough to determine whether the task is complete.

They must cover, where applicable:

* expected behavior;
* preserved behavior;
* prohibited behavior;
* failure behavior;
* automated tests;
* manual verification;
* documentation impact;
* cleanup requirements.

A task is not complete merely because code has been written.

### 5.13 Known Rollback Boundary

Every implementation task must have a known rollback boundary before implementation begins.

The rollback boundary should normally correspond to the task's isolated commit and any explicitly identified external state change.

A task must not introduce irreversible migration without:

* explicit justification;
* backup or recovery strategy where required;
* validation of the migration path;
* approval of the irreversible boundary.

One task should normally correspond to one implementation commit.

### 5.14 No Speculative Implementation

Phase 6 must not introduce functionality, frameworks, abstractions, infrastructure, or services solely because they might be useful in the future.

Future-compatible architecture is appropriate only when:

* required by the approved Technical Architecture;
* necessary to prevent a known future redesign;
* proportionate to the current implementation need.

Preparation for the future must not become implementation of the future.

### 5.15 Cleanup Before Task Closure

A task is not complete while it leaves behind unnecessary implementation debris.

Before closure, inspect for:

* dead code;
* obsolete helpers;
* redundant branches;
* unused imports;
* temporary debug code;
* obsolete CSS;
* abandoned compatibility paths;
* duplicate implementation artifacts;
* temporary migration scaffolding that has reached its removal point.

Cleanup must remain within task scope and must not become unrelated refactoring.

### 5.16 Documentation Alignment

Documentation must be updated when implementation changes the authoritative description of:

* current system behavior;
* implementation status;
* task status;
* architecture realization;
* commands;
* environment requirements;
* known limitations;
* migration state.

Documentation updates must describe the implemented reality.

They must not claim future functionality as complete.

### 5.17 Repository Discipline

Before starting a new task, the repository should be in a known clean state unless the task explicitly continues approved unfinished work.

Task closure must normally include:

* appropriate automated tests;
* production build where required;
* manual QA where applicable;
* code hygiene review;
* documentation update;
* commit;
* push;
* clean repository confirmation;
* confirmation that unauthorized future-task functionality was not introduced.

### 5.18 Stop Conditions

Implementation must stop when:

* the repository state contradicts a critical assumption of the task;
* an approved architectural decision appears technically impossible;
* two approved architectural rules appear contradictory;
* a major product decision is missing;
* data integrity cannot be guaranteed;
* ownership or authorization boundaries are unclear;
* capability enforcement would become contradictory;
* implementation would require silently changing launch scope;
* rollback safety cannot be reasonably established;
* the task has expanded materially beyond its approved responsibility.

Stopping in these situations is part of implementation discipline, not a failure of progress.

### 5.19 Authoritative Implementation Principle

The authoritative rule is:

**Implement in small dependency-driven steps. Preserve what works. Replace only with cause. Migrate before deleting. Verify every task independently. Keep rollback boundaries known. Never delegate unresolved product or architectural decisions to implementation tools, and never sacrifice product integrity for implementation speed.**
## 6. Task Decomposition Rules

Phase 6 implementation tasks must be derived from approved architectural obligations, real repository dependencies, migration boundaries, verification needs, and rollback safety.

Task decomposition must avoid two opposite failures:

* tasks so large that their implementation, review, testing, or rollback becomes difficult to control;
* tasks so fragmented that individually they do not produce a coherent, independently verifiable implementation state.

The goal is not to maximize or minimize the number of tasks.

The goal is to create the smallest safe sequence of meaningful implementation units.

### 6.1 When an Architectural Obligation Should Become a Separate Task

An architectural obligation should normally become a separate task when one or more of the following conditions apply:

* it introduces a distinct architectural responsibility;
* it creates or changes an authoritative data model;
* it changes persistence semantics;
* it changes Project identity, ownership, versioning, or integrity behavior;
* it introduces a security or authorization boundary;
* it introduces a migration boundary;
* it requires independent automated verification;
* it requires distinct Product Owner manual QA;
* it has a meaningful independent rollback boundary;
* failure could affect data integrity, Project portability, ownership, authorization, capabilities, recovery, or essential product workflows;
* it requires evidence-based investigation or performance measurement before implementation;
* it can be completed and verified without requiring unrelated architectural changes.

A separate task is especially appropriate when combining the work with another responsibility would make it difficult to determine which change caused a regression.

### 6.2 When Closely Related Changes May Remain in One Task

Closely related changes may remain in one task when:

* they implement one coherent architectural responsibility;
* separating them would leave the application in an artificial or invalid intermediate state;
* they share the same acceptance criteria;
* they share the same rollback boundary;
* they require the same verification workflow;
* they are small enough to understand and review together;
* no independent Product Owner decision is hidden inside the combined work.

File count alone does not determine task size.

A task may modify several files when those files participate in one coherent responsibility.

Conversely, a change involving only one file may still require a separate task when it changes an important persistence, security, identity, ownership, capability, or data-integrity rule.

### 6.3 When a Task Is Too Large

A proposed task must be divided when it:

* combines multiple primary architectural responsibilities;
* crosses several independent migration boundaries;
* requires unrelated forms of manual QA;
* cannot be safely reversed as one unit;
* would leave too many possible causes for a regression;
* requires multiple major architectural assumptions to be validated simultaneously;
* mixes foundational work with substantial user-facing functionality;
* mixes implementation with unrelated cleanup or refactoring;
* cannot be described with clear and bounded acceptance criteria;
* is likely to produce an implementation diff too large for reliable review.

If a task cannot be explained clearly in terms of one primary objective, known dependencies, expected behavior, verification, and rollback, it is probably too large.

### 6.4 When a Task Is Too Small

A proposed task should normally be merged with adjacent work when it:

* has no independently meaningful result;
* cannot be verified independently;
* exists only as mechanical preparation for the immediately following change;
* creates a temporary state with no architectural or product value;
* has no distinct rollback value;
* would create unnecessary commit noise without improving safety or understanding.

Task decomposition must not become fragmentation for its own sake.

### 6.5 Investigation Tasks

Some architectural obligations require evidence before implementation decisions can be finalized.

A dedicated investigation task is appropriate when the approved architecture explicitly requires repository inspection, measurement, realistic testing, or validation before implementation configuration is selected.

Examples may include:

* current primary-image serialization behavior;
* realistic mobile-photo file sizes;
* decoded image dimensions;
* browser memory behavior;
* `.hfzproject` Save and Open performance;
* payload limits;
* current backend test execution gaps;
* production container packaging behavior;
* existing persistence dependencies.

An investigation task must not silently implement production changes.

Its result should be a concrete evidence-based recommendation that enables a later implementation task.

Investigation must not be used to reopen approved product or architectural decisions.

### 6.6 Migration Tasks

A migration task must clearly identify:

* the current authoritative behavior or storage path;
* the approved target behavior or storage path;
* compatibility requirements;
* temporary coexistence rules, if any;
* cutover conditions;
* cleanup conditions;
* rollback boundary;
* validation required before the old path may be removed.

Migration tasks must avoid indefinite dual authority.

When the target architecture requires one authoritative source, temporary coexistence may exist only for a controlled migration period with an explicit removal point.

### 6.7 Refactoring Tasks

Refactoring must not be introduced as a vague goal.

A dedicated refactoring task is justified only when it serves a concrete requirement such as:

* enabling an approved architectural boundary;
* reducing verified duplication that creates implementation risk;
* isolating validated domain logic before surrounding infrastructure changes;
* improving testability required for migration;
* removing obsolete code after successful replacement;
* correcting a structure that prevents safe implementation.

A refactoring task must preserve approved behavior unless behavior change is explicitly part of the task.

Large general cleanup tasks should be avoided.

### 6.8 Security-Sensitive Tasks

Changes affecting the following areas should normally receive explicit task boundaries or explicit security acceptance criteria:

* authentication;
* authorization;
* Project ownership;
* administrator access;
* Product Capability enforcement;
* password recovery;
* file or media upload;
* file or media download;
* Project import;
* protected backend operations;
* secrets and configuration;
* abuse-sensitive or expensive operations.

Security must be implemented within the relevant architectural responsibility rather than postponed entirely to a final hardening pass.

The final security audit verifies the complete system; it does not replace security work during implementation.

### 6.9 Data-Integrity-Sensitive Tasks

Changes affecting persistent Project data require especially strict decomposition and verification.

This includes:

* `.hfzproject` schema changes;
* Project identity;
* version generation;
* ancestry;
* primary-image integrity;
* Save behavior;
* Open behavior;
* dirty-state logic;
* metadata persistence;
* ownership metadata;
* capability snapshots;
* deletion behavior;
* migration or serialization.

Such tasks should be small enough that corruption, data loss, false version creation, or incorrect state adoption can be isolated and tested precisely.

### 6.10 Product Owner QA Boundaries

A task should normally have a distinct manual QA boundary when it changes behavior that the Product Owner can meaningfully observe or evaluate.

Examples include:

* Project creation;
* Save;
* Open;
* Update;
* Local Workspace behavior;
* read-only foreign Project behavior;
* authentication;
* capability restrictions;
* Settings;
* error messages;
* warnings;
* recovery interactions.

Purely internal tasks may not require extensive Product Owner manual QA when their correctness is better established through automated tests, repository inspection, or infrastructure verification.

However, internal implementation must never be classified as exempt from manual QA merely to accelerate closure when it has observable product consequences.

### 6.11 Milestone-Level Decomposition

The complete Phase 6 milestone sequence is defined in advance.

Detailed task decomposition is performed progressively, one milestone at a time.

Before a milestone begins:

1. inspect its approved architectural obligations;
2. inspect the real repository state relevant to that milestone;
3. identify dependencies and migration boundaries;
4. propose the smallest safe set of implementation tasks;
5. review the task sequence;
6. approve the milestone plan;
7. implement one task at a time.

Later milestones must not be prematurely decomposed into rigid detailed task lists when earlier implementation may reveal repository facts that legitimately affect their safest internal sequencing.

This progressive planning approach must not change the approved milestone direction or silently alter architectural scope.

### 6.12 Task Numbering

Task numbering must remain stable after a task enters approved implementation.

If additional work is discovered within the same milestone, new task identifiers should be added without renumbering already completed tasks.

The exact numbering convention may be established when the first milestone is decomposed.

The numbering system should make it easy to identify:

* the milestone;
* the task;
* any repair pass or follow-up task where applicable.

### 6.13 Mandatory Task Definition

Before implementation begins, every task must define, where applicable:

* Task ID;
* Title;
* Objective;
* Architectural source;
* Current-state context;
* In scope;
* Out of scope;
* Dependencies;
* Expected files or modules involved, when known;
* Behavior that must be preserved;
* Expected result;
* Acceptance criteria;
* Automated verification;
* Manual QA scenarios;
* Risks;
* Rollback boundary;
* Cleanup requirements;
* Documentation impact;
* explicit confirmation that unauthorized future-scope functionality must not be implemented.

The exact level of detail should remain proportionate to task complexity and risk.

### 6.14 Repair Passes and Follow-Up Work

If implementation or Product Owner QA identifies defects within the approved responsibility of the active task, those defects should normally be corrected before task closure.

Repair passes do not automatically become new architectural tasks.

A separate follow-up task is appropriate when the discovered work:

* introduces a new primary responsibility;
* materially expands scope;
* requires a separate architectural decision;
* has an independent rollback boundary;
* belongs to a later milestone;
* is not necessary for correctness of the active task.

Deferring a blocking defect merely to close a task is not permitted.

### 6.15 Task Closure Rule

A task may be closed only when:

* its approved implementation is complete;
* acceptance criteria are satisfied;
* required automated tests pass;
* required build validation passes;
* required Product Owner manual QA is complete;
* blocking defects are resolved;
* task-scoped code hygiene is complete;
* documentation is aligned where required;
* obsolete task-scoped code has been removed when safe;
* the task commit is created;
* the task is pushed;
* repository state is confirmed;
* no unauthorized future-task functionality has been introduced.

### 6.16 Authoritative Task Decomposition Rule

The authoritative rule is:

**Create task boundaries around meaningful architectural responsibility, dependency, verification, migration, risk, and rollback. Split work when combining it would reduce control or safety. Merge work when separation would create meaningless fragmentation. The objective is the smallest safe sequence of independently understandable and verifiable implementation steps.**
## 7. Phase 6 Milestone Sequence

Phase 6 is organized as a dependency-driven sequence of implementation milestones.

The milestone sequence defines the complete path from the current working HFZWood application to an initial Local-Only release-ready product.

The sequence is established in advance so that implementation has a clear end-to-end direction.

However, detailed task decomposition is performed progressively, one milestone at a time, based on:

* the approved Phase 5 Technical Architecture;
* the real repository state;
* implementation results from earlier milestones;
* verified technical dependencies;
* migration boundaries;
* testing and rollback requirements.

Later milestones must not be prematurely decomposed into rigid task lists when earlier implementation may reveal repository facts that legitimately affect their safest internal sequencing.

The approved milestone sequence is:

### Milestone 0 — Implementation Baseline and Safety Net

Establish the verified technical baseline required before architectural migration begins.

Primary responsibilities include:

* verify repository state;
* verify the correct development startup workflow;
* verify frontend and backend startup;
* verify authentication and administrator access in the local development environment;
* inventory authoritative build and test commands;
* ensure the complete frontend and backend automated test suites can be executed;
* identify existing validation gaps;
* establish regression safety around launch-critical existing behavior;
* identify architecture and functionality that must be preserved;
* establish task validation, rollback, repository cleanliness, and closure requirements.

No major architectural migration begins before this baseline is verified.

---

### Milestone 1 — Canonical Project Model and `.hfzproject` v2 Foundation

Implement the authoritative Project representation required by the approved Technical Architecture.

Primary responsibilities include:

* canonical `.hfzproject` v2 schema;
* Project format and schema versioning;
* permanent `projectId`;
* stable `ownerId` field;
* `versionId`;
* `parentVersionId`;
* ancestry metadata where required;
* `createdAt`;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* `primaryImageHash`;
* Project Structural Capability Snapshot;
* separation of technical metadata, technical Project content, descriptive metadata, and derived metadata;
* Project creation threshold semantics;
* first persistent version semantics;
* technical-change versioning;
* metadata-only persistence behavior;
* mixed-change persistence behavior;
* no-change Save behavior;
* strict Project validation on Open;
* safe rejection of invalid Project files;
* direct establishment of `.hfzproject` v2 without compatibility requirements for disposable pre-launch v1 development files.

This milestone establishes the canonical Project foundation required by later ownership, capability, Local Workspace, and future cloud behavior.

---

### Milestone 2 — Primary Image Integrity and Import Boundaries

Establish the validated primary-image architecture required for portable, trustworthy, and performant Project persistence.

Primary responsibilities include:

* inspect the existing primary-image serialization mechanism;
* preserve it where compatible and safe;
* ensure JSON-safe portable Project storage;
* implement consistent SHA-256 `primaryImageHash` behavior;
* enforce primary-image immutability for a given `projectId`;
* verify image integrity during relevant Project operations;
* define supported image formats through evidence;
* define source-file size boundaries through evidence;
* define safely decoded image-dimension boundaries through evidence;
* validate actual decodable image content rather than trusting extension or declared MIME type alone;
* safely reject corrupted, malformed, unsupported, or misleading image input;
* test realistic modern phone photographs;
* test browser memory behavior;
* test `.hfzproject` Save and Open behavior with realistic large images;
* preserve sufficient image fidelity for accurate reference measurement, geometry placement, calculation, and Project inspection.

Arbitrary limits must not be invented without measurement and realistic testing.

---

### Milestone 3 — Production Identity and Authentication

Complete the production identity foundation required by authenticated Project ownership and protected product behavior.

Primary responsibilities include:

* complete production frontend authentication integration;
* production Cognito integration;
* backend JWT validation;
* stable authenticated user identity;
* stable production `ownerId` derivation;
* login;
* registration;
* logout;
* password recovery;
* session expiration behavior;
* authenticated route protection;
* backend protection of authenticated endpoints;
* administrator authorization enforcement;
* controlled handling of temporary identity-service unavailability;
* clear separation between Identity, authorization, Subscription, and Product Capabilities;
* preserve mock authentication only for explicitly approved development or testing purposes.

This milestone establishes who the authenticated user is before ownership-dependent product behavior is finalized.

---

### Milestone 4 — Project Ownership Enforcement and Foreign Project Read-Only Mode

Implement authoritative Project ownership behavior across local Project handling and protected operations.

Primary responsibilities include:

* assign and preserve stable `ownerId`;
* enforce ownership immutability through normal product workflows;
* evaluate Project ownership when opening local Project files;
* open foreign-owned local Projects in read-only mode;
* prevent editing of foreign-owned Projects;
* prevent saving or updating foreign-owned Projects;
* prevent ownership replacement or claiming;
* prevent unauthorized cloud operations for foreign-owned Projects;
* provide clear user-facing ownership messaging;
* treat local `ownerId` as persistent metadata rather than trusted authorization proof;
* require independent backend authorization for protected server-side operations.

This milestone preserves legitimate Project inspection without weakening ownership boundaries.

---

### Milestone 5 — Product Capability Resolution and Enforcement

Complete the capability architecture required for consistent product restrictions, offline continuity, and future commercial evolution.

Primary responsibilities include:

* preserve the backend-owned Product Capability catalog;
* implement authoritative effective-capability resolution;
* prevent product modules from checking subscription tiers directly;
* distinguish Project structural capabilities from current account-level capabilities;
* implement the Project Structural Capability Snapshot;
* persist snapshot changes only through successful explicit Save;
* support structural capability expansion after upgrade;
* prevent normal downgrade from silently contracting an existing Project snapshot;
* avoid bulk mutation of all local Projects after entitlement changes;
* define and enforce the approved offline capability window;
* distinguish genuine entitlement expiry from temporary infrastructure unavailability;
* enforce capabilities consistently across frontend UX, local product behavior, backend operations, and protected services where applicable;
* preserve administrator-unlimited behavior without confusing administrative role with commercial tier.

This milestone must be complete before capability-dependent Local Workspace behavior is considered stable.

---

### Milestone 6 — Local Workspace Completion

Complete the approved Local Workspace architecture on top of stable Project identity, ownership, versioning, image integrity, and capability foundations.

Primary responsibilities include:

* local Project discovery;
* Recent Projects as convenience metadata rather than canonical persistence;
* IndexedDB file-handle retention where supported;
* Open Project;
* Save;
* Save As where required by approved behavior;
* Update Existing Project;
* browser-download fallback behavior;
* technically confirmed persistence handling;
* explicit user confirmation where browser-managed download success cannot be independently verified;
* technical dirty-state tracking;
* metadata dirty-state tracking;
* Project Structural Capability Snapshot dirty-state handling;
* unsaved-changes protection;
* Project naming and generated fallback names;
* local deletion behavior;
* last-known-managed-copy protection;
* strong warning before deliberate deletion of the last known managed copy;
* handling of moved, deleted, unavailable, or inaccessible local files;
* foreign-owned Project read-only integration;
* complete Project reopen and restoration behavior;
* removal of obsolete local persistence paths after verified migration.

This milestone produces the stable local Project management experience required for the initial Local-Only release.

---

### Milestone 7 — Device-Local Settings Migration

Establish a single device-local authority for approved device-specific preferences.

Primary responsibilities include:

* make interface language device-local;
* make length units device-local;
* make volume units device-local;
* use browser storage as the single authoritative source for these preferences;
* remove backend persistence as a competing authority for these three settings;
* avoid indefinite dual authority;
* support initialization from browser or system locale where appropriate;
* support regional unit defaults where appropriate;
* provide safe fallback behavior;
* preserve Quick Preferences;
* preserve correct offline availability;
* ensure Settings do not modify Project identity, Project content, ownership, or Product Capabilities;
* preserve active display units in generated exports where applicable.

This milestone aligns implementation with the approved Settings architecture.

---

### Milestone 8 — Backend Modularization and API Hardening

Evolve the backend and API structure only as required to support the approved architecture safely.

Primary responsibilities include:

* modularize calculator backend responsibilities where necessary;
* preserve validated calculation algorithms;
* establish clear router, service, repository, and schema boundaries where justified;
* introduce a consistent API error model;
* establish API versioning where required;
* enforce schema validation;
* enforce authentication;
* enforce ownership;
* enforce Product Capabilities;
* establish request-size boundaries;
* harden media and file validation;
* provide safe error responses;
* configure CORS appropriately;
* introduce proportionate abuse protection and rate limiting where justified;
* remove obsolete paths after verified replacement;
* consolidate duplicated API communication only where concrete duplication or risk justifies it;
* avoid introducing unnecessary frontend state-management frameworks or backend abstractions.

This milestone is controlled architectural evolution, not a general rewrite.

---

### Milestone 9 — Production Persistence for Editorial and Launch-Critical Data

Replace development-only persistence mechanisms where required for durable production operation.

Primary responsibilities include:

* replace inappropriate production filesystem persistence;
* establish durable persistence for editorial structure;
* preserve Draft and Published state;
* preserve locale variants;
* preserve translation states where applicable;
* preserve entitlement and capability data;
* establish identity-related domain metadata persistence where required;
* establish future-compatible Project and cloud metadata foundations where required;
* use appropriate durable metadata storage;
* use appropriate object storage for media and binary objects;
* preserve stable object identifiers;
* use temporary signed access URLs rather than treating temporary URLs as persistent identity;
* keep storage private by default;
* preserve editorial snapshots;
* preserve cross-references;
* preserve media reuse;
* separate editorial media storage from private Project storage;
* prevent private Project content from entering public editorial delivery paths.

This milestone provides durable production persistence without activating operational Cloud Workspace functionality.

---

### Milestone 10 — Production Infrastructure and Deployment Readiness

Complete the production infrastructure required to deploy, operate, observe, recover, and financially monitor the initial product.

Primary responsibilities include:

* correct production container packaging;
* ensure the complete backend application is included in production deployment;
* verify ECS Fargate deployment boundaries where retained;
* verify Application Load Balancer integration where retained;
* establish production Cognito resources;
* establish required durable storage resources;
* establish public content delivery infrastructure where appropriate;
* enforce HTTPS;
* enforce encryption at rest;
* manage secrets through appropriate managed mechanisms;
* use IAM roles and least privilege;
* separate development and production configuration;
* use the approved EU AWS region strategy;
* preserve future staging capability without unnecessary current complexity;
* enable appropriate backup and recovery foundations;
* enable DynamoDB point-in-time recovery where applicable;
* enable S3 versioning where applicable;
* define lifecycle retention;
* support recovery into separate resources where appropriate;
* establish logging, metrics, and alarms;
* avoid unnecessary sensitive data in logs;
* establish cost visibility;
* establish budget alerts and proportionate anomaly awareness where justified;
* clean up temporary and expired objects according to policy.

This milestone makes the production platform operationally supportable.

---

### Milestone 11 — Cloud-Ready Foundations Without Cloud Activation

Implement only the hidden architectural foundations required for safe future Cloud Workspace evolution.

Primary responsibilities include:

* preserve Project structures compatible with future cloud persistence;
* preserve Project ancestry metadata required for future synchronization reasoning;
* establish future-compatible repository and service boundaries where required;
* preserve ownership boundaries;
* preserve capability boundaries;
* define future-compatible canonical cloud representation foundations;
* preserve Local Workspace and future Cloud Workspace separation;
* establish cloud metadata foundations where required by the approved architecture;
* keep operational Cloud Workspace functionality invisible to users.

This milestone must not expose:

* cloud upload;
* automatic synchronization;
* manual synchronization;
* Open from Cloud;
* Update Cloud Version;
* cloud restore workflows;
* cloud branching;
* cloud conflict-resolution screens;
* disabled cloud buttons;
* placeholder cloud screens;
* mock cloud behavior presented as real functionality.

The objective is cloud readiness, not cloud activation.

---

### Milestone 12 — Security, Input Boundaries, and Operational Hardening

Perform a transversal hardening pass across the complete launch-critical architecture.

Security must already be implemented within earlier relevant milestones.

This milestone verifies and strengthens the complete system rather than postponing all security work until the end.

Primary responsibilities include:

* authentication-sensitive endpoint review;
* administrator endpoint review;
* Project ownership enforcement review;
* Product Capability enforcement review;
* password-recovery protection;
* file and media upload protection;
* file and media download protection;
* Project import validation;
* protected backend operation review;
* secret and configuration review;
* abuse-sensitive and expensive-operation review;
* schema validation review;
* payload-limit alignment across browser, backend, proxy, and object storage where applicable;
* safe failure behavior;
* prevention of partial authoritative mutation;
* ownership-bypass testing;
* authorization-bypass testing;
* capability-bypass testing;
* secret-exposure review;
* CORS verification;
* rate-limit and abuse-protection verification;
* secret scanning;
* dependency review;
* production configuration validation;
* sensitive logging review.

The goal is a proportionate, tested launch-security baseline rather than unnecessary enterprise-scale complexity.

---

### Milestone 13 — Integrated Local-Only Release Candidate

Validate the complete initial Local-Only product as one integrated release candidate.

Primary responsibilities include end-to-end verification of:

* authentication;
* New Project;
* Project creation threshold;
* `.hfzproject` v2 identity;
* first Save;
* technical Save;
* metadata-only Save;
* mixed Save;
* no-change Save;
* close and reopen;
* Project restoration;
* primary-image integrity;
* ownership;
* foreign-owned Project read-only behavior;
* Product Capability behavior;
* Project Structural Capability Snapshot behavior;
* Local Workspace;
* Settings;
* Manual;
* Tutorials;
* Glossary;
* Knowledge Base;
* Admin;
* production persistence;
* media delivery;
* error handling;
* temporary-unavailability behavior;
* approved offline continuity behavior;
* realistic large-image behavior;
* corrupted-file handling;
* supported-browser behavior;
* performance;
* complete frontend automated test suite;
* complete backend automated test suite;
* production build;
* Product Owner manual QA.

This milestone produces the integrated release candidate that enters final audit.

---

### Milestone 14 — Final Release-Readiness Audit

Perform an independent final audit before Phase 6 closure.

Primary responsibilities include:

* code hygiene audit;
* dead-code review;
* obsolete-path review;
* regression audit;
* Project integrity audit;
* Save and Open reliability audit;
* authentication audit;
* ownership audit;
* Product Capability audit;
* security audit;
* input-boundary audit;
* production-persistence audit;
* backup and recovery audit;
* observability audit;
* infrastructure audit;
* documentation-alignment audit;
* deployment-readiness audit;
* rollback-readiness audit;
* repository cleanliness confirmation;
* launch-blocker assessment;
* documentation of known low-risk non-blocking defects where applicable.

Phase 6 must not close while a known unresolved issue creates material risk of:

* Project data loss;
* Project corruption;
* ownership violation;
* authorization bypass;
* Product Capability bypass;
* failure of an essential Local-Only workflow;
* unsafe production deployment.

Phase 6 is complete when the initial Local-Only HFZWood product is stable, secure, tested, documented, operationally supportable, and ready for release within its approved scope.

## 7.1 Dependency Principle

The milestone sequence is dependency-driven.

The primary dependency chain is:

`M0 → M1 → M2 → M3 → M4 → M5 → M6`

This chain establishes:

* verified baseline;
* canonical Project representation;
* primary-image integrity;
* production identity;
* Project ownership;
* Product Capability enforcement;
* stable Local Workspace behavior.

Later milestones may contain implementation areas with partial independence, but their execution order must still respect actual repository dependencies and must not weaken the primary architectural chain.

The later convergence path is:

`M7 + M8 + M9 + M10 + M11 + M12 → M13 → M14`

This notation does not mean that all later milestones may be implemented arbitrarily or simultaneously.

Their detailed sequencing must be determined by real technical dependencies, migration boundaries, infrastructure requirements, verification safety, and the results of earlier implementation.

## 7.2 Progressive Milestone Planning Rule

The complete milestone sequence is defined now.

Detailed task decomposition is not.

Before each milestone begins:

1. inspect the approved Phase 5 architectural obligations relevant to that milestone;
2. inspect the real repository state;
3. identify dependencies, risks, migration boundaries, and preserved behavior;
4. propose the smallest safe sequence of meaningful tasks;
5. review and approve the milestone task plan;
6. implement one task at a time;
7. close the milestone only after its completion criteria are satisfied.

The next milestone must not begin merely because coding for the previous milestone appears complete.

The previous milestone must first satisfy its required validation, cleanup, documentation, and closure conditions.

## 7.3 Authoritative Milestone Sequence Rule

The authoritative rule is:

**Phase 6 follows a complete dependency-driven milestone sequence from verified baseline to final release audit. The overall direction is established in advance, while detailed task planning remains progressive and evidence-based. Earlier foundations must not be bypassed, later milestones must not invent missing architecture, and every milestone must leave the product in a known, verifiable state.**
## 8. Phase 6 Completion and Release-Readiness Criteria

Phase 6 is complete only when the approved initial Local-Only HFZWood product is demonstrably stable, secure, tested, documented, operationally supportable, and ready for release within its approved scope.

Completion is not determined solely by:

* the number of completed tasks;
* the amount of code written;
* successful implementation of individual features;
* passing isolated tests;
* completion of the final implementation milestone.

Phase 6 completion requires integrated evidence that the product as a whole satisfies the approved Product Architecture, Technical Architecture, implementation plan, and initial launch scope.

### 8.1 Architectural Completion

Phase 6 may be considered architecturally complete only when:

* the canonical `.hfzproject` v2 Project representation is implemented and validated;
* permanent Project identity is implemented;
* Project ownership is implemented and enforced;
* Project technical versioning and metadata persistence behavior match the approved architecture;
* primary-image integrity and immutability are enforced;
* Product Capability resolution and enforcement are operational;
* the Project Structural Capability Snapshot is implemented according to approved rules;
* Local Workspace behavior is complete for the initial Local-Only release;
* approved device-specific Settings use a single device-local authority;
* production authentication is operational;
* launch-critical backend and API boundaries are implemented and hardened;
* launch-critical production persistence is durable;
* production infrastructure is deployable and supportable;
* required cloud-ready foundations exist without exposing incomplete Cloud Workspace functionality;
* no unresolved implementation path contradicts the approved Phase 5 Technical Architecture.

### 8.2 Project Integrity and Persistence Completion

Project persistence must be verified across the complete approved lifecycle.

This includes:

* Project creation threshold;
* `projectId` creation;
* `ownerId` assignment;
* first successful Save;
* `versionId` generation;
* `parentVersionId` behavior;
* ancestry metadata where required;
* technical-content changes;
* metadata-only changes;
* mixed changes;
* no-change Save behavior;
* dirty-state handling;
* technically confirmed persistence;
* browser-download fallback behavior;
* explicit user confirmation where persistence cannot be technically confirmed;
* Project close and reopen;
* complete Project restoration;
* Project naming;
* primary-image restoration;
* primary-image integrity verification;
* Project validation on Open;
* safe rejection of invalid or corrupted Project files;
* handling of moved, missing, inaccessible, or unavailable local Project files.

No known unresolved issue may create material risk of silent Project corruption, false persistence confirmation, incorrect version identity, or accidental Project data loss.

### 8.3 Identity, Ownership, and Authorization Completion

Before Phase 6 closure:

* production authentication must function correctly;
* authenticated identity must be stable;
* Project `ownerId` must be assigned and preserved correctly;
* foreign-owned local Projects must open according to the approved read-only behavior;
* foreign-owned Projects must not be editable, saved, claimed, or treated as belonging to the current user;
* protected backend operations must independently enforce authorization;
* local Project metadata must not be trusted as authoritative proof of server-side authorization;
* administrator access must be enforced correctly;
* no known ownership or authorization bypass may remain unresolved.

### 8.4 Product Capability Completion

Before Phase 6 closure:

* modules must not depend directly on subscription-tier checks where Product Capabilities are the approved authority;
* effective capabilities must resolve correctly;
* frontend restrictions must reflect authoritative capability behavior;
* backend or protected-service enforcement must exist where required;
* Project structural capabilities must be distinguished from current account-level capabilities;
* the Project Structural Capability Snapshot must persist correctly;
* normal downgrade must not silently contract existing Project structural capability snapshots;
* upgrades must behave according to approved expansion rules;
* offline capability continuity must respect the approved offline window;
* genuine entitlement expiry must be distinguished from temporary infrastructure unavailability;
* administrator-unlimited behavior must remain correctly separated from ordinary commercial entitlement logic;
* no known capability bypass may remain unresolved.

### 8.5 Local Workspace Completion

The Local Workspace must support the complete approved initial local Project lifecycle.

This includes:

* Project discovery;
* Recent Projects;
* Open Project;
* Save;
* Update Existing Project;
* Save As where required by approved behavior;
* file-handle retention where supported;
* browser fallback behavior;
* Project reopen;
* complete state restoration;
* dirty-state handling;
* unsaved-changes protection;
* local deletion behavior;
* last-known-managed-copy protection;
* handling of missing or inaccessible files;
* foreign-owned Project read-only integration.

Recent Projects must remain convenience metadata rather than authoritative Project persistence.

The application must not imply that a Project is safely persisted when persistence has not been technically confirmed or explicitly confirmed by the user according to the approved fallback workflow.

### 8.6 Settings Completion

Before Phase 6 closure:

* interface language must use the approved device-local authority;
* length units must use the approved device-local authority;
* volume units must use the approved device-local authority;
* no indefinite competing backend authority may remain for these preferences;
* Quick Preferences must remain functional;
* preference initialization and fallback behavior must be safe;
* Settings must remain independent from Project ownership, Project content, and Product Capability authorization;
* approved offline preference availability must function correctly.

### 8.7 Learning and Editorial Completion

The existing Learning and editorial platform must remain operational after architectural migration.

This includes:

* Manual;
* Tutorials;
* Glossary;
* Knowledge Base;
* administrator editorial interfaces;
* Draft and Published states;
* published snapshots;
* locale variants;
* media handling;
* cross-references;
* authenticated Learning access according to approved product rules.

Production persistence must not weaken existing editorial behavior.

Private Project content must remain isolated from public or editorial content-delivery paths.

### 8.8 Security Completion

Before Phase 6 closure, the launch-critical product must have a tested and proportionate security baseline.

This includes, where applicable:

* authentication protection;
* authorization enforcement;
* ownership validation;
* administrator authorization;
* Product Capability enforcement;
* Project import validation;
* image validation;
* media upload validation;
* file and media download protection;
* request-schema validation;
* request-size limits;
* payload-boundary alignment;
* CORS configuration;
* safe error responses;
* abuse protection;
* rate limiting where justified;
* secret protection;
* production configuration validation;
* dependency review;
* sensitive logging review.

No known unresolved issue may permit material ownership bypass, authorization bypass, capability bypass, secret exposure, or unsafe authoritative mutation.

### 8.9 Production Persistence and Infrastructure Completion

Before Phase 6 closure:

* development-only filesystem persistence must not remain authoritative for production data where durable storage is required;
* production metadata persistence must be durable;
* production object storage must be appropriately private by default;
* stable object identifiers must not depend on temporary signed URLs;
* backup foundations must be enabled where required;
* recovery behavior must be documented and realistically verifiable;
* production container packaging must include the complete required application;
* deployment configuration must be valid;
* HTTPS must be enforced;
* encryption at rest must be enabled where applicable;
* secrets must not be embedded in source code or inappropriate configuration;
* least-privilege access must be used where practical;
* development and production configuration must remain separated;
* logging, metrics, and launch-critical alarms must exist;
* cost visibility and appropriate budget awareness must exist;
* temporary or expired storage must have appropriate cleanup behavior.

### 8.10 Automated Validation Completion

Before Phase 6 closure:

* the complete frontend automated test suite must pass;
* the complete backend automated test suite must pass;
* the production build must pass;
* launch-critical persistence tests must pass;
* Project migration and validation tests required by the implemented architecture must pass;
* ownership and authorization tests must pass;
* Product Capability enforcement tests must pass;
* corrupted-input tests must pass where applicable;
* security-sensitive tests must pass where applicable;
* realistic image and Project-file tests must pass;
* no known test-runner configuration may silently omit required launch-critical tests.

Targeted tests may be used during individual tasks.

Final Phase 6 validation requires the complete authoritative validation suite.

### 8.11 Product Owner Manual QA Completion

Product Owner manual QA must verify the complete user-visible Local-Only release candidate.

This includes, where applicable:

* authentication;
* navigation;
* New Project;
* Project creation threshold;
* Save;
* Open;
* Update;
* reopen and restoration;
* Project naming;
* Local Workspace;
* ownership messaging;
* foreign-owned Project read-only behavior;
* capability restrictions;
* Settings;
* Learning modules;
* error messages;
* warnings;
* corrupted or invalid Project handling;
* temporary-unavailability behavior;
* unsaved-changes protection;
* last-known-managed-copy protection.

Phase 6 cannot close while a blocking Product Owner QA issue remains unresolved.

### 8.12 Code Hygiene and Legacy Cleanup Completion

Before Phase 6 closure, the implementation must be reviewed for:

* dead code;
* obsolete persistence paths;
* obsolete API paths;
* unused imports;
* redundant helpers;
* temporary debug code;
* abandoned migration scaffolding;
* duplicate implementation artifacts;
* obsolete CSS;
* unauthorized future-scope functionality;
* misleading placeholders;
* incomplete cloud controls;
* mock behavior accidentally exposed as production functionality.

Legacy code must not be removed merely because it is old.

It should be removed when its replacement is verified and no approved dependency still requires it.

### 8.13 Documentation Completion

Before Phase 6 closure, project documentation must accurately describe the implemented reality.

This includes, where applicable:

* implementation status;
* completed milestones and tasks;
* authoritative development commands;
* environment requirements;
* production deployment requirements;
* migration status;
* known limitations;
* rollback and recovery information;
* launch scope;
* deferred functionality.

Documentation must not describe future functionality as implemented.

### 8.14 Final Audit Completion

Milestone 14 must perform an independent final release-readiness audit.

The audit must verify at least:

* architecture alignment;
* code hygiene;
* regression status;
* Project integrity;
* persistence reliability;
* authentication;
* ownership;
* authorization;
* Product Capabilities;
* security;
* input boundaries;
* production persistence;
* backup and recovery;
* observability;
* infrastructure;
* documentation;
* deployment readiness;
* rollback readiness;
* repository cleanliness;
* known defects;
* launch blockers.

The final audit must explicitly distinguish between:

* launch-blocking defects;
* non-blocking known defects;
* intentionally deferred future functionality.

### 8.15 Phase 6 Closure Blockers

Phase 6 must not be declared complete while a known unresolved issue creates material risk of:

* Project data loss;
* Project corruption;
* false Save confirmation;
* incorrect Project identity;
* incorrect Project ownership;
* ownership bypass;
* authorization bypass;
* Product Capability bypass;
* secret exposure;
* unsafe production persistence;
* unrecoverable launch-critical production data;
* failure of an essential Local-Only workflow;
* incomplete or misleading user-facing future functionality;
* production deployment that cannot be reasonably operated or observed.

### 8.16 Non-Blocking Defects

Not every minor defect must prevent release.

A known defect may be classified as non-blocking only when:

* it does not threaten data integrity;
* it does not threaten Project portability;
* it does not weaken ownership or authorization;
* it does not permit Product Capability bypass;
* it does not create material security risk;
* it does not break an essential Local-Only workflow;
* it has a documented workaround where appropriate;
* its impact is understood;
* deferral is explicit rather than accidental.

Non-blocking defects must be documented before Phase 6 closure.

### 8.17 Phase 6 Definition of Done

Phase 6 is complete only when:

* Milestones 0 through 14 are complete;
* all launch-critical acceptance criteria are satisfied;
* the complete automated validation suite passes;
* the production build passes;
* Product Owner manual QA is complete;
* the final release-readiness audit passes;
* documentation reflects implemented reality;
* the repository is clean;
* the release scope contains no unauthorized future functionality;
* no known launch blocker remains unresolved.

The authoritative rule is:

**Phase 6 is complete when the approved initial Local-Only HFZWood product is not merely implemented, but demonstrably stable, secure, testable, recoverable, documented, operationally supportable, and ready for release within its approved scope.**
## 9. Task Execution Workflow

Every Phase 6 implementation task must follow a controlled execution workflow.

This workflow converts an approved task definition into verified implementation while preserving architectural intent, repository discipline, rollback safety, and Product Owner control.

No task may skip directly from task selection to implementation.

The authoritative execution sequence is:

**Task Selection → Pre-Implementation Analysis → Analysis Review → Explicit Implementation Approval → Implementation → Implementation Report → Automated Verification → Product Owner Manual QA where applicable → Repair Passes where required → Code Hygiene Review → Documentation Update → Commit → Push → Repository Clean Confirmation → Task Closure → Next Task**

Each stage has a distinct purpose and must not be treated as interchangeable with another stage.

### 9.1 Task Selection

Only one implementation task should normally be active at a time.

Before work begins, the active task must have:

* an approved Task ID;
* a clear title;
* one primary implementation responsibility;
* defined scope;
* defined out-of-scope boundaries;
* known architectural sources;
* known dependencies;
* preliminary acceptance criteria;
* an expected rollback boundary.

A later task must not be implemented early merely because its code appears adjacent or convenient.

If implementation reveals future-task work, that work must be identified and deferred unless it is strictly necessary for correctness or safety of the active task.

### 9.2 Pre-Implementation Analysis

Every task begins with Pre-Implementation Analysis against the real repository state.

The implementation tool must inspect the relevant code, tests, configuration, documentation, persistence paths, and dependencies before proposing changes.

The analysis must identify, where applicable:

* current implementation behavior;
* relevant files and modules;
* existing abstractions;
* existing tests;
* existing persistence behavior;
* dependencies on earlier or later tasks;
* behavior that must be preserved;
* behavior that must change;
* obsolete behavior that may eventually be removed;
* security boundaries;
* ownership boundaries;
* Product Capability boundaries;
* data-integrity risks;
* migration risks;
* likely files or modules to modify;
* proposed implementation approach;
* automated verification requirements;
* manual QA requirements;
* rollback boundary;
* unresolved questions;
* any conflict between repository reality and approved architecture.

Pre-Implementation Analysis must not silently become implementation.

No production code should be changed during this stage unless the active task is explicitly an approved investigation task whose defined output requires controlled experimental changes.

### 9.3 Analysis Review

The Pre-Implementation Analysis must be reviewed before implementation begins.

The review must determine:

* whether the repository findings are credible;
* whether the proposed implementation respects the approved Product and Technical Architecture;
* whether task scope remains correct;
* whether the task should be divided;
* whether dependencies are satisfied;
* whether existing behavior is unnecessarily being replaced;
* whether future-scope functionality is being introduced;
* whether acceptance criteria are sufficient;
* whether verification is sufficient;
* whether rollback remains reasonably safe.

Repository findings may refine implementation details.

They must not silently redefine approved product behavior or major architectural decisions.

If the analysis exposes a genuine architectural gap, contradiction, unsafe assumption, or missing major decision, implementation must stop at that boundary until the issue is explicitly resolved.

### 9.4 Explicit Implementation Approval

Implementation begins only after the Pre-Implementation Analysis has been reviewed and explicit approval to implement has been given.

Approval applies only to the reviewed task scope.

It does not authorize:

* unrelated refactoring;
* speculative abstractions;
* future-task implementation;
* product redesign;
* architectural redesign;
* opportunistic feature additions;
* cleanup outside reasonable task scope.

If implementation later requires material scope expansion, the task must return to analysis and review before continuing.

### 9.5 Implementation

The implementation tool must execute only the approved task.

During implementation it must:

* preserve approved existing behavior;
* follow approved architectural boundaries;
* avoid unnecessary rewrites;
* avoid unauthorized future functionality;
* keep changes proportionate to the task;
* preserve data integrity;
* preserve ownership and authorization guarantees;
* preserve Product Capability guarantees;
* maintain a known rollback boundary;
* add or update tests appropriate to the changed behavior.

If unexpected repository facts materially invalidate the approved implementation approach, implementation must stop and report the issue rather than improvising a new architectural direction.

### 9.6 Implementation Report

After implementation, the implementation tool must provide a factual report describing:

* what was changed;
* which files or modules were modified;
* which files or modules were added or removed;
* how the implementation satisfies the approved objective;
* what existing behavior was preserved;
* what tests were added or updated;
* what validation was run;
* whether all validation passed;
* whether any warnings or limitations remain;
* whether any unexpected repository facts were discovered;
* whether any future work was identified but intentionally not implemented.

The implementation report must describe actual repository changes.

It must not merely restate the task specification or claim success without evidence.

### 9.7 Automated Verification

Every implementation task must run the automated validation appropriate to its scope.

This may include:

* targeted frontend tests;
* complete frontend test suite;
* targeted backend tests;
* complete backend test suite;
* production build;
* schema validation;
* persistence tests;
* migration tests;
* Project Save and Open tests;
* corrupted-input tests;
* ownership tests;
* authorization tests;
* Product Capability tests;
* security tests;
* performance measurements;
* infrastructure validation.

Targeted tests are appropriate during implementation.

Broader regression validation must be run whenever task risk, milestone closure, or release-readiness requirements justify it.

A task must not be declared complete while required tests are failing.

If a test is believed to be obsolete or incorrect, it must be investigated and explicitly resolved rather than ignored.

### 9.8 Product Owner Manual QA

Manual Product Owner QA is required when the task changes behavior that can be meaningfully observed, experienced, or evaluated through the product.

This may include:

* authentication;
* navigation;
* New Project;
* Project creation;
* Save;
* Open;
* Update;
* reopen and restoration;
* Local Workspace;
* ownership messaging;
* foreign-owned Project read-only behavior;
* Product Capability restrictions;
* Settings;
* Learning modules;
* warnings;
* error messages;
* unsaved-changes behavior;
* recovery behavior;
* other user-visible workflows.

The implementation tool or implementation review must provide clear manual QA steps where appropriate.

Product Owner QA is not a ceremonial confirmation.

It must verify actual behavior.

A task remains open when Product Owner QA reveals a blocking defect, confusing behavior, architectural mismatch, or regression within task scope.

Purely internal tasks may not require Product Owner manual QA when correctness is more appropriately established through automated tests, repository inspection, infrastructure validation, or other technical evidence.

### 9.9 Repair Passes

If automated verification or Product Owner QA reveals a defect within the approved responsibility of the active task, the task remains open.

The repair workflow is:

1. identify the exact defect;
2. determine whether it belongs to the active task;
3. investigate the root cause;
4. implement the smallest correct repair;
5. rerun relevant automated validation;
6. repeat Product Owner QA where applicable;
7. continue until blocking task-scoped defects are resolved.

A repair pass does not automatically create a new task.

A separate task is appropriate only when the discovered work introduces a new primary responsibility, materially expands scope, requires a separate architectural decision, belongs to a later milestone, or has an independent rollback boundary.

A blocking defect must not be deferred merely to allow administrative task closure.

### 9.10 Code Hygiene Review

After functional correctness is established, the task must receive a task-scoped code hygiene review.

Inspect for:

* dead code;
* obsolete helpers;
* unused imports;
* redundant branches;
* temporary debug code;
* obsolete CSS;
* duplicate implementation artifacts;
* abandoned compatibility paths;
* migration scaffolding that has reached its removal point;
* misleading comments;
* accidental future-scope functionality.

Code hygiene must remain within task scope.

It must not become an excuse for unrelated broad refactoring.

### 9.11 Documentation Update

Documentation must be updated when the completed task changes authoritative project reality.

This may include:

* task status;
* milestone status;
* implementation notes;
* architecture realization;
* development commands;
* test commands;
* environment requirements;
* migration status;
* known limitations;
* recovery information;
* deferred work.

Documentation must describe what is actually implemented.

It must not describe future work as complete.

### 9.12 Commit

A completed implementation task should normally correspond to one isolated commit.

Before commit:

* required implementation must be complete;
* required automated validation must pass;
* required Product Owner QA must be complete;
* blocking defects must be resolved;
* task-scoped code hygiene must be complete;
* documentation must be aligned where required.

The commit message should identify the task and its primary implementation responsibility clearly.

The commit creates the normal rollback boundary for the completed task.

### 9.13 Push

After the task commit is created, it must be pushed to the approved remote repository according to the established project workflow.

A task is not considered operationally closed merely because changes exist locally.

The pushed repository state must correspond to the reviewed and validated implementation.

### 9.14 Repository Clean Confirmation

After commit and push, repository state must be checked.

The task should normally close with:

* no unintended uncommitted changes;
* no forgotten temporary files;
* no accidental debug artifacts;
* no unexplained generated files;
* no unauthorized future-task implementation;
* no hidden task-scoped work left outside the committed state.

If intentional uncommitted work exists, it must be explicitly identified and justified.

### 9.15 Task Closure

A task may be declared closed only after all applicable workflow stages are complete.

Task closure must confirm, where applicable:

* implementation completed;
* acceptance criteria satisfied;
* automated validation passed;
* Product Owner manual QA completed;
* blocking defects resolved;
* code hygiene completed;
* documentation aligned;
* commit created;
* push completed;
* repository state confirmed;
* no unauthorized future-scope functionality introduced.

Only after task closure may the next task normally begin.

### 9.16 No Silent Workflow Compression

Workflow stages may be proportionate to task complexity, but they must not be silently skipped.

A small internal task may require:

* shorter analysis;
* fewer tests;
* no Product Owner manual QA;
* minimal documentation impact.

A high-risk task may require:

* deeper analysis;
* dedicated investigation;
* extensive automated tests;
* realistic input testing;
* multiple manual QA scenarios;
* broader regression validation;
* explicit migration verification.

Proportionality changes depth, not discipline.

### 9.17 Roles and Responsibilities

The execution workflow preserves clear responsibility boundaries.

The Product Owner is responsible for:

* product intent;
* product behavior decisions;
* user-experience acceptance;
* commercial constraints;
* manual QA where applicable;
* explicit approval when product-level tradeoffs are required.

The architecture and implementation-planning process is responsible for:

* technical sequencing;
* dependency analysis;
* task decomposition;
* architectural alignment;
* risk identification;
* verification strategy;
* identifying when implementation must stop for a missing decision.

The implementation tool is responsible for:

* factual repository inspection;
* Pre-Implementation Analysis;
* implementation of approved task scope;
* test creation and execution;
* factual implementation reporting;
* identifying unexpected repository conditions;
* avoiding unauthorized product or architectural decisions.

No participant or implementation tool should silently assume responsibility for decisions belonging to another role.

### 9.18 Authoritative Task Execution Rule

The authoritative rule is:

**Every Phase 6 task moves through a controlled sequence from selection and repository-based analysis to explicit approval, implementation, factual reporting, verification, Product Owner QA where applicable, repair, cleanup, documentation, commit, push, repository confirmation, and closure. No task skips directly to code, no blocking defect is hidden to accelerate closure, and no next task begins before the active task is properly closed.**
## 10. Milestone 0 — Implementation Baseline and Safety Net

### 10.1 Milestone Objective

The objective of Milestone 0 is to establish a verified, reproducible, and trustworthy implementation baseline before any major Phase 6 architectural migration begins.

Milestone 0 does not implement the target architecture itself.

Its purpose is to determine, from the real repository state, exactly what currently exists, what currently works, how the application is started and validated, which automated protections already exist, which validation gaps must be closed before higher-risk migration begins, and which existing behavior or implementation foundations must be preserved.

The milestone must establish sufficient confidence that later architectural changes can be evaluated against a known baseline rather than against assumptions.

Milestone 0 must therefore:

* verify the actual repository state;
* verify the authoritative local development startup workflow;
* verify frontend and backend startup;
* verify the current local development authentication workflow;
* verify administrator access in the local development environment;
* identify the authoritative frontend and backend build, test, and validation commands;
* confirm that the complete intended frontend automated test suite can be executed;
* confirm that the complete intended backend automated test suite can be executed;
* detect any test-runner configuration that silently omits intended tests;
* identify launch-critical existing behavior that already has automated regression protection;
* identify launch-critical existing behavior that lacks sufficient automated regression protection;
* identify validated existing algorithms, workflows, abstractions, persistence behavior, and architectural foundations that must be preserved during later migration;
* identify current development-only mechanisms that are expected to be replaced in later milestones without prematurely replacing them in Milestone 0;
* establish a factual baseline for repository cleanliness, validation, rollback, and task closure;
* close only those safety-net gaps that are necessary before major architectural migration begins.

Milestone 0 must not become a general refactoring milestone.

It must not:

* implement `.hfzproject` v2;
* change Project identity semantics;
* change Project ownership semantics;
* implement production authentication;
* implement new Product Capability behavior;
* redesign Local Workspace;
* migrate Settings authority;
* perform general backend modularization;
* replace production persistence;
* activate cloud functionality;
* introduce speculative infrastructure;
* rewrite validated Resin Calculator algorithms.

If the repository investigation reveals defects or gaps, they must be classified before action is taken.

A discovered issue may be:

* a Milestone 0 blocker that must be corrected before architectural migration;
* an existing non-blocking defect that may be documented and deferred;
* work that belongs to a later approved milestone;
* evidence of a genuine architectural contradiction or missing decision requiring explicit resolution before implementation.

Milestone 0 must preserve this distinction and must not absorb unrelated future work merely because it is discovered during investigation.

The expected result of Milestone 0 is a repository and development workflow with a known baseline, verified validation commands, trustworthy automated test execution, documented preservation boundaries, identified safety-net gaps, and sufficient regression confidence to begin Milestone 1 safely.

The authoritative rule is:

**Milestone 0 establishes evidence before migration. It verifies the real repository, the real development workflow, the real validation coverage, and the real preservation boundaries so that Phase 6 architectural implementation begins from a known and trustworthy baseline rather than from assumptions.**
### 10.2 Architectural Sources and Obligations

Milestone 0 is derived from the approved Phase 5 Technical Architecture and from the Phase 6 implementation principles established in this document.

Its purpose is not to reinterpret the target architecture.

Its purpose is to establish the verified implementation baseline required before the target architecture is introduced through later milestones.

The primary architectural sources for Milestone 0 are the Phase 5 obligations concerning:

* incremental and reversible migration;
* preservation of validated existing behavior;
* repository-based implementation planning;
* complete and trustworthy automated validation;
* explicit acceptance criteria;
* known rollback boundaries;
* code hygiene;
* documentation alignment;
* production-readiness sequencing;
* final release-readiness auditability.

The milestone must also respect all approved Phase 5 architectural decisions that define behavior to be preserved during later implementation, including:

* validated Resin Calculator algorithms;
* existing Learning and editorial behavior where compatible with the approved architecture;
* existing frontend provider and application structure where no concrete migration requirement justifies replacement;
* existing Project persistence behavior only as a factual current-state baseline, without treating pre-launch `.hfzproject` v1 files as compatibility obligations;
* existing tests that correctly protect approved behavior;
* existing abstractions that remain compatible with the target architecture.

Milestone 0 has the following explicit obligations.

#### 10.2.1 Establish a Known Repository Baseline

The actual repository state must be inspected rather than assumed.

The investigation must identify, where applicable:

* repository structure;
* frontend and backend boundaries;
* authoritative application entry points;
* development configuration;
* relevant environment files and templates;
* test configuration;
* build configuration;
* container configuration;
* current persistence mechanisms;
* current authentication mechanisms;
* current capability mechanisms;
* relevant documentation;
* repository cleanliness.

The investigation must distinguish factual repository reality from architectural target state.

#### 10.2.2 Verify the Real Development Startup Workflow

The actual development startup process must be identified and verified.

This includes, where applicable:

* frontend startup;
* backend startup;
* required environment configuration;
* ports;
* frontend-to-backend communication;
* local authentication behavior;
* administrator access;
* required service dependencies;
* startup failure conditions.

The result must be a reproducible development workflow rather than a collection of remembered or assumed commands.

#### 10.2.3 Verify Authoritative Validation Commands

The authoritative commands for validation must be identified and verified.

This includes, where applicable:

* targeted frontend tests;
* complete frontend test suite;
* targeted backend tests;
* complete backend test suite;
* production frontend build;
* backend validation;
* linting or static checks where they actually exist and are authoritative;
* other repository-specific validation required before task closure.

Commands must be based on the real repository configuration.

Commands must not be invented merely because they are conventional for the technology stack.

#### 10.2.4 Verify Complete Test Discovery and Execution

Milestone 0 must establish that the intended automated test suites are actually discovered and executed.

A successful test command is not sufficient if intended tests are silently omitted.

The investigation must identify:

* frontend test discovery rules;
* backend test discovery rules;
* excluded paths;
* ignored files;
* configuration filters;
* environment-dependent test behavior;
* commands that execute only a subset while appearing complete.

If an intended launch-critical test suite is silently incomplete because of test-runner configuration, this is a Milestone 0 safety-net issue.

#### 10.2.5 Identify Launch-Critical Regression Protection

The investigation must map existing automated protection around launch-critical behavior.

This includes, where applicable:

* Resin Calculator behavior;
* Project creation;
* Project persistence;
* Save;
* Open;
* Update Existing Project;
* dirty-state behavior;
* primary-image handling;
* authentication;
* administrator access;
* Product Capabilities;
* Settings;
* Manual;
* Tutorials;
* Glossary;
* Knowledge Base;
* editorial Draft and Publish behavior;
* media behavior;
* API behavior.

The objective is not to require exhaustive testing of every implementation detail before Milestone 1.

The objective is to identify whether later architectural migration would otherwise modify high-risk behavior without a trustworthy regression signal.

#### 10.2.6 Identify Preservation Boundaries

Milestone 0 must identify existing implementation areas that should be preserved unless a later approved milestone provides a concrete reason to change them.

Preservation candidates may include:

* validated domain algorithms;
* stable user workflows;
* useful abstractions;
* correct automated tests;
* compatible frontend provider structure;
* compatible API behavior;
* compatible editorial behavior;
* safe serialization mechanisms;
* other implementation foundations already aligned with the approved architecture.

Preservation does not mean permanent immunity from change.

It means that later replacement or substantial refactoring requires evidence and justification.

#### 10.2.7 Identify Development-Only Mechanisms Without Prematurely Replacing Them

The investigation must identify mechanisms that are acceptable for current development but are expected to be replaced before production launch.

Examples may include:

* mock authentication;
* development-only administrator access;
* filesystem persistence;
* incomplete production container packaging;
* local-only configuration assumptions;
* temporary infrastructure mechanisms.

Milestone 0 should classify these mechanisms and map them to later milestones.

It must not replace them merely because they are discovered.

#### 10.2.8 Classify Safety-Net Gaps Before Repair

Every discovered validation or baseline gap must be classified before implementation work is approved.

The classification must distinguish between:

* **Milestone 0 blocker** — must be corrected before major architectural migration begins;
* **Milestone 0 improvement** — useful safety-net work that is justified before migration but is not itself evidence of broken product behavior;
* **existing non-blocking defect** — documented but not required to block Milestone 1;
* **later-milestone work** — belongs to an already defined future milestone;
* **architectural escalation** — reveals a contradiction, unsafe assumption, or missing major decision requiring explicit resolution.

Discovery alone does not authorize repair.

Classification precedes implementation.

#### 10.2.9 Preserve Scope Discipline

Milestone 0 must not become:

* a general code review of the entire repository;
* a general refactoring campaign;
* a general test-coverage maximization exercise;
* a production infrastructure implementation milestone;
* a Project v2 implementation milestone;
* a security redesign milestone;
* a cleanup opportunity for unrelated code.

Investigation depth must be sufficient to establish a trustworthy baseline for Phase 6 migration and proportionate to actual risk.

#### 10.2.10 Establish the Evidence Required for Milestone 0 Task Decomposition

The Pre-Milestone Repository Investigation must produce enough factual evidence to determine the smallest safe task sequence for Milestone 0.

The investigation should answer:

* What currently works?
* How is it started?
* How is it validated?
* Are all intended tests actually running?
* Which launch-critical behaviors already have reliable regression protection?
* Which critical migration areas lack sufficient protection?
* Which existing implementation foundations should be preserved?
* Which current mechanisms are development-only and belong to later milestones?
* Are there any Milestone 0 blockers?
* Are there any architectural contradictions or missing decisions?
* What is the smallest justified set of Milestone 0 tasks?

Detailed Milestone 0 tasks must be derived from this evidence.

They must not be invented before the investigation.

#### 10.2.11 Authoritative Milestone 0 Obligation Rule

The authoritative rule is:

**Milestone 0 must establish a verified repository baseline, reproducible development workflow, trustworthy validation commands, complete intended test execution, known regression protection, explicit preservation boundaries, and classified safety-net gaps before major architectural migration begins. It investigates first, classifies second, and implements only the smallest justified baseline repairs required for safe progression.**
### 10.3 Pre-Milestone Repository Investigation

Before detailed Milestone 0 task decomposition begins, the real HFZWood repository must be inspected through a dedicated read-only investigation.

The purpose of this investigation is to establish factual evidence about the current application baseline.

It must not implement Phase 6 architecture, repair discovered defects, refactor code, modify configuration, add tests, update documentation, or otherwise change repository state.

The investigation must answer what currently exists, what currently works, how it is started and validated, what is already protected by automated regression tests, what remains insufficiently protected for safe migration, and which existing foundations should be preserved.

### 10.3.1 Investigation Mode

The investigation is read-only.

During this stage, the implementation tool must not:

* modify source code;
* modify tests;
* modify configuration;
* modify environment files;
* modify documentation;
* install or remove dependencies;
* perform migrations;
* create commits;
* push changes;
* repair defects;
* implement future milestone work.

Commands that inspect repository state or execute existing application, build, or test workflows are permitted when they do not intentionally modify tracked repository content.

If a command may create ordinary untracked caches, build outputs, coverage artifacts, temporary files, or other generated content, the investigation report must identify this and confirm the final repository state.

If a destructive, irreversible, credential-sensitive, production-affecting, or externally state-changing action appears necessary, it must not be performed during the investigation.

### 10.3.2 Repository Structure and Application Boundaries

The investigation must identify:

* repository root structure;
* frontend location;
* backend location;
* documentation location;
* test locations;
* configuration locations;
* container and deployment files;
* application entry points;
* frontend-to-backend communication path;
* major architectural modules relevant to Phase 6;
* current persistence locations and mechanisms.

The report should focus on architecture-relevant structure rather than produce an exhaustive file listing.

### 10.3.3 Development Startup Workflow

The investigation must determine the actual local development startup workflow.

It must identify and, where safely possible, verify:

* required frontend startup command;
* required backend startup command;
* required working directories;
* frontend port;
* backend port;
* proxy or API routing behavior;
* required environment configuration;
* local authentication behavior;
* local administrator-access behavior;
* required local service dependencies;
* known startup ordering requirements;
* known startup failure conditions.

The result must distinguish between:

* commands documented as authoritative;
* commands actually supported by repository configuration;
* commands actually verified during investigation.

### 10.3.4 Automated Test Inventory

The investigation must identify all intended automated test suites.

For each relevant test system, the report must identify:

* test framework;
* configuration file;
* test discovery rules;
* test locations;
* excluded or ignored paths;
* relevant environment requirements;
* authoritative targeted-test command where applicable;
* authoritative complete-suite command;
* actual discovered test count where determinable;
* actual executed test count where determinable;
* pass, fail, skip, or omission status.

Special attention must be given to any configuration that may cause intended tests to be silently excluded.

A command reporting success must not automatically be treated as proof that the complete intended suite executed.

### 10.3.5 Build and Validation Inventory

The investigation must identify the actual repository-supported validation commands, including where applicable:

* frontend production build;
* backend validation;
* linting;
* static analysis;
* type checking;
* schema validation;
* other existing repository-specific checks.

The investigation must not invent conventional commands that the repository does not actually support.

For each command, the report should state whether it was:

* identified only;
* executed and passed;
* executed and failed;
* not executed, with reason.

### 10.3.6 Launch-Critical Regression Protection Map

The investigation must map existing automated regression protection for launch-critical product behavior.

The map must cover, where applicable:

* Resin Calculator algorithms and calculations;
* Project creation;
* Project creation threshold;
* primary-image handling;
* Project persistence;
* Save;
* Open;
* Update Existing Project;
* Recent Projects;
* dirty-state behavior;
* unsaved-changes behavior;
* authentication;
* password recovery;
* administrator access;
* Product Capability resolution and restrictions;
* Settings;
* Manual;
* Tutorials;
* Glossary;
* Knowledge Base;
* editorial Draft and Publish behavior;
* editorial media behavior;
* relevant API behavior.

Each area should be classified as:

* **strongly protected**;
* **partially protected**;
* **weakly protected**;
* **not protected by identified automated tests**;
* **not applicable to the current baseline**.

The classification must be evidence-based and should cite relevant tests, files, or test suites.

The objective is not to demand perfect test coverage.

The objective is to identify whether a later high-risk migration would otherwise proceed without a trustworthy regression signal.

### 10.3.7 Preservation Candidates

The investigation must identify existing implementation foundations that appear compatible with the approved target architecture and should therefore be preserved unless a later milestone establishes concrete cause for change.

Candidates may include:

* validated Resin Calculator algorithms;
* stable Project workflows;
* existing serialization mechanisms;
* frontend provider structure;
* useful API abstractions;
* editorial workflows;
* Draft and Publish behavior;
* locale handling;
* media handling;
* existing automated tests;
* other stable abstractions or implementation boundaries.

The report must distinguish between:

* factual evidence that something currently works;
* architectural compatibility;
* recommendation to preserve.

Working code is not automatically architecturally correct.

Likewise, code scheduled for later migration is not automatically poor code.

### 10.3.8 Development-Only and Later-Milestone Mechanisms

The investigation must identify current mechanisms that appear intentionally temporary, development-only, or already scheduled for replacement in later milestones.

Examples may include:

* mock authentication;
* development-only administrator access;
* filesystem persistence;
* incomplete production container packaging;
* local-only environment assumptions;
* pre-launch `.hfzproject` v1 behavior;
* temporary capability mechanisms;
* future cloud placeholders, if any.

Each identified mechanism should be mapped, where possible, to the later milestone responsible for its approved replacement.

Discovery does not authorize replacement during Milestone 0.

### 10.3.9 Safety-Net Gap Classification

Every meaningful gap discovered during the investigation must be classified as one of:

* **Milestone 0 blocker** — correction is required before major architectural migration begins;
* **Milestone 0 improvement** — justified baseline protection that should be considered before migration;
* **existing non-blocking defect** — real but not required to block Milestone 1;
* **later-milestone work** — belongs to an already defined future milestone;
* **architectural escalation** — reveals a contradiction, unsafe assumption, or missing major decision.

The report must explain the evidence and reasoning behind each classification.

The investigation must not inflate ordinary imperfections into blockers.

A Milestone 0 blocker should normally involve a condition such as:

* inability to reproduce the development environment;
* inability to execute an intended launch-critical test suite;
* silent omission of intended launch-critical tests;
* absence of a trustworthy regression signal around behavior that Milestone 1 will immediately put at material risk;
* unknown repository state that prevents safe migration;
* unresolved contradiction that makes the next milestone unsafe to define.

### 10.3.10 Repository Cleanliness Verification

The investigation must record repository state:

* before investigation commands are executed;
* after investigation is complete.

The report must identify:

* tracked modifications;
* untracked files;
* generated artifacts;
* caches or build outputs created during investigation;
* whether repository state changed;
* whether any change requires cleanup.

Pre-existing user work must not be deleted or altered.

### 10.3.11 Required Investigation Report Structure

The final investigation report must contain:

1. **Executive Summary**
2. **Repository Baseline**
3. **Application Structure and Entry Points**
4. **Verified Development Startup Workflow**
5. **Authentication and Administrator Development Access**
6. **Automated Test Inventory**
7. **Test Discovery and Omission Analysis**
8. **Build and Validation Commands**
9. **Launch-Critical Regression Protection Map**
10. **Preservation Candidates**
11. **Development-Only and Later-Milestone Mechanisms**
12. **Safety-Net Gaps and Classification**
13. **Architectural Contradictions or Missing Decisions**
14. **Repository Cleanliness Before and After Investigation**
15. **Recommended Smallest Safe Milestone 0 Task Set**
16. **Explicit Confirmation That No Implementation Changes Were Made**

The recommendation for Milestone 0 tasks must be evidence-based.

It must not include work merely because it would improve general code quality.

### 10.3.12 Investigation Completion Rule

The Pre-Milestone Repository Investigation is complete only when sufficient evidence exists to answer:

* What is the actual current repository baseline?
* How is the application actually started?
* How is the application actually validated?
* Are all intended launch-critical tests actually discovered and executed?
* Which launch-critical behaviors already have trustworthy regression protection?
* Which migration-sensitive behaviors lack sufficient protection?
* Which existing implementation foundations should be preserved?
* Which current mechanisms belong to later milestones?
* Are there any genuine Milestone 0 blockers?
* Are there any architectural contradictions or missing major decisions?
* What is the smallest justified Milestone 0 task sequence?

The authoritative rule is:

**Milestone 0 task decomposition begins only after a read-only repository investigation establishes sufficient factual evidence. Investigation discovers and classifies; it does not silently repair, refactor, or implement.**
### 10.4 Investigation Findings and Approved Milestone 0 Task Sequence

The read-only Pre-Milestone Repository Investigation required by Section 10.3 has been completed.

The investigation confirmed that HFZWood has a substantial and functional implementation baseline.

Verified results include:

* the complete frontend automated test suite executes successfully;
* 234 frontend tests pass;
* the complete backend automated test suite executes successfully when invoked correctly;
* 115 backend tests pass;
* the frontend production build passes;
* the backend starts successfully;
* the backend health endpoint returns HTTP 200;
* no new contradiction with the approved Phase 5 Technical Architecture was identified;
* no missing major product or architectural decision blocks Milestone 0 or Milestone 1 planning;
* the approved Phase 6 milestone order remains valid.

The investigation also confirmed that several existing foundations should be preserved unless a later milestone establishes concrete cause for change.

Preservation candidates include:

* the existing Project file I/O layer as a migration foundation;
* the Resin Calculator snapshot and restore mechanism;
* validated backend Resin Calculator algorithms;
* the editorial router, service, repository, and schema patterns;
* the Draft, Publish, and snapshot editorial model;
* the Product Capability catalog and resolver;
* repository abstractions for Preferences and Entitlements;
* the frontend provider hierarchy;
* route-guard patterns;
* relative API URL and Vite proxy conventions;
* existing automated tests.

These preservation recommendations do not prevent later approved migration.

They establish that replacement or substantial refactoring requires a concrete architectural, correctness, security, data-integrity, testability, or maintainability reason.

#### 10.4.1 Confirmed Milestone 0 Blocker

The investigation identified one genuine Milestone 0 blocker.

The repository root command:

`.\test.cmd`

currently executes:

* all 234 frontend tests;
* only 34 of the intended 115 backend tests.

The command explicitly invokes only:

`backend/test_app.py`

and silently omits 81 backend tests covering areas including:

* editorial administration;
* Manual public and administrative APIs;
* Glossary administration;
* Knowledge Base administration;
* Draft and Published visibility;
* Preferences API behavior;
* Product Capability resolution;
* Product Capability API behavior;
* administrator authorization.

All 115 backend tests pass when the complete backend suite is invoked correctly.

The blocker is therefore not failing backend behavior.

The blocker is a false-complete validation workflow that may report success while omitting intended launch-critical regression tests.

This gap must be corrected before Milestone 1 begins.

#### 10.4.2 Confirmed Non-Blocking and Later-Milestone Findings

The investigation identified additional gaps and transitional mechanisms.

They do not belong to Milestone 0 unless explicitly included in the approved task sequence below.

Later-milestone responsibilities include:

* `.hfzproject` v2 and Project creation threshold behavior — Milestone 1;
* primary-image integrity and immutability — Milestone 2;
* production Cognito authentication and password recovery — Milestone 3;
* Product Capability enforcement — Milestone 5;
* Local Workspace completion — Milestone 6;
* device-local Settings authority — Milestone 7;
* production editorial and application persistence — Milestone 9;
* production container packaging — Milestone 10;
* cloud-ready foundations — Milestone 11.

The following are not Milestone 0 blockers:

* absence of Project creation-threshold tests before that behavior is implemented;
* absence of Product Capability enforcement tests before enforcement is implemented;
* incomplete production Docker packaging;
* current `.hfzproject` v1 semantics;
* primary-image replacement behavior;
* absence of a CI pipeline;
* absence of general lint or coverage configuration;
* development-only mock authentication;
* development-only filesystem persistence.

Milestone 0 must not absorb this future work.

#### 10.4.3 Repository-State Constraint

The investigation began with pre-existing tracked and untracked repository changes.

These changes were not created by the investigation.

They include existing documentation work, development configuration, and other user-managed files.

Milestone 0 implementation must therefore preserve commit discipline and must not accidentally include unrelated pre-existing work in a task commit.

Before every Milestone 0 task commit:

* the intended task diff must be reviewed explicitly;
* unrelated tracked or untracked work must not be deleted, reverted, or committed accidentally;
* repository cleanliness must be interpreted relative to the known pre-existing baseline;
* task-scoped files must be identified precisely.

#### 10.4.4 Approved Milestone 0 Task Sequence

Based on the investigation evidence, the approved Milestone 0 implementation sequence is:

##### Task M0.1 — Complete Backend Test Execution in Unified Validation

Primary objective:

Correct the root unified validation workflow so that `.\test.cmd` executes the complete intended backend test suite together with the complete frontend test suite.

Required outcome:

* all 115 backend tests are discovered and executed;
* all 234 frontend tests are discovered and executed;
* the unified command executes 349 tests in total under the current baseline;
* the command fails if any required frontend or backend test fails;
* no backend test area is silently omitted;
* no unrelated validation framework, CI system, linting system, or coverage system is introduced.

This task is the only confirmed blocker before Milestone 1.

##### Task M0.2 — Authoritative Validation Workflow Documentation

Primary objective:

Document the verified authoritative validation commands after Task M0.1 is complete.

The documentation must identify, where applicable:

* the unified complete validation command;
* the complete backend test command;
* the complete frontend test command;
* the frontend production build command;
* the distinction between targeted validation and complete task-closure validation.

The documentation must describe commands actually supported and verified by the repository.

It must not invent unsupported conventional tooling.

##### Task M0.3 — Development Environment Baseline Documentation

Primary objective:

Document the verified local development environment contract required for reproducible Phase 6 work.

The documentation must include, where applicable:

* the authoritative project-root startup command;
* frontend and backend ports;
* frontend-to-backend proxy behavior;
* startup ordering;
* backend health verification;
* required environment-variable names without secret values;
* local mock-authentication behavior;
* local administrator-access behavior;
* known development startup failure conditions;
* the rule that pre-existing user work must not be overwritten or cleaned automatically.

This task documents the verified baseline.

It must not implement production authentication, infrastructure, or later-milestone migration.

#### 10.4.5 Task Dependencies

The approved dependency order is:

`M0.1 → M0.2 → M0.3`

Task M0.2 depends on M0.1 because the authoritative unified validation workflow must be corrected before it is documented.

Task M0.3 may be technically independent from M0.1, but it follows M0.2 to preserve a simple, controlled, one-task-at-a-time Milestone 0 sequence.

#### 10.4.6 Excluded Milestone 0 Work

The following work is explicitly excluded from the approved Milestone 0 task sequence:

* `.hfzproject` v2 implementation;
* Project identity or ownership changes;
* primary-image architecture changes;
* production Cognito implementation;
* Product Capability enforcement;
* Local Workspace redesign;
* Settings migration;
* backend modularization;
* production persistence migration;
* Docker packaging repair;
* cloud functionality;
* CI introduction;
* linting-system introduction;
* coverage-maximization work;
* general code cleanup;
* unrelated documentation consolidation.

#### 10.4.7 Milestone 0 Planning Rule

The authoritative rule is:

**Milestone 0 contains only the smallest evidence-based work required to establish a trustworthy implementation and validation baseline. The confirmed false-complete test workflow is corrected first, the authoritative validation workflow is documented second, and the verified development environment baseline is documented third. No later-milestone architecture is implemented during Milestone 0.**
### 10.5 Task M0.1 — Complete Backend Test Execution in Unified Validation

**Status: Complete.**

#### 10.5.1 Objective

Correct the root unified validation workflow so that `.\test.cmd` executes the complete intended backend automated test suite together with the complete frontend automated test suite.

The task addressed the only confirmed Milestone 0 blocker identified by the Pre-Milestone Repository Investigation: the previous unified validation command executed all frontend tests but only a subset of the intended backend tests.

#### 10.5.2 Pre-Implementation Finding

Before Task M0.1, the root command:

`.\test.cmd`

executed:

* all 234 frontend tests;
* only 34 of the intended 115 backend tests.

The backend invocation targeted only:

`backend/test_app.py`

and therefore silently omitted 81 backend tests covering areas including editorial administration, Manual, Glossary, Knowledge Base, Preferences, Product Capabilities, and administrator authorization.

The complete backend suite itself was healthy: all 115 backend tests passed when invoked correctly.

The defect was therefore a false-complete validation workflow rather than failing application behavior.

#### 10.5.3 Implemented Change

The implementation was intentionally limited to one line in:

`test.cmd`

The previous backend invocation:

`call uv run --project "%ROOT%\backend" pytest "%ROOT%\backend\test_app.py" -v`

was replaced with:

`call uv run --project "%ROOT%\backend" pytest "%ROOT%\backend" -v`

No other line was modified.

No application source code, test code, test configuration, dependency configuration, documentation, environment file, CI configuration, linting configuration, coverage configuration, or static-analysis configuration was changed.

#### 10.5.4 Verification Results

Unified validation:

`.\test.cmd`

Result:

* 115 backend tests collected and passed;
* 234 frontend tests passed across 49 test files;
* 349 tests passed in total as the current observational baseline;
* exit code: `0`;
* final output: `RESULT: All tests passed.`

Complete backend collection verification:

`uv run --project backend pytest --collect-only -q`

Result:

* 115 tests collected;
* exit code: `0`.

Complete backend execution:

`uv run --project backend pytest -q`

Result:

* 115 tests passed;
* exit code: `0`.

Complete frontend execution:

`npm test --prefix frontend`

Result:

* 49 test files passed;
* 234 tests passed;
* exit code: `0`.

#### 10.5.5 Acceptance Criteria

Task M0.1 satisfied all approved acceptance criteria:

* the unified validation command executes the complete intended backend suite;
* the unified validation command executes the complete intended frontend suite;
* all current backend and frontend tests pass;
* no intended backend test area is silently omitted;
* no unrelated validation tooling was introduced;
* no application source or test behavior was changed;
* no test counts were hard-coded into the validation script;
* the implementation diff was limited to the approved one-line change in `test.cmd`.

#### 10.5.6 Product Owner Manual QA

Product Owner manual QA was not required.

The task changed only the internal unified validation script and did not change user-visible application behavior.

Correctness was established through automated execution results and task-scoped diff verification.

#### 10.5.7 Warnings

The following non-failing warnings were observed during verification:

* `tool.uv.dev-dependencies` deprecation warning;
* missing `requires-python` value, defaulting to `>=3.13`;
* Starlette deprecation warning concerning `httpx`;
* npm warning concerning unknown environment configuration `devdir`.

These warnings were not introduced by Task M0.1.

They do not block Milestone 0 and were intentionally not repaired within this task because doing so would have expanded the approved scope.

#### 10.5.8 Commit and Push

Task M0.1 was committed in isolation.

Commit:

`020fa95 — Phase 6 M0.1: run complete backend test suite`

Commit contents:

* `test.cmd` only;
* one insertion;
* one deletion.

The commit was pushed successfully to:

`main`

No force-push was used.

No unrelated file was staged or committed.

#### 10.5.9 Repository State

After commit and push:

* `test.cmd` was no longer modified;
* no uncommitted Task M0.1 changes remained;
* pre-existing unrelated tracked and untracked work remained untouched;
* no new task-scoped uncommitted file existed.

The repository was clean relative to Task M0.1.

#### 10.5.10 Closure

Task M0.1 is officially complete.

The authoritative unified validation workflow now executes the complete intended backend and frontend automated test suites.

Milestone 0 may proceed to:

**Task M0.2 — Authoritative Validation Workflow Documentation**
### 10.6 Task M0.2 — Authoritative Validation Workflow Documentation

**Status: Pre-Implementation Analysis complete; implementation approved.**

#### 10.6.1 Objective

Establish a clear, durable, and authoritative developer-facing validation workflow for HFZWood Phase 6.

The task documents repository-supported commands that have been verified against the real implementation baseline and avoids creating competing or redundant sources of truth.

#### 10.6.2 Pre-Implementation Finding

The Pre-Implementation Analysis confirmed that the repository has a working unified validation script and repository-supported commands for:

* complete unified backend and frontend validation;
* complete backend test execution;
* complete frontend test execution;
* frontend production build;
* targeted backend and frontend test execution where appropriate.

However, no tracked developer-facing document currently describes the authoritative validation workflow.

The root `README.md` already serves as the primary tracked developer entry point for setup, local development, and deployment-related instructions, but it currently contains no dedicated automated validation section.

The Phase 6 implementation plan defines implementation governance, verification principles, task execution workflow, and task history, but it should not become a duplicate operational developer manual.

#### 10.6.3 Approved Documentation Authority

The approved documentation authority is:

* `README.md` — authoritative operational source for current developer validation commands;
* `documentation/phase-6-implementation-plan.md` — authoritative Phase 6 governance, planning, task history, and completion record.

Task M0.2 must not create a new dedicated validation document.

Task M0.2 must not duplicate a complete operational command reference in both documents.

The Phase 6 implementation plan records the task and references the operational authority in `README.md`.

#### 10.6.4 Approved Validation Commands

The following repository-supported commands are approved for documentation from the repository root under the current Windows development workflow.

Complete unified validation:

`.\test.cmd`

Complete backend test suite:

`uv run --project backend pytest -q`

Complete frontend test suite:

`npm test --prefix frontend`

Frontend production build:

`npm run build --prefix frontend`

Repository-supported targeted validation examples may also be documented where useful.

Examples include:

Backend calculator tests:

`uv run --project backend pytest backend/test_app.py -q`

Backend API test module:

`uv run --project backend pytest backend/tests/content/test_preferences_api.py -q`

Frontend single test file:

`npm test --prefix frontend -- src/workspace/projectFileSave.test.js`

No unsupported linting, coverage, static-analysis, or CI command may be invented or documented as part of this task.

#### 10.6.5 Validation Levels

The operational documentation should distinguish between:

* **Targeted validation** — used during implementation to validate a specific changed area;
* **Task-scoped validation** — selected according to task risk and acceptance criteria;
* **Complete unified validation** — executes the complete intended backend and frontend automated test suites through `.\test.cmd`;
* **Production build validation** — verifies that the frontend production bundle can be created successfully;
* **Milestone and final release validation** — governed by the broader requirements of this Phase 6 implementation plan.

The operational documentation must remain concise and must not duplicate the complete governance rules already defined in Sections 8 and 9.

#### 10.6.6 Observational Test Baseline

At the completion of Task M0.1, the verified observational baseline is:

* 115 backend tests;
* 234 frontend tests across 49 test files;
* 349 automated tests in total through the unified validation workflow.

These counts are observational.

They are not permanent contracts and must not be hard-coded into validation scripts or treated as fixed future expectations.

The counts are expected to change as legitimate tests are added, removed, reorganized, or replaced.

#### 10.6.7 Historical Documentation

Historical phase documents may contain older test counts or references to previous validation behavior.

Task M0.2 must not rewrite historical implementation records merely because later work changed the current repository baseline.

In particular:

* historical Phase 1, Phase 2, and Phase 3 implementation records remain historical;
* the Phase 5 Technical Architecture may contain pre-M0.1 observations about incomplete unified backend test execution;
* these historical or architecture-time observations do not become competing operational sources of truth.

The current operational validation authority is the tracked root `README.md`.

#### 10.6.8 Exact Implementation Scope

Task M0.2 implementation must:

* modify `README.md`;
* add a concise authoritative validation section;
* document the complete unified validation command;
* document the complete backend test command;
* document the complete frontend test command;
* document the frontend production build command;
* distinguish targeted validation from complete unified validation and production build validation;
* identify current test counts only as an observational baseline;
* avoid unsupported tooling;
* avoid unrelated documentation cleanup.

The Phase 6 implementation plan records this task locally as part of the continuing Phase 6 governance history.

No new documentation file is required.

#### 10.6.9 Verification Plan

After implementation, the following verification is required:

Complete unified validation:

`.\test.cmd`

Expected result:

* exit code `0`;
* complete backend and frontend suites execute successfully.

Frontend production build:

`npm run build --prefix frontend`

Expected result:

* exit code `0`;
* production build completes successfully.

Separate complete backend and frontend commands do not need to be rerun if `.\test.cmd` passes, because the unified command already executes both complete suites.

#### 10.6.10 Product Owner Manual QA

Product Owner manual QA is not required because Task M0.2 changes documentation only and does not change user-visible application behavior.

A Product Owner documentation review may be performed to confirm that the resulting README validation section is understandable and consistent with the approved task objective.

Such review is documentation review, not product manual QA.

#### 10.6.11 Repository and Commit Isolation

The repository contains substantial pre-existing tracked and untracked work.

In particular, `documentation/phase-6-implementation-plan.md` is currently untracked and contains substantial Phase 6 planning and implementation history created before Task M0.2.

The Task M0.2 implementation commit must therefore contain only:

`README.md`

The Phase 6 implementation plan must not be introduced into Git history as part of the M0.2 commit because doing so would mix the full pre-existing Phase 6 planning baseline with a narrowly scoped validation-documentation task.

The Phase 6 implementation plan and other approved untracked architecture or planning documents require a separate, explicitly controlled documentation-baseline commit.

No unrelated tracked or untracked file may enter the M0.2 commit.

#### 10.6.12 Rollback Boundary

The Task M0.2 implementation rollback boundary is the isolated README validation-section commit.

No external or irreversible state is involved.

The local Phase 6 task record remains part of the continuing implementation-plan history and will enter Git through a separate approved documentation-baseline workflow.

#### 10.6.13 Acceptance Criteria

Task M0.2 is complete only when:

* `README.md` documents `.\test.cmd` as the complete unified validation command;
* the complete backend test command is documented accurately;
* the complete frontend test command is documented accurately;
* the frontend production build command is documented accurately;
* targeted validation is distinguished from complete unified validation;
* production build validation is distinguished from automated test execution;
* current test counts are identified only as an observational baseline;
* no unsupported tooling is invented;
* no competing operational source of truth is created;
* no unrelated documentation is modified;
* required verification passes;
* the implementation commit contains only `README.md`;
* no unrelated pre-existing repository work enters the commit.

#### 10.6.14 Approved Implementation State

The Pre-Implementation Analysis has been reviewed and approved.

No architectural contradiction, missing major decision, or scope concern blocks implementation.

Task M0.2 may proceed to implementation within the approved scope.
#### 10.6.15 Implementation Result

Task M0.2 was implemented within the approved scope.

The root:

`README.md`

was updated with a new:

`## Automated validation`

section.

The section was inserted after the local-development instructions and before the Docker deployment section.

The implementation added 59 lines and modified no existing content outside the new validation section.

The new README validation section establishes the tracked developer-facing operational authority for the current HFZWood validation workflow.

It documents:

* complete unified automated validation;
* complete backend test execution;
* complete frontend test execution;
* frontend production build validation;
* targeted backend and frontend validation examples;
* the distinction between targeted validation, complete unified validation, and production build validation;
* the current observational automated-test baseline.

No new documentation file was created.

No application source code, tests, test configuration, dependency configuration, environment file, validation script, development script, deployment documentation, CI configuration, linting configuration, coverage configuration, static-analysis configuration, or later-milestone implementation was modified.

#### 10.6.16 Implemented Validation Workflow

The following commands are now documented in the root `README.md` as the current operational validation workflow.

Complete unified validation:

`.\test.cmd`

Complete backend test suite:

`uv run --project backend pytest -q`

Complete frontend test suite:

`npm test --prefix frontend`

Frontend production build:

`npm run build --prefix frontend`

The README also documents repository-supported targeted-validation examples for:

* backend calculator tests;
* an individual backend API test module;
* an individual frontend test file.

The documentation states that targeted validation provides faster feedback during implementation but does not replace complete unified validation when broader regression verification is required for task closure, milestone closure, or higher-risk changes.

Production build validation is explicitly distinguished from automated test execution.

#### 10.6.17 Observational Baseline Documentation

The README records the current verified observational baseline established through Task M0.1:

* 115 backend tests;
* 234 frontend tests across 49 test files;
* 349 automated tests in total through the unified validation workflow.

These counts are explicitly identified as observational only.

They are not permanent contracts and are expected to change as legitimate tests are added, removed, reorganized, or replaced.

No test count was hard-coded into any script or configuration.

#### 10.6.18 Verification Results

The implemented documentation was verified against the actual repository behavior.

Complete unified validation:

`.\test.cmd`

Result:

* exit code: `0`;
* 115 backend tests collected and passed;
* 234 frontend tests passed across 49 test files;
* final output: `RESULT: All tests passed.`

Frontend production build:

`npm run build --prefix frontend`

Result:

* exit code: `0`;
* 2778 modules transformed;
* production build completed successfully.

The complete backend and frontend suites were not rerun separately because the unified validation command already executed both complete suites successfully.

#### 10.6.19 Warnings

The following non-failing warnings or advisories were observed during verification:

* `tool.uv.dev-dependencies` deprecation warning;
* missing `requires-python` value, defaulting to `>=3.13`;
* Starlette deprecation warning concerning `httpx`;
* npm warning concerning unknown environment configuration `devdir`;
* Vite production-build chunk-size advisory.

These warnings were not introduced by Task M0.2.

They do not block Task M0.2 and are not addressed within this task because doing so would expand the approved scope.

#### 10.6.20 Acceptance Criteria Status

Task M0.2 satisfies its approved implementation and verification criteria:

* `README.md` documents `.\test.cmd` as the complete unified validation command;
* the complete backend test command is documented accurately;
* the complete frontend test command is documented accurately;
* the frontend production build command is documented accurately;
* targeted validation is distinguished from complete unified validation;
* production build validation is distinguished from automated test execution;
* current test counts are identified only as an observational baseline;
* no unsupported tooling was invented;
* no competing operational source of truth was introduced in another tracked document;
* no unrelated documentation was modified by the implementation;
* complete unified validation passed;
* frontend production build validation passed;
* the implementation changed only `README.md`.

#### 10.6.21 Product Owner Manual QA

Product Owner manual QA is not required.

Task M0.2 changes documentation only and does not modify user-visible application behavior.

Correctness was established through:

* repository-specific Pre-Implementation Analysis;
* review and approval of the documentation authority;
* task-scoped implementation;
* direct verification of every required documented command;
* diff-scope verification.

A Product Owner documentation review remains possible but is not a blocking product QA requirement.

#### 10.6.22 Repository and Rollback State

The Task M0.2 implementation currently modifies only:

`README.md`

The change remains uncommitted pending formal closure authorization.

The rollback boundary is the isolated README validation-section change and its future dedicated Task M0.2 commit.

No external or irreversible state is involved.

Pre-existing tracked and untracked repository work remains untouched.

The Phase 6 implementation plan itself remains outside the M0.2 implementation commit and will require a separate approved documentation-baseline workflow.

#### 10.6.23 Closure State

Implementation and verification are complete.

Before Task M0.2 may be formally closed:

* the `README.md` change must be committed in an isolated Task M0.2 commit;
* the commit must contain no unrelated file;
* the commit must be pushed successfully;
* post-commit repository state must confirm that no uncommitted Task M0.2 implementation change remains;
* unrelated pre-existing tracked and untracked work must remain untouched.

Task M0.2 remains open until commit and push are complete.
#### 10.6.24 Commit and Push

Task M0.2 was committed in isolation.

Commit:

`c67cc25 — Phase 6 M0.2: document authoritative validation workflow`

Commit contents:

* `README.md` only;
* 59 insertions;
* 0 deletions.

The committed change contains only the approved:

`## Automated validation`

section.

No unrelated README change was included.

No other file entered the commit.

The commit was pushed successfully to:

`main`

No force-push was used.

#### 10.6.25 Post-Commit Repository State

After commit and push:

* `README.md` was no longer modified;
* no uncommitted Task M0.2 implementation change remained;
* the Task M0.2 commit existed at repository `HEAD`;
* pre-existing unrelated tracked and untracked work remained outside the commit;
* no unrelated file was staged, committed, reverted, deleted, or modified during Task M0.2 closure.

The repository remained globally non-clean because of known pre-existing work.

This does not affect Task M0.2 closure.

For Task M0.2, repository cleanliness means:

* no uncommitted M0.2 implementation change remains;
* no unrelated work entered the M0.2 commit;
* known pre-existing work remains untouched.

These conditions were satisfied.

#### 10.6.26 Closure

Task M0.2 is officially complete.

The root `README.md` is now the authoritative tracked developer-facing operational source for the current HFZWood validation workflow.

The documented workflow includes:

* complete unified automated validation;
* complete backend test execution;
* complete frontend test execution;
* frontend production build validation;
* repository-supported targeted validation examples;
* practical validation-level distinctions;
* the current observational automated-test baseline.

The implementation was verified successfully.

The isolated Task M0.2 commit was created and pushed.

No unrelated file entered the commit.

The Phase 6 implementation plan remained outside the M0.2 commit and continues to require a separate approved documentation-baseline workflow before it enters Git history.

Milestone 0 may now proceed to:

**Task M0.3 — Development Environment Baseline Documentation**
### 10.7 Task M0.3 — Development Environment Baseline Documentation

**Status: Pre-Implementation Analysis complete; implementation approved.**

#### 10.7.1 Objective

Establish a verified, concise, and reproducible operational baseline for the current local HFZWood development environment.

The task documents the actual repository-supported development workflow without implementing production authentication, infrastructure, persistence, container changes, deployment changes, cloud functionality, or later-milestone architecture.

#### 10.7.2 Pre-Implementation Finding

The Pre-Implementation Analysis confirmed that the root `README.md` already serves as the primary tracked developer-facing operational entry point.

Its existing `## Run locally` section documents the main startup command and manual backend and frontend alternatives, but it does not yet provide a complete development-environment baseline.

The current documentation is incomplete regarding:

* startup orchestration;
* backend and frontend ports;
* startup ordering;
* frontend-to-backend proxy behavior;
* backend health verification;
* relevant development environment-variable names;
* local mock-authentication behavior;
* local administrator-access behavior;
* known startup failure conditions;
* repository-safety expectations for automated implementation work.

No other tracked document provides a complete current operational development baseline.

Historical architecture and implementation documents may contain contextual development details but must not become competing operational sources of truth.

#### 10.7.3 Approved Documentation Authority

The approved documentation authority is:

* `README.md` — authoritative tracked developer-facing operational source for local startup, development-environment baseline, and current validation commands;
* `documentation/phase-6-implementation-plan.md` — authoritative Phase 6 governance, planning, task history, verification record, and completion record.

Task M0.3 must not create a new development documentation file.

Historical phase documents must not be rewritten merely to reflect the current development baseline.

#### 10.7.4 Verified Startup Workflow

The authoritative project-root startup command is:

`.\dev.cmd`

The committed startup script currently:

* resolves the project root;
* establishes relevant frontend Cognito configuration variables used by the current development script;
* installs frontend dependencies;
* runs a frontend production build;
* starts the backend in a separate persistent terminal window;
* starts the frontend Vite development server in another persistent terminal window.

The backend command used by the startup script is:

`uv run --project backend uvicorn app:app --app-dir backend --host 0.0.0.0 --port 5000 --reload`

The frontend command is:

`npm --prefix frontend run dev`

Equivalent manual startup from the repository root may use:

Backend:

`uv run --project backend uvicorn app:app --app-dir backend --host 0.0.0.0 --port 5000 --reload`

Frontend:

`npm run dev --prefix frontend`

The current development ports are:

* backend: `5000`;
* frontend: `5173` under the current Vite default configuration.

The backend should be available before API-dependent frontend functionality is used.

#### 10.7.5 Frontend-to-Backend Communication

The frontend uses relative API paths under the current development architecture.

The Vite development proxy currently routes:

* `/api`;
* `/health`;
* `/calculate`;

to:

`http://127.0.0.1:5000`

Task M0.3 documents this verified current proxy scope.

It does not modify proxy configuration.

It does not diagnose, repair, or make operational claims about routes outside the verified proxy scope.

If the frontend development server is running while the backend is unavailable, requests to proxied backend paths may fail with a development proxy connection error.

This is a development-environment failure condition, not a production API contract.

#### 10.7.6 Backend Health Verification

The current backend health endpoint is:

`GET /health`

Expected successful result:

* HTTP status `200`;
* response body: `{"status":"ok"}`.

The README should document a concise Windows-appropriate verification method, such as:

`Invoke-WebRequest -Uri 'http://127.0.0.1:5000/health' -UseBasicParsing`

A browser request to:

`http://127.0.0.1:5000/health`

may also be used for simple manual verification.

No new health-check mechanism is implemented by M0.3.

#### 10.7.7 Environment Variables

Task M0.3 may document relevant environment-variable names and safe development semantics.

Relevant variables include, where appropriate:

* `AUTH_MODE`;
* `VITE_AUTH_MODE`;
* `VITE_MOCK_ADMIN`;
* `CAPABILITY_DEV_ACCESS_TIER`;
* `VITE_COGNITO_USER_POOL_ID`;
* `VITE_COGNITO_CLIENT_ID`;
* `VITE_COGNITO_DOMAIN`;
* `VITE_COGNITO_REDIRECT_URI`;
* `COGNITO_USER_POOL_ID`;
* `COGNITO_REGION`.

The README must distinguish current mock-development behavior from future production Cognito behavior.

It must not expose:

* AWS access keys;
* passwords;
* client secrets;
* JWTs;
* session tokens;
* private credentials;
* any other secret value.

Public configuration identifiers or variable names must not be presented as production security guarantees.

Task M0.3 documents configuration names and safe semantics only.

It does not redesign authentication or implement production authentication.

#### 10.7.8 Local Mock Authentication

The current local development authentication model is mock-first and environment-dependent.

Under the default mock-development path:

* the developer enters the authenticated experience through the existing login flow;
* authentication is not automatic;
* the login form requires submitted credentials, while the mock adapter does not perform production credential validation;
* mock authentication state is stored in browser session storage;
* the backend `AUTH_MODE` defaults to mock behavior unless configured otherwise;
* the frontend remains on the mock path unless configured for Cognito behavior.

The current mock-authentication mechanism is development-only.

Production Cognito authentication belongs to the later approved authentication milestone and is not implemented or redesigned during M0.3.

#### 10.7.9 Local Administrator Access

Local administrator access is development-only.

Under the current local workflow:

* `VITE_MOCK_ADMIN=true` allows the mock authentication adapter to assign the `administrator` role after login or session restoration;
* administrator pages are available under `/admin` and related administrator routes;
* the normal workspace navigation does not expose an administrator sidebar entry;
* administrator pages may be reached directly through the appropriate local URL;
* the frontend administrator route guard requires an authenticated user with the `administrator` role;
* backend administrator API routes independently use administrator authorization checks.

The README must not describe this mechanism as production-grade administrator security.

Production administrator identity and authorization belong to the approved later authentication and authorization architecture.

#### 10.7.10 Known Development Startup Failure Conditions

The README should document only a concise set of verified or repository-supported development failure conditions.

These include:

* backend unavailable while the frontend makes requests to proxied backend paths;
* backend port `5000` already occupied;
* frontend port `5173` already occupied;
* required runtime or dependency tooling unavailable;
* incomplete dependency setup;
* frontend environment changes not taking effect until the Vite development server is restarted;
* local administrator access unavailable when the required mock-admin configuration is absent.

Task M0.3 must not become a general troubleshooting encyclopedia.

#### 10.7.11 Pre-Existing User Work Safety Rule

The README should include a concise repository-safety rule for Phase 6 implementation work.

The operational rule is:

**Automated implementation work must not delete, revert, clean, stage, or commit unrelated tracked or untracked user work without explicit approval.**

This rule belongs in the local development baseline because the repository may contain legitimate pre-existing work outside the active task scope.

The Phase 6 implementation plan remains the full governance authority for task isolation and repository discipline.

The README must not become a general Git tutorial.

#### 10.7.12 Relationship to Task M0.2

The README structure should remain logically separated:

* `## Run locally` — startup and development-environment baseline;
* `## Automated validation` — automated tests, targeted validation, complete unified validation, and production build validation;
* deployment documentation — production deployment concerns.

Task M0.3 must not modify the approved `## Automated validation` section created by Task M0.2.

No duplication of the M0.2 validation workflow is required.

#### 10.7.13 Committed and Working-Tree `dev.cmd` Divergence

The Pre-Implementation Analysis identified a pre-existing difference between:

* the committed `dev.cmd` at repository `HEAD`;
* the current locally modified working-tree version.

The working-tree version contains an uncommitted backend health-wait mechanism before frontend startup.

This difference existed before M0.3.

Task M0.3 must not modify, revert, stage, commit, or otherwise alter `dev.cmd`.

The operational documentation must describe the committed and repository-supported baseline unless an explicitly approved later task changes that baseline.

Uncommitted local behavior must not silently become authoritative documentation.

#### 10.7.14 Proxy-Scope Finding

The Pre-Implementation Analysis identified that the current Vite development proxy explicitly covers:

* `/api`;
* `/health`;
* `/calculate`.

Other backend calculator routes exist outside this explicitly verified proxy scope.

Task M0.3 does not diagnose, repair, or modify this condition.

The README must document the verified current proxy behavior without asserting unverified product failure for routes outside that scope.

Any future correction, if required, must be evidence-based and handled under an appropriately scoped task.

#### 10.7.15 Exact Implementation Scope

Task M0.3 implementation must:

* modify `README.md` only;
* expand the existing `## Run locally` section rather than create a competing startup section;
* preserve the approved M0.2 `## Automated validation` section unchanged;
* document the authoritative project-root startup command;
* document manual backend and frontend startup commands;
* document backend and frontend ports;
* document startup ordering;
* document the verified Vite proxy scope;
* document backend health verification;
* document relevant environment-variable names and safe semantics without exposing secrets;
* document local mock-authentication behavior;
* document local administrator-access behavior as development-only;
* document concise known startup failure conditions;
* document the pre-existing user work safety rule;
* avoid unrelated documentation cleanup.

No code, script, configuration, environment file, application behavior, authentication mechanism, proxy configuration, deployment configuration, or later-milestone architecture may be modified.

No new documentation file is required.

#### 10.7.16 Verification Plan

Task M0.3 requires developer-workflow verification proportionate to a documentation-only task.

Required verification should establish:

* the documented startup commands match actual repository-supported commands;
* the backend starts successfully;
* `GET /health` returns HTTP `200`;
* the frontend development server becomes reachable;
* the documented ports match actual behavior;
* the documented proxy behavior matches current Vite configuration.

A full `.\test.cmd` rerun is not required unless implementation unexpectedly modifies code, tests, scripts, or configuration.

A production build rerun is not required because Task M0.3 changes documentation only and the build workflow was already verified during M0.2.

Verification must clearly state whether observed startup behavior came from:

* committed repository behavior;
* the pre-existing locally modified `dev.cmd`;
* manual equivalent commands.

This distinction must not be hidden.

#### 10.7.17 Product Owner Manual QA

Product Owner manual QA is not required because Task M0.3 changes documentation only and does not change user-visible application behavior.

Developer-workflow verification is required.

A Product Owner documentation review may be performed but is not a blocking product QA requirement.

#### 10.7.18 Repository and Commit Isolation

The repository contains substantial pre-existing tracked and untracked work.

Task M0.3 implementation must modify only:

`README.md`

The future M0.3 implementation commit must contain only:

`README.md`

The following must remain outside the M0.3 commit:

* the pre-existing modified `dev.cmd`;
* the untracked Phase 6 implementation plan;
* other untracked architecture and planning documents;
* `frontend/.env.local`;
* all unrelated tracked or untracked work.

The Phase 6 implementation plan continues to require a separate approved documentation-baseline workflow.

#### 10.7.19 Rollback Boundary

The Task M0.3 rollback boundary is the isolated README development-baseline commit.

No external or irreversible state is involved.

#### 10.7.20 Acceptance Criteria

Task M0.3 is complete only when:

* `README.md` accurately documents `.\dev.cmd` as the authoritative project-root startup command;
* manual backend and frontend startup commands are documented accurately;
* backend port `5000` and frontend port `5173` are documented accurately;
* separate backend and frontend process behavior is documented accurately;
* startup ordering is documented appropriately;
* verified Vite proxy behavior is documented accurately;
* backend health verification is documented accurately;
* relevant environment-variable names are documented safely;
* no secret values are exposed;
* local mock-authentication behavior is documented accurately;
* local administrator access is documented accurately as development-only;
* concise known startup failure conditions are documented;
* the pre-existing user work safety rule is documented;
* no production security guarantee is overstated;
* no later-milestone implementation is introduced;
* no competing operational documentation source is created;
* the M0.2 `## Automated validation` section remains unchanged;
* no unrelated file is modified by M0.3;
* required developer-workflow verification passes;
* the future M0.3 commit contains only `README.md`.

#### 10.7.21 Approved Implementation State

The Pre-Implementation Analysis has been reviewed and approved with one explicit scope refinement:

**The README will document the verified current Vite proxy scope, but it will not list unproxied calculator routes as product defects or claim that specific calculator modes fail without direct verification.**

No architectural contradiction, missing major decision, or documentation-authority ambiguity blocks implementation.

Task M0.3 may proceed to implementation within the approved scope.
#### 10.7.22 Implementation Result

Task M0.3 was implemented within the approved scope.

The root:

`README.md`

was updated by expanding the existing:

`## Run locally`

section into the authoritative tracked developer-facing operational baseline for the current HFZWood local development environment.

No competing startup section was created.

The approved:

`## Automated validation`

section introduced by Task M0.2 remained unchanged.

The implementation modified no application source code, backend source code, frontend source code, test, script, proxy configuration, authentication configuration, dependency configuration, environment file, deployment configuration, or later-milestone implementation.

No new file was created.

#### 10.7.23 Documented Startup Workflow

The README now documents the authoritative project-root startup command:

`.\dev.cmd`

The committed startup-script behavior is described as:

* resolving the project root;
* installing frontend dependencies;
* running the frontend production build;
* starting the backend in a separate terminal window;
* starting the Vite frontend development server in another terminal window.

The README also documents manual project-root startup alternatives.

Backend:

`uv run --project backend uvicorn app:app --app-dir backend --host 0.0.0.0 --port 5000 --reload`

Frontend:

`npm run dev --prefix frontend`

The manual commands are documented as running in separate terminals.

The pre-existing uncommitted working-tree `dev.cmd` health-wait behavior was not documented as authoritative.

#### 10.7.24 Documented Ports and Frontend URL

The documented local development ports are:

* backend: `5000`;
* frontend: `5173`.

The verified local frontend URL is:

`http://localhost:5173`

Developer-workflow verification confirmed:

* `http://localhost:5173/` returned HTTP `200`;
* `http://127.0.0.1:5173/` was not reachable in the verification environment.

Therefore, the README does not present `http://127.0.0.1:5173` as the verified or authoritative frontend address.

The final documented frontend wording is:

`- **Frontend:** port \`5173\` under the current Vite development configuration; verified local URL: \`http://localhost:5173\``

The backend and proxy addresses remain correctly based on:

`http://127.0.0.1:5000`

No Vite host-binding investigation or configuration change was introduced.

#### 10.7.25 Documented Frontend-to-Backend Communication

The README documents that the frontend uses relative API paths during local development.

The current Vite proxy routes:

* `/api`;
* `/health`;
* `/calculate`;

to:

`http://127.0.0.1:5000`

This documentation was verified directly against:

`frontend/vite.config.js`

The README also explains that when the backend is unavailable, requests to proxied backend paths may fail with a development proxy connection error.

No proxy configuration was modified.

No unproxied calculator route was documented as a product defect.

No claim was made that a specific calculator mode fails without direct verification.

#### 10.7.26 Backend Health Verification Result

The backend was started using the documented manual backend startup command.

Health verification used:

`Invoke-WebRequest -Uri 'http://127.0.0.1:5000/health' -UseBasicParsing`

Observed result:

* HTTP status: `200`;
* response body: `{"status":"ok"}`.

Backend health verification passed.

No new health-check mechanism was introduced.

#### 10.7.27 Frontend Reachability Verification Result

The frontend was started using:

`npm run dev --prefix frontend`

The Vite development server reported:

`http://localhost:5173/`

and became ready in approximately 893 milliseconds during the observed verification run.

The verified frontend URL:

`http://localhost:5173/`

returned HTTP `200`.

Frontend reachability verification passed.

Temporary backend and frontend processes started specifically for verification were stopped afterward.

No pre-existing user process was intentionally terminated.

#### 10.7.28 Documented Environment Variables

The README documents the following relevant development environment-variable names:

* `AUTH_MODE`;
* `VITE_AUTH_MODE`;
* `VITE_MOCK_ADMIN`;
* `CAPABILITY_DEV_ACCESS_TIER`;
* `VITE_COGNITO_USER_POOL_ID`;
* `VITE_COGNITO_CLIENT_ID`;
* `VITE_COGNITO_DOMAIN`;
* `VITE_COGNITO_REDIRECT_URI`;
* `COGNITO_USER_POOL_ID`;
* `COGNITO_REGION`.

Only safe development semantics are documented.

The README also explains that:

* `frontend/.env.local` may be used for local frontend-only configuration;
* the file is untracked in the current repository state;
* the Vite development server must be restarted after relevant environment changes.

No password, client secret, AWS access key, JWT, session token, private credential, or secret value was exposed.

No value from `frontend/.env.local` was copied into the README.

Cognito-related configuration names are not presented as evidence that production authentication is complete.

#### 10.7.29 Documented Mock Authentication and Administrator Access

The README documents the current local development authentication model as mock-first.

It explains that:

* the developer enters through the normal login flow;
* authentication is not automatic;
* the mock adapter does not provide production credential validation;
* mock session state is browser-session based;
* backend `AUTH_MODE` defaults to mock behavior unless configured otherwise;
* production Cognito integration belongs to a later milestone.

The README also documents local administrator access as development-only.

It explains that:

* `VITE_MOCK_ADMIN=true` gives the mock user the `administrator` role after login or session restoration;
* administrator pages are available under `/admin` and related routes;
* the normal workspace navigation does not expose an administrator sidebar entry;
* direct local access may be used;
* frontend route guards require the administrator role;
* backend administrator API routes independently enforce administrator authorization.

This mechanism is explicitly not presented as production administrator security.

#### 10.7.30 Documented Startup Failure Conditions and Repository Safety

The README documents a concise set of current development failure conditions:

* backend unavailable while the frontend calls proxied backend paths;
* port `5000` or `5173` already in use;
* required runtime tooling or dependencies unavailable;
* incomplete setup;
* relevant Vite environment changes requiring frontend restart;
* missing local mock-administrator configuration resulting in non-administrator behavior.

The README also establishes the following operational repository-safety rule:

**Automated implementation work must not delete, revert, clean, stage, or commit unrelated tracked or untracked user work without explicit approval.**

The README does not attempt to become a general Git or troubleshooting manual.

#### 10.7.31 Verification and Diff Scope

Developer-workflow verification passed.

Verified results:

* backend startup command executed successfully;
* `GET /health` returned HTTP `200` with `{"status":"ok"}`;
* frontend startup command executed successfully;
* `http://localhost:5173/` returned HTTP `200`;
* documented Vite proxy paths and target matched `frontend/vite.config.js`.

A full `.\test.cmd` regression run was not required because Task M0.3 changed documentation only.

A production build rerun was not required because Task M0.3 changed documentation only and the production-build workflow had already been verified during Task M0.2.

Diff-scope verification confirmed:

* the complete M0.3 implementation diff is confined to the `## Run locally` section of `README.md`;
* the approved M0.2 `## Automated validation` section remains unchanged;
* no unrelated file was modified by the M0.3 implementation;
* no secret was exposed.

#### 10.7.32 Warnings and Unexpected Findings

The following non-blocking observations were recorded:

* the frontend was reachable through `http://localhost:5173/` but not through `http://127.0.0.1:5173/` in the verification environment;
* the pre-existing locally modified `dev.cmd` still contains an uncommitted backend health-wait behavior and remained untouched;
* an existing npm warning concerning unknown environment configuration `devdir` was observed during frontend startup.

None of these findings was introduced by Task M0.3.

No architectural contradiction or implementation blocker was identified.

#### 10.7.33 Acceptance Criteria Status

Task M0.3 satisfies its approved implementation and verification criteria:

* the authoritative project-root startup command is documented accurately;
* manual backend and frontend startup commands are documented accurately;
* backend port `5000` and frontend port `5173` are documented accurately;
* the verified frontend URL is documented as `http://localhost:5173`;
* startup ordering is documented appropriately;
* verified Vite proxy behavior is documented accurately;
* backend health verification is documented accurately;
* relevant environment-variable names are documented safely;
* no secret values are exposed;
* local mock-authentication behavior is documented accurately;
* local administrator access is documented accurately as development-only;
* concise known startup failure conditions are documented;
* the pre-existing user work safety rule is documented;
* no production security guarantee is overstated;
* no later-milestone implementation was introduced;
* no competing operational documentation source was created;
* the M0.2 `## Automated validation` section remains unchanged;
* no unrelated file was modified by M0.3;
* required developer-workflow verification passed.

#### 10.7.34 Product Owner Manual QA

Product Owner manual QA is not required.

Task M0.3 changes documentation only and does not modify user-visible application behavior.

Developer-workflow verification was required and passed.

A Product Owner documentation review remains possible but is not a blocking product QA requirement.

#### 10.7.35 Repository and Rollback State

The Task M0.3 implementation currently modifies only:

`README.md`

The change remains uncommitted pending formal closure authorization.

The rollback boundary is the isolated README development-baseline change and its future dedicated Task M0.3 commit.

No external or irreversible state is involved.

Pre-existing tracked and untracked repository work remains untouched.

The Phase 6 implementation plan itself remains outside the M0.3 implementation commit and continues to require a separate approved documentation-baseline workflow.

#### 10.7.36 Closure State

Implementation and verification are complete.

Before Task M0.3 may be formally closed:

* the `README.md` change must be committed in an isolated Task M0.3 commit;
* the commit must contain no unrelated file;
* the commit must be pushed successfully;
* post-commit repository state must confirm that no uncommitted Task M0.3 implementation change remains;
* unrelated pre-existing tracked and untracked work must remain untouched.

Task M0.3 remains open until commit and push are complete.
#### 10.7.37 Commit and Push

Task M0.3 was committed in isolation.

Commit:

`92ea47f — Phase 6 M0.3: document development environment baseline`

Commit contents:

* `README.md` only;
* 113 insertions;
* 7 deletions.

The committed change contains only the approved expansion of:

`## Run locally`

into the authoritative tracked developer-facing operational baseline for the current HFZWood local development environment.

The approved Task M0.2:

`## Automated validation`

section remained unchanged.

No unrelated README change was included.

No other file entered the commit.

The commit was pushed successfully to:

`main`

No force-push was used.

#### 10.7.38 Post-Commit Repository State

After commit and push:

* `README.md` was no longer modified;
* no uncommitted Task M0.3 implementation change remained;
* the Task M0.3 commit existed at repository `HEAD`;
* the commit contained only `README.md`;
* the pre-existing modified `dev.cmd` remained outside the commit;
* the Phase 6 implementation plan remained outside the commit;
* pre-existing unrelated tracked and untracked work remained untouched;
* no unrelated file was staged, committed, reverted, deleted, or modified during Task M0.3 closure.

The repository remained globally non-clean because of known pre-existing work.

This does not affect Task M0.3 closure.

For Task M0.3, repository cleanliness means:

* no uncommitted M0.3 implementation change remains;
* no unrelated work entered the M0.3 commit;
* no secret value entered the commit;
* known pre-existing work remains untouched.

These conditions were satisfied.

#### 10.7.39 Secrets and Repository-Safety Confirmation

The Task M0.3 commit documents only environment-variable names and safe development semantics.

It contains no:

* password;
* client secret;
* AWS access key;
* JWT;
* session token;
* private credential;
* local secret value.

The following pre-existing work remained outside the commit:

* modified `dev.cmd`, including its uncommitted backend health-wait behavior;
* deleted `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* untracked architecture and planning documents;
* untracked `frontend/.env.local`;
* all other unrelated tracked or untracked work.

No unrelated file was committed.

#### 10.7.40 Closure

Task M0.3 is officially complete.

The root `README.md` is now the authoritative tracked developer-facing operational source for:

* local startup;
* manual backend and frontend startup;
* development ports;
* verified frontend URL;
* frontend-to-backend proxy behavior;
* backend health verification;
* development environment-variable names and safe semantics;
* local mock-authentication behavior;
* local administrator-access behavior;
* known startup failure conditions;
* repository-safety expectations;
* automated validation commands.

The implementation was verified successfully.

The isolated Task M0.3 commit was created and pushed.

No unrelated file entered the commit.

No secret value entered the commit.

Milestone 0 has now completed all approved implementation tasks:

* Task M0.1 — Complete Backend Test Execution in Unified Validation;
* Task M0.2 — Authoritative Validation Workflow Documentation;
* Task M0.3 — Development Environment Baseline Documentation.

Before Milestone 0 may be formally closed, the milestone completion criteria must be reviewed and the remaining documentation-baseline issue for the currently untracked architecture and planning documents must be explicitly resolved.
### 10.8 Milestone 0 Pre-Closure Review

**Status: Technical implementation complete; formal milestone closure pending documentation baseline.**

#### 10.8.1 Review Purpose

The Milestone 0 Pre-Closure Review was performed after completion of:

* Task M0.1 — Complete Backend Test Execution in Unified Validation;
* Task M0.2 — Authoritative Validation Workflow Documentation;
* Task M0.3 — Development Environment Baseline Documentation.

The review evaluated:

* whether the approved Milestone 0 objective was satisfied;
* whether all approved Milestone 0 obligations were addressed;
* whether the three implementation tasks were properly closed;
* whether the current validation and development baselines remain trustworthy;
* whether any known warning or repository condition blocks closure;
* whether authoritative Phase 4–6 documentation is safely preserved in Git history.

#### 10.8.2 Milestone 0 Technical Completion

The review confirmed that all approved Milestone 0 implementation tasks are complete.

Task M0.1:

* corrected the false-complete unified validation workflow;
* established complete backend and frontend automated test execution;
* was committed and pushed as:
  `020fa95 — Phase 6 M0.1: run complete backend test suite`.

Task M0.2:

* established `README.md` as the authoritative tracked operational source for validation commands;
* was committed and pushed as:
  `c67cc25 — Phase 6 M0.2: document authoritative validation workflow`.

Task M0.3:

* established `README.md` as the authoritative tracked operational source for the local development environment baseline;
* was committed and pushed as:
  `92ea47f — Phase 6 M0.3: document development environment baseline`.

No uncommitted M0.1, M0.2, or M0.3 implementation changes remain.

#### 10.8.3 Milestone 0 Objective Review

The approved Milestone 0 objective was to establish a verified, reproducible, and trustworthy implementation baseline before major architectural migration begins.

The review confirmed that the following are satisfied:

* complete intended backend and frontend test execution;
* authoritative unified validation command;
* documented complete backend and frontend validation commands;
* documented production frontend build command;
* documented targeted-validation workflow;
* documented local startup workflow;
* documented backend and frontend ports;
* documented backend health verification;
* documented frontend-to-backend proxy behavior;
* documented development environment-variable names and safe semantics;
* documented mock-authentication behavior;
* documented local administrator-access behavior;
* documented repository-safety expectations;
* identified preservation candidates;
* classified safety-net gaps;
* preserved later-milestone scope boundaries.

No later-milestone architecture was implemented during Milestone 0.

#### 10.8.4 Current Validation Baseline

The current verified observational baseline remains:

* 115 backend tests;
* 234 frontend tests across 49 test files;
* 349 automated tests in total through `.\test.cmd`.

These counts remain observational and are not permanent contracts.

A fresh unified validation run is recommended as part of final Milestone 0 closure evidence, but no contradictory repository evidence currently requires it as a technical blocker.

#### 10.8.5 Development Workflow Baseline

The tracked `README.md` accurately describes the committed repository-supported development baseline.

The committed `dev.cmd`:

* installs frontend dependencies;
* runs the frontend production build;
* starts the backend;
* starts the frontend in a separate terminal.

A pre-existing working-tree modification adds a backend health-wait mechanism before frontend startup.

That working-tree change:

* existed before Milestone 0 implementation;
* was not modified by M0.1–M0.3;
* remains outside the Milestone 0 task commits;
* does not block Milestone 0 technical closure.

The authoritative operational documentation correctly reflects committed behavior rather than uncommitted local behavior.

#### 10.8.6 Known Non-Blocking Findings

The following findings do not block Milestone 0 closure:

* `tool.uv.dev-dependencies` deprecation warning;
* missing `requires-python` declaration;
* Starlette `httpx` deprecation warning;
* npm `devdir` warning;
* Vite production-build chunk-size advisory;
* frontend reachability through `localhost` rather than `127.0.0.1` in the verification environment;
* pre-existing uncommitted `dev.cmd` health-wait behavior;
* current Vite proxy scope covering `/api`, `/health`, and `/calculate`.

These findings may become later-task candidates when justified.

They must not be repaired merely to complete Milestone 0.

#### 10.8.7 Documentation Baseline Closure Gate

The review identified one remaining Milestone 0 closure gate.

The following authoritative architecture and planning documents remain untracked:

* `documentation/phase-4-concept-exploration-and-product-vision.md`;
* `documentation/phase-4-product-architecture.md`;
* `documentation/product-architecture-decisions.md`;
* `documentation/phase-5-technical-architecture.md`;
* `documentation/phase-6-implementation-plan.md`.

The first four documents establish the approved Product and Technical Architecture baseline that Phase 6 implements.

The Phase 6 implementation plan contains:

* Phase 6 governance;
* milestone sequencing;
* task workflow;
* Milestone 0 investigation;
* completed M0.1–M0.3 implementation history;
* Milestone 0 pre-closure evidence.

Formal Milestone 0 closure must not occur while these authoritative documents exist only outside Git history.

#### 10.8.8 Approved Documentation Baseline Strategy

The approved documentation-baseline strategy uses separate commits.

Documentation Baseline A — Phase 4 and Phase 5 Architecture:

* `documentation/phase-4-concept-exploration-and-product-vision.md`;
* `documentation/phase-4-product-architecture.md`;
* `documentation/product-architecture-decisions.md`;
* `documentation/phase-5-technical-architecture.md`.

Documentation Baseline B — Phase 6 Implementation Plan:

* `documentation/phase-6-implementation-plan.md` only.

The Phase 6 implementation plan must be committed separately because it is an active living implementation-history document and requires an independent rollback and history boundary.

The following must remain outside these baseline commits:

* `documentation/external-architecture-review.md`;
* `documentation/Arthur-project-handover.md`;
* deletion of `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* modified `dev.cmd`;
* `frontend/.env.local`;
* all unrelated tracked or untracked work.

#### 10.8.9 Handover Document State

The repository currently contains:

* a tracked deletion of:
  `documentation/chatgpt-project-handover.md`;
* an untracked file:
  `documentation/Arthur-project-handover.md`.

The files appear to serve the same operational handover role, but the repository state does not prove whether this is an intentional rename or a separate replacement.

This state must not be resolved automatically during the authoritative architecture baseline commits.

The handover rename or replacement requires a separate explicit decision and commit.

#### 10.8.10 Milestone 0 Closure Decision

The Milestone 0 Pre-Closure Review decision is:

**READY TO CLOSE AFTER DOCUMENTATION BASELINE**

All technical, validation, workflow, and operational documentation obligations approved for M0.1–M0.3 are satisfied.

Formal closure remains pending only:

* Documentation Baseline A;
* Documentation Baseline B;
* final post-baseline repository verification;
* final Milestone 0 closure record.

Milestone 1 must not begin before these closure actions are complete.
### 10.9 Documentation Baseline A — Phase 4 and Phase 5 Architecture

**Status: Pre-Commit Analysis complete; commit approved.**

#### 10.9.1 Purpose

Documentation Baseline A establishes the authoritative Phase 4 and Phase 5 architecture baseline in Git history before formal Milestone 0 closure and before Milestone 1 begins.

The baseline preserves the approved progression from product vision to Product Architecture, product decisions, and Technical Architecture.

#### 10.9.2 Approved Baseline Files

Documentation Baseline A contains exactly:

* `documentation/phase-4-concept-exploration-and-product-vision.md`;
* `documentation/phase-4-product-architecture.md`;
* `documentation/product-architecture-decisions.md`;
* `documentation/phase-5-technical-architecture.md`.

No other file may enter the Documentation Baseline A commit.

#### 10.9.3 File Status and Completeness

The Pre-Commit Analysis confirmed that all four approved files:

* exist at the expected repository paths;
* are currently untracked;
* have not previously entered Git history;
* appear complete rather than truncated;
* have no similarly named duplicate under `documentation/`;
* are ready to enter Git as the approved architecture baseline.

Observed approximate sizes:

* Phase 4 Concept Exploration and Product Vision: 363 lines, approximately 15 KB;
* Phase 4 Product Architecture: 674 lines, approximately 37 KB;
* Product Architecture Decisions: 495 lines, approximately 17 KB;
* Phase 5 Technical Architecture: 5,939 lines, approximately 243 KB.

The large size of the Phase 5 Technical Architecture document does not prevent it from forming part of the approved architecture baseline.

#### 10.9.4 Document Purpose and Authority

The four documents have distinct but complementary roles.

`phase-4-concept-exploration-and-product-vision.md`:

* records product vision and Phase 4 concept exploration;
* is foundational and supporting rather than an operational implementation specification;
* preserves the product philosophy and principles from which later architecture was derived.

`phase-4-product-architecture.md`:

* is the official Product Architecture;
* is authoritative for approved product behavior and structural product decisions.

`product-architecture-decisions.md`:

* is the approved product decision log;
* preserves explicit product constraints, decisions, and rationale;
* serves as authoritative supporting material for Product Architecture.

`phase-5-technical-architecture.md`:

* is the approved Technical Architecture;
* is the primary technical source for Phase 6 implementation;
* defines how approved product architecture is translated into technical architecture and implementation obligations.

Together, the four files form the coherent progression:

**Product Vision → Product Architecture → Product Decisions → Technical Architecture**

#### 10.9.5 Internal Consistency Review

The Pre-Commit Analysis found no material contradiction among the four documents.

The documents are materially consistent regarding:

* Local-First behavior;
* initial Local-Only launch sequencing;
* project identity;
* project creation threshold;
* immutable primary image;
* authenticated ownership;
* `.hfzproject` v2;
* Local Workspace;
* future Cloud Workspace;
* Product Capabilities;
* Settings;
* Learning and editorial behavior;
* launch scope;
* the role of Phase 6.

The broader cloud-enabled vision in the concept document does not contradict the approved Local-Only launch sequence.

It describes the broader product direction, while the Technical Architecture establishes implementation sequencing.

The `Trusted Devices` topic remains appropriately classified as requiring further exploration and does not block the baseline.

#### 10.9.6 Cross-Reference Review

The Pre-Commit Analysis found no broken or misleading cross-reference requiring correction before commit.

Confirmed relationships include:

* `product-architecture-decisions.md` references the actual `phase-4-product-architecture.md` filename;
* Phase 4 Product Architecture conceptually references the Concept Exploration and future Technical Architecture;
* Phase 5 Technical Architecture correctly treats Phase 4 Product Architecture as its approved product source;
* the Product Architecture Decisions document is meaningfully connected to the Product Architecture baseline.

No cross-reference repair is required before staging.

#### 10.9.7 Secret and Inappropriate Content Review

The four candidate files were reviewed for inappropriate repository content.

No actual:

* password;
* token;
* AWS credential;
* API key;
* client secret;
* private environment value;
* local absolute path;
* personal private data;
* accidental pasted log;
* transient ChatGPT session instruction

was identified.

Architectural mentions of passwords, credentials, tokens, or secrets are policy and design rules rather than exposed secret values.

No secret-exposure blocker exists.

#### 10.9.8 Completeness and Baseline Quality

All four documents are ready to enter Git history.

No baseline-blocking issue was identified involving:

* incomplete sections;
* truncated content;
* accidental duplicate sections;
* broken Markdown structure;
* missing document identity;
* material authority ambiguity;
* false implementation-completion claims.

One minor non-blocking ordering observation exists:

* in `product-architecture-decisions.md`, PA-016 appears before the PA-013 section header.

This does not affect architecture integrity, authority, or commit readiness.

No editorial correction is required merely to permit Documentation Baseline A.

#### 10.9.9 Commit Coherence Decision

The approved decision is:

**Commit all four Documentation Baseline A files together in one isolated documentation commit.**

This is justified because:

* the four documents form one coherent architecture progression;
* the Phase 4 and Phase 5 relationship is direct;
* one commit establishes a clear historical architecture-baseline boundary;
* one revert can remove the complete baseline without affecting implementation commits;
* the grouping was already approved during Milestone 0 Pre-Closure Review.

No approved candidate should be excluded.

No additional Phase 4 or Phase 5 source is required for this baseline.

#### 10.9.10 Approved Commit Message

The approved commit message is:

`Add authoritative Phase 4 and Phase 5 architecture baseline`

This identifies the change as an architecture-documentation baseline rather than implementation work.

#### 10.9.11 Staging and Repository Safety

The future commit must use explicit-path staging only.

Exactly four files may be staged:

* `documentation/phase-4-concept-exploration-and-product-vision.md`;
* `documentation/phase-4-product-architecture.md`;
* `documentation/product-architecture-decisions.md`;
* `documentation/phase-5-technical-architecture.md`.

The following must remain outside Documentation Baseline A:

* `documentation/phase-6-implementation-plan.md`;
* `documentation/external-architecture-review.md`;
* `documentation/Arthur-project-handover.md`;
* deletion of `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* modified `dev.cmd`;
* `frontend/.env.local`;
* all other unrelated tracked or untracked work.

No wildcard staging is permitted.

#### 10.9.12 Rollback Boundary

The Documentation Baseline A rollback boundary is one isolated documentation commit containing exactly the four approved Phase 4 and Phase 5 files.

Reverting that commit must remove the complete authoritative Phase 4–5 architecture baseline from Git history without affecting:

* M0.1;
* M0.2;
* M0.3;
* Documentation Baseline B;
* unrelated repository work.

This is an acceptable and intentional rollback unit.

#### 10.9.13 Relationship to Documentation Baseline B

The following file must remain outside Documentation Baseline A:

`documentation/phase-6-implementation-plan.md`

It will be handled separately as:

**Documentation Baseline B — Phase 6 Implementation Plan**

The separation preserves the distinction between:

* Baseline A — what the approved Product and Technical Architecture requires;
* Baseline B — how Phase 6 governs, sequences, verifies, and records implementation.

No Phase 6 task-history file may enter Documentation Baseline A.

#### 10.9.14 Pre-Commit Decision

The final Pre-Commit Analysis decision is:

**READY FOR DOCUMENTATION BASELINE A COMMIT**

No blocker was identified involving:

* secret exposure;
* incomplete authoritative content;
* material contradiction;
* broken cross-reference;
* ambiguous authority;
* missing required Phase 4–5 source;
* staging isolation.

Documentation Baseline A may proceed to explicit-path staging, staged-diff verification, isolated commit, push, and post-commit verification.
#### 10.9.15 Commit and Push

Documentation Baseline A was committed in isolation.

Commit:

`3dc77d3 — Add authoritative Phase 4 and Phase 5 architecture baseline`

Commit contents:

* `documentation/phase-4-concept-exploration-and-product-vision.md`;
* `documentation/phase-4-product-architecture.md`;
* `documentation/product-architecture-decisions.md`;
* `documentation/phase-5-technical-architecture.md`.

Commit summary:

* 4 files changed;
* 7,469 insertions;
* all four files entered Git history as new tracked files.

No other file entered the commit.

The commit was pushed successfully to:

`main`

No force-push was used.

#### 10.9.16 Post-Commit Repository State

After commit and push:

* the four Documentation Baseline A files were no longer untracked;
* the commit existed at repository `HEAD`;
* `documentation/phase-6-implementation-plan.md` remained untracked;
* Documentation Baseline B had not begun;
* Milestone 1 had not begun;
* all unrelated pre-existing tracked and untracked work remained untouched.

The repository remained globally non-clean because of known pre-existing work.

This does not affect Documentation Baseline A closure.

#### 10.9.17 Unrelated Repository Work Preservation

The following remained outside Documentation Baseline A:

* modified `dev.cmd`;
* deleted `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* untracked `documentation/Arthur-project-handover.md`;
* untracked `documentation/external-architecture-review.md`;
* untracked `documentation/phase-6-implementation-plan.md`;
* untracked `frontend/.env.local`.

None of these files was staged, committed, reverted, deleted, restored, or modified during Documentation Baseline A closure.

#### 10.9.18 Closure

Documentation Baseline A is officially complete.

The authoritative Phase 4–5 architecture baseline is now preserved in Git history.

The committed baseline establishes:

* product vision and concept exploration;
* Product Architecture;
* Product Architecture Decisions;
* Technical Architecture.

The isolated commit was created and pushed successfully.

No unrelated file entered the commit.

Milestone 0 may now proceed to:

**Documentation Baseline B — Phase 6 Implementation Plan**
### 10.10 Documentation Baseline B — Phase 6 Implementation Plan

**Status: Pre-Commit Analysis complete; commit approved.**

#### 10.10.1 Purpose

Documentation Baseline B establishes:

`documentation/phase-6-implementation-plan.md`

as the authoritative tracked Phase 6 governance, milestone-sequence, task-workflow, implementation-history, and release-readiness document.

The baseline must enter Git history before formal Milestone 0 closure and before Milestone 1 begins.

#### 10.10.2 File State and Completeness

The Pre-Commit Analysis confirmed that:

`documentation/phase-6-implementation-plan.md`

* exists at the expected repository path;
* is currently untracked;
* has never previously existed in Git history;
* is approximately 5,011 lines and 194 KB;
* has no similarly named duplicate under `documentation/`;
* appears complete rather than truncated;
* ends with a coherent transition from Documentation Baseline A to Documentation Baseline B.

Document size alone is not a blocker.

No split is required before commit.

The single-file structure remains consistent with the approved single-source-of-truth strategy for Phase 6 governance and implementation history.

#### 10.10.3 Document Purpose and Authority

The document clearly functions as:

* the authoritative Phase 6 implementation plan;
* the authoritative milestone sequence from Milestone 0 through Milestone 14;
* the task-governance document;
* the task-execution workflow;
* the implementation-history record;
* the release-readiness framework.

It must enter Git history before Milestone 1 begins.

#### 10.10.4 Structural Integrity

The Pre-Commit Analysis confirmed the presence and structural integrity of:

* the document title;
* Sections 1–9 governing Phase 6 principles, scope, milestones, completion criteria, and workflow;
* Section 10 governing Milestone 0;
* the complete Task M0.1 record;
* the complete Task M0.2 record;
* the complete Task M0.3 record;
* the Milestone 0 Pre-Closure Review;
* the complete Documentation Baseline A record;
* the transition to Documentation Baseline B.

No material issue was identified involving:

* duplicate top-level section numbers;
* malformed document structure;
* abrupt truncation;
* broken document title;
* materially inconsistent status labels.

Earlier subsections contain historical point-in-time states that are superseded by later closure sections.

These historical states are intentional append-only governance history and must not be removed merely because later sections record a newer state.

#### 10.10.5 Alignment with the Phase 4–5 Architecture Baseline

The Phase 6 implementation plan correctly treats the approved upstream architecture sources as authoritative.

Documentation Baseline A is now preserved in Git through:

`3dc77d3 — Add authoritative Phase 4 and Phase 5 architecture baseline`

The tracked upstream baseline contains:

* `documentation/phase-4-concept-exploration-and-product-vision.md`;
* `documentation/phase-4-product-architecture.md`;
* `documentation/product-architecture-decisions.md`;
* `documentation/phase-5-technical-architecture.md`.

No material contradiction was identified between the Phase 6 implementation plan and the tracked Phase 4–5 baseline regarding:

* Local-First behavior;
* Local-Only launch sequencing;
* project identity;
* ownership;
* Product Capabilities;
* `.hfzproject` v2;
* Local Workspace;
* future cloud behavior;
* incremental implementation sequencing.

#### 10.10.6 Milestone Sequence Consistency

The complete milestone sequence from Milestone 0 through Milestone 14 remains coherent.

The plan preserves:

* the Local-Only launch target;
* the distinction between cloud-ready and cloud-enabled architecture;
* progressive milestone planning;
* the approved primary dependency chain;
* Phase 5 sequencing;
* the requirement that Milestone 1 must not begin before Milestone 0 closure.

No premature Milestone 1 implementation claim exists.

#### 10.10.7 Milestone 0 History Accuracy

The Pre-Commit Analysis verified the Milestone 0 history against Git and repository evidence.

Task M0.1:

* corrected the false-complete backend validation behavior;
* is recorded accurately;
* commit:
  `020fa95 — Phase 6 M0.1: run complete backend test suite`.

Task M0.2:

* established authoritative automated-validation documentation in `README.md`;
* is recorded accurately;
* commit:
  `c67cc25 — Phase 6 M0.2: document authoritative validation workflow`.

Task M0.3:

* established the authoritative local development environment baseline in `README.md`;
* is recorded accurately;
* verified frontend URL:
  `http://localhost:5173`;
* commit:
  `92ea47f — Phase 6 M0.3: document development environment baseline`.

Documentation Baseline A:

* contains exactly four approved Phase 4–5 architecture documents;
* is recorded accurately;
* commit:
  `3dc77d3 — Add authoritative Phase 4 and Phase 5 architecture baseline`.

No factual mismatch was identified involving:

* commit hashes;
* commit scopes;
* file counts;
* implementation outcomes;
* verified test counts;
* documented frontend URL;
* closure status.

#### 10.10.8 Current Status Accuracy

The latest authoritative state recorded by the Phase 6 implementation plan is:

* Task M0.1 — complete;
* Task M0.2 — complete;
* Task M0.3 — complete;
* Documentation Baseline A — complete;
* Documentation Baseline B — pending commit;
* Milestone 0 — not yet formally closed;
* Milestone 1 — not started.

Earlier historical sections may record prior interim states such as:

* a task remaining open before commit;
* an authoritative document remaining untracked before its baseline commit.

These are accurate point-in-time historical records and are superseded by later closure sections.

They do not constitute stale or contradictory current status.

#### 10.10.9 Completion and Closure Logic

The current Milestone 0 closure path is coherent.

Remaining steps are:

1. commit and push Documentation Baseline B;
2. record the Documentation Baseline B commit and closure;
3. perform final post-baseline repository verification;
4. perform final Milestone 0 closure review;
5. record formal Milestone 0 closure;
6. only then begin Milestone 1 planning.

No section incorrectly declares Milestone 0 formally closed.

#### 10.10.10 Secret and Inappropriate Content Review

The Phase 6 implementation plan was reviewed for inappropriate repository content.

No actual:

* password;
* token;
* API key;
* AWS credential;
* client secret;
* private environment value;
* local absolute path;
* personal private data;
* accidental pasted log;
* hidden operational secret

was identified.

References to secrets, passwords, credentials, tokens, or environment files are architectural, security, workflow, or repository-safety rules rather than exposed secret values.

No secret-exposure blocker exists.

#### 10.10.11 Transient and Conversational Content Review

Because the document was built incrementally, it was specifically reviewed for transient conversational residue.

No material instance was identified involving:

* raw ChatGPT session instructions;
* instructions to copy content into Cursor;
* temporary assistant commentary;
* conversational transitions;
* prompts to say `gata`;
* raw implementation prompts;
* accidental pasted chat residue.

The extensive task-analysis and implementation-history sections are legitimate authoritative governance records produced by the approved Phase 6 workflow.

They are not transient chat residue.

No content removal is required before commit.

#### 10.10.12 Cross-Reference Review

The Pre-Commit Analysis confirmed that:

* referenced Phase 4–5 architecture filenames exist and are tracked;
* the Phase 5 Technical Architecture reference is valid;
* commit hashes `020fa95`, `c67cc25`, `92ea47f`, and `3dc77d3` are accurate;
* `README.md` validation and development-baseline claims match the tracked file;
* `test.cmd` behavior matches the recorded M0.1 result;
* internal section references remain understandable.

No broken or misleading cross-reference requires correction before commit.

#### 10.10.13 Commit Coherence Decision

The approved Documentation Baseline B commit unit is:

`documentation/phase-6-implementation-plan.md`

and no other file.

One isolated commit is the correct governance and rollback boundary.

The document must not be combined with:

* handover documents;
* external review material;
* `implementation-roadmap.md`;
* `dev.cmd`;
* environment files;
* any unrelated tracked or untracked work.

#### 10.10.14 Approved Commit Message

The approved commit message is:

`Add authoritative Phase 6 implementation plan baseline`

This identifies the commit as a governance and documentation baseline rather than application implementation work.

#### 10.10.15 Staging and Repository Safety

The future commit must use explicit-path staging only.

Exactly one file may be staged:

`documentation/phase-6-implementation-plan.md`

The following must remain outside Documentation Baseline B:

* `documentation/external-architecture-review.md`;
* `documentation/Arthur-project-handover.md`;
* deletion of `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* modified `dev.cmd`;
* `frontend/.env.local`;
* all other unrelated tracked or untracked work.

No wildcard staging is permitted.

#### 10.10.16 Rollback Boundary

The Documentation Baseline B rollback boundary is one isolated commit containing only:

`documentation/phase-6-implementation-plan.md`

Reverting that commit must remove the Phase 6 governance and implementation-history baseline from Git without affecting:

* M0.1;
* M0.2;
* M0.3;
* Documentation Baseline A;
* unrelated repository work.

This is the correct rollback and history unit.

#### 10.10.17 Future Update Workflow

After Documentation Baseline B enters Git, the Phase 6 implementation plan must remain tracked and must not again become an untracked governance artifact.

Future updates should follow the approved Section 9 workflow.

Task implementation commits should remain narrow and isolated.

Phase 6 plan updates should record, as appropriate:

* approved task scope;
* pre-implementation analysis;
* implementation result;
* verification evidence;
* commit hash;
* closure status.

Plan updates may be committed through:

* dedicated plan-only commits;
* approved task-closure documentation commits;
* milestone documentation checkpoints.

They should not be mixed automatically into narrow application implementation commits when doing so would weaken rollback isolation.

The exact commit timing may remain proportional to task risk and workflow needs, but authoritative Phase 6 history must not remain only in an uncommitted local file for extended periods.

#### 10.10.18 Pre-Commit Decision

The final Pre-Commit Analysis decision is:

**READY FOR DOCUMENTATION BASELINE B COMMIT**

No blocker was identified involving:

* secret exposure;
* transient chat residue;
* malformed document structure;
* inaccurate task history;
* incorrect commit hashes;
* false Milestone 0 closure status;
* material architectural contradiction;
* broken cross-reference;
* staging isolation.

Documentation Baseline B may proceed to explicit-path staging, staged-diff verification, isolated commit, push, and post-commit verification.
