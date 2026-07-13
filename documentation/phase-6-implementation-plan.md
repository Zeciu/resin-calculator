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
#### 10.10.19 Commit and Push

Documentation Baseline B was committed in isolation.

Commit:

`9a95987 — Add authoritative Phase 6 implementation plan baseline`

Commit contents:

* `documentation/phase-6-implementation-plan.md` only;
* 5,370 insertions;
* one new tracked documentation file.

No other file entered the commit.

The commit was pushed successfully to:

`main`

No force-push was used.

#### 10.10.20 Post-Commit Repository State

After commit and push:

* `documentation/phase-6-implementation-plan.md` became tracked;
* no uncommitted Documentation Baseline B change remained;
* the Documentation Baseline B commit existed at repository `HEAD`;
* Documentation Baseline A files remained tracked and unchanged;
* all unrelated pre-existing tracked and untracked work remained untouched;
* Milestone 1 had not begun.

The repository remained globally non-clean because of known pre-existing work.

This does not affect Documentation Baseline B closure.

For Documentation Baseline B, repository cleanliness means:

* no uncommitted Baseline B change remains;
* no unrelated file entered the commit;
* no secret value entered the commit;
* unrelated pre-existing work remains untouched.

These conditions were satisfied.

#### 10.10.21 Documentation Baseline A Preservation

The following Documentation Baseline A files remained tracked and unchanged:

* `documentation/phase-4-concept-exploration-and-product-vision.md`;
* `documentation/phase-4-product-architecture.md`;
* `documentation/product-architecture-decisions.md`;
* `documentation/phase-5-technical-architecture.md`.

No Documentation Baseline A file was staged, modified, or included in the Documentation Baseline B commit.

#### 10.10.22 Unrelated Repository Work Preservation

The following pre-existing work remained outside Documentation Baseline B:

* modified `dev.cmd`;
* deleted `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* untracked `documentation/Arthur-project-handover.md`;
* untracked `documentation/external-architecture-review.md`;
* untracked `frontend/.env.local`.

None of these files was staged, committed, reverted, restored, deleted, or modified during Documentation Baseline B closure.

#### 10.10.23 Secret-Safety Confirmation

The Documentation Baseline B commit contains no:

* password;
* client secret;
* AWS access key;
* API key;
* JWT;
* session token;
* private credential;
* actual environment secret value.

The committed file contains governance, architecture, task-history, security-policy, and repository-safety documentation only.

#### 10.10.24 Closure

Documentation Baseline B is officially complete.

The authoritative Phase 6 implementation plan is now preserved in Git history.

Commit:

`9a95987 — Add authoritative Phase 6 implementation plan baseline`

The document now serves as the tracked authoritative source for:

* Phase 6 purpose and scope;
* relationship with Phase 5 Technical Architecture;
* implementation principles;
* task decomposition rules;
* milestone sequence;
* release-readiness criteria;
* task execution workflow;
* Milestone 0 investigation;
* M0.1, M0.2, and M0.3 implementation history;
* Milestone 0 Pre-Closure Review;
* Documentation Baseline A;
* Documentation Baseline B.

No unrelated file entered the commit.

No secret value entered the commit.

Milestone 0 has now completed:

* Task M0.1;
* Task M0.2;
* Task M0.3;
* Documentation Baseline A;
* Documentation Baseline B.

Before Milestone 0 may be formally closed, the final post-baseline verification and Milestone 0 Closure Review must be completed.

Milestone 1 must not begin before formal Milestone 0 closure.
### 10.11 Final Milestone 0 Closure Verification and Formal Closure

**Status: Milestone 0 formally closed.**

#### 10.11.1 Purpose

This section records the final post-baseline verification and formal closure of Milestone 0.

The final verification was performed only after completion of:

* Task M0.1 — Complete Backend Test Execution in Unified Validation;
* Task M0.2 — Authoritative Validation Workflow Documentation;
* Task M0.3 — Development Environment Baseline Documentation;
* Documentation Baseline A — Phase 4 and Phase 5 Architecture;
* Documentation Baseline B — Phase 6 Implementation Plan.

The purpose of this verification was to determine whether the repository had reached the verified, reproducible, trustworthy implementation baseline required before Milestone 1 planning and subsequent architectural migration.

#### 10.11.2 Completed Milestone 0 Commits

The final verification confirmed the following five approved commits on `main`:

* `020fa95 — Phase 6 M0.1: run complete backend test suite`;
* `c67cc25 — Phase 6 M0.2: document authoritative validation workflow`;
* `92ea47f — Phase 6 M0.3: document development environment baseline`;
* `3dc77d3 — Add authoritative Phase 4 and Phase 5 architecture baseline`;
* `9a95987 — Add authoritative Phase 6 implementation plan baseline`.

All five commits were pushed successfully.

Each commit preserved its approved isolation boundary.

No unrelated file entered any Milestone 0 implementation or documentation-baseline commit.

#### 10.11.3 Final Unified Validation

A fresh complete unified validation run was performed using:

`.\test.cmd`

Result:

* exit code: `0`;
* backend: 115 tests passed;
* frontend: 234 tests passed across 49 test files;
* total observational automated-test count: 349;
* final result:
  `RESULT: All tests passed.`

The final verification confirmed that:

* the complete backend test suite is executed;
* the complete frontend test suite is executed;
* failure aggregation remains intact;
* a failure in either suite produces a non-zero final result;
* the README documents the authoritative validation workflow accurately.

The counts:

* 115 backend;
* 234 frontend;
* 349 total

remain observational only and are not permanent contracts.

#### 10.11.4 Final Frontend Production Build Verification

A fresh frontend production build was performed using:

`npm run build --prefix frontend`

Result:

* exit code: `0`;
* build completed successfully;
* 2,778 modules transformed;
* build time: approximately 12.49 seconds.

The build produced a non-failing Vite chunk-size advisory.

This advisory does not block Milestone 0 closure.

#### 10.11.5 Development Baseline Verification

The final verification confirmed that the tracked `README.md` accurately documents the committed development baseline, including:

* authoritative startup through `.\dev.cmd`;
* manual backend startup;
* manual frontend startup;
* backend port `5000`;
* frontend port `5173`;
* verified frontend URL:
  `http://localhost:5173`;
* frontend proxy paths:
  `/api`, `/health`, and `/calculate`;
* backend health endpoint;
* relevant environment-variable names and safe semantics;
* local mock-authentication behavior;
* development-only administrator access;
* repository-safety expectations.

The pre-existing working-tree modification to `dev.cmd` remains outside the committed baseline and does not block Milestone 0 closure.

#### 10.11.6 Architecture and Governance Tracking

The final verification confirmed that the following authoritative architecture and governance documents exist at `HEAD` and are tracked:

* `documentation/phase-4-concept-exploration-and-product-vision.md`;
* `documentation/phase-4-product-architecture.md`;
* `documentation/product-architecture-decisions.md`;
* `documentation/phase-5-technical-architecture.md`;
* `documentation/phase-6-implementation-plan.md`.

Documentation Baseline A is preserved through:

`3dc77d3 — Add authoritative Phase 4 and Phase 5 architecture baseline`

Documentation Baseline B is preserved through:

`9a95987 — Add authoritative Phase 6 implementation plan baseline`

No authoritative Phase 4–6 baseline document remains untracked.

#### 10.11.7 Known Warnings and Non-Blocking Findings

The final verification observed or reconfirmed the following known warnings:

* `tool.uv.dev-dependencies` deprecation warning;
* missing `requires-python` declaration;
* Starlette `httpx` deprecation warning;
* npm `devdir` warning;
* Vite production-build chunk-size advisory.

These findings are classified as:

* non-blocking known issues;
* later-task candidates where justified;
* not reasons to expand Milestone 0 scope.

The pre-existing uncommitted `dev.cmd` health-wait behavior also remains non-blocking for Milestone 0 closure.

No known warning requires corrective implementation merely to close Milestone 0.

#### 10.11.8 Unrelated Repository Work Preservation

The final verification confirmed the following unrelated pre-existing repository work:

* modified `dev.cmd`;
* deleted `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* untracked `documentation/Arthur-project-handover.md`;
* untracked `documentation/external-architecture-review.md`;
* untracked `frontend/.env.local`.

This work:

* is unrelated to Milestone 0 technical completion;
* remained outside all Milestone 0 implementation and documentation-baseline commits;
* was not modified during final closure verification;
* does not block Milestone 0 closure.

The repository is therefore not globally clean.

For Milestone 0 closure, repository cleanliness means:

* no uncommitted M0.1 implementation change remains;
* no uncommitted M0.2 implementation change remains;
* no uncommitted M0.3 implementation change remains;
* no uncommitted Documentation Baseline A change remains;
* no unrelated file entered a Milestone 0 commit;
* known unrelated pre-existing work remains untouched.

The only current Milestone 0-scoped working-tree modification is this Phase 6 plan update containing:

* Documentation Baseline B post-commit history;
* final post-baseline verification evidence;
* formal Milestone 0 closure record.

This update must be committed separately as the final Milestone 0 closure commit.

#### 10.11.9 Milestone 0 Completion Criteria

The final verification confirmed that all substantive Milestone 0 completion criteria are satisfied.

Confirmed:

* repository state was investigated;
* real development startup workflow was verified;
* frontend and backend startup commands and ports were verified;
* local authentication and administrator-development behavior were documented;
* authoritative validation commands were established;
* complete backend automated test execution was established;
* complete frontend automated test execution was preserved;
* the false-complete unified validation defect was corrected;
* authoritative validation workflow documentation was established;
* authoritative development environment baseline documentation was established;
* preservation boundaries were identified;
* safety-net gaps were classified;
* no later-milestone architecture was implemented prematurely;
* Documentation Baseline A entered Git history;
* Documentation Baseline B entered Git history;
* fresh unified validation passed;
* fresh frontend production build passed;
* final post-baseline verification was completed;
* no technical, validation, architecture, documentation-baseline, or repository-contamination blocker remains.

The final governance requirement is the isolated commit and push of this closure record.

#### 10.11.10 Closure Blocker Review

The final review found no remaining blocker involving:

* incomplete automated tests;
* false-complete validation;
* missing operational documentation;
* missing tracked architecture;
* missing tracked Phase 6 governance;
* inaccurate task history;
* secret exposure;
* repository contamination;
* architectural contradiction;
* premature Milestone 1 implementation.

No technical blocker remains.

No architecture-baseline blocker remains.

No validation blocker remains.

No release-baseline blocker remains within Milestone 0 scope.

#### 10.11.11 Formal Closure Decision

The final Milestone 0 closure decision is:

**MILESTONE 0 FORMALLY CLOSED**

Milestone 0 has achieved its approved objective:

> Establish a verified, reproducible, and trustworthy implementation baseline before major Phase 6 architectural migration begins.

The repository now has:

* trustworthy complete unified automated validation;
* authoritative validation documentation;
* authoritative development-environment documentation;
* preserved Product Architecture;
* preserved Product Architecture Decisions;
* preserved Technical Architecture;
* a tracked authoritative Phase 6 Implementation Plan;
* isolated rollback boundaries for all Milestone 0 implementation and documentation-baseline work;
* fresh successful final validation and production-build evidence.

Milestone 0 is therefore formally closed.

#### 10.11.12 Transition to Milestone 1

Milestone 1 planning may begin only after this formal closure record is committed and pushed successfully.

Milestone 1 implementation must not begin automatically.

Before implementation, Milestone 1 must follow the approved Phase 6 workflow:

1. inspect the authoritative milestone obligations;
2. perform repository investigation;
3. build the dependency map;
4. decompose the milestone into small, controlled, independently verifiable tasks;
5. define task acceptance criteria;
6. perform Pre-Implementation Analysis for the first approved task;
7. implement only after explicit approval.

Milestone 1 will address:

**Project File v2 and Canonical Project Model**

No Milestone 1 implementation work occurred during Milestone 0 closure.

#### 10.11.13 Final Closure Commit Strategy

The final Milestone 0 closure commit must contain exactly:

`documentation/phase-6-implementation-plan.md`

The commit must include:

* Sections 10.10.19–10.10.24 — Documentation Baseline B post-commit history and closure;
* Section 10.11 — Final Milestone 0 Closure Verification and Formal Closure.

No other file may enter the commit.

Approved commit message:

`Phase 6 M0: record formal Milestone 0 closure`

After the commit is pushed successfully:

* Milestone 0 closure is preserved in Git history;
* no uncommitted Milestone 0-scoped work should remain;
* Milestone 1 planning may begin;
* Milestone 1 implementation remains subject to the approved task workflow.
## 11. Milestone 1 — Canonical Project Model and `.hfzproject` v2 Foundation

**Status: Planning in progress. Implementation not started.**

### 11.1 Milestone Objective

The objective of Milestone 1 is to establish the authoritative canonical Project model and the `.hfzproject` v2 foundation required by the approved HFZWood Technical Architecture.

This milestone must transform the current Project snapshot and Project-file persistence foundation into a formally defined, validated, and internally consistent Project representation without unnecessarily rewriting the existing working Project workflow.

The resulting canonical Project model must provide the stable technical foundation required for later implementation of:

* authenticated Project ownership;
* foreign-owned Project read-only behavior;
* Product Capability enforcement;
* the Project Structural Capability Snapshot;
* complete Local Workspace behavior;
* future cloud Project representations;
* future synchronization and divergence detection;
* safe Project persistence, restoration, and validation.

Milestone 1 must establish the authoritative rules and implementation foundation for:

* `.hfzproject` format version 2;
* canonical Project structure;
* Project identity;
* Project ownership metadata;
* technical Project version identity;
* direct version ancestry;
* technical and metadata modification timestamps;
* Project creation-threshold semantics;
* first persistent-version semantics;
* classification of technical metadata, technical Project content, descriptive metadata, and derived metadata;
* technical-change versioning;
* metadata-only persistence;
* mixed technical and metadata persistence;
* no-change Save behavior;
* strict validation of Project files during Open;
* safe rejection of malformed, incomplete, unsupported, or architecturally invalid Project representations.

Milestone 1 must preserve the validated existing Project snapshot, Save, Open, Update, restore, dirty-state, unsaved-changes, and file-I/O foundations wherever they remain compatible with the approved architecture.

It must not treat the current implementation as disposable legacy code.

Milestone 1 does not by itself complete:

* evidence-based image-import limits;
* complete primary-image input validation and performance boundaries;
* production authentication;
* authoritative ownership enforcement;
* foreign-owned Project user experience;
* complete Product Capability enforcement;
* complete Local Workspace functionality;
* operational Cloud Workspace;
* synchronization;
* conflict-resolution workflows.

Those responsibilities belong to later milestones, although Milestone 1 must establish the canonical Project fields and boundaries on which they depend.

The authoritative `.hfzproject` v2 model must be established directly.

Compatibility, migration, or automatic upgrading of disposable pre-launch `.hfzproject` v1 development files is not required.

No Milestone 1 implementation task may begin until:

1. the complete architectural obligations have been extracted from the approved architecture;
2. the relevant repository state has been investigated read-only;
3. architecture has been compared with repository reality;
4. dependencies, preservation boundaries, migration boundaries, risks, and safety-net requirements have been identified;
5. the milestone has been decomposed into small, independently verifiable tasks;
6. the Milestone 1 plan has been reviewed and explicitly approved by the Product Owner.

The authoritative rule is:

**Milestone 1 establishes one canonical, validated, portable, and version-aware `.hfzproject` v2 Project representation that preserves compatible existing behavior and provides the stable foundation required by all later Project-related Phase 6 milestones, without prematurely implementing those later responsibilities.**

### 11.2 Authoritative Architectural Sources

Milestone 1 must be planned and implemented exclusively from approved architectural sources, the authoritative Phase 6 implementation workflow, and verified repository evidence.

The following sources are authoritative for Milestone 1.

#### 11.2.1 Phase 5 Technical Architecture

The approved `documentation/phase-5-technical-architecture.md` document is the primary technical source of truth for Milestone 1.

The architectural obligations relevant to this milestone must be extracted comprehensively from all applicable sections of that document, including, but not limited to, the sections governing:

* current Project persistence and existing Project architecture gaps;
* Project identity;
* Project version identity and direct ancestry;
* authenticated Project ownership metadata;
* primary-image metadata and integrity foundations required by the canonical Project model;
* Project data separation and technical versioning rules;
* Project creation-threshold semantics;
* first persistent-version semantics;
* canonical Project representation;
* `.hfzproject` format and schema versioning;
* Save semantics;
* metadata-only changes;
* mixed technical and metadata changes;
* no-change Save behavior;
* strict Project validation;
* safe handling of invalid or unsupported Project files;
* migration and compatibility policy for disposable pre-launch `.hfzproject` v1 development files;
* implementation sequencing, preservation, testing, reversibility, and migration constraints relevant to the canonical Project foundation.

Section numbers alone must not be treated as sufficient architectural extraction.

Milestone 1 planning must inspect the complete approved Technical Architecture for cross-cutting obligations, dependencies, preservation requirements, security boundaries, future-compatibility requirements, and implementation constraints that materially affect the canonical Project model.

#### 11.2.2 Phase 6 Implementation Plan

The current `documentation/phase-6-implementation-plan.md` document is authoritative for:

* Phase 6 purpose and scope;
* the relationship between Phase 5 architecture and Phase 6 implementation;
* implementation principles;
* task-decomposition rules;
* the approved milestone sequence;
* Milestone 1 scope and position within that sequence;
* Task Execution Workflow;
* investigation requirements;
* acceptance-criteria requirements;
* automated and manual verification requirements;
* rollback discipline;
* repository discipline;
* documentation alignment;
* stop conditions;
* task and milestone closure requirements.

Milestone 1 planning and implementation must follow this workflow without bypassing Pre-Implementation Analysis, Product Owner review, explicit implementation authorization, verification, documentation alignment, commit discipline, or formal closure evidence.

#### 11.2.3 Approved Phase 4 Product Architecture Sources

The approved Phase 4 Product Architecture and Product Architecture Decisions remain authoritative for underlying product behavior.

They must be consulted where necessary to ensure that Milestone 1 does not accidentally redefine:

* what constitutes a valid Project;
* when a Project comes into existence;
* the role and immutability of the primary image;
* authenticated Project ownership;
* the distinction between Project identity and Project version;
* the distinction between technical Project content and descriptive or organizational information;
* Local-First behavior;
* Project portability;
* the relationship between local and future cloud representations of the same logical Project.

Milestone 1 must not reopen approved product decisions.

If repository investigation or implementation reveals a genuine contradiction, missing product decision, or technical impossibility affecting an approved product rule, work must stop at that boundary and the issue must be escalated explicitly.

#### 11.2.4 Verified Repository Evidence

The actual repository state is authoritative for determining how the approved architecture can be implemented safely in the existing application.

Repository investigation must establish facts concerning:

* the current `.hfzproject` representation;
* current Project snapshot structure;
* current Save behavior;
* current Open behavior;
* current Update Existing Project behavior;
* current restore behavior;
* current dirty-state detection;
* current unsaved-changes protection;
* current primary-image serialization;
* current Project metadata;
* current Recent Projects metadata;
* current IndexedDB file-handle persistence;
* current frontend state ownership;
* current tests covering Project persistence and restoration;
* current dependencies that must be preserved or migrated;
* existing behavior that already satisfies part of the approved architecture;
* existing behavior that conflicts with or falls short of the approved architecture.

Repository evidence may determine implementation details, dependency order, preservation boundaries, migration boundaries, test requirements, and safe task decomposition.

Repository evidence must not independently override approved Product Architecture or Technical Architecture.

#### 11.2.5 Source Precedence and Conflict Rule

The authoritative precedence for Milestone 1 is:

1. approved Product Architecture for product meaning and behavior;
2. approved Phase 5 Technical Architecture for technical guarantees and architectural rules;
3. Phase 6 Implementation Plan for implementation sequencing, workflow, verification, and closure discipline;
4. verified repository evidence for current implementation reality and repository-specific implementation details.

These sources serve different responsibilities and should normally complement rather than compete with one another.

If verified repository reality differs from the approved target architecture, the difference must be treated as an implementation gap to investigate and plan.

If a repository-specific implementation detail is not defined by the approved architecture, it may be decided during Phase 6 only when it:

* preserves approved product behavior;
* does not contradict the Technical Architecture;
* does not weaken data integrity, Project identity, ownership, versioning, portability, validation, security, recovery, or future compatibility;
* remains proportionate to the actual implementation need;
* avoids speculative complexity.

If two approved architectural sources appear genuinely contradictory, or if implementation would require silently changing an approved architectural guarantee, work must stop at that boundary until the contradiction is explicitly resolved.

The authoritative rule is:

**Milestone 1 must be derived from approved product meaning, approved technical guarantees, the disciplined Phase 6 implementation workflow, and verified repository reality. Architecture defines what must be true; repository evidence determines how to reach that state safely without unnecessary rewrites or invented behavior.**
### 11.3 Complete Architectural Obligations

Milestone 1 must establish the complete canonical Project foundation required by the approved Technical Architecture.

The obligations below define what must become true through Milestone 1.

They do not yet define implementation tasks, repository-specific module boundaries, file changes, or implementation order.

Those decisions must be made only after read-only repository investigation and dependency analysis.

#### 11.3.1 Canonical `.hfzproject` v2 Representation

Milestone 1 must establish `.hfzproject` v2 as the authoritative persisted Project format for the launch-ready HFZWood product.

The canonical Project representation must:

* use `formatVersion: 2`;
* remain a single portable JSON file;
* contain sufficient information to reconstruct a valid locally persisted Project without cloud availability;
* preserve the complete Project state required for opening, inspection, restoration, and continued editing when later ownership and authentication rules permit;
* evolve the existing validated Project snapshot and restore mechanisms rather than unnecessarily replacing working calculator domain logic or persistence foundations.

The canonical representation must preserve, directly or through a clearly defined internal structure:

* Project identity;
* ownership metadata;
* technical version identity;
* direct version ancestry;
* complete known technical ancestry where required;
* Project creation and modification timestamps;
* the primary image;
* primary-image integrity metadata;
* reference measurements;
* geometry;
* calculation inputs;
* calculation results where applicable;
* technical Project parameters;
* descriptive and organizational metadata;
* free-form notes;
* Project Structural Capability Snapshot;
* any other information required by the approved canonical Project schema.

The exact serialized schema must preserve the approved architectural distinctions and must not collapse technically different data categories into ambiguous undifferentiated state.

#### 11.3.2 Permanent Project Identity

Every valid HFZWood Project must have one unique and permanent `projectId`.

The `projectId`:

* identifies the logical Project;
* is generated locally using a standard UUID mechanism;
* must not depend on server availability;
* remains unchanged throughout the Project lifecycle;
* is independent of Project name, file name, file path, device, storage location, and current Project version;
* travels with the Project inside the `.hfzproject` representation;
* must be preserved when the Project is moved, copied, restored, reopened, or later represented in cloud storage.

The authoritative identity rule is:

**Same `projectId` means the same logical Project. Different `projectId` means a different Project.**

Manual copying of a `.hfzproject` file must not create a new logical Project.

#### 11.3.3 Project Creation Threshold

A Project becomes technically valid only when both approved threshold conditions are satisfied:

* one primary image exists;
* at least one reference measurement exists.

At the moment the threshold is first satisfied, the Project must receive:

* `projectId`;
* `ownerId`;
* `primaryImageHash`;
* `createdAt`.

The Project then exists as a valid Project in application memory.

Reaching the creation threshold must not automatically and silently create a `.hfzproject` file on the user's filesystem.

Initial local persistence requires an explicit successful Save operation initiated by the user.

#### 11.3.4 Valid but Unsaved Project State

A valid Project may exist temporarily in application memory without yet having a persisted `.hfzproject` representation.

In this state:

* `projectId` exists;
* `ownerId` exists;
* `primaryImageHash` exists;
* `createdAt` exists;
* no persistent `versionId` exists yet;
* no persistent `parentVersionId` exists yet;
* no persistent technical ancestry exists yet.

A valid but unsaved Project must remain protected against accidental abandonment through the applicable unsaved-changes behavior.

Milestone 1 must establish the canonical state semantics required for this lifecycle distinction without prematurely implementing later Local Workspace responsibilities beyond the scope necessary for the v2 foundation.

#### 11.3.5 Ownership Metadata Foundation

Every valid Project must contain one stable `ownerId`.

Within Milestone 1, `ownerId` is part of the canonical Project metadata foundation.

The field must:

* be created when the Project first becomes valid;
* be stored persistently in `.hfzproject` v2;
* remain associated with the Project across Save, Open, move, copy, restore, and future cloud representations;
* not depend on username, display name, email address, Project name, file name, file path, or device identity.

Milestone 1 establishes the canonical `ownerId` field and its persistence boundary.

It does not complete production identity derivation, authoritative ownership enforcement, foreign-owned Project read-only behavior, or protected backend authorization, which belong to later milestones.

Local `ownerId` metadata must not be treated as authoritative proof of authorization.

#### 11.3.6 Primary-Image Integrity Metadata Foundation

The canonical Project representation must include:

* the authoritative stored primary image;
* `primaryImageHash`.

The `primaryImageHash` must be based on the authoritative stored primary-image representation and must be associated permanently with the Project identity.

Milestone 1 must establish the canonical field and persistence boundary required by this architecture.

The complete evidence-based image-import policy, supported-format boundaries, source-file-size limits, decoded-dimension limits, malformed-image validation, realistic phone-photo testing, browser-memory testing, and full primary-image integrity enforcement belong to Milestone 2.

Milestone 1 must not prematurely invent those limits.

#### 11.3.7 Technical Version Identity

Each successfully persisted technical Project version must have a unique `versionId`.

The distinction must remain explicit:

* `projectId` identifies the logical Project;
* `versionId` identifies one exact persisted technical version of that Project.

A `versionId`:

* is generated locally using a standard UUID mechanism;
* must not depend on server availability;
* changes only when a successful Save persists a real technical Project-content change;
* must not change solely because descriptive, organizational, display, or other non-technical metadata changes.

A valid Project that has never been successfully persisted does not yet have a persistent `versionId`.

#### 11.3.8 Direct and Complete Known Ancestry

Each persisted technical Project version must preserve the ancestry information required by the approved architecture.

This includes:

* `parentVersionId` for direct ancestry;
* `ancestorVersionIds` for complete known technical branch ancestry where required by the approved version-relationship architecture.

For the first successfully persisted technical version:

* `parentVersionId = null`;
* `ancestorVersionIds = []`.

When a new technical version is created from an existing persisted version:

* the previous `versionId` becomes the new `parentVersionId`;
* the new version inherits the parent's complete known ancestry;
* the direct parent's `versionId` is appended to `ancestorVersionIds`.

Conceptually:

`newVersion.ancestorVersionIds = parentVersion.ancestorVersionIds + [parentVersion.versionId]`

Milestone 1 must preserve sufficient ancestry information for later succession and divergence reasoning without implementing full version-control behavior or permanent storage of every historical Project-content snapshot.

Ancestry must not be arbitrarily truncated merely to optimize a theoretical scale problem.

No ancestry pruning, checkpointing, compression, or compaction mechanism is required unless repository evidence or realistic testing demonstrates a concrete technical need.

#### 11.3.9 Project Timestamps

The canonical Project model must preserve the distinct meanings of:

* `createdAt`;
* `lastModifiedAt`;
* `metadataModifiedAt`.

`createdAt` records Project creation at the moment the approved creation threshold is first satisfied.

`lastModifiedAt` records the persistence time of the current technical Project version.

`metadataModifiedAt` records successful persistence of descriptive, organizational, or applicable technical-metadata changes that do not independently create a new technical version.

These timestamps must not be treated as interchangeable.

Timestamps provide context.

They must not independently determine:

* Project identity;
* technical version identity;
* ancestry;
* succession;
* divergence;
* conflict resolution;
* overwrite permission.

#### 11.3.10 Project Data Classification

The canonical Project model must preserve a clear architectural distinction between:

* technical Project metadata;
* technical Project content;
* descriptive and organizational Project information;
* derived metadata.

Technical Project metadata includes, where applicable:

* `projectId`;
* `ownerId`;
* `versionId`;
* `parentVersionId`;
* `ancestorVersionIds`;
* `createdAt`;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* `primaryImageHash`;
* Project Structural Capability Snapshot;
* Project format and schema version information.

Technical Project content consists of persistent data whose modification changes the technical state of the Project, including:

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
* other future Project Tool data used for calculation, technical validation, or execution-related technical behavior.

Descriptive and organizational information includes, where applicable:

* `projectName`;
* free-form notes;
* descriptive material information;
* resin product description when it does not affect calculation logic;
* pigment or color information;
* wood species;
* other organizational information not consumed as technical Project input.

Derived metadata includes information such as thumbnails that may be regenerated from authoritative Project data.

The classification of a field must depend on its architectural function, not merely on its UI representation or data type.

#### 11.3.11 Technical Version Boundary

A new `versionId` must be generated only when a successful Save persists a real change to technical Project content.

Examples include changes to:

* reference measurements;
* reference measurement values;
* geometry;
* depth information;
* pour-layer configuration;
* calculation inputs;
* mix ratio;
* other persistent data used for calculation, technical validation, or execution-related technical behavior.

Descriptive, organizational, display, and free-form informational changes must not by themselves generate a new technical `versionId`.

This boundary must be explicit and testable.

#### 11.3.12 Project Structural Capability Snapshot Foundation

The Project Structural Capability Snapshot is technical Project metadata.

Milestone 1 must establish its canonical place in `.hfzproject` v2 and preserve the approved persistence and versioning boundaries.

A change to the Project Structural Capability Snapshot:

* must be persisted only through a successful explicit Save;
* does not by itself generate a new `versionId`;
* does not by itself update `lastModifiedAt`;
* updates `metadataModifiedAt`;
* must still be recognized as a persistent metadata change by the Save pipeline.

If the same Save also persists a real technical Project-content change, normal technical-versioning rules apply.

Milestone 1 establishes this canonical persistence foundation.

Complete effective-capability resolution, upgrade behavior, downgrade behavior, offline capability windows, and authoritative capability enforcement belong to Milestone 5.

#### 11.3.13 First Successful Save Semantics

The first successful explicit Save creates the first persistent technical version of the Project.

At that moment:

* a new `versionId` is generated;
* `parentVersionId` is `null`;
* `ancestorVersionIds` is empty;
* `lastModifiedAt` is established;
* the complete canonical Project representation is persisted.

The first `versionId` must not be generated merely because the Project became valid in application memory.

A `versionId` represents a successfully persisted technical Project version.

Failed persistence must never be represented as a successful Save.

#### 11.3.14 Subsequent Save with Technical Changes

When a previously persisted Project is successfully saved after technical Project content has changed:

* a new `versionId` is generated;
* the previous `versionId` becomes the new `parentVersionId`;
* complete known ancestry is carried forward according to the approved ancestry construction rule;
* `lastModifiedAt` is updated;
* changed technical Project content is persisted.

The previous persisted technical identity must not be discarded before successful persistence of the new representation is confirmed.

#### 11.3.15 Save with Metadata-Only Changes

When a Save persists only descriptive, organizational, or applicable technical-metadata changes:

* `projectId` remains unchanged;
* `versionId` remains unchanged;
* `parentVersionId` remains unchanged;
* `ancestorVersionIds` remains unchanged;
* `lastModifiedAt` remains unchanged;
* metadata changes are persisted;
* `metadataModifiedAt` is updated.

Metadata-only differences must not be incorrectly represented as technical Project divergence.

#### 11.3.16 Save with Mixed Technical and Metadata Changes

A single Save may persist both technical Project-content changes and metadata changes.

In this case:

* a new `versionId` is generated;
* ancestry advances according to the approved technical-versioning rules;
* `lastModifiedAt` is updated;
* `metadataModifiedAt` is updated when applicable;
* all successfully persisted changes are represented atomically by the resulting canonical Project state.

The Save pipeline must not lose or misclassify either category of change.

#### 11.3.17 Save with No Persistent Changes

A Save operation with no real persistent change must not create artificial Project history.

When no technical Project content, descriptive metadata, organizational metadata, applicable technical metadata, or Project Structural Capability Snapshot change requires persistence:

* no new `versionId` is generated;
* `parentVersionId` does not change;
* `ancestorVersionIds` does not change;
* `lastModifiedAt` does not change;
* `metadataModifiedAt` does not change merely because Save was invoked.

The application must not create false versions or misleading modification timestamps.

#### 11.3.18 Persistence Success Boundary

Version and timestamp transitions must represent successfully persisted reality.

The implementation must not permanently adopt a newly generated `versionId`, advanced ancestry, or updated modification timestamp as authoritative Project state when persistence fails.

A failed Save must not:

* masquerade as successful;
* create false persisted history;
* leave canonical in-memory state falsely claiming that unsuccessful persistence occurred.

The exact repository-specific implementation mechanism must be determined only after investigation of the current Save pipeline.

#### 11.3.19 Strict Validation on Open

HFZWood must validate a Project file before adopting it as active Project state.

A malformed, corrupted, incomplete, structurally invalid, or unsupported Project file must fail safely.

The application must:

* reject the invalid file;
* not partially load invalid Project state into the active workspace;
* not silently repair or reinterpret unknown structures;
* not overwrite or modify the original invalid file;
* preserve the currently active valid Project state, if one exists;
* display a clear user-facing error explaining that the Project could not be opened.

A failed Open operation must never leave the application in an ambiguous partially loaded state.

#### 11.3.20 Unsupported Format Handling

Every canonical Project file must contain an explicit `formatVersion`.

For Milestone 1, the authoritative supported Project format is:

`formatVersion: 2`

If the application encounters an unsupported format version, including a future version it does not understand, it must reject the file safely rather than guess how to interpret it.

Unknown Project structures must fail closed.

#### 11.3.21 Pre-Launch `.hfzproject` v1 Policy

Existing pre-launch `.hfzproject` v1 development files are explicitly disposable.

Milestone 1 does not require:

* v1 backward compatibility;
* v1 opening support;
* v1 editing support;
* v1-to-v2 automatic migration;
* v1 identity assignment;
* parallel v1 and v2 persistence authorities;
* preservation of existing v1 development artifacts.

Phase 6 may transition directly to `.hfzproject` v2.

Existing disposable v1 Projects may be discarded and recreated as new v2 Projects where required.

The absence of v1 migration support is an explicit approved architecture decision and must not be treated as missing functionality or technical debt.

This policy applies only to disposable pre-launch development files.

It does not establish permission to discard real production user data in future format transitions.

#### 11.3.22 Preservation Obligations

Milestone 1 must preserve existing validated behavior and implementation foundations wherever compatible with the approved architecture.

Particular preservation candidates include:

* existing Project file I/O abstractions;
* existing Project snapshot construction;
* existing Project restoration;
* existing Save workflow;
* existing Open workflow;
* existing Update Existing Project behavior;
* existing dirty-state detection;
* existing unsaved-changes protection;
* existing primary-image serialization;
* existing Recent Projects metadata behavior where not made authoritative;
* existing IndexedDB file-handle retention;
* validated Resin Calculator algorithms;
* existing automated tests covering Project persistence and restoration.

These are preservation candidates, not assumptions that every current implementation detail is already correct.

Repository investigation must determine:

* what can remain unchanged;
* what can be extended;
* what requires migration;
* what conflicts with the approved architecture;
* what may become obsolete only after verified replacement.

No working foundation may be rewritten merely for architectural preference.

#### 11.3.23 Milestone Boundary with Later Responsibilities

Milestone 1 must establish the canonical Project foundation without prematurely implementing later milestone responsibilities.

In particular, Milestone 1 must not expand into full implementation of:

* evidence-based image-import boundaries and performance limits belonging to Milestone 2;
* production authentication and stable production identity derivation belonging to Milestone 3;
* authoritative ownership enforcement and foreign-owned read-only UX belonging to Milestone 4;
* complete Product Capability resolution and enforcement belonging to Milestone 5;
* complete Local Workspace behavior belonging to Milestone 6;
* operational Cloud Workspace;
* synchronization;
* user-facing conflict resolution.

Where canonical fields are required now for those future responsibilities, Milestone 1 must establish the minimum correct foundation without activating incomplete future product behavior.

#### 11.3.24 Architectural Stop Conditions

Milestone 1 planning or implementation must stop if repository evidence reveals that:

* an approved architectural obligation is technically impossible;
* two approved architectural rules are genuinely contradictory;
* the canonical v2 model cannot be implemented without weakening Project integrity;
* Save semantics cannot safely distinguish successful persistence from failed persistence;
* current state ownership makes version or timestamp transitions ambiguous;
* strict Open validation cannot preserve the active valid Project on failure;
* implementation would require inventing unresolved product behavior;
* implementation would materially expand into a later milestone without explicit justification and approval.

Such findings must be documented and resolved explicitly rather than silently worked around in code.

#### 11.3.25 Authoritative Milestone 1 Architectural Rule

The authoritative rule is:

**Milestone 1 must establish one canonical, portable, validated, version-aware `.hfzproject` v2 representation in which Project identity, ownership metadata, technical version identity, ancestry, timestamps, Project data classification, capability-snapshot metadata, Save semantics, and validation behavior are explicit and internally consistent. The implementation must preserve compatible working foundations, create no false persistence history, fail closed on invalid input, avoid unnecessary v1 compatibility, and establish only the minimum correct foundation required by later milestones without prematurely implementing them.**
### 11.4 Preservation Boundaries

Milestone 1 must evolve the existing HFZWood Project persistence architecture without treating the current working implementation as disposable legacy code.

The repository already contains validated Project workflows, persistence mechanisms, restoration behavior, state-management foundations, and automated tests that represent substantial implementation value.

These foundations must be preserved wherever they remain compatible with the approved Product Architecture and Phase 5 Technical Architecture.

Preservation does not mean that existing implementation is automatically authoritative or exempt from change.

It means that existing working behavior must not be rewritten, replaced, deleted, or materially altered without a concrete reason established through approved architecture and verified repository evidence.

#### 11.4.1 Existing Project File I/O Foundation

The existing Project file I/O layer is a primary preservation boundary.

Repository investigation must identify:

* the current `.hfzproject` serialization path;
* the current file-writing mechanism;
* the current file-reading mechanism;
* native filesystem behavior where supported;
* browser-download fallback behavior;
* file-handle retention;
* update-in-place behavior;
* error handling;
* relevant abstractions and helpers;
* existing automated tests.

The existing file I/O foundation must be extended rather than replaced where it can safely support `.hfzproject` v2.

Replacement is justified only if repository evidence demonstrates that the current implementation:

* cannot support the approved canonical v2 model;
* creates a concrete data-integrity risk;
* prevents strict validation;
* prevents reliable persistence-success semantics;
* prevents safe rollback or testing;
* contains verified duplication or obsolete behavior that materially obstructs implementation.

Architectural preference alone is not sufficient justification for replacement.

#### 11.4.2 Existing Project Snapshot Construction

The current Project snapshot mechanism is a preservation boundary.

Repository investigation must identify:

* where the current Project snapshot is constructed;
* which persistent fields it contains;
* how technical Project content is collected;
* how descriptive information is collected;
* how the primary image is represented;
* whether calculation results are persisted;
* how snapshot equality or dirty-state comparison currently works;
* which consumers depend on the existing snapshot shape.

Milestone 1 should evolve the current snapshot into or toward the canonical v2 representation where safe.

Validated Project content must not be omitted, silently reclassified, or reconstructed differently without explicit architectural justification and verification.

#### 11.4.3 Existing Project Restoration Behavior

The existing Project restoration mechanism is a preservation boundary.

Repository investigation must identify:

* how opened Project data is restored into application state;
* which providers, contexts, components, hooks, or services receive restored data;
* restoration order dependencies;
* primary-image restoration behavior;
* reference-measurement restoration;
* geometry restoration;
* calculator-state restoration;
* notes and descriptive-data restoration;
* error behavior when restoration fails.

Milestone 1 must preserve complete restoration of valid Project state.

Strict v2 validation must occur before invalid data is adopted as active Project state.

A failed Open must not partially mutate or corrupt the currently active valid Project.

#### 11.4.4 Existing Save Workflow

The current Save workflow is a critical preservation boundary.

Repository investigation must determine:

* how Save is initiated;
* how Project state is collected;
* when persistence is attempted;
* when in-memory state is considered saved;
* when dirty state is cleared;
* how success and failure are detected;
* how file handles are created or reused;
* how browser-download fallback behaves;
* how Recent Projects metadata is updated;
* whether state transitions occur before or after persistence success is known.

Milestone 1 must preserve validated Save behavior while introducing the approved v2 identity, versioning, ancestry, timestamp, metadata, and validation semantics.

No implementation may create false persisted history by permanently adopting a new `versionId`, ancestry state, timestamp, or saved-state marker when persistence has failed.

#### 11.4.5 Existing Open Workflow

The current Open workflow is a critical preservation boundary.

Repository investigation must determine:

* how a Project file is selected;
* how file content is read;
* how JSON parsing occurs;
* what validation currently exists;
* when active Project state begins to change;
* how restoration is triggered;
* how file handles are retained;
* how Recent Projects metadata is updated;
* what happens when parsing, validation, or restoration fails.

Milestone 1 must preserve successful opening of valid supported Projects while introducing strict v2 validation and fail-closed behavior.

Invalid, malformed, incomplete, corrupted, or unsupported Project files must not be partially adopted as active Project state.

#### 11.4.6 Existing Update Existing Project Behavior

The existing Update Existing Project workflow is a preservation boundary.

Repository investigation must identify:

* how an existing writable Project representation is recognized;
* how a valid file handle is associated with the active Project;
* how update-in-place behavior works;
* how persistence success is determined;
* how fallback behavior works when direct update is unavailable;
* how dirty state and Recent Projects metadata are affected.

Milestone 1 must not break validated update-in-place behavior while establishing canonical v2 Save semantics.

Later Local Workspace responsibilities must not be prematurely implemented merely because they interact with the same persistence foundation.

#### 11.4.7 Existing Dirty-State Detection

The existing dirty-state mechanism is a preservation boundary.

Repository investigation must identify:

* what state is currently compared;
* what snapshot or baseline is treated as last saved;
* how technical changes are detected;
* how notes or descriptive changes are detected;
* whether primary-image state participates;
* how dirty state is reset after Save or Open;
* how no-change Save behavior currently works;
* which UI protections depend on dirty state.

Milestone 1 may need to distinguish technical changes from metadata-only changes in order to implement correct versioning semantics.

However, existing validated unsaved-change detection must not be weakened.

A change that requires persistence must not become invisible merely because it does not generate a new technical `versionId`.

#### 11.4.8 Existing Unsaved-Changes Protection

Existing protection against accidental loss of unsaved Project work is a preservation boundary.

Repository investigation must identify:

* navigation protections;
* Project-switch protections;
* browser-close or unload behavior where applicable;
* confirmation dialogs;
* interaction with dirty state;
* behavior for valid but never-persisted Projects;
* behavior after failed Save attempts.

Milestone 1 must preserve protection against accidental abandonment of unsaved work.

The introduction of v2 lifecycle semantics must not create a gap in which a valid but unsaved Project can be lost without appropriate warning.

#### 11.4.9 Existing Primary-Image Serialization

The existing primary-image serialization mechanism is a preservation boundary.

Repository investigation must determine:

* the current serialized representation;
* where image encoding occurs;
* where image decoding occurs;
* whether the representation is JSON-safe;
* whether the saved Project is independent of the original image path;
* how restoration works;
* what tests exist;
* whether any known size, memory, portability, or integrity limitations are already documented or observable.

Milestone 1 must preserve the current image representation where it remains compatible with the canonical v2 model.

A new image-encoding mechanism must not be introduced merely for preference or theoretical elegance.

Evidence-based image-import limits, realistic phone-photo performance, decoded-dimension boundaries, malformed-image validation, and complete image-integrity enforcement remain responsibilities of Milestone 2.

#### 11.4.10 Existing Recent Projects Metadata

Existing Recent Projects behavior is a preservation boundary where it remains a convenience layer rather than canonical Project persistence.

Repository investigation must determine:

* what metadata is stored;
* where it is stored;
* how entries are created and updated;
* whether thumbnails are stored;
* how file handles relate to Recent Projects;
* how stale or unavailable entries are handled;
* whether any current metadata duplicates information that will become canonical inside `.hfzproject` v2.

Milestone 1 must not accidentally promote Recent Projects metadata into an authoritative source for Project identity, ownership, technical versioning, ancestry, or canonical Project content.

Changes to complete Local Workspace behavior belong to Milestone 6 unless a minimal adjustment is strictly required for the canonical v2 foundation.

#### 11.4.11 Existing IndexedDB File-Handle Retention

Existing IndexedDB-based native file-handle retention is a preservation boundary where supported by the browser environment.

Repository investigation must identify:

* how handles are stored;
* how they are retrieved;
* how they are associated with Recent Projects or active Projects;
* how invalid, stale, moved, deleted, or inaccessible handles are treated;
* which browsers or APIs support the current behavior;
* what fallback behavior exists.

Milestone 1 must avoid unnecessary changes to this mechanism unless required by the canonical v2 foundation.

Complete handling of moved, deleted, unavailable, or inaccessible local files belongs primarily to Local Workspace completion in Milestone 6.

#### 11.4.12 Validated Resin Calculator Domain Logic

Validated Resin Calculator algorithms are a strict preservation boundary.

Milestone 1 must not rewrite, redesign, optimize, or materially alter calculation algorithms merely because the canonical Project representation changes.

Repository investigation must identify the boundary between:

* Project persistence representation;
* frontend calculator state;
* backend calculation logic;
* calculation inputs;
* calculation results;
* restore behavior.

Any change affecting validated calculation behavior requires explicit justification, dedicated regression verification, and scope review.

The canonical Project migration must adapt around validated domain logic wherever practical rather than forcing unnecessary domain rewrites.

#### 11.4.13 Existing Frontend State Ownership

The existing frontend provider, context, hook, component, and local-state structure must be treated as a preservation boundary until repository investigation establishes where canonical Project state is currently owned.

Milestone 1 must not introduce a new global state-management framework merely to implement `.hfzproject` v2.

Repository investigation must determine:

* where Project lifecycle state is owned;
* where calculator state is owned;
* where primary-image state is owned;
* where references and geometry are owned;
* where notes and descriptive metadata are owned;
* where file-handle state is owned;
* where last-saved baselines are owned;
* how Save and Open coordinate across these boundaries.

Existing state-management foundations should be extended where sufficient.

New abstractions are justified only when a concrete canonical-model, testability, data-integrity, or migration requirement cannot be safely satisfied otherwise.

#### 11.4.14 Existing Automated Test Safety Net

Existing automated tests covering Project behavior are a strict preservation boundary.

Repository investigation must identify tests covering, where applicable:

* Project Save;
* Project Open;
* Project Update Existing Project;
* Recent Projects;
* file-handle persistence;
* browser-download fallback;
* dirty-state detection;
* unsaved-changes protection;
* Project snapshot construction;
* Project restoration;
* primary-image persistence;
* calculation-state restoration;
* invalid-file handling.

Existing tests must not be weakened, deleted, skipped, or rewritten merely to make new implementation pass.

A test may be changed only when:

* approved architecture intentionally changes the behavior it verifies;
* the old expectation is demonstrably obsolete;
* the new expected behavior is explicitly documented;
* equivalent or stronger regression protection remains.

Milestone 1 must add targeted automated coverage for new v2 behavior rather than relying solely on existing tests.

#### 11.4.15 Unrelated Repository Work

Unrelated pre-existing repository work is outside the Milestone 1 preservation and implementation scope and must remain untouched unless explicitly authorized.

The currently known unrelated repository state includes:

* modified `dev.cmd`;
* deleted `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* untracked `documentation/Arthur-project-handover.md`;
* untracked `documentation/external-architecture-review.md`;
* untracked `frontend/.env.local`.

Milestone 1 investigation and implementation must not:

* modify;
* revert;
* restore;
* delete;
* clean;
* rename;
* stage;
* commit

these unrelated files or states without explicit approval.

Repository-wide cleanup commands must not be used in a way that risks altering unrelated work.

Wildcard staging must not be used where isolated explicit-path staging is required.

#### 11.4.16 Conditions for Changing Preserved Foundations

A preserved foundation may be changed only when repository evidence demonstrates a concrete reason, including:

* incompatibility with an approved architectural obligation;
* data-integrity risk;
* inability to support canonical v2 validation;
* inability to distinguish successful from failed persistence;
* inability to support correct versioning or metadata semantics;
* security weakness;
* verified duplication that creates implementation risk;
* obsolete behavior after successful replacement;
* maintainability or testability problems that materially block safe implementation.

Any such change must:

* remain proportionate to the concrete problem;
* preserve unaffected validated behavior;
* receive explicit task scope;
* define acceptance criteria;
* define regression verification;
* define rollback boundaries;
* avoid unrelated refactoring.

#### 11.4.17 No Premature Preservation Assumptions

The preservation boundaries above do not establish that every current implementation detail is correct or must remain unchanged.

Before repository investigation, Milestone 1 must not assume:

* the current snapshot shape is suitable as the final v2 schema;
* the current Save pipeline has correct persistence-success boundaries;
* current dirty-state logic already distinguishes technical and metadata changes;
* current Open behavior is fail-closed;
* current image serialization is fully compatible with all future integrity requirements;
* current Recent Projects metadata is free from duplicated authority;
* current state ownership is sufficient for canonical version transitions;
* current tests cover every required failure mode.

These questions must be answered through read-only repository investigation.

The preservation principle is therefore:

**Preserve verified value, not accidental structure.**

#### 11.4.18 Authoritative Preservation Rule

The authoritative rule is:

**Milestone 1 must preserve validated HFZWood Project behavior, persistence foundations, restoration mechanisms, domain logic, state-management structures, and automated tests wherever they remain compatible with the approved architecture. Existing code must not be rewritten, replaced, weakened, or deleted without concrete repository evidence and architectural justification. Preservation must protect working value without turning current implementation accidents into permanent constraints, and unrelated repository work must remain untouched unless explicitly authorized.**
### 11.5 Repository Investigation Requirements

Before Milestone 1 may be decomposed into implementation tasks, the actual HFZWood repository must be investigated strictly read-only.

The purpose of this investigation is to establish verified repository facts required to compare the approved architecture with the current implementation reality.

The investigation must determine:

* what already exists and should be preserved;
* what partially satisfies the approved architecture;
* what conflicts with the approved architecture;
* what is missing;
* what dependencies constrain safe implementation order;
* what migration boundaries exist;
* what safety-net gaps must be closed before data-integrity-sensitive changes;
* what repository-specific implementation details may be decided safely during Phase 6;
* whether any genuine architectural contradiction, impossibility, or missing decision requires escalation before implementation.

The investigation must not modify repository content.

It must not:

* edit files;
* create files;
* delete files;
* rename files;
* format files;
* generate production code;
* generate migration code;
* update documentation;
* stage changes;
* commit;
* push;
* clean unrelated repository state;
* restore unrelated files;
* run destructive commands;
* implement any Milestone 1 behavior.

Commands that only read repository state, inspect files, search code, inspect Git history, or run existing tests without modifying tracked source files may be used where appropriate.

If any command could modify repository content, generated artifacts, lockfiles, caches, environment files, persistent local data, or unrelated working-tree state, it must not be used without explicit approval.

#### 11.5.1 Repository State Verification

The investigation must begin by verifying and reporting the current repository state.

It must identify:

* current branch;
* current HEAD commit;
* tracked modified files;
* tracked deleted files;
* untracked files;
* staged changes, if any;
* whether the known unrelated pre-existing repository work remains present and untouched.

The known unrelated repository state that must be protected includes:

* modified `dev.cmd`;
* deleted `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* untracked `documentation/Arthur-project-handover.md`;
* untracked `documentation/external-architecture-review.md`;
* untracked `frontend/.env.local`.

If the actual repository state differs materially from the expected state, the discrepancy must be reported before implementation planning proceeds.

No unrelated repository work may be modified, reverted, restored, deleted, cleaned, staged, or committed.

#### 11.5.2 Current `.hfzproject` Representation

The investigation must identify the complete current `.hfzproject` representation.

It must determine:

* where the Project snapshot is constructed;
* the exact current top-level structure;
* all persisted fields;
* nested structures;
* current format or schema markers, if any;
* whether a format version already exists;
* how the primary image is represented;
* how reference measurements are represented;
* how formwork geometry is represented;
* how wood geometry is represented;
* how cavity geometry is represented;
* how depth and layer information are represented;
* how calculator inputs are represented;
* how calculation results are represented;
* how notes and descriptive information are represented;
* whether Project name exists;
* whether any current identity, ownership, version, ancestry, timestamp, integrity, or capability-snapshot fields already exist;
* which parts of the representation are authoritative Project data and which are convenience or derived metadata.

The investigation must identify all code paths that create, consume, validate, transform, compare, or restore this representation.

#### 11.5.3 Project Snapshot Construction

The investigation must trace the complete current Project snapshot construction path.

It must identify:

* entry point;
* responsible function or functions;
* source state for every persisted field;
* provider, context, hook, component, service, or helper dependencies;
* calculation-state dependencies;
* primary-image dependencies;
* reference-measurement dependencies;
* geometry dependencies;
* notes and descriptive-data dependencies;
* whether snapshot construction has side effects;
* whether snapshot construction can fail;
* how failures are handled;
* whether multiple competing snapshot-construction paths exist.

The investigation must determine whether the existing snapshot mechanism can be safely evolved into the canonical `.hfzproject` v2 representation or whether a more explicit canonical-model boundary is required.

No recommendation to replace the existing mechanism may be made without concrete evidence.

#### 11.5.4 Current Project Lifecycle and State Ownership

The investigation must establish the actual current Project lifecycle from initial workflow entry through creation, persistence, reopening, modification, and replacement.

It must determine:

* when the application currently considers a Project to exist;
* whether any Project identity exists today;
* when primary image selection occurs;
* when reference measurements become available;
* whether the approved creation threshold is currently represented anywhere;
* where active Project state is owned;
* where current file-handle state is owned;
* where Project metadata is owned;
* where the last-saved baseline is owned;
* how a new Project replaces or resets previous Project state;
* how an opened Project becomes the active Project;
* whether active Project state is centralized or distributed;
* which state transitions are synchronous and which are asynchronous;
* which lifecycle transitions may affect Save, Open, dirty state, or unsaved-changes protection.

The investigation must identify any current state-ownership pattern that could make canonical Project identity, version transitions, timestamps, or persistence-success semantics ambiguous.

#### 11.5.5 Save Workflow and Persistence-Success Boundary

The complete Save workflow must be traced from user action to confirmed persistence outcome.

The investigation must determine:

* all Save entry points;
* how the Project snapshot is obtained;
* how the target file or download path is selected;
* how native filesystem persistence works;
* how browser-download fallback works;
* when a file handle is created or reused;
* when persistence is considered successful;
* how persistence failure is detected;
* how cancellation is distinguished from failure where applicable;
* when in-memory Project state changes;
* when dirty state is cleared;
* when the last-saved baseline is updated;
* when Recent Projects metadata is updated;
* whether any state is mutated before persistence success is known;
* whether failed persistence can currently leave the application falsely believing that data was saved.

The investigation must explicitly answer whether the current Save pipeline can safely support:

* first persistent `versionId` creation;
* technical-change version advancement;
* ancestry advancement;
* `lastModifiedAt` updates;
* metadata-only persistence;
* `metadataModifiedAt` updates;
* mixed technical and metadata changes;
* no-change Save behavior;
* rollback of proposed in-memory version metadata when persistence fails.

If the answer is no or uncertain, the exact gap must be identified.

#### 11.5.6 First Save, Subsequent Save, and No-Change Save

The investigation must separately trace and compare:

* first Save of a newly created Project;
* Save of a previously persisted Project after technical changes;
* Save after metadata-only changes;
* Save after mixed technical and metadata changes;
* Save when no persistent changes exist.

It must determine whether the current implementation distinguishes these cases.

The investigation must identify:

* current state transitions;
* current dirty-state behavior;
* current persistence behavior;
* current timestamp behavior, if any;
* current baseline updates;
* current user-visible behavior;
* relevant automated tests.

No assumption may be made that one generic Save path automatically satisfies all approved v2 semantics.

#### 11.5.7 Update Existing Project Workflow

The investigation must trace the complete Update Existing Project path.

It must determine:

* how the application recognizes an existing writable Project;
* how a file handle is associated with the active Project;
* how update-in-place persistence works;
* whether the same snapshot-construction path is used as ordinary Save;
* how success and failure are determined;
* when dirty state is cleared;
* when the last-saved baseline changes;
* when Recent Projects metadata changes;
* what happens when the existing handle is invalid, stale, unavailable, or no longer writable;
* what fallback behavior exists;
* which automated tests cover this workflow.

The investigation must identify whether canonical v2 Save semantics can be shared safely across first Save and Update Existing Project without breaking existing validated behavior.

#### 11.5.8 Open Workflow, Parsing, Validation, and State Adoption

The complete Open workflow must be traced from file selection to active Project restoration.

The investigation must determine:

* all Open entry points;
* how a file is selected;
* how file content is read;
* where JSON parsing occurs;
* what structural validation currently exists;
* what semantic validation currently exists;
* whether format-version validation exists;
* whether unknown fields are tolerated, ignored, transformed, or rejected;
* whether missing fields are defaulted;
* when active Project state begins to change;
* whether validation occurs before or after state mutation;
* how restoration is triggered;
* whether restoration can partially succeed;
* what happens if parsing fails;
* what happens if validation fails;
* what happens if restoration fails;
* whether the previously active valid Project remains intact after failed Open;
* whether the invalid source file remains untouched;
* how user-facing errors are presented;
* when file handles are retained;
* when Recent Projects metadata is updated.

The investigation must explicitly determine whether current Open behavior is fail-closed.

If it is not, the exact partial-state-adoption or mutation risk must be documented.

#### 11.5.9 Current Validation Model

The investigation must inventory all current Project-file validation behavior.

It must identify:

* schema validators;
* runtime type guards;
* manual property checks;
* default-value insertion;
* compatibility logic;
* format-version checks;
* image-presence checks;
* reference-measurement checks;
* geometry validation;
* calculator-state validation;
* corrupted-input handling;
* unsupported-format handling;
* error types and user-facing messages.

The investigation must distinguish between:

* JSON syntax validity;
* structural schema validity;
* Project creation-threshold validity;
* canonical metadata validity;
* technical-content validity;
* semantic consistency;
* supported-format validity.

It must identify the minimum validation boundary required before a Project may safely become active state.

#### 11.5.10 Current Dirty-State Detection

The investigation must trace the complete dirty-state mechanism.

It must determine:

* where dirty state is calculated;
* whether it is explicit or derived;
* what current state is compared;
* what baseline is used;
* how the baseline is established;
* how the baseline is updated;
* whether primary-image changes participate;
* whether reference changes participate;
* whether geometry changes participate;
* whether calculator inputs participate;
* whether notes participate;
* whether descriptive metadata participates;
* whether Project naming participates;
* whether current equality comparison is shallow, deep, serialized, selective, or custom;
* whether derived data creates false dirty states;
* whether persistent changes can escape detection;
* how dirty state behaves after failed Save;
* how dirty state behaves after successful Save;
* how dirty state behaves after Open.

The investigation must determine whether the current mechanism can support separate classification of:

* technical Project-content changes;
* metadata-only changes;
* Project Structural Capability Snapshot changes;
* mixed changes;
* no persistent changes.

#### 11.5.11 Unsaved-Changes Protection

The investigation must inventory all protections against accidental loss of unsaved Project work.

It must identify:

* route-change protection;
* navigation protection;
* Project-switch protection;
* New Project protection;
* Open Project protection;
* browser unload protection where applicable;
* confirmation dialogs;
* modal behavior;
* cancellation behavior;
* interaction with dirty state;
* behavior for a valid but never-persisted Project;
* behavior after failed Save;
* behavior after successful Save.

The investigation must determine whether introducing the valid-but-unsaved v2 Project lifecycle creates any safety gap.

#### 11.5.12 Primary-Image Serialization Foundation

The investigation must identify the exact existing primary-image persistence mechanism.

It must determine:

* accepted source representation;
* image-selection path;
* encoding path;
* serialized representation;
* JSON-safety;
* decoding and restoration path;
* whether the Project remains valid when the original image file is moved, renamed, or deleted;
* whether image data is duplicated in multiple state locations;
* whether thumbnails exist;
* whether image serialization participates in dirty-state comparison;
* known size or memory behavior;
* existing validation;
* existing tests.

The investigation must not invent image-format, file-size, decoded-dimension, compression, or performance limits.

Those evidence-based decisions belong primarily to Milestone 2.

For Milestone 1, the investigation must determine only whether the existing serialization foundation is compatible with the canonical v2 model and what minimal changes, if any, are required.

#### 11.5.13 Recent Projects Metadata

The investigation must trace the complete Recent Projects mechanism.

It must determine:

* storage location;
* stored fields;
* identity key currently used;
* relationship with file names;
* relationship with file paths;
* relationship with native file handles;
* thumbnail behavior;
* update timing;
* removal behavior;
* stale-entry behavior;
* duplicate behavior;
* behavior after Save;
* behavior after Update Existing Project;
* behavior after Open;
* whether any Recent Projects field currently acts as an accidental authority for Project state.

The investigation must identify any duplication of future canonical v2 fields and determine whether that duplication is harmless convenience metadata or creates conflicting authority.

Complete Local Workspace redesign must not be proposed within Milestone 1 unless a minimal dependency is unavoidable.

#### 11.5.14 IndexedDB File-Handle Retention

The investigation must identify the complete IndexedDB file-handle mechanism.

It must determine:

* database and store names;
* keying strategy;
* write path;
* read path;
* deletion path;
* relationship with Recent Projects;
* relationship with active Project state;
* permission handling;
* stale-handle behavior;
* inaccessible-file behavior;
* browser-support assumptions;
* fallback behavior;
* relevant tests.

The investigation must identify whether introducing permanent `projectId` changes any necessary association strategy.

It must not prematurely redesign Local Workspace file discovery or unavailable-file handling beyond Milestone 1 requirements.

#### 11.5.15 Project Name and Descriptive Metadata

The investigation must determine whether current Project state or persistence already contains:

* Project name;
* notes;
* resin description;
* pigment or color information;
* wood species;
* other descriptive or organizational fields.

For each field, the investigation must identify:

* current owner of state;
* current persisted representation;
* dirty-state behavior;
* Save behavior;
* restoration behavior;
* tests.

The investigation must compare actual field function with the approved technical-versus-metadata classification.

A field must not be classified merely by name or UI presentation if repository evidence shows that it affects calculation, validation, or technical execution.

#### 11.5.16 Calculation Inputs, Results, and Domain Boundaries

The investigation must identify the boundary between canonical Project persistence and validated Resin Calculator behavior.

It must determine:

* which persisted fields are calculation inputs;
* which fields affect technical validation;
* which fields affect execution-related technical behavior;
* which fields are derived calculation results;
* whether derived results are persisted;
* whether restored results are trusted directly or recalculated;
* where calculation logic resides;
* which calculator behaviors are frontend-owned;
* which are backend-owned;
* what tests protect validated algorithms.

The investigation must identify technical Project-content fields based on actual architectural function.

It must not propose rewriting validated calculator algorithms unless a concrete Milestone 1 requirement makes such a change unavoidable.

#### 11.5.17 Existing Identity, Version, Timestamp, and Capability Metadata

The investigation must search the repository comprehensively for any existing concepts or fields corresponding to:

* `projectId`;
* `ownerId`;
* `versionId`;
* `parentVersionId`;
* `ancestorVersionIds`;
* `createdAt`;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* `primaryImageHash`;
* `formatVersion`;
* schema version;
* Project Structural Capability Snapshot;
* equivalent fields under different names.

For each discovered field or concept, the investigation must determine:

* where it is defined;
* where it is generated;
* where it is persisted;
* where it is read;
* whether it is authoritative;
* whether it is partial, transitional, obsolete, or unrelated;
* whether existing tests cover it.

Existing names must not be assumed to satisfy approved semantics merely because they resemble the target architecture.

#### 11.5.18 Existing Project Tests

The investigation must inventory all automated tests relevant to Milestone 1.

The inventory must cover, where applicable:

* Project snapshot construction;
* Save;
* first Save;
* Update Existing Project;
* browser-download fallback;
* Open;
* restoration;
* Recent Projects;
* IndexedDB file handles;
* dirty-state detection;
* unsaved-changes protection;
* primary-image persistence;
* invalid JSON;
* malformed Project structures;
* missing required fields;
* unsupported format versions;
* persistence failure;
* cancellation;
* partial restoration failure;
* calculation-state restoration.

For each relevant test area, the investigation must identify:

* test file;
* behavior protected;
* important assertions;
* whether the test represents current behavior that must be preserved;
* whether approved architecture intentionally requires changed expectations;
* missing coverage relevant to data integrity.

The investigation must not recommend weakening or deleting existing tests merely to ease migration.

#### 11.5.19 Dependency Map Requirements

The investigation report must produce an explicit dependency map for Milestone 1.

The map must show the actual relationships between, where applicable:

* Project workflow entry;
* active Project state;
* primary image;
* reference measurements;
* geometry state;
* calculator state;
* snapshot construction;
* canonical Project representation;
* Save;
* Update Existing Project;
* Open;
* validation;
* restoration;
* dirty state;
* unsaved-changes protection;
* Recent Projects;
* IndexedDB file handles;
* tests.

The dependency map must identify:

* foundational dependencies;
* downstream consumers;
* shared code paths;
* duplicated paths;
* circular or ambiguous dependencies;
* state-transition boundaries;
* migration-sensitive boundaries;
* places where one change could unintentionally affect multiple workflows.

The dependency map must be based on actual repository evidence rather than architectural expectation.

#### 11.5.20 Architecture-to-Repository Gap Analysis

The investigation report must compare the complete Milestone 1 architectural obligations with current repository reality.

For every major obligation, it must classify the current state as one of:

* already satisfied;
* partially satisfied;
* missing;
* conflicting with approved architecture;
* unclear and requiring further evidence.

The comparison must include at least:

* canonical v2 format;
* `formatVersion`;
* Project creation threshold;
* valid-but-unsaved Project state;
* `projectId`;
* `ownerId`;
* `primaryImageHash` foundation;
* `versionId`;
* `parentVersionId`;
* `ancestorVersionIds`;
* `createdAt`;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* Project data classification;
* Project Structural Capability Snapshot foundation;
* first Save semantics;
* technical-change Save semantics;
* metadata-only Save semantics;
* mixed-change Save semantics;
* no-change Save semantics;
* persistence-success boundary;
* strict Open validation;
* fail-closed behavior;
* unsupported-format rejection;
* disposable v1 policy;
* preservation of compatible existing behavior.

Every classification must cite concrete repository evidence.

#### 11.5.21 Migration Boundary Analysis

The investigation must identify every Milestone 1 migration boundary.

For each boundary, it must state:

* current behavior;
* target behavior;
* affected modules or files;
* dependencies;
* temporary coexistence requirements, if any;
* whether dual authority would exist temporarily;
* cutover condition;
* cleanup condition;
* rollback boundary;
* relevant tests;
* risk of data corruption or regression.

Particular attention must be given to migration from the current Project snapshot representation to canonical `.hfzproject` v2.

The investigation must prefer extension and controlled migration over unnecessary replacement.

#### 11.5.22 Safety-Net Gap Analysis

The investigation must identify missing regression protection that should be established before or during data-integrity-sensitive implementation.

Potential safety-net gaps include, but are not limited to:

* persistence failure before in-memory version adoption;
* failed Open preserving the current valid Project;
* malformed JSON;
* structurally invalid v2;
* missing required canonical metadata;
* unsupported format version;
* first Save version semantics;
* technical-only change;
* metadata-only change;
* mixed change;
* no-change Save;
* ancestry construction;
* failed update-in-place;
* browser-download fallback uncertainty;
* valid-but-unsaved Project abandonment protection.

The investigation must distinguish between:

* tests required before risky implementation begins;
* tests that naturally belong inside the implementation task that introduces the new behavior.

It must not create tests or modify code during the read-only investigation.

#### 11.5.23 Blockers and Stop Conditions

The investigation must explicitly identify any blocker that prevents safe Milestone 1 task decomposition.

A blocker exists if evidence shows, for example:

* an approved architectural rule is technically impossible in the current application structure;
* two approved architectural rules are contradictory;
* current Save behavior cannot reliably distinguish success from failure;
* current state ownership makes version transitions unsafe or ambiguous;
* failed Open can irreversibly destroy current active Project state and no controlled migration path is apparent;
* a major product decision is missing;
* a later milestone must unexpectedly be implemented first;
* rollback safety cannot be reasonably established;
* unrelated repository state prevents isolated implementation.

If no blocker exists, the report must state this explicitly.

A risk, inconvenience, refactoring need, or missing test is not automatically a blocker.

#### 11.5.24 Future-Scope Boundary Check

The investigation must identify any temptation to expand Milestone 1 into later milestone scope.

It must explicitly prevent premature implementation of:

* evidence-based image limits and full image hardening from Milestone 2;
* production identity integration from Milestone 3;
* ownership enforcement and foreign-owned read-only UX from Milestone 4;
* full capability resolution and enforcement from Milestone 5;
* complete Local Workspace behavior from Milestone 6;
* operational Cloud Workspace;
* synchronization;
* conflict resolution.

If a minimal later-milestone dependency is genuinely unavoidable, the investigation must explain:

* why it is unavoidable;
* the minimum required scope;
* why deferral would make Milestone 1 unsafe or impossible;
* whether explicit architectural or Product Owner approval is required.

#### 11.5.25 Required Investigation Report Structure

The read-only repository investigation report must use a structured format containing at least:

1. Executive Summary;
2. Repository State Verification;
3. Current `.hfzproject` Representation;
4. Project Snapshot Construction;
5. Current Project Lifecycle and State Ownership;
6. Save and Persistence-Success Analysis;
7. First, Subsequent, Metadata-Only, Mixed, and No-Change Save Analysis;
8. Update Existing Project Analysis;
9. Open, Validation, and State-Adoption Analysis;
10. Dirty-State Analysis;
11. Unsaved-Changes Protection Analysis;
12. Primary-Image Serialization Analysis;
13. Recent Projects Analysis;
14. IndexedDB File-Handle Analysis;
15. Project Metadata and Data-Classification Analysis;
16. Calculator and Domain-Boundary Analysis;
17. Existing Identity, Version, Timestamp, Hash, Format, and Capability Metadata;
18. Existing Test Inventory;
19. Dependency Map;
20. Architecture-to-Repository Gap Matrix;
21. Migration Boundaries;
22. Safety-Net Gaps;
23. Risks;
24. Blockers and Stop Conditions;
25. Future-Scope Boundary Check;
26. Recommended Milestone 1 Task Decomposition Inputs.

The final section must provide inputs for later task decomposition.

It must not prematurely invent or authorize the final Milestone 1 task list before the investigation evidence has been reviewed.

#### 11.5.26 Evidence Standard

Every important repository claim must be supported by concrete evidence.

Evidence should identify, where applicable:

* file path;
* function, class, hook, component, service, schema, or test name;
* relevant line or code region where practical;
* observed behavior;
* relationship to the approved architectural obligation.

The report must clearly distinguish:

* verified fact;
* inference;
* recommendation;
* unresolved question.

Uncertainty must be stated explicitly.

Repository evidence must not be overstated.

#### 11.5.27 Investigation Completion Criteria

The Milestone 1 repository investigation is complete only when:

* current repository state is verified;
* unrelated repository work is confirmed protected;
* the complete current Project persistence workflow is mapped;
* Save success and failure boundaries are understood;
* Open validation and state-adoption boundaries are understood;
* current Project lifecycle and state ownership are understood;
* snapshot construction and restoration are understood;
* dirty-state and unsaved-changes behavior are understood;
* primary-image serialization is understood sufficiently for Milestone 1;
* Recent Projects and IndexedDB handle dependencies are understood;
* relevant automated tests are inventoried;
* the dependency map is complete;
* every major Milestone 1 architectural obligation is compared against repository reality;
* migration boundaries are identified;
* safety-net gaps are identified;
* blockers are identified or explicitly ruled out;
* later-milestone scope boundaries are protected;
* sufficient evidence exists to perform safe Milestone 1 task decomposition.

#### 11.5.28 Authoritative Investigation Rule

The authoritative rule is:

**Milestone 1 task decomposition must be based on verified repository reality rather than assumptions. The investigation must remain strictly read-only, protect unrelated repository work, trace the complete Project persistence lifecycle, identify dependencies and migration boundaries, compare every major architectural obligation with actual implementation, expose safety-net gaps and blockers, and provide sufficient evidence for the smallest safe sequence of independently verifiable implementation tasks without prematurely implementing or inventing them.**
### 11.6 Repository Investigation Findings

The Milestone 1 read-only repository investigation has been completed.

The investigation examined the actual HFZWood repository against:

* the approved Phase 4 Product Architecture;
* the approved Phase 5 Technical Architecture;
* the Phase 6 implementation principles and Task Execution Workflow;
* the Milestone 1 objective;
* the complete Milestone 1 architectural obligations;
* the approved preservation boundaries;
* the repository-investigation requirements defined in Section 11.5.

The investigation remained read-only.

No Milestone 1 implementation was started.

No production code was created or modified.

No documentation was modified by the investigation.

No files were staged, committed, or pushed.

The repository evidence is sufficient to continue Milestone 1 planning.

No blocker has been identified that prevents dependency mapping, safety-net analysis, or evidence-based task decomposition.

#### 11.6.1 Repository State at Investigation Time

At the time of investigation:

* the active branch was `main`;
* HEAD was `1b5ae97` — `Phase 6 M0: record formal Milestone 0 closure`;
* no staged changes were present.

The known unrelated pre-existing repository work remained present and untouched:

* modified `dev.cmd`;
* deleted `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* untracked `documentation/Arthur-project-handover.md`;
* untracked `documentation/external-architecture-review.md`;
* untracked `frontend/.env.local`.

The investigation also identified one expected additional tracked modification:

* modified `documentation/phase-6-implementation-plan.md`.

This additional modification contains the current local Milestone 1 planning work introduced after formal Milestone 0 closure.

It is therefore expected planning state rather than an unexplained repository discrepancy.

This file must remain isolated from unrelated repository work and must be handled explicitly according to the approved Phase 6 documentation and commit discipline.

#### 11.6.2 Existing Project Persistence Foundation

The repository contains a substantial working Project persistence foundation that must be evolved rather than unnecessarily replaced.

The principal existing foundations include:

* Project snapshot construction in `frontend/src/calculator/ResinCalculator.jsx`;
* Save and Update Existing Project orchestration in `frontend/src/workspace/NewProjectWorkspace.jsx`;
* Project Open entry behavior in `frontend/src/workspace/ProjectsPage.jsx`;
* Project file persistence in `frontend/src/workspace/projectFileSave.js`;
* Project file parsing in `frontend/src/workspace/projectFileParse.js`;
* current Project lifecycle representation in `frontend/src/workspace/currentProject.js`;
* dirty-state logic;
* Project snapshot comparison;
* unsaved-changes protection;
* Recent Projects metadata;
* IndexedDB-backed native file-handle retention;
* primary-image serialization and restoration;
* validated Resin Calculator domain logic;
* substantial automated test coverage across Project Save, Open, Update, restoration, dirty-state, Recent Projects, file handles, and unsaved-changes behavior.

The repository evidence supports the architectural preservation principle:

**Milestone 1 should extend existing validated Project persistence foundations rather than replace them with a parallel architecture or unnecessary rewrite.**

#### 11.6.3 Current `.hfzproject` Format

The current persisted Project format is explicitly version 1.

The repository defines:

`HFZ_PROJECT_FORMAT_VERSION = 1`

The current Project payload contains:

* `format`;
* `formatVersion`;
* `projectName`;
* `savedAt`;
* a flat spread of calculator snapshot fields.

The current calculator snapshot contains, among other data:

* application version information;
* primary image data;
* UI state;
* calibration and reference measurements;
* standard resin-area data;
* wood-boundary, mold, cavity, depth, layer, and mix-ratio data;
* Project notes;
* calculation result data.

The primary image is currently embedded in the Project file as `image.dataUrl`.

The current v1 format does not contain the canonical metadata required by Milestone 1, including:

* `projectId`;
* `ownerId`;
* `versionId`;
* `parentVersionId`;
* `ancestorVersionIds`;
* `createdAt`;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* `primaryImageHash`;
* Project Structural Capability Snapshot.

The current representation therefore provides useful persistence content but does not satisfy the approved canonical `.hfzproject` v2 architecture.

#### 11.6.4 Current Project Snapshot Construction

The current Project snapshot is constructed by `buildProjectSnapshot()` in `ResinCalculator.jsx`.

This snapshot is already the common source for the principal Project Save paths and is consumed by:

* new Project Save;
* Update Existing Project;
* Project file payload construction;
* dirty-state comparison for opened Projects;
* Project restoration-related workflows.

Repository evidence indicates that this existing snapshot mechanism is a strong preservation candidate and likely extension point.

However, the current snapshot is not itself the complete canonical Project model.

Milestone 1 must not assume that simply adding fields ad hoc to the existing flat snapshot is sufficient.

The canonical v2 boundary must preserve the existing validated calculator-state collection while making Project identity, ownership metadata, technical versioning, ancestry, timestamps, data classification, capability-snapshot metadata, and validation semantics explicit.

#### 11.6.5 Current Project Lifecycle and Creation Threshold Gap

The current application does not implement the approved canonical Project creation threshold.

Today:

* a new workspace begins without permanent Project identity;
* no `projectId` exists;
* no Project-level `ownerId` exists;
* no `createdAt` exists;
* no `primaryImageHash` exists;
* Project validity is primarily enforced at Save time;
* the current Save workflow requires a primary image and Project name.

The approved architecture requires a Project to become technically valid when:

* one primary image exists;
* at least one reference measurement exists.

At the first moment this threshold is satisfied, the canonical Project must receive:

* `projectId`;
* `ownerId`;
* `primaryImageHash`;
* `createdAt`.

A valid Project may then exist in application memory before its first successful persistence.

The current repository therefore lacks:

* creation-threshold detection for canonical Project identity;
* valid-but-unsaved canonical Project state;
* persistent identity before first Save;
* the distinction between Project creation and first successful persistence.

This is a major Milestone 1 implementation gap.

#### 11.6.6 Current State Ownership

Current Project-related state is distributed across several existing layers.

`ResinCalculator.jsx` owns substantial calculator and session state, including:

* primary image;
* geometry;
* calibration;
* reference measurements;
* notes;
* calculation result.

`NewProjectWorkspace.jsx` owns important orchestration state, including:

* dirty state;
* Save and Open orchestration;
* current Project context;
* baseline snapshot handling;
* unsaved-changes behavior.

`currentProject.js` currently represents the active Project primarily as:

* a new Project; or
* an opened Project associated with Recent Projects metadata and, where available, a file handle.

Recent Projects and IndexedDB file handles provide device-local convenience and update-in-place behavior.

They are not canonical Project identity.

Repository evidence shows that Milestone 1 must introduce canonical Project identity and version metadata without conflating them with:

* Recent Projects entry IDs;
* file names;
* file paths;
* native file handles;
* device-local convenience metadata.

The existing distributed state structure does not itself constitute a blocker.

However, implementation must establish an unambiguous owner for canonical Project lifecycle metadata so that identity, version, ancestry, timestamp, and persistence-success transitions remain internally consistent.

#### 11.6.7 Current Save Foundation

The existing Save foundation is substantial and should be preserved.

The repository currently supports:

* first Save;
* native File System Access API persistence where supported;
* browser-download fallback;
* Update Existing Project through a retained writable file handle;
* Save from unsaved-changes protection;
* Recent Projects updates;
* dirty-state clearing after successful Save workflow completion.

The existing native file-write path has an important positive property:

**The application completes successful-Save handling only after the native persistence promise resolves successfully.**

This provides a useful foundation for later canonical version and timestamp transitions.

However, the current Save pipeline does not yet distinguish:

* first persistent Save;
* technical-content Save;
* metadata-only Save;
* mixed technical and metadata Save;
* no-change Save.

It also does not implement:

* `versionId`;
* ancestry advancement;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* canonical no-change semantics.

These are expected Milestone 1 gaps.

#### 11.6.8 Browser-Download Fallback Conflict

The repository investigation identified one direct conflict between current behavior and the approved Technical Architecture.

When the native File System Access API is unavailable, the current browser-download fallback:

* initiates a browser download;
* immediately returns a successful result to the application;
* allows successful-Save completion;
* clears dirty state;
* adopts a new saved baseline.

The browser does not provide technical confirmation that the user actually retained the downloaded file.

The approved architecture requires that download initiation alone must not be treated as confirmed persistence.

Therefore, the current browser-download fallback conflicts with the approved persistence-success boundary.

Milestone 1 must resolve this conflict without weakening existing unsaved-work protection.

The exact repository-specific implementation mechanism must be determined through task-level Pre-Implementation Analysis.

No unconfirmed browser download may permanently advance canonical Project version state, ancestry, timestamps, or saved baseline as if persistence had been technically confirmed.

#### 11.6.9 Current Save Classification Gap

The current implementation treats the Project snapshot as one persistence unit.

It does not distinguish between:

* technical Project-content changes;
* descriptive or organizational metadata changes;
* Project Structural Capability Snapshot changes;
* mixed changes;
* no persistent changes.

The current dirty-state mechanism can detect broad Project differences, but it does not provide the approved technical-versus-metadata versioning semantics.

As a result, the repository does not yet support the required rules:

* technical change → new `versionId`;
* metadata-only change → same `versionId`, unchanged technical ancestry, updated `metadataModifiedAt`;
* capability-snapshot-only change → metadata persistence without technical version advancement;
* mixed change → technical version advancement plus applicable metadata timestamp update;
* no persistent change → no artificial version, ancestry, or timestamp change.

This distinction must become explicit and testable.

#### 11.6.10 Current No-Change Save Behavior

The current Update Existing Project path may rewrite the Project file when Save is invoked even if no persistent Project data has changed.

The existing snapshot-equality mechanism is used for dirty-state detection but is not currently an authoritative Save-classification engine.

The approved architecture requires that a no-change Save must not create artificial Project history.

Milestone 1 must ensure that invoking Save without a real persistent change does not:

* generate a new `versionId`;
* advance ancestry;
* update `lastModifiedAt`;
* update `metadataModifiedAt` merely because Save was invoked.

Whether the physical file write itself should always be skipped in every no-change case is an implementation detail to be determined from repository evidence and task-level analysis.

The architectural requirement is that no false canonical history may be created.

#### 11.6.11 Current Open and Validation Foundation

The current Open workflow provides a useful but incomplete foundation.

Today, Project Open includes:

* file selection;
* file reading;
* JSON parsing;
* limited validation;
* Recent Projects interaction;
* navigation into the workspace;
* Project restoration.

Current validation checks primarily:

* that the file contains a valid JSON object;
* that `image.dataUrl` exists as a non-empty string.

The current implementation does not strictly validate:

* supported Project format;
* `formatVersion`;
* canonical v2 metadata;
* Project identity;
* ownership metadata;
* version identity;
* ancestry;
* required timestamps;
* capability-snapshot metadata;
* complete canonical structure;
* semantic consistency.

Therefore, strict canonical v2 validation is missing.

#### 11.6.12 Fail-Closed Open Status

Current Open behavior is partially fail-closed.

Positive existing behavior includes:

* parsing failure can prevent navigation;
* an image-loading error does not complete the normal successful restoration path.

However, the investigation identified important uncertainty and risk around:

* incomplete schema validation;
* restoration-time failures;
* potential synchronous exceptions during restoration;
* whether every failure path preserves the previously active valid Project without partial mutation.

Milestone 1 must establish the authoritative rule:

**A Project file must be fully accepted as a supported and valid canonical v2 representation before it is adopted as active Project state.**

A failed Open must not:

* partially replace active valid Project state;
* leave an ambiguous mixed state;
* modify the invalid source file;
* silently reinterpret unsupported structures.

Targeted safety-net coverage is required before or during implementation of this boundary.

#### 11.6.13 Current Dirty-State Foundation

The existing dirty-state system is a valuable preservation boundary.

It currently supports:

* meaningful-work detection;
* opened-Project baseline comparison;
* unsaved-changes protection;
* dirty-state clearing after successful Save;
* restoration-related baseline behavior.

Existing tests already protect important behavior, including:

* image upload alone does not make the Project dirty;
* meaningful Project work does;
* notes and technical changes can participate in dirty detection;
* opened Projects become dirty after subsequent changes.

However, current dirty-state detection does not classify changes according to canonical v2 versioning semantics.

Milestone 1 must preserve existing unsaved-change protection while adding sufficient classification to distinguish:

* technical changes;
* metadata-only changes;
* capability-snapshot metadata changes;
* mixed changes;
* no persistent changes.

A change may require persistence even when it does not generate a new technical `versionId`.

#### 11.6.14 Existing Unsaved-Changes Protection

The current application contains tested unsaved-changes protection based on dirty state and route blocking.

Existing verified behavior includes:

* meaningful unsaved work triggers protection;
* Cancel keeps the user in the workspace;
* Discard resets or abandons the current work as intended;
* Save routes through the applicable Save workflow;
* failed Save keeps the workspace open.

This is a strong preservation boundary.

The introduction of valid-but-unsaved canonical Project state must not weaken this protection.

The investigation did not find an explicit browser-tab-close or `beforeunload` protection mechanism in the relevant workspace code.

This absence is not currently classified as a Milestone 1 blocker.

Its exact scope must be evaluated separately and must not be allowed to expand Milestone 1 without architectural justification.

#### 11.6.15 Primary-Image Persistence Foundation

The current Project snapshot stores the primary image as embedded `image.dataUrl` data.

The existing implementation already provides:

* JSON-safe image serialization;
* Project portability independent of the original source image path;
* image restoration from persisted Project data.

This is a valuable preservation foundation.

The current repository does not implement `primaryImageHash`.

Milestone 1 must establish the canonical `primaryImageHash` foundation required by the approved architecture.

However, Milestone 1 must not prematurely expand into:

* evidence-based source-file-size limits;
* decoded-dimension limits;
* supported-format policy;
* realistic phone-photo performance limits;
* complete image-import hardening.

Those responsibilities remain primarily in Milestone 2.

#### 11.6.16 Recent Projects and File-Handle Foundations

The current Recent Projects mechanism is device-local convenience metadata.

It currently stores information including:

* Recent entry ID;
* Project name;
* last-opened timestamp;
* last-saved timestamp;
* last-known file name;
* source format.

The current Recent entry ID is not and must not become canonical `projectId`.

IndexedDB stores native file handles keyed to Recent entry IDs and supports Update Existing Project where a writable handle remains available.

These mechanisms are useful preservation foundations.

Milestone 1 must avoid conflating:

* canonical Project identity;
* Recent Projects identity;
* native file-handle identity;
* file name;
* file path.

Complete Local Workspace behavior remains a later milestone responsibility.

Milestone 1 should make only the minimum changes required to preserve compatibility with canonical v2 persistence.

#### 11.6.17 Current Project Data Classification Findings

The repository currently persists Project state largely as one flat snapshot without an explicit architectural classification layer.

Repository evidence supports the following current classifications:

Technical Project content includes, at minimum:

* reference measurements;
* reference measurement values;
* formwork geometry;
* wood geometry;
* cavity geometry;
* depth information;
* pour-layer configuration;
* resin mix ratio;
* calculation-affecting parameters.

Descriptive or organizational metadata includes, at minimum:

* Project name;
* free-form Project notes, unless a future Project Tool consumes them as technical input;
* descriptive material information that does not affect calculation logic.

Calculation results are currently persisted as part of the snapshot.

UI rotation and zoom are also currently persisted.

The exact canonical classification of:

* persisted calculation results;
* UI rotation;
* UI zoom;
* other display-state fields

requires explicit technical resolution before final canonical schema implementation.

These are technical classification questions unless they reveal a genuine product-behavior trade-off.

They should not be delegated to the Product Owner merely as low-level implementation choices.

#### 11.6.18 Existing Identity and Metadata Findings

The current repository does not contain canonical Project-level implementations of:

* `projectId`;
* `ownerId`;
* `versionId`;
* `parentVersionId`;
* `ancestorVersionIds`;
* `createdAt`;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* `primaryImageHash`;
* Project Structural Capability Snapshot.

The repository does contain:

* `formatVersion`, currently set to version 1;
* device-local Recent Projects entry IDs;
* account/session-level capability information;
* an existing mock authentication user identity.

These existing concepts must not be assumed to satisfy canonical v2 semantics merely because similar data exists elsewhere in the application.

#### 11.6.19 `ownerId` Sequencing Constraint

The repository contains an existing mock authentication user ID that could technically provide an interim identity value.

However, Milestone 1 must not automatically establish a disposable mock identifier such as `"stub-user"` as permanent canonical Project ownership without explicit technical justification.

The approved architecture requires:

* one stable `ownerId` per valid Project;
* persistent ownership metadata in `.hfzproject`;
* later production identity derivation from the approved authentication architecture.

Production identity integration belongs to Milestone 3.

Therefore, Milestone 1 task decomposition must explicitly resolve how the canonical `ownerId` field is introduced without:

* creating accidental permanent dependence on mock identity;
* inventing a second production identity system;
* prematurely implementing Milestone 3;
* weakening the approved ownership architecture.

This sequencing constraint is not currently a blocker for Milestone 1 planning.

It is a technical dependency that must be resolved before the relevant implementation task is authorized.

#### 11.6.20 Project Structural Capability Snapshot Foundation

The current repository contains account/session-level capability information but no Project-level Structural Capability Snapshot.

Milestone 1 must establish the canonical Project metadata field and persistence boundary required by the approved architecture.

Milestone 1 must not implement complete capability enforcement.

The required foundation must preserve the distinction between:

* current account capabilities;
* Project Structural Capability Snapshot;
* later effective-capability resolution.

Complete Product Capability enforcement remains a Milestone 5 responsibility.

#### 11.6.21 Existing Automated Test Foundation

The repository contains substantial Project-related automated coverage.

Existing tests protect, among other areas:

* Project payload construction;
* native Save;
* browser-download fallback;
* Update Existing Project;
* Save cancellation;
* basic Project parsing;
* missing-image rejection;
* snapshot equality;
* dirty-state rules;
* in-place update eligibility;
* Recent Projects behavior;
* Project Open;
* file-handle rebind behavior;
* Save success and failure;
* workspace restoration;
* unsaved-changes protection.

These tests are a strict preservation boundary.

They must not be weakened or deleted merely to simplify v2 migration.

Where approved architecture intentionally changes behavior, tests may be updated only with explicit justification and equivalent or stronger regression protection.

#### 11.6.22 Safety-Net Gaps

The repository investigation identified important safety-net gaps relevant to Milestone 1.

High-priority gaps include:

* browser-download fallback currently treated as confirmed successful persistence;
* no strict `formatVersion: 2` enforcement;
* no canonical v2 schema-validation tests;
* no identity, version, or ancestry tests;
* no technical-versus-metadata Save classification tests;
* no persistence-failure-before-version-adoption tests;
* no explicit ancestry-construction tests.

Additional gaps include:

* no explicit failed-Open preservation test proving that an active valid Project remains intact;
* limited malformed-input coverage;
* no no-change Save semantics tests;
* no creation-threshold identity tests;
* no valid-but-unsaved canonical Project lifecycle tests;
* no explicit browser-tab-close protection identified.

These gaps do not all require one preliminary safety-net task.

Task decomposition must distinguish between:

* regression tests that must exist before a risky implementation begins;
* tests that naturally belong inside the task introducing new behavior.

#### 11.6.23 Migration Boundaries

The investigation identified the principal Milestone 1 migration boundaries:

* Project format version: v1 → v2;
* current flat Project payload → canonical v2 representation;
* no canonical identity → threshold-created Project identity;
* `savedAt` semantics → distinct canonical timestamps;
* no technical versioning → `versionId` and ancestry;
* minimal Open validation → strict v2 validation;
* monolithic dirty-state comparison → persistence-aware change classification;
* browser-download initiation treated as Save success → architecture-compliant persistence confirmation;
* current v1-oriented test fixtures → canonical v2 test coverage.

The approved pre-launch policy allows direct cutover to v2.

Milestone 1 does not require:

* v1 backward compatibility;
* v1 automatic migration;
* parallel v1 and v2 persistence authorities.

The migration should preserve compatible working foundations and avoid unnecessary dual authority.

#### 11.6.24 Dependency Findings

Repository evidence identifies several foundational dependency relationships.

The existing Project snapshot construction feeds:

* new Project Save;
* Update Existing Project;
* Project payload construction;
* opened-Project dirty-state comparison.

The Project parsing path feeds all Project Open workflows.

The current Save and Update workflows share the same payload-construction foundation.

Dirty state and baseline management affect:

* Save behavior;
* Update behavior;
* unsaved-changes protection;
* navigation protection.

Recent Projects and IndexedDB file handles affect:

* reopening;
* Update Existing Project eligibility;
* device-local Project continuity.

The most migration-sensitive boundaries are:

* canonical Project state ownership;
* Project creation-threshold identity assignment;
* payload construction;
* persistence-success adoption;
* Save change classification;
* Open validation before state adoption;
* post-Save baseline establishment.

These dependencies must determine task order.

Task order must not be based merely on document order or convenience.

#### 11.6.25 Unresolved Technical Questions

The investigation identified four unresolved questions requiring explicit resolution before or during task decomposition:

1. the exact canonical v2 JSON schema layout;
2. whether persisted calculation `result` remains authoritative persisted data or is treated as derived data;
3. the canonical classification of persisted UI rotation and zoom state;
4. whether browser-tab-close or `beforeunload` protection belongs within Milestone 1 scope.

These questions are not currently blockers.

The first three are primarily technical architecture questions and should be resolved from:

* approved product meaning;
* approved technical guarantees;
* repository evidence;
* data integrity;
* portability;
* restoration behavior;
* versioning semantics;
* preservation requirements.

They should not be delegated to the Product Owner unless a genuine product-behavior trade-off emerges.

The fourth question must be evaluated against existing unsaved-work protection and milestone scope.

It must not expand Milestone 1 automatically.

#### 11.6.26 Risks

The principal Milestone 1 risks identified by repository evidence are:

* schema creep caused by adding v2 fields ad hoc without one explicit canonical representation;
* accidental dual authority between canonical `projectId` and Recent Projects entry IDs;
* versioning errors caused by insufficient technical-versus-metadata change classification;
* false persisted history if version metadata is adopted before persistence success;
* loss of unsaved-work protection through browser-download fallback;
* partial or ambiguous state adoption during failed Open;
* excessive test-fixture churn;
* accidental expansion into Milestones 2–6;
* accidental dependence on mock identity for permanent Project ownership;
* unnecessary rewriting of validated Project persistence or calculator foundations.

These risks are manageable through controlled task decomposition, targeted safety nets, explicit persistence boundaries, and isolated implementation.

#### 11.6.27 Blocker Assessment

The read-only repository investigation identified no blocker preventing continued Milestone 1 planning or safe task decomposition.

The following findings are implementation gaps, not blockers:

* missing canonical v2 fields;
* missing Project identity;
* missing versioning and ancestry;
* missing timestamp semantics;
* missing Project Structural Capability Snapshot;
* weak current Open validation;
* browser-download fallback conflict;
* missing safety-net coverage;
* current v1-oriented test fixtures.

The unresolved technical questions identified in Section 11.6.25 do not currently prevent planning from continuing.

If later task-level analysis reveals a genuine architectural contradiction, unsafe state-ownership boundary, unresolved production-identity dependency, or inability to preserve data integrity, work must stop at that boundary.

#### 11.6.28 Future-Scope Boundary

Milestone 1 must not expand into:

* Milestone 2 image-import limits and complete image hardening;
* Milestone 3 production authentication;
* Milestone 4 authoritative ownership enforcement and foreign-owned read-only UX;
* Milestone 5 complete Product Capability resolution and enforcement;
* Milestone 6 complete Local Workspace behavior;
* operational Cloud Workspace;
* synchronization;
* user-facing conflict resolution.

Minimal foundations required by the canonical Project model may be introduced only where explicitly justified.

A future-milestone concept being represented as canonical metadata does not authorize implementation of that future milestone's complete behavior.

#### 11.6.29 Planning Consequence

The repository investigation provides sufficient evidence to proceed to dependency mapping.

Milestone 1 task decomposition must not yet be derived directly from the investigation report's suggested A–K implementation inputs.

Those inputs are evidence-based recommendations, not approved tasks.

Before final task decomposition, Milestone 1 planning must:

1. establish the authoritative dependency map;
2. resolve or correctly sequence unresolved technical questions;
3. identify which safety-net gaps require protection before risky implementation;
4. identify the smallest safe migration sequence;
5. preserve existing validated behavior;
6. isolate the `ownerId` sequencing dependency;
7. prevent premature expansion into later milestones;
8. then decompose implementation into small, independently verifiable tasks with explicit acceptance criteria and rollback boundaries.

#### 11.6.30 Authoritative Investigation Conclusion

The authoritative conclusion is:

**The existing HFZWood repository contains a substantial, tested, and reusable Project persistence foundation. Milestone 1 does not require a rewrite. It requires a controlled migration from the current v1 persistence model to one canonical `.hfzproject` v2 representation with explicit Project identity, ownership metadata, technical versioning, ancestry, timestamps, Project data classification, capability-snapshot metadata, strict validation, and architecture-compliant persistence-success semantics. The principal risks are concentrated at canonical state ownership, creation-threshold identity, Save classification, persistence-success adoption, browser-download fallback, strict Open validation, and the sequencing of ownership metadata before production identity. No blocker prevents continued planning. Dependency mapping must now determine the smallest safe implementation order before task decomposition begins.**
### 11.7 Dependency Map

The Milestone 1 dependency map is derived from:

* the approved Product Architecture;
* the approved Phase 5 Technical Architecture;
* the Milestone 1 architectural obligations;
* the preservation boundaries;
* the completed read-only repository investigation;
* the architecture-to-repository gap analysis.

Its purpose is to establish the actual implementation dependency order before task decomposition begins.

The dependency map does not itself define final implementation tasks.

It identifies:

* foundational concepts that must exist before downstream behavior can be implemented safely;
* repository paths shared by multiple workflows;
* migration-sensitive boundaries;
* safety-net dependencies;
* technical questions that must be resolved before dependent implementation begins;
* later-milestone boundaries that must not be crossed prematurely.

The authoritative dependency principle is:

**Implementation order must follow data integrity, state ownership, persistence, validation, and rollback dependencies rather than document order, UI convenience, or superficial code locality.**

#### 11.7.1 Existing Repository Dependency Chain

The current Project persistence workflow can be represented conceptually as:

`Project workflow entry`

→ `ResinCalculator session state`

→ `buildProjectSnapshot()`

→ `Project payload construction`

→ `Save / Update Existing Project persistence`

→ `successful-Save completion`

→ `dirty-state baseline adoption`

→ `Recent Projects update`

The current Open workflow can be represented conceptually as:

`Project file selection`

→ `file reading`

→ `JSON parsing`

→ `minimal current validation`

→ `Recent Projects interaction`

→ `navigation into workspace`

→ `Project restoration`

→ `active Project state adoption`

→ `opened-Project baseline establishment`

The current unsaved-work protection chain is:

`Project state changes`

→ `dirty-state detection or snapshot comparison`

→ `isProjectDirty`

→ `navigation blocker`

→ `Unsaved Changes dialog`

→ `Save / Discard / Cancel behavior`

The current Update Existing Project chain is:

`opened Project`

→ `Recent Projects entry`

→ `IndexedDB-retained file handle`

→ `writable-handle eligibility`

→ `Project snapshot construction`

→ `updateProjectFile()`

→ `successful-Save completion`

→ `baseline adoption`

These existing chains must be preserved where compatible with the approved architecture.

#### 11.7.2 Canonical Schema Is a Foundational Dependency

The canonical `.hfzproject` v2 representation is foundational.

Before downstream v2 persistence behavior can be implemented safely, the repository must have one explicit canonical definition of:

* `formatVersion`;
* Project identity metadata;
* ownership metadata;
* technical version metadata;
* ancestry metadata;
* timestamps;
* primary-image integrity metadata;
* Project Structural Capability Snapshot;
* technical Project content;
* descriptive and organizational metadata;
* derived metadata where persisted;
* the relationship between canonical metadata and the existing calculator snapshot.

The exact canonical schema must be defined before:

* v2 Save payload assembly;
* strict v2 Open validation;
* v2 round-trip testing;
* technical-versus-metadata change classification;
* version advancement;
* ancestry construction;
* canonical timestamp transitions.

No downstream implementation should add v2 fields independently in multiple modules before one canonical representation exists.

This prevents schema creep and competing definitions of Project state.

#### 11.7.3 Data Classification Precedes Save Versioning

The approved Save semantics depend on knowing whether a persistent change is:

* technical;
* metadata-only;
* Project Structural Capability Snapshot metadata;
* mixed;
* nonexistent.

Therefore, canonical Project data classification must be resolved before the Save pipeline can correctly implement:

* new `versionId` generation;
* unchanged `versionId` for metadata-only changes;
* ancestry advancement;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* mixed-change behavior;
* no-change Save behavior.

The unresolved classification of:

* calculation `result`;
* UI rotation;
* UI zoom;
* other persisted display-state fields

must be resolved before those fields participate in authoritative change classification.

The classification decision should be derived technically from actual field function.

A field that affects calculation, technical validation, or execution-related behavior must be treated as technical content.

A field that is purely descriptive, organizational, or display-oriented must not create technical Project history merely because it is persisted.

#### 11.7.4 Canonical State Ownership Precedes Lifecycle Transitions

The current repository distributes Project-related state across:

* `ResinCalculator.jsx`;
* `NewProjectWorkspace.jsx`;
* `currentProject.js`;
* Recent Projects metadata;
* IndexedDB file-handle storage.

Milestone 1 must establish an unambiguous owner for canonical Project lifecycle metadata before implementing transitions involving:

* `projectId`;
* `ownerId`;
* `primaryImageHash`;
* `createdAt`;
* `versionId`;
* `parentVersionId`;
* `ancestorVersionIds`;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* Project Structural Capability Snapshot.

This does not require replacing existing calculator state ownership.

The dependency requirement is narrower:

**Canonical lifecycle metadata must have one authoritative in-memory owner so that identity, versioning, ancestry, timestamps, and persistence-success transitions cannot diverge across competing state locations.**

The exact repository-specific ownership mechanism must be determined through task-level Pre-Implementation Analysis.

No new global state-management framework is justified merely by this requirement.

#### 11.7.5 Creation Threshold Depends on Canonical State Ownership

Creation-threshold behavior depends on the existence of an authoritative canonical Project lifecycle state.

The approved threshold is:

* one primary image exists;
* at least one reference measurement exists.

When this threshold is first satisfied, the Project must receive:

* `projectId`;
* `ownerId`;
* `primaryImageHash`;
* `createdAt`.

Therefore, creation-threshold implementation depends on:

1. canonical metadata definition;
2. canonical in-memory state ownership;
3. a reliable signal that the threshold has been crossed;
4. stable local UUID generation;
5. a resolved ownership-metadata strategy;
6. a defined primary-image hash representation.

Creation-threshold implementation must not depend on first Save.

Project creation and first persistence are separate lifecycle events.

#### 11.7.6 `ownerId` Has an Explicit Sequencing Dependency

Canonical Project creation requires `ownerId`.

Production identity derivation belongs to Milestone 3.

The repository currently exposes a mock authentication identity, but Milestone 1 must not accidentally establish a disposable mock value as permanent production ownership without a controlled architectural boundary.

Therefore, the `ownerId` dependency must be resolved before creation-threshold identity assignment is implemented.

The resolution must satisfy all of the following:

* Milestone 1 establishes the canonical `ownerId` field;
* Milestone 1 does not invent a second production identity system;
* Milestone 1 does not prematurely implement production authentication;
* temporary development identity must not silently become irreversible production ownership;
* Milestone 3 must retain a safe path to authoritative production identity derivation.

If this cannot be satisfied through a narrow technical boundary, work must stop before the relevant implementation task.

This is a sequencing constraint, not currently a Milestone 1 blocker.

#### 11.7.7 `primaryImageHash` Depends on One Authoritative Image Representation

The current Project representation persists the primary image as `image.dataUrl`.

Before `primaryImageHash` is implemented, the authoritative input to hashing must be defined.

The hash must be deterministic for the same authoritative stored primary-image representation.

Therefore, hash implementation depends on:

* preserving or explicitly defining the authoritative stored image representation;
* defining deterministic hash input;
* ensuring the hash can be generated locally;
* ensuring the hash does not depend on original file path, file name, or external source availability.

Milestone 1 must not expand this dependency into Milestone 2 image-limit policy.

The hash foundation must remain separate from:

* source-file-size limits;
* decoded-dimension limits;
* supported-format restrictions;
* compression policy;
* realistic phone-photo performance limits.

#### 11.7.8 First Persistent Version Depends on Valid Canonical Project State

The first persistent `versionId` must not exist merely because the Project crossed the creation threshold.

First persistent version creation depends on:

1. a valid canonical in-memory Project;
2. explicit user Save initiation;
3. canonical v2 payload construction;
4. successful persistence according to the applicable persistence boundary.

Only after successful persistence may the Project authoritatively adopt:

* first `versionId`;
* `parentVersionId = null`;
* `ancestorVersionIds = []`;
* first `lastModifiedAt`.

This dependency prevents Project creation from being conflated with persistence.

#### 11.7.9 Save Classification Precedes Version Transition

A proposed Save must be classified before canonical version metadata is advanced.

The Save pipeline must determine whether the Save contains:

* first persistence;
* technical changes;
* metadata-only changes;
* capability-snapshot-only changes;
* mixed changes;
* no persistent changes.

Only after classification can the application correctly propose:

* a new `versionId`;
* unchanged `versionId`;
* new `parentVersionId`;
* updated `ancestorVersionIds`;
* new `lastModifiedAt`;
* new `metadataModifiedAt`;
* no canonical transition.

Therefore, version transition logic depends on:

* canonical schema;
* canonical data classification;
* current persisted baseline;
* current canonical state;
* reliable comparison semantics.

No version transition may be based merely on a generic dirty boolean.

#### 11.7.10 Proposed Version State Must Precede Persistence, but Authoritative Adoption Must Follow Success

The application may need to construct a candidate v2 payload containing proposed:

* `versionId`;
* ancestry;
* timestamps;
* metadata changes.

However, candidate state must not become authoritative persisted state merely because payload construction succeeded.

The dependency sequence is:

`Current authoritative canonical state`

→ `Change classification`

→ `Candidate canonical persisted state`

→ `Persistence attempt`

→ `Confirmed persistence success`

→ `Authoritative in-memory adoption`

→ `Saved baseline update`

→ `Dirty-state reconciliation`

If persistence fails or is cancelled:

* candidate version state must not become authoritative;
* ancestry must not advance;
* timestamps must not falsely claim persistence;
* dirty state must remain correct;
* unsaved-work protection must remain active where applicable.

This is one of the most critical Milestone 1 dependency boundaries.

#### 11.7.11 Native Persistence and Browser-Download Fallback Have Different Confirmation Boundaries

Native writable-file persistence can provide technical completion through the successful resolution of the write operation.

Browser-download fallback does not provide equivalent technical confirmation that the user retained the file.

Therefore, the two persistence paths must not automatically share identical post-persistence adoption semantics.

Native persistence may follow:

`write succeeds`

→ `persistence confirmed`

→ `canonical state adoption`

Browser-download fallback requires an architecture-compliant confirmation boundary before:

* version state is adopted;
* timestamps are adopted;
* saved baseline is replaced;
* dirty state is cleared.

The exact fallback mechanism must be resolved through task-level analysis.

The dependency rule is:

**No downstream state transition may assume that download initiation equals confirmed persistence.**

#### 11.7.12 Baseline Adoption Depends on Successful Canonical State Adoption

The current dirty-state system relies on a saved baseline.

Under v2 semantics, the baseline must correspond to the canonical state that was actually accepted as persisted.

Therefore:

* baseline adoption depends on confirmed persistence;
* dirty-state clearing depends on baseline adoption;
* unsaved-changes protection depends on correct dirty state.

The sequence must remain:

`Confirmed persistence`

→ `Authoritative canonical state adoption`

→ `Saved baseline adoption`

→ `Dirty-state reconciliation`

The baseline must not be advanced independently from canonical Project version state.

Otherwise, the application could believe that unsaved work is safe when the canonical Project history says otherwise.

#### 11.7.13 Strict Validation Precedes Open State Adoption

The current Open path performs only limited validation.

Canonical v2 Open requires the following dependency sequence:

`File selection`

→ `File read`

→ `JSON parse`

→ `Supported format validation`

→ `Canonical structural validation`

→ `Required metadata validation`

→ `Semantic consistency validation where required`

→ `Safe restoration preparation`

→ `Active Project state adoption`

No invalid or unsupported Project may become active state before these validation boundaries succeed.

This means strict validation must be implemented before v2 Open can be considered complete.

Open state adoption must not be the mechanism by which validity is discovered.

#### 11.7.14 Failed-Open Preservation Is a Safety Dependency

Before sensitive Open-path changes are considered complete, regression protection must prove that a failed Open does not destroy or partially replace an already active valid Project.

This protection is especially important because the current repository contains:

* distributed calculator state;
* asynchronous image restoration;
* navigation-based pending restore state;
* potential restoration-time failure paths.

The exact implementation order may place the regression test:

* before the risky Open migration; or
* inside the task that introduces strict Open validation and safe adoption.

However, the behavior must be protected before the relevant migration is closed.

#### 11.7.15 v2 Round-Trip Integrity Depends on Both Save and Open Foundations

A canonical v2 Project is not complete merely because it can be serialized.

The canonical model must support:

`Valid in-memory canonical Project`

→ `v2 serialization`

→ `successful persistence`

→ `v2 parse`

→ `strict validation`

→ `restoration`

→ `equivalent valid Project state`

Therefore, v2 round-trip verification depends on both:

* canonical Save representation;
* canonical Open validation and restoration.

Round-trip tests must verify that required Project information is neither lost nor silently reclassified.

#### 11.7.16 Recent Projects Must Remain Downstream of Canonical Project Identity

Recent Projects is a device-local convenience layer.

It must not become an authority for:

* `projectId`;
* `ownerId`;
* `versionId`;
* ancestry;
* canonical timestamps;
* technical Project content.

The dependency direction must be:

`Canonical Project`

→ `Recent Projects convenience metadata`

not:

`Recent Projects entry`

→ `Canonical Project identity`

The existing Recent entry ID may continue to serve internal device-local purposes.

Any optional addition of `projectId` to Recent Projects must remain a derived convenience reference, not a competing identity authority.

#### 11.7.17 File-Handle Retention Remains a Persistence Convenience Dependency

IndexedDB-retained file handles support:

* reopening;
* Update Existing Project;
* direct write-back where available.

They do not define canonical Project identity.

The dependency direction must remain:

`Canonical Project / Recent entry context`

→ `Optional retained file handle`

A missing, stale, moved, deleted, inaccessible, or unsupported file handle must not invalidate the canonical meaning of a `.hfzproject` file.

Complete unavailable-file behavior remains primarily a Milestone 6 responsibility.

#### 11.7.18 Capability Snapshot Foundation Depends on Canonical Metadata but Not Full Capability Enforcement

The Project Structural Capability Snapshot must have a canonical place in `.hfzproject` v2.

Its implementation depends on:

* canonical metadata definition;
* access to current account/session capability information;
* explicit snapshot semantics;
* metadata-only persistence classification.

It does not depend on complete Milestone 5 capability enforcement.

Milestone 1 must establish only the minimum persistence foundation required for later capability behavior.

The dependency must not be reversed by implementing complete effective-capability resolution prematurely.

#### 11.7.19 Existing Tests Are Upstream Safety Dependencies

Existing automated tests are not merely final verification.

They are upstream safety dependencies for migration.

Before modifying a preserved workflow, the relevant existing tests must be identified and understood.

Where existing coverage is insufficient for a risky boundary, targeted regression protection may need to be established before or during the relevant implementation task.

Particular high-risk dependencies include:

* persistence failure before canonical version adoption;
* browser-download fallback confirmation;
* failed Open preserving active valid state;
* technical-versus-metadata classification;
* ancestry construction;
* no-change Save semantics;
* creation-threshold identity.

Tests must follow the behavior boundary they protect.

A single giant preliminary test task is not automatically required.

#### 11.7.20 Migration Must Avoid Dual Canonical Authority

Milestone 1 must migrate directly from the disposable pre-launch v1 format to canonical v2.

The approved policy does not require:

* v1 backward compatibility;
* v1 automatic migration;
* simultaneous v1 and v2 canonical persistence;
* dual Project identity systems.

The migration dependency should therefore prefer:

`Existing working persistence foundation`

→ `Canonical v2 definition`

→ `Controlled v2 integration`

→ `v2 Save/Open cutover`

→ `v1 rejection`

rather than prolonged coexistence of competing authorities.

Temporary implementation scaffolding may exist only where necessary and must not create ambiguous persisted truth.

#### 11.7.21 Unresolved Technical Questions and Their Dependency Positions

The four unresolved technical questions identified by repository investigation have different dependency positions.

**Canonical v2 JSON schema layout**

Must be resolved before:

* v2 payload construction;
* strict v2 validation;
* v2 round-trip fixtures;
* downstream versioning integration.

**Persisted calculation `result` classification**

Must be resolved before:

* final canonical data classification;
* authoritative technical-change comparison;
* v2 round-trip expectations.

**UI rotation and zoom classification**

Must be resolved before:

* final change-classification rules;
* technical-versus-metadata Save semantics;
* no-change comparison behavior.

**Browser-tab-close / `beforeunload` scope**

Does not block canonical schema or core versioning work.

It should be evaluated separately against:

* existing unsaved-work protection;
* valid-but-unsaved Project lifecycle;
* Milestone 1 scope;
* later workspace responsibilities.

It must not delay unrelated foundational work unless concrete evidence shows a data-loss gap introduced by Milestone 1.

#### 11.7.22 Critical Dependency Path

Based on approved architecture and verified repository evidence, the critical Milestone 1 dependency path is:

1. preserve and understand the existing test-backed persistence foundation;
2. resolve canonical v2 schema and Project data classification;
3. establish one authoritative canonical lifecycle-metadata owner;
4. resolve the `ownerId` sequencing boundary;
5. define deterministic primary-image hash input;
6. establish creation-threshold canonical identity;
7. establish candidate-state and persistence-success semantics;
8. implement Save change classification;
9. implement first, technical, metadata-only, mixed, and no-change version semantics;
10. resolve browser-download persistence confirmation;
11. establish strict v2 validation before Open state adoption;
12. protect failed-Open preservation;
13. verify complete v2 round-trip integrity;
14. preserve Recent Projects and file-handle compatibility without creating competing authority;
15. complete targeted regression coverage and milestone-level validation.

This sequence expresses dependency order.

It does not imply that each numbered dependency becomes exactly one implementation task.

Some dependencies may require multiple tasks.

Some may be safely combined.

Final task boundaries must be determined by reversibility, verification scope, rollback safety, and repository evidence.

#### 11.7.23 Parallelizable or Partially Independent Work

Not every Milestone 1 dependency is strictly linear.

After the canonical v2 schema and classification rules are established, some work may be partially independent, including:

* strict parser and validator foundations;
* primary-image hash utility;
* targeted test fixtures;
* Recent Projects compatibility analysis;
* file-handle compatibility verification.

However, parallelizability must not create premature integration.

A component may be implemented independently only when:

* its inputs are already stable;
* it does not require unresolved lifecycle semantics;
* it can be verified independently;
* it does not create a second authority;
* rollback remains isolated.

#### 11.7.24 Dependency-Based Stop Conditions

Planning or implementation must stop at the relevant boundary if:

* canonical schema remains ambiguous before dependent persistence work;
* data classification remains ambiguous before versioning work;
* canonical state ownership remains ambiguous before lifecycle transitions;
* `ownerId` cannot be introduced without unsafe mock-to-production identity consequences;
* hash input is nondeterministic;
* Save success cannot be distinguished from failure or cancellation;
* candidate version state cannot be prevented from becoming authoritative after failed persistence;
* strict Open validation cannot precede active-state adoption;
* failed Open cannot preserve the current valid Project;
* a proposed task requires premature implementation of a later milestone;
* rollback boundaries cannot be reasonably isolated.

These are dependency failures, not reasons to silently weaken architecture.

#### 11.7.25 Dependency Map Conclusion

The authoritative dependency conclusion is:

**Milestone 1 must begin from one explicit canonical `.hfzproject` v2 schema and one unambiguous canonical lifecycle-metadata authority. Project creation-threshold identity depends on that state foundation and on a safe ownership-metadata boundary. Save versioning depends on explicit Project data classification and must distinguish candidate persisted state from authoritative state adopted only after confirmed persistence. Dirty-state baselines and unsaved-work protection are downstream of that success boundary. Strict validation must precede Open state adoption, and failed Open must preserve valid active state. Recent Projects, file handles, capability metadata, and future cloud behavior must remain downstream consumers of canonical Project truth rather than competing authorities. Final task decomposition must follow these dependencies and the smallest safe reversible migration sequence.**
### 11.8 Safety-Net Requirements

Milestone 1 changes Project identity, persistence, versioning, validation, and lifecycle semantics.

These areas are data-integrity-sensitive.

The purpose of the Milestone 1 safety net is not to maximize test count.

Its purpose is to ensure that:

* validated existing behavior is not silently broken;
* risky migrations are protected before destructive or difficult-to-diagnose regressions can occur;
* new architectural guarantees are introduced together with targeted automated verification;
* persistence failures cannot create false Project history;
* invalid Project files cannot corrupt active valid state;
* Save classification remains deterministic;
* migration to `.hfzproject` v2 remains reversible and independently verifiable.

Safety-net requirements are divided into three categories:

1. pre-change safety nets;
2. implementation-coupled tests;
3. milestone-level validation.

The authoritative principle is:

**Tests must be placed at the boundary where they provide the most useful protection. Existing behavior should be protected before risky modification; new behavior should normally be tested in the same task that introduces it; complete system coherence should be verified at milestone closure.**

#### 11.8.1 Existing Test Baseline Must Remain Green

Before each Milestone 1 implementation task begins, the relevant existing automated baseline must be known.

The authoritative unified validation command remains:

`test.cmd`

At the formal Milestone 0 closure baseline:

* backend: 115 tests passed;
* frontend: 234 tests passed across 49 test files;
* total observational automated-test count: 349;
* final result: `RESULT: All tests passed.`

These counts are observational evidence, not permanent contracts.

Milestone 1 implementation must not assume that exact counts remain fixed as legitimate tests are added, removed, renamed, reorganized, or intentionally updated.

The invariant is:

**The complete authoritative validation suite must pass unless an explicitly approved architectural change intentionally requires a documented test expectation change.**

Existing tests must not be:

* weakened;
* skipped;
* deleted;
* bypassed;
* rewritten merely to make new implementation pass.

Any intentional change to an existing expectation must be justified by approved architecture and retain equivalent or stronger regression protection.

#### 11.8.2 Pre-Change Safety-Net Rule

A pre-change safety net is required when Milestone 1 will modify a working behavior whose failure could:

* lose unsaved Project work;
* create false persistence history;
* corrupt canonical Project identity;
* partially replace active valid Project state;
* break existing Save, Open, Update, or restoration workflows;
* make rollback difficult;
* produce a regression not reliably detected by existing tests.

Pre-change tests must protect the existing behavior boundary before the risky implementation changes it.

A separate preliminary test task is not automatically required.

Where practical, the safety-net addition may be the first controlled step inside the same implementation task, provided:

* the test is written against existing behavior before production behavior is changed;
* the test passes before the implementation change;
* the implementation report records this sequence;
* rollback remains clear.

#### 11.8.3 Existing Save Workflow Preservation

Before modifying the existing Save pipeline, the relevant existing tests must be identified and confirmed.

The existing safety net already covers important behavior including:

* Project payload construction;
* native Save;
* browser-download fallback;
* Save cancellation;
* Save failure;
* Save dialog behavior;
* navigation after Save;
* Update Existing Project;
* opened-Project dirty baseline behavior.

Milestone 1 must preserve these behaviors where they remain compatible with approved architecture.

The browser-download fallback is an explicit exception because current behavior conflicts with the approved persistence-success boundary.

Tests that currently encode download initiation as confirmed successful persistence may require intentional expectation changes.

Such changes must:

* be explicitly tied to the approved architecture;
* preserve unsaved-work safety;
* verify the new confirmation boundary;
* not silently weaken Save behavior.

#### 11.8.4 Persistence-Failure Safety Net

Before or during implementation of canonical version transitions, automated protection must verify that failed persistence cannot create false canonical history.

At minimum, a failed persistence attempt must not permanently adopt:

* a new `versionId`;
* a new `parentVersionId`;
* advanced `ancestorVersionIds`;
* a new `lastModifiedAt`;
* a new `metadataModifiedAt`;
* a new saved baseline;
* a false clean dirty-state condition.

Where a candidate canonical state is constructed before persistence, tests must prove that:

* failure preserves the previously authoritative canonical state;
* cancellation preserves the previously authoritative canonical state;
* unsaved changes remain represented correctly.

This protection must exist before the relevant versioning task is considered complete.

#### 11.8.5 Browser-Download Fallback Safety Net

The browser-download fallback requires dedicated automated protection because current repository behavior conflicts with the approved architecture.

Tests must verify that download initiation alone does not automatically:

* prove persistence;
* advance authoritative canonical version state;
* advance ancestry;
* update canonical persistence timestamps;
* replace the saved baseline;
* clear dirty state.

The exact confirmation mechanism must be determined through task-level Pre-Implementation Analysis.

Once chosen, tests must verify:

* initiation behavior;
* confirmation behavior;
* cancellation or non-confirmation behavior;
* dirty-state behavior;
* canonical state adoption;
* unsaved-changes protection.

This safety net must be introduced with the task that resolves the browser-download persistence boundary.

#### 11.8.6 Creation-Threshold Identity Tests

The implementation task that introduces canonical Project creation must include targeted automated tests for the approved threshold:

* primary image exists;
* at least one reference measurement exists.

Tests must verify that:

* image alone does not create a canonical Project;
* reference measurement without a primary image does not create a canonical Project;
* the first moment both threshold conditions are satisfied creates canonical Project identity;
* `projectId` is generated once;
* `projectId` remains stable after subsequent Project edits;
* `createdAt` is generated once;
* `createdAt` remains stable;
* `primaryImageHash` is associated with the authoritative stored primary image;
* `ownerId` follows the approved Milestone 1 ownership-metadata boundary;
* crossing the creation threshold does not itself generate a persistent `versionId`;
* crossing the creation threshold does not itself write a `.hfzproject` file.

These tests belong with the implementation that introduces the lifecycle behavior.

They are not required as a separate speculative preliminary test task.

#### 11.8.7 Canonical Identity Stability Tests

Canonical identity must be protected explicitly.

Tests must verify that `projectId` remains unchanged when a valid Project is:

* edited;
* saved;
* saved again;
* moved;
* copied;
* reopened;
* restored from a valid canonical `.hfzproject` v2 representation.

A manually copied `.hfzproject` file must preserve the same `projectId`.

Tests must also verify that a genuinely new Project receives a different `projectId`.

Where file movement or copying depends on browser APIs outside practical unit-test boundaries, equivalent serialization-and-reopen tests may be used to protect the canonical identity guarantee.

#### 11.8.8 `ownerId` Foundation Tests

The implementation task that introduces canonical `ownerId` metadata must verify:

* every valid canonical Project has one `ownerId`;
* the field is persisted in `.hfzproject` v2;
* Save does not arbitrarily replace it;
* Open restores it from canonical Project data;
* file name, file path, Project name, Recent Projects entry ID, and device-local file handle do not define or mutate it.

Tests must reflect the approved Milestone 1 ownership-metadata strategy.

They must not accidentally encode a disposable mock identifier as a permanent production architecture contract.

Production identity derivation and authoritative ownership enforcement remain later-milestone responsibilities.

#### 11.8.9 Primary-Image Hash Tests

The implementation that introduces `primaryImageHash` must include targeted deterministic tests.

At minimum, tests must verify:

* identical authoritative stored image representations produce identical hashes;
* different authoritative stored image representations produce different hashes with practical test inputs;
* the hash is generated locally;
* the hash is persisted in canonical v2 metadata;
* the hash survives Save/Open round-trip.

If Milestone 1 validates the stored hash on Open, tests must also verify that a mismatch fails closed.

Tests must not introduce speculative Milestone 2 image-size, decoded-dimension, compression, or supported-format policy.

#### 11.8.10 Canonical v2 Schema Tests

The canonical `.hfzproject` v2 schema must have direct automated protection.

Tests must verify at minimum:

* `format` is correct;
* `formatVersion` is exactly the supported value;
* required canonical metadata exists;
* required Project content exists;
* required field types are valid;
* required arrays and nested structures satisfy their structural contracts;
* unsupported format versions are rejected;
* disposable v1 files are rejected;
* malformed JSON is rejected;
* structurally invalid v2 files are rejected;
* missing required canonical fields are rejected.

Tests must distinguish between:

* JSON syntax validity;
* supported-format validity;
* canonical structural validity;
* semantic validity where required.

The validator must fail closed rather than guess how to interpret unknown unsupported structures.

#### 11.8.11 First Persistent Save Tests

The implementation that introduces first persistent version semantics must verify:

* a valid but unsaved Project has no persistent `versionId`;
* the first successful Save generates one `versionId`;
* `parentVersionId` is `null`;
* `ancestorVersionIds` is empty;
* `lastModifiedAt` is established;
* Project identity remains unchanged;
* failed first Save does not permanently adopt a persistent `versionId`;
* cancelled first Save does not permanently adopt a persistent `versionId`;
* crossing the Project creation threshold alone does not create the first persistent version.

#### 11.8.12 Technical-Change Save Tests

The implementation of technical version advancement must verify that a real technical Project-content change followed by successful Save:

* preserves `projectId`;
* preserves `ownerId`;
* generates a new `versionId`;
* sets the previous `versionId` as `parentVersionId`;
* carries forward complete known ancestry;
* appends the direct parent to `ancestorVersionIds`;
* updates `lastModifiedAt`;
* persists changed technical content.

Tests should cover representative technical changes rather than every individual technical field when equivalent classification logic is shared.

Representative cases should include fields from materially different technical categories where useful, such as:

* reference measurement;
* geometry;
* calculation-affecting parameter.

#### 11.8.13 Metadata-Only Save Tests

The implementation of metadata-only persistence must verify that a successful Save containing only metadata changes:

* preserves `projectId`;
* preserves `ownerId`;
* preserves `versionId`;
* preserves `parentVersionId`;
* preserves `ancestorVersionIds`;
* preserves `lastModifiedAt`;
* persists the metadata change;
* updates `metadataModifiedAt`.

Representative metadata-only cases should be selected from the final approved canonical classification.

The test suite must not assume that every non-geometric field is metadata.

Classification must follow architectural function.

#### 11.8.14 Project Structural Capability Snapshot Tests

The implementation of the Project Structural Capability Snapshot foundation must verify that:

* the snapshot has one canonical place in `.hfzproject` v2;
* it is persisted;
* it is restored;
* a snapshot-only persistent change does not generate a new technical `versionId`;
* it does not advance technical ancestry;
* it does not update `lastModifiedAt`;
* it updates `metadataModifiedAt` after successful persistence;
* it is not confused with current account/session capability state.

These tests must not prematurely implement complete effective-capability resolution or enforcement.

#### 11.8.15 Mixed-Change Save Tests

The implementation of mixed Save semantics must verify that one successful Save containing both technical and metadata changes:

* generates a new `versionId`;
* advances ancestry correctly;
* updates `lastModifiedAt`;
* updates `metadataModifiedAt` where applicable;
* persists both categories of change;
* does not lose one category because the other is present.

A representative mixed-change scenario is sufficient when the shared classification and transition logic is directly tested.

#### 11.8.16 No-Change Save Tests

The implementation of no-change Save semantics must verify that invoking Save without any real persistent change does not:

* generate a new `versionId`;
* change `parentVersionId`;
* change `ancestorVersionIds`;
* update `lastModifiedAt`;
* update `metadataModifiedAt` merely because Save was invoked;
* create false Project history.

If the final implementation skips physical persistence entirely for a no-change Save, that behavior should be tested.

If physical persistence remains possible for a justified implementation reason, tests must still prove that canonical history remains unchanged.

#### 11.8.17 Ancestry Construction Tests

Technical ancestry requires direct unit-level protection.

Tests must verify:

For the first persisted version:

* `parentVersionId = null`;
* `ancestorVersionIds = []`.

For the second technical version:

* the first `versionId` becomes `parentVersionId`;
* `ancestorVersionIds` contains the first `versionId`.

For a later technical version:

* complete known ancestry is preserved;
* the direct parent is appended exactly once;
* ancestry order remains deterministic.

Metadata-only Saves must not alter ancestry.

Failed or cancelled Saves must not alter ancestry.

No arbitrary ancestry truncation should be introduced.

#### 11.8.18 Dirty-State and Change-Classification Tests

The existing dirty-state safety net must be preserved.

New tests must verify the distinction between:

* technical dirty state;
* metadata-only dirty state;
* capability-snapshot metadata change;
* mixed change;
* no persistent change.

The implementation must preserve the rule that:

**A change may require persistence even when it does not generate a new technical `versionId`.**

Tests must also verify that:

* successful confirmed persistence establishes the correct baseline;
* failed persistence does not establish a false baseline;
* cancelled persistence does not establish a false baseline;
* metadata-only Save can return the Project to a clean state without advancing technical version history.

#### 11.8.19 Strict Open Validation Tests

Strict Open validation must include targeted negative tests.

At minimum, the suite must cover:

* malformed JSON;
* non-object root;
* wrong `format`;
* missing `formatVersion`;
* `formatVersion: 1`;
* unsupported future `formatVersion`;
* missing required Project identity metadata;
* missing ownership metadata;
* missing required version metadata for a persisted Project;
* invalid ancestry structure;
* invalid timestamps where required;
* missing primary image;
* missing `primaryImageHash`;
* missing required technical Project content;
* invalid capability-snapshot structure where applicable.

The exact fixture set should remain proportionate.

Equivalent structural failures do not require repetitive tests for every possible field when one validator branch protects the same behavior class.

#### 11.8.20 Failed-Open Preservation Tests

Before strict Open migration is considered complete, automated protection must prove that attempting to open an invalid or unsupported Project does not corrupt or partially replace an already active valid Project.

Tests must verify, where applicable:

* current valid Project identity remains unchanged;
* current calculator state remains unchanged;
* current primary image remains unchanged;
* current baseline remains unchanged;
* current dirty-state meaning remains correct;
* invalid Project data is not partially adopted;
* no successful Recent Projects state is created from a failed Open where that would falsely imply success.

Restoration-time failures must also be handled safely where practical to test.

This is a high-value data-integrity safety net.

#### 11.8.21 v2 Save/Open Round-Trip Tests

Milestone 1 must include end-to-end frontend-level verification of canonical v2 round-trip behavior.

A representative valid canonical Project must be:

1. constructed from valid application state;
2. serialized as `.hfzproject` v2;
3. persisted or passed through the applicable test persistence boundary;
4. parsed;
5. strictly validated;
6. restored;
7. compared against expected equivalent Project state.

The round-trip must protect, where applicable:

* `projectId`;
* `ownerId`;
* `versionId`;
* ancestry;
* timestamps;
* primary image;
* `primaryImageHash`;
* reference measurements;
* geometry;
* calculation-affecting inputs;
* descriptive metadata;
* Project Structural Capability Snapshot;
* other canonical persisted state.

Derived values may be compared according to their final approved canonical classification.

#### 11.8.22 Recent Projects Compatibility Tests

Milestone 1 must preserve Recent Projects as a device-local convenience layer.

Tests should verify that:

* canonical `projectId` is not replaced by Recent entry ID;
* Recent entry identity does not become canonical Project identity;
* Save and Open continue updating Recent Projects correctly;
* Update Existing Project remains compatible with retained file handles;
* any optional stored `projectId` remains a convenience reference rather than competing authority.

Complete Local Workspace behavior must not be pulled into these tests.

#### 11.8.23 File-Handle Compatibility Tests

Where Milestone 1 changes affect Update Existing Project or canonical persistence, relevant file-handle tests must verify:

* valid retained writable handle still enables update-in-place;
* successful update follows canonical versioning semantics;
* failed update does not adopt false version history;
* missing handle does not corrupt canonical Project identity;
* file-handle identity does not define `projectId`.

Moved, deleted, inaccessible, or unavailable-file UX beyond the minimum affected behavior remains primarily Milestone 6 scope.

#### 11.8.24 Regression Protection for Validated Calculator Logic

Milestone 1 must not rewrite validated Resin Calculator algorithms.

The complete existing automated suite must continue to protect calculation behavior.

If any Milestone 1 implementation touches code paths that also influence:

* reference measurements;
* geometry;
* calculation inputs;
* resin mix ratio;
* depth;
* layer configuration;
* calculation results;
* restoration of technical state,

the relevant existing tests must be run and reviewed.

Additional calculator-domain tests are required only if Milestone 1 introduces a concrete new regression risk not already covered.

#### 11.8.25 Browser-Tab-Close Protection Assessment

The repository investigation did not identify explicit `beforeunload` protection for browser-tab or browser-window closure.

This is not currently a Milestone 1 blocker.

Before Milestone 1 closure, the issue must be classified as one of:

* required for Milestone 1 because the new valid-but-unsaved lifecycle introduces or exposes a concrete data-loss gap;
* already sufficiently mitigated by existing behavior for Milestone 1 scope;
* explicitly deferred to a later workspace milestone.

This classification must be evidence-based.

Milestone 1 must not expand automatically into general browser-lifecycle hardening.

#### 11.8.26 Test Fixture Migration

Existing Project-related tests currently use v1-shaped fixtures and expectations.

Migration to v2 must be controlled.

Test fixtures should:

* use one reusable canonical v2 fixture foundation where practical;
* avoid duplicated ad hoc canonical payload definitions across many tests;
* preserve readability;
* make required metadata explicit;
* support targeted invalid-fixture mutations for negative tests.

The migration must not create a parallel test-only Project schema that diverges from production validation rules.

Where possible, fixtures should derive from or be validated against the same canonical schema contract used by production code.

#### 11.8.27 Safety-Net Sequencing

The authoritative safety-net sequence is:

1. identify the preserved behavior affected by the next implementation task;
2. identify existing tests already protecting it;
3. identify any high-risk unprotected regression boundary;
4. add pre-change protection only where necessary;
5. implement the approved behavior;
6. add implementation-coupled tests for the new guarantee;
7. run targeted tests;
8. run the complete authoritative validation suite;
9. perform required manual verification;
10. review discrepancies before commit or closure.

This sequence applies task by task.

Milestone 1 must not postpone all testing until the end.

#### 11.8.28 Milestone-Level Validation Requirements

Before Milestone 1 may be formally closed, validation must demonstrate the coherent operation of the complete canonical Project foundation.

At minimum, milestone-level verification must establish:

* new valid Project creation at the approved threshold;
* stable `projectId`;
* correct `ownerId` foundation;
* deterministic `primaryImageHash`;
* valid-but-unsaved Project behavior;
* first persistent version semantics;
* subsequent technical version advancement;
* ancestry preservation;
* metadata-only Save semantics;
* Project Structural Capability Snapshot persistence semantics;
* mixed Save semantics;
* no-change Save semantics;
* persistence-failure rollback;
* architecture-compliant browser-download fallback;
* strict v2 Open validation;
* v1 rejection;
* unsupported future-version rejection;
* failed-Open preservation;
* v2 Save/Open round-trip integrity;
* Recent Projects compatibility;
* Update Existing Project compatibility;
* IndexedDB file-handle compatibility;
* unsaved-changes protection;
* preserved Resin Calculator behavior;
* complete authoritative automated validation passing;
* required manual verification completed.

Exact test counts remain observational.

The milestone closes on verified behavior, not on a fixed number of tests.

#### 11.8.29 Safety-Net Stop Conditions

Implementation must stop at the relevant boundary if:

* an existing validated behavior is being changed without adequate regression protection;
* a persistence failure can adopt false canonical history;
* a failed Open can partially corrupt active valid Project state;
* technical-versus-metadata classification cannot be tested deterministically;
* ancestry behavior is ambiguous;
* browser-download initiation is still treated as confirmed persistence contrary to architecture;
* test expectations are weakened merely to make implementation pass;
* v2 fixtures diverge from production schema rules;
* rollback cannot restore a known good state;
* full-suite failures are dismissed without root-cause analysis.

No Milestone 1 task may be closed while a known data-integrity regression remains unresolved.

#### 11.8.30 Authoritative Safety-Net Rule

The authoritative rule is:

**Milestone 1 safety nets must protect the boundaries where Project identity, persistence, versioning, ancestry, timestamps, validation, dirty-state baselines, and active Project state could become false, corrupted, or ambiguous. Existing validated behavior must be protected before risky modification where necessary; new architectural guarantees must normally be tested in the same task that introduces them; and complete v2 coherence must be demonstrated at milestone closure. The objective is not maximum test count, but sufficient targeted evidence that canonical Project history reflects successfully persisted reality, invalid input fails closed, unsaved work remains protected, and the migration preserves compatible working foundations.**
### 11.9 Technical Resolution Points

The completed Milestone 1 repository investigation identified four technical questions requiring explicit resolution before final task decomposition.

These questions were analyzed against:

* the approved Phase 4 Product Architecture;
* the approved Phase 5 Technical Architecture;
* the actual repository evidence;
* the Milestone 1 architectural obligations;
* the dependency map;
* the safety-net requirements;
* data-integrity, reversibility, validation, and preservation principles.

All four technical resolution points are now resolved and approved.

These resolutions are authoritative for Milestone 1 planning and future implementation.

They do not authorize implementation by themselves.

#### 11.9.1 Canonical `.hfzproject` v2 JSON Structure

**Status: RESOLVED AND APPROVED**

The canonical `.hfzproject` v2 representation shall use one explicit envelope.

The root level shall contain:

* `format`;
* `formatVersion`.

The canonical Project representation shall then be divided into four explicit sections:

* `projectMetadata`;
* `technicalContent`;
* `descriptiveMetadata`;
* `derivedData`.

The conceptual structure is:

```json
{
  "format": "hfzwood-project",
  "formatVersion": 2,
  "projectMetadata": {},
  "technicalContent": {},
  "descriptiveMetadata": {},
  "derivedData": {}
}
```

`format` and `formatVersion` remain at the root so that a Project file can be identified and its supported format version determined before deeper interpretation.

`projectMetadata` is the authoritative location for Project lifecycle, identity, ownership, integrity, versioning, ancestry, timestamp, and structural-capability metadata, including as applicable:

* `projectId`;
* `ownerId`;
* `versionId`;
* `parentVersionId`;
* `ancestorVersionIds`;
* `createdAt`;
* `lastModifiedAt`;
* `metadataModifiedAt`;
* `primaryImageHash`;
* Project Structural Capability Snapshot.

`technicalContent` contains authoritative Project data that defines technical Project meaning and calculation-affecting state.

This includes the immutable primary-image representation and the validated calculator-state structures required for:

* calibration;
* reference measurements;
* geometry;
* cavities;
* depth;
* pour layers;
* resin mix ratio;
* other calculation-affecting inputs.

Existing validated calculator structures should be preserved where compatible rather than unnecessarily rewritten for cosmetic schema elegance.

`descriptiveMetadata` contains persistent non-technical Project information that does not independently define technical Project history.

This includes, as applicable:

* Project name;
* free-form Project notes, unless later consumed as technical input;
* descriptive or organizational information;
* persistent display metadata approved by this section.

`derivedData` contains regenerable information produced from authoritative Project state.

Derived data may be persisted for restoration speed, continuity, diagnostics, or user experience, but it does not become a competing technical source of truth.

The canonical v2 structure must not be implemented by continuing to add unrelated fields ad hoc to the existing flat v1 payload.

The purpose of the explicit four-section structure is to support:

* one canonical Project representation;
* deterministic Save classification;
* strict validation;
* technical versioning;
* metadata-only persistence;
* safe restoration;
* future cloud compatibility without implementing Cloud Workspace now.

No separate `schemaVersion` field is required for Milestone 1.

For the initial canonical implementation, `formatVersion: 2` defines the complete supported v2 schema.

A separate schema-version axis may be introduced only if future evidence demonstrates a concrete need.

#### 11.9.2 Persisted Calculation Result Classification

**Status: RESOLVED AND APPROVED**

Persisted calculation results shall be stored under:

`derivedData`

They shall not be classified as authoritative `technicalContent`.

The authoritative source of Project technical truth remains the technical input state from which the calculation result is produced.

This includes, as applicable:

* reference measurements;
* calibration;
* geometry;
* cavities;
* depth;
* layer configuration;
* resin mix ratio;
* other calculation-affecting inputs.

The calculation result may be persisted because doing so supports:

* restoration speed;
* continuity of existing behavior;
* immediate display of the last valid known result;
* diagnostics;
* avoidance of unnecessary recalculation during Open.

However:

**A persisted calculation result must not become a second technical source of truth competing with the technical inputs that produced it.**

A calculation result must not independently:

* generate a new `versionId`;
* advance `parentVersionId`;
* advance `ancestorVersionIds`;
* update `lastModifiedAt` as if technical Project content had changed.

If technical content changes and no corresponding successful recalculation exists, the previous calculation result must not be represented as the current valid result for the changed technical state.

The implementation may:

* store no current result;
* use `null`;
* otherwise represent absence according to the final canonical schema.

Milestone 1 must not introduce an unnecessarily complex derived-result state machine unless actual repository evidence requires one.

A missing or invalid derived calculation result must not automatically invalidate an otherwise valid canonical Project when the authoritative technical content remains complete and valid.

Such a result may be:

* ignored;
* discarded;
* regenerated.

If useful and technically justified during task-level analysis, persisted calculation results may contain minimal provenance information such as:

* calculator or application version;
* calculation timestamp.

Such provenance must not create a second version-history system.

The final authoritative rule is:

**Technical inputs define Project truth. Calculation results are derived from that truth and may be persisted for continuity, but they do not independently define technical Project history.**

#### 11.9.3 UI Rotation and Zoom Classification

**Status: RESOLVED AND APPROVED**

UI rotation and zoom do not constitute authoritative technical Project content.

They must not independently generate a new technical `versionId`.

##### Rotation

Rotation may be persisted as display metadata only when it represents a reversible view transformation over the immutable canonical primary image.

A display-only rotation must not:

* rewrite primary-image pixels;
* replace the canonical primary image;
* change `primaryImageHash`;
* rewrite canonical geometry merely because the display orientation changed;
* independently generate a new technical `versionId`;
* advance technical ancestry;
* update `lastModifiedAt`.

Where persisted, rotation belongs under descriptive display metadata, conceptually:

```json
{
  "descriptiveMetadata": {
    "workspaceView": {
      "rotation": 90
    }
  }
}
```

A rotation-only Save is a metadata-only Save.

After confirmed successful persistence, it may update:

`metadataModifiedAt`

It must not update technical version history.

Canonical technical coordinates must remain independent of display rotation.

The rendering and interaction layer must preserve a stable canonical coordinate system and apply reversible view transformation as required.

Any operation that materially transforms the stored primary image is not merely UI rotation.

Such an operation must not silently continue the same Project identity contrary to the immutable-primary-image rule.

##### Zoom

Zoom shall remain session-only UI state.

Zoom shall not be persisted in canonical `.hfzproject` v2.

Changing zoom shall not:

* generate a new `versionId`;
* advance ancestry;
* update `lastModifiedAt`;
* update `metadataModifiedAt`;
* mark the Project persistently dirty;
* trigger unsaved-changes protection;
* trigger browser `beforeunload` protection.

This prevents ordinary viewing interaction from creating false Project history or unnecessary Save prompts.

The authoritative rule is:

**Rotation may be persistent display metadata when it is a reversible view transformation. Zoom is ephemeral session state. Neither constitutes technical Project content, and neither may independently generate technical Project history.**

#### 11.9.4 Browser `beforeunload` Protection

**Status: RESOLVED AND APPROVED**

Milestone 1 shall include narrowly scoped browser `beforeunload` protection for persistent unsaved Project work.

This protection is required because Milestone 1 introduces the explicit canonical lifecycle state:

**valid Project, but not yet successfully persisted.**

Under the approved Project creation threshold, a Project becomes technically valid when:

* one primary image exists;
* at least one reference measurement exists.

A valid canonical Project may therefore exist in memory before its first successful Save.

Closing or refreshing the browser tab at that point may destroy valid unsaved Project work.

Conditional `beforeunload` protection shall therefore be active when persistent Project work is at genuine risk, including as applicable:

* a valid canonical Project has never been successfully persisted;
* persistent technical changes remain unsaved;
* persistent metadata changes remain unsaved;
* persistence has failed;
* persistence has been cancelled where unsaved work remains;
* persistence has been initiated but remains unconfirmed;
* browser-download fallback has not reached the approved persistence-confirmation boundary.

The protection must not be permanently active.

It must not activate merely because of:

* zoom;
* passive viewing;
* session-only UI interaction;
* an unchanged successfully persisted Project;
* other non-persistent ephemeral state.

For internal HFZWood navigation, the existing application-controlled unsaved-changes workflow remains authoritative and should continue to provide, where applicable:

* Save;
* Discard;
* Cancel.

For browser-controlled boundaries such as:

* tab close;
* page refresh;
* browser close;
* external navigation,

HFZWood shall use the browser-native `beforeunload` confirmation mechanism.

Modern browsers control the content and available actions of this native confirmation dialog.

Milestone 1 must not depend on custom Save/Discard/Cancel text or controls being available inside that browser-native dialog.

The purpose of this requirement is to give the user a final opportunity to remain on the page and save valid unsaved work.

This requirement does not authorize Milestone 1 to expand into:

* autosave;
* crash recovery;
* power-loss recovery;
* browser-process recovery;
* operating-system shutdown recovery;
* general browser-lifecycle hardening;
* cloud backup;
* synchronization.

The authoritative rule is:

**Milestone 1 shall protect persistent unsaved Project work at browser-exit boundaries through conditional `beforeunload` behavior, while preserving the existing richer Save/Discard/Cancel workflow for internal application navigation. This is a targeted data-loss protection required by the valid-but-unsaved canonical Project lifecycle, not a general recovery system.**

#### 11.9.5 Combined Technical Resolution Consequences

The four approved resolutions establish the following authoritative Milestone 1 rules:

1. `.hfzproject` v2 has one canonical envelope with `format` and `formatVersion` at the root.

2. Canonical Project state is divided into:

   * `projectMetadata`;
   * `technicalContent`;
   * `descriptiveMetadata`;
   * `derivedData`.

3. Project identity, ownership, versioning, ancestry, timestamps, image integrity metadata, and Project Structural Capability Snapshot belong to `projectMetadata`.

4. Calculation-affecting authoritative state belongs to `technicalContent`.

5. Persistent descriptive and organizational information belongs to `descriptiveMetadata`.

6. Regenerable calculation results belong to `derivedData` and do not independently define technical Project history.

7. Display-only rotation may be persistent descriptive metadata.

8. Zoom remains session-only state and is excluded from canonical `.hfzproject` v2 persistence.

9. Neither display rotation nor zoom independently generates a technical `versionId`.

10. A valid canonical Project may exist before first successful persistence.

11. Persistent unsaved Project work must receive conditional browser `beforeunload` protection.

12. Internal application navigation continues to use the richer application-controlled Save/Discard/Cancel workflow.

13. Browser-exit protection does not authorize autosave, crash recovery, synchronization, or general lifecycle expansion.

#### 11.9.6 Effect on Dependency Mapping and Task Decomposition

The four technical resolution points remove the principal schema and classification ambiguities identified during repository investigation.

Final task decomposition may now rely on the following resolved foundations:

* one explicit canonical v2 schema shape;
* one explicit separation between technical, descriptive, derived, and lifecycle metadata;
* calculation results classified as derived;
* display rotation classified as persistent metadata when applicable;
* zoom classified as session-only state;
* browser-exit protection confirmed as narrowly scoped Milestone 1 responsibility.

Task decomposition must still respect unresolved implementation-specific questions that require repository-level Pre-Implementation Analysis, including:

* the exact repository module that should own canonical Project lifecycle metadata;
* the exact `ownerId` sequencing mechanism before Milestone 3 production authentication;
* the deterministic `primaryImageHash` input and implementation boundary;
* the exact browser-download persistence-confirmation mechanism;
* the exact canonical validator implementation structure;
* the smallest safe sequence for v1-to-v2 cutover.

These are implementation-design questions.

They do not invalidate the approved technical resolutions above.

They must be resolved at the appropriate dependency or task boundary rather than delegated to the Product Owner unless a genuine product trade-off emerges.

#### 11.9.7 Authoritative Technical Resolution Conclusion

The authoritative conclusion is:

**Milestone 1 shall establish one canonical `.hfzproject` v2 representation built from explicit lifecycle metadata, authoritative technical content, persistent descriptive metadata, and regenerable derived data. Calculation results shall remain persisted derived data rather than technical source of truth. Display-only rotation may persist as metadata without creating technical history, while zoom remains session-only. Valid unsaved Project work shall receive narrowly scoped browser-exit protection through conditional `beforeunload` behavior. These decisions resolve the principal schema, classification, and browser-exit questions identified by repository investigation and provide a stable foundation for final evidence-based task decomposition.**
### 11.10 Milestone 1 Task Decomposition

Milestone 1 shall be implemented through eight controlled tasks.

This decomposition follows the approved architecture, verified repository evidence, dependency map, safety-net requirements, and technical resolutions established in Sections 11.1–11.9.

The task structure is intentionally pragmatic.

It avoids both:

* oversized implementation tasks that combine unrelated risk boundaries;
* artificial fragmentation that creates process overhead without meaningful gains in safety, verification, reversibility, or continuity.

Each task shall follow the approved Phase 6 Task Execution Workflow.

Detailed Pre-Implementation Analysis shall be performed only when the relevant task is ready to begin and shall use the actual repository state at that time.

The sections below define implementation boundaries. They do not authorize implementation automatically.

#### M1.1 — Canonical Project v2 Schema and Lifecycle Foundation

**Objective**

Establish one canonical `.hfzproject` v2 schema and one unambiguous in-memory authority for canonical Project lifecycle metadata.

**Scope**

* define the canonical v2 envelope established in Section 11.9;
* establish `projectMetadata`, `technicalContent`, `descriptiveMetadata`, and `derivedData`;
* define required canonical fields and structural contracts;
* establish the repository ownership boundary for canonical lifecycle metadata;
* create reusable canonical v2 test fixtures where appropriate.

**Dependencies**

Sections 11.3, 11.7, 11.8, and 11.9.

**Acceptance criteria**

* one canonical v2 representation exists;
* canonical lifecycle metadata has one authoritative in-memory ownership boundary;
* no competing Project schema or lifecycle authority is introduced;
* existing validated calculator structures are preserved where compatible;
* targeted tests pass;
* the complete authoritative test suite remains green.

**Explicit exclusions**

* creation-threshold behavior;
* full `ownerId` production integration;
* technical version advancement;
* Save/Open cutover;
* cloud behavior.

**Rollback boundary**

The schema and lifecycle foundation must remain sufficiently isolated to be reverted without requiring a rewrite of validated calculator logic or unrelated repository behavior.

#### M1.2 — Project Creation Threshold, Identity, and Primary Image Hash

**Objective**

Implement canonical Project creation when the approved validity threshold is first satisfied.

**Scope**

* detect the first moment when one primary image and at least one reference measurement exist;
* generate and preserve stable `projectId`;
* establish `createdAt`;
* establish deterministic `primaryImageHash`;
* implement the approved narrow `ownerId` foundation without prematurely implementing Milestone 3 production authentication;
* preserve valid-but-unsaved canonical Project state.

**Dependencies**

M1.1.

**Acceptance criteria**

* image alone does not create a canonical Project;
* reference measurement without an image does not create one;
* crossing the complete threshold creates canonical identity exactly once;
* `projectId` and `createdAt` remain stable;
* `primaryImageHash` is deterministic;
* threshold creation does not itself create a persistent `versionId` or write a Project file;
* the `ownerId` sequencing boundary is technically safe and documented;
* targeted and full-suite validation pass.

**Explicit exclusions**

* production authentication;
* authoritative ownership enforcement;
* complete image-import hardening.

**Rollback boundary**

Creation-threshold logic and identity generation must be independently revertible without damaging existing calculator state.

#### M1.3 — Change Classification and Version Transition Semantics

**Objective**

Establish deterministic Project change classification and canonical version-transition rules.

**Scope**

* classify technical, metadata-only, Structural Capability Snapshot, mixed, and no-change states;
* preserve the approved derived-data classification;
* preserve rotation as metadata and zoom as session-only state;
* implement candidate transitions for first persistence, technical Save, metadata-only Save, mixed Save, and no-change Save;
* implement `versionId`, parent, ancestry, and timestamp semantics.

**Dependencies**

M1.1 and M1.2.

**Acceptance criteria**

* classification is deterministic and testable;
* technical changes generate technical version advancement;
* metadata-only changes preserve technical version history;
* mixed changes update both applicable histories correctly;
* no-change Save creates no false history;
* ancestry remains complete and deterministic;
* candidate transitions do not yet become authoritative merely because they were calculated;
* targeted and full-suite validation pass.

**Explicit exclusions**

* persistence-success adoption;
* browser-download confirmation;
* Save/Open cutover.

**Rollback boundary**

Classification and transition logic must be isolated sufficiently to revert without corrupting previously persisted Project data.

#### M1.4 — Confirmed Persistence, Save Integration, and Browser-Download Safety

**Objective**

Integrate canonical v2 Save behavior and ensure canonical history advances only after confirmed persistence.

**Scope**

* integrate candidate canonical transitions with Save and Update Existing Project;
* adopt version state, ancestry, timestamps, baseline, and clean state only after confirmed persistence;
* preserve authoritative state after failure or cancellation;
* resolve the browser-download fallback conflict;
* make canonical `.hfzproject` v2 the direct pre-launch persistence authority;
* reject accidental dual v1/v2 authority.

**Dependencies**

M1.1–M1.3.

**Acceptance criteria**

* first successful Save establishes first persistent version correctly;
* subsequent technical, metadata-only, mixed, and no-change Saves follow approved semantics;
* failure and cancellation create no false history;
* browser-download initiation alone is not treated as confirmed persistence;
* dirty state and saved baseline remain correct;
* Update Existing Project remains functional;
* targeted and full-suite validation pass.

**Explicit exclusions**

* v1 migration;
* v1 backward compatibility;
* cloud persistence;
* synchronization.

**Rollback boundary**

The Save migration must preserve a clear last-known-good state and must not require weakening existing unsaved-work protection.

#### M1.5 — Strict v2 Validation and Safe Open/Restore

**Objective**

Ensure only supported valid canonical v2 Projects become active state and failed Open attempts preserve existing valid work.

**Scope**

* implement strict v2 parsing and validation;
* reject malformed JSON, invalid structures, v1, and unsupported future versions;
* validate required canonical metadata and Project content;
* treat invalid regenerable derived data proportionately;
* integrate safe v2 Open and restoration;
* preserve active valid Project state after failed Open.

**Dependencies**

M1.1 and M1.4.

**Acceptance criteria**

* unsupported or invalid Project files fail closed;
* validation precedes active-state adoption;
* failed Open does not partially replace or corrupt active valid state;
* valid v2 Projects restore correctly;
* invalid regenerable derived results do not automatically invalidate otherwise valid canonical Projects;
* targeted and full-suite validation pass.

**Explicit exclusions**

* v1 migration;
* automatic repair of unsupported Project files;
* general recovery systems.

**Rollback boundary**

Parser, validator, and Open integration must remain sufficiently isolated to restore the last known working Open path if required during implementation.

#### M1.6 — Canonical v2 Round-Trip and Workspace Compatibility

**Objective**

Demonstrate complete canonical v2 Save/Open/Restore integrity while preserving compatible local workspace foundations.

**Scope**

* verify canonical Save → Open → Restore round-trip;
* preserve stable Project identity;
* verify Recent Projects compatibility;
* verify Update Existing Project compatibility;
* verify IndexedDB file-handle compatibility;
* ensure convenience-layer identities do not compete with canonical `projectId`.

**Dependencies**

M1.1–M1.5.

**Acceptance criteria**

* representative canonical Project data survives round-trip without silent loss or reclassification;
* Project identity remains stable;
* Recent Projects remains a device-local convenience layer;
* file handles do not define canonical identity;
* existing compatible workspace behavior remains functional;
* targeted and full-suite validation pass.

**Explicit exclusions**

* complete Milestone 6 Local Workspace behavior;
* unavailable-file UX beyond directly affected compatibility;
* cloud behavior.

**Rollback boundary**

Compatibility changes must remain separable from the canonical Project model and must not create competing persistence authority.

#### M1.7 — Conditional Browser `beforeunload` Protection

**Objective**

Protect persistent unsaved Project work at browser-controlled exit boundaries.

**Scope**

* activate conditional `beforeunload` protection when persistent unsaved Project work is genuinely at risk;
* include valid-but-never-persisted Projects and unsaved persistent changes;
* preserve existing internal Save/Discard/Cancel navigation behavior;
* exclude zoom and other session-only state.

**Dependencies**

M1.2–M1.4.

**Acceptance criteria**

* valid unsaved Project work activates browser-exit protection;
* unsaved technical or persistent metadata changes activate protection;
* confirmed clean persisted Projects do not;
* zoom and ephemeral UI state do not;
* existing internal navigation protection remains functional;
* targeted and full-suite validation pass.

**Explicit exclusions**

* autosave;
* crash recovery;
* power-loss recovery;
* general browser-lifecycle hardening.

**Rollback boundary**

The browser-exit protection must be independently removable without affecting canonical Project persistence or internal navigation protection.

#### M1.8 — Milestone 1 Integration Validation and Formal Closure

**Objective**

Verify the complete Milestone 1 implementation and record formal closure evidence.

**Scope**

* run complete authoritative automated validation;
* perform required targeted and manual verification;
* verify the complete canonical v2 lifecycle;
* confirm preservation boundaries and milestone exclusions;
* record final evidence and relevant commit hashes;
* formally close Milestone 1 only after all required criteria pass.

**Dependencies**

M1.1–M1.7 complete.

**Acceptance criteria**

Milestone-level verification confirms, as applicable:

* canonical v2 schema;
* creation threshold;
* identity stability;
* `ownerId` foundation;
* deterministic primary-image hash;
* valid-but-unsaved lifecycle;
* first persistent version;
* technical version advancement;
* metadata-only, mixed, and no-change Save semantics;
* complete ancestry;
* persistence-failure rollback;
* browser-download safety;
* strict v2 validation;
* v1 and unsupported-version rejection;
* failed-Open preservation;
* Save/Open/Restore round-trip;
* Recent Projects and file-handle compatibility;
* conditional `beforeunload` protection;
* preserved calculator behavior;
* complete authoritative validation passing.

Exact test counts remain observational rather than permanent contracts.

**Explicit exclusions**

No new feature implementation may be added merely to close the milestone.

**Rollback boundary**

Milestone closure records evidence only and must not hide unresolved implementation discrepancies.

#### 11.10.1 Approved Implementation Order

The approved Milestone 1 task order is:

`M1.1 → M1.2 → M1.3 → M1.4 → M1.5 → M1.6 → M1.7 → M1.8`

No task begins automatically.

Before each implementation task:

1. perform task-specific Pre-Implementation Analysis against the current repository state;
2. review the analysis;
3. resolve blockers or discrepancies;
4. obtain explicit Product Owner authorization;
5. implement only the approved scope.

#### 11.10.2 Milestone 1 Documentation Stop Boundary

After formal closure of M1.8:

**STOP.**

Do not begin Milestone 2 planning or implementation automatically.

Before Milestone 2 begins, evaluate and explicitly approve a new Phase 6 documentation structure.

The current `documentation/phase-6-implementation-plan.md` has become sufficiently large that continuing all later milestone detail in the same file may reduce usability, auditability, navigability, and context efficiency.

The likely future model is:

* the current Phase 6 plan remains the authoritative master overview and historical record;
* later milestones may receive dedicated planning and implementation documents.

The exact post-Milestone-1 documentation structure must be decided only after Milestone 1 is formally closed.

#### 11.10.3 Authoritative Task-Decomposition Conclusion

Milestone 1 shall be implemented through eight controlled tasks.

The decomposition preserves real technical risk boundaries without artificial fragmentation.

The authoritative sequence is:

**define the canonical Project foundation → create stable Project identity → classify changes and version transitions → persist safely → validate and restore safely → prove round-trip and workspace compatibility → protect browser exit → validate and formally close the milestone.**

No Milestone 1 implementation is authorized merely by this task decomposition.
**Implementation status: COMPLETED**

**Implementation evidence**

* canonical `.hfzproject` v2 contract introduced;
* canonical lifecycle metadata contract and factory introduced;
* pure inactive calculator-snapshot-to-v2 mapper introduced;
* reusable v2 test foundation introduced;
* live v1 Save/Open behavior remained unchanged;
* lifecycle runtime wiring remains deferred to M1.2;
* targeted tests: 8 passed;
* complete validation: backend 115 passed, frontend 242 passed across 50 files;
* total observational automated-test count: 357;
* frontend production build passed with 2,778 modules transformed;
* implementation commit: `43e9d57 — Phase 6 M1.1: add canonical project v2 foundation`.

**Closure**

M1.1 is complete and verified.

No M1.2 implementation has begun.
