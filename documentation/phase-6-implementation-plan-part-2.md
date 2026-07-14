# HFZWood — Phase 6 Implementation Plan — Part 2

## 1. Purpose and Continuation Point

This document continues the HFZWood Phase 6 implementation from the exact point where `phase-6-implementation-plan.md` ends operationally.

The previous document remains the authoritative historical record for:

* the complete Phase 6 implementation principles and milestone sequence;
* Milestone 0 planning, execution, verification, and formal closure;
* Milestone 1 planning;
* M1.1 planning, implementation, verification, and formal closure.

Current implementation status at the start of this document:

* Milestone 0 — CLOSED;
* M1.1 — CLOSED, committed, and pushed;
* M1.2 — CLOSED (see Section 4);
* next implementation step — M1.3 Pre-Implementation Analysis.

This document does not duplicate the architecture, governance rules, implementation history, or completed-task evidence already preserved in `phase-6-implementation-plan.md`.

## 2. Simplified Implementation Principle

From this point forward, Phase 6 uses the simplest implementation and documentation workflow that preserves:

* product correctness;
* architectural integrity;
* data safety;
* security;
* traceability;
* independent verification;
* rollback capability;
* repository discipline.

The objective is not to maximize documentation, task count, analysis length, or process ceremony.

The objective is to complete HFZWood safely, professionally, and efficiently.

The application is already functional, the Resin Calculator is validated and working, and the existing codebase contains substantial tested functionality that must be preserved rather than unnecessarily redesigned or rewritten.

Therefore:

* analysis must be proportionate to actual implementation risk;
* documentation must record decisions and evidence once, without unnecessary repetition;
* task decomposition must use the smallest number of meaningful tasks consistent with safe implementation;
* low-risk implementation details must not receive disproportionate architectural treatment;
* existing working functionality must be reused whenever compatible with the approved architecture;
* no speculative future functionality or unnecessary abstraction may be introduced;
* completed historical information must be referenced rather than copied;
* implementation should move forward decisively when architecture, repository evidence, and acceptance criteria are clear.

Higher-risk areas — including Project persistence, identity, ownership, authorization, data integrity, authentication, security, migration, and irreversible operations — retain the level of analysis and verification justified by their actual risk.

The authoritative rule is:

**Use the minimum process necessary to preserve correctness, safety, traceability, and reversibility. Complexity must be justified by real product or technical risk, not by process itself.**

## 3. Active Implementation Point

The active implementation task is:

**M1.3 — Change Classification and Version Transition Semantics**

The next action is:

**Cursor Pre-Implementation Analysis for M1.3, based on the approved Phase 5 Technical Architecture, the completed M1.1–M1.2 foundation, and the real current repository state.**

No implementation begins before that focused analysis is reviewed.

## 4. M1.2 — Project Creation Threshold, Identity, and Primary Image Hash

**Status:** CLOSED

**Implementation commit:** pending

### Threshold behavior

Canonical Project identity is created only when both conditions are satisfied:

* a non-empty authoritative primary-image data URL exists;
* at least one completed valid reference measurement exists (`knownLengthCm > 0`, at least two valid calibration points, in the completed `referenceMeasurements` collection).

Draft reference data does not satisfy the threshold. Evaluation is state-based, not tied to a specific UI event.

### Identity at threshold

When the threshold is first satisfied, the in-memory canonical lifecycle receives exactly once:

* `projectId` — `crypto.randomUUID()`;
* `ownerId` — from authenticated `user.id` via the auth adapter;
* `primaryImageHash` — SHA-256 over UTF-8 bytes of `image.dataUrl`, lowercase hex;
* `createdAt` — ISO timestamp.

The Project is valid but unsaved. No `versionId`, ancestry, persistence timestamps, or `.hfzproject` file is created.

### Session boundary

Identity creation applies only to **new Project sessions** wired through `NewProjectWorkspace`. Opened or imported Projects do not receive new canonical identity (deferred to M1.5).

When the session becomes non-new (import/open gating), in-flight identity operations are invalidated immediately via enabled-state and generation/operation token guards; pending hash results cannot be adopted; stale identity errors are cleared.

Replacing the primary image after identity exists resets lifecycle for a new Project session. Same data URL repeated callbacks do not reset identity.

### Validation at closure

* Backend: 115 passed
* Frontend: 309 passed
* Frontend production build: passed

### Explicit exclusions preserved

No `versionId`, persistence-success semantics, canonical v2 Save/Open cutover, strict Open validation, production authentication, ownership enforcement, image hardening, Cloud Workspace, or synchronization.
