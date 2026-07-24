# HFZWood — External Architecture Review

## Purpose

This document records independent architectural reviews performed outside the core development workflow.

Its purpose is **not** to redefine the project architecture after every review.

Instead, it serves as a long-term collection of external observations, risks, recommendations, and alternative architectural perspectives.

Each recommendation must be evaluated individually before becoming part of the roadmap.

This document is intentionally independent from the implementation plans.

---

# Review 1

Reviewer

Independent AI Architecture Review (Claude)

Date

2026-07-08

Review Scope

Phase 3 architecture

Implementation roadmap

Technical architecture

Product architecture

CMS architecture

Authorization

Product capabilities

Future cloud migration

Commercial scalability

---

# Key Findings

## 1. Local-first vs Cloud-first architecture

Observation

The current project model is fundamentally Local-first, while future phases introduce Cloud Sync and Project Sharing.

Potential risk:

Cloud synchronization may become increasingly difficult if projects continue to be treated exclusively as local files.

Current decision

No change.

The Product Owner intentionally chose a Local-first strategy because the application targets workshop environments where offline work remains important.

Action

Re-evaluate during Phase 4 Product Architecture before implementing Cloud Projects.

Priority

High

---

## 2. Product Capability enforcement

Observation

Capability limits must never rely exclusively on frontend/UI restrictions.

Future free users must not be able to bypass limitations by manually editing project files.

Recommendation

Server-side validation must exist wherever Product Capabilities affect business rules.

Examples:

- project upload
- project validation
- export
- calculations
- advanced reports

Priority

Critical

Status

Deferred to future commercial implementation.

---

## 3. Media delivery

Observation

Public media currently flows through the application server.

Recommendation

Introduce CDN-based media delivery before commercial launch.

Priority

Medium

Target

Phase 4 / Phase 5

---

## 4. Mock authentication

Observation

Mock authentication currently depends on environment configuration.

Recommendation

Production deployments should completely exclude mock authentication code rather than relying solely on configuration flags.

Priority

Critical

Target

Before production release.

---

## 5. API versioning

Observation

Public APIs currently have no version prefix.

Recommendation

Introduce API versioning before public API evolution becomes significant.

Example:

/api/v1/

Priority

Medium

---

## 6. CMS revision history

Observation

Editorial content currently has no historical revision system.

Recommendation

Implement revision history and rollback support before multiple editors begin using the CMS.

Priority

High

---

## 7. Optimistic locking

Observation

Current CMS assumes a single editor.

Recommendation

Introduce optimistic locking before collaborative editing.

Priority

High

---

## 8. Localization scalability

Observation

Current implementation is optimized for English and Romanian.

Recommendation

Review locale architecture before introducing additional languages.

Priority

Medium

---

## 9. Capability architecture

Observation

The Product Capability architecture (Identity → Role → Product Capabilities) was considered a strong architectural decision.

Recommendation

Continue building future commercial functionality exclusively through Product Capabilities.

Status

Approved.

---

## 10. Development workflow

Observation

The current workflow is more rigorous than most commercial software teams.

Product Owner Decision

Keep the workflow unchanged.

Current team size and project complexity justify the additional discipline.

The workflow has significantly improved software quality throughout Phase 3.

Status

Approved.

---

## 11. Product strategy

Observation

The reviewer questioned investing heavily in CMS infrastructure before implementing cloud collaboration.

Product Owner Decision

HFZWood is intentionally positioned as an educational ecosystem rather than only a resin calculator.

Manual

Glossary

Knowledge Base

Tutorials

are considered core product value, not secondary functionality.

No roadmap changes.

---

# Overall Assessment

The external review identified several valuable architectural improvements, particularly regarding:

- server-side capability enforcement
- production authentication
- CMS version history
- optimistic locking
- CDN adoption

The review did **not** identify any architectural flaw requiring redesign of Phase 3.

Several recommendations have been accepted for future phases.

Several observations were intentionally rejected because they conflict with the long-term product vision.

---

# Product Owner Notes

External reviews are intentionally preserved without modification.

Accepted recommendations are transferred into future implementation plans when appropriate.

Rejected recommendations remain documented to preserve architectural decision history.
# Review Outcome

## Review Status

Following additional product and architectural context, the external review was revisited by the reviewer.

Several original concerns were confirmed.

Several concerns were withdrawn after understanding the long-term product vision.

This second-pass review provides a much more accurate assessment of the project.

---

# Confirmed Recommendations

The following recommendations are accepted and will become architectural requirements for future phases.

## 1. Server-side Capability Enforcement

Accepted.

Product Capabilities must eventually be enforced by backend business logic, not only by frontend UI restrictions.

Future commercial features must validate capability limits during:

- calculations
- exports
- project validation
- cloud synchronization

Target:

Before commercial release.

---

## 2. Production Authentication

Accepted.

Mock authentication should not exist inside production deployment artifacts.

Future production builds should completely exclude development authentication code.

Target:

Before production deployment.

---

## 3. CMS Revision History

Accepted.

The editorial platform should eventually support revision history.

Rollback UI is not required immediately.

However, historical revisions should begin being stored before collaborative editing is introduced.

Target:

Future Editorial Improvements.

---

## 4. Optimistic Locking

Accepted.

Single-editor workflow is sufficient today.

Before introducing multiple editors, optimistic locking should be implemented to avoid silent overwrites.

Target:

Future Editorial Improvements.

---

## 5. API Versioning

Accepted.

Public API versioning should be introduced before long-term API evolution.

Target:

Before public API stabilization.

---

## 6. CDN-based Media Delivery

Accepted.

Public editorial media should eventually move behind a CDN.

Current implementation is acceptable for the current project stage.

Target:

Before commercial launch.

---

## 7. Project File Evolution

Accepted.

This became the most valuable recommendation of the review.

HFZWood should prepare the .hfzproject format for future synchronization before implementing cloud storage.

The goal is NOT to implement synchronization now.

The goal is to ensure that the file format is synchronization-ready.

Future project metadata should include concepts similar to:

- stable project identifier
- format version
- revision identifier
- content hash
- synchronization metadata

The exact schema will be designed during Phase 4 Product Architecture.

---

# Recommendations Not Adopted

## CMS developed too early

Rejected.

Additional product context clarified that:

Manual

Glossary

Knowledge Base

Tutorials

are considered core product functionality rather than supporting documentation.

HFZWood is intentionally designed as an educational platform rather than a standalone calculator.

No roadmap changes required.

---

## Local-first architecture

Rejected.

The Local-first strategy was an intentional product decision.

Target users frequently work in woodworking workshops where reliable internet access cannot be assumed.

Cloud synchronization remains an enhancement rather than the primary storage model.

However, the implementation recommendations regarding synchronization-ready project files have been accepted.

---

## Development Workflow

Rejected.

The reviewer initially considered the workflow too heavyweight.

After additional context regarding the current development model:

- Product Owner
- Cursor
- ChatGPT

the reviewer agreed that the workflow appropriately replaces traditional peer review.

The workflow will remain unchanged.

---

# Architectural Decisions Generated

The external review produced one new architectural direction that was not previously identified.

Future Phase 4 architecture should explicitly define:

**Canonical Project Ownership**

Before implementing cloud synchronization, the project must formally answer:

Who is the canonical owner of a project?

Possible models include:

- Local device is authoritative; cloud acts as synchronization.
- Cloud is authoritative; local file becomes a synchronized replica.

This decision should be documented as an Architecture Decision Record (ADR) before any cloud implementation begins.

No cloud implementation should start before this architectural decision is approved.

---

# Final Assessment

The second-pass review significantly increased confidence in the overall architecture.

After receiving additional product context, the reviewer:

- withdrew the major concerns regarding CMS investment,
- withdrew the concerns regarding Local-first strategy,
- withdrew the concerns regarding the development workflow.

The remaining recommendations are implementation improvements rather than architectural redesigns.

No recommendation requires revisiting or redesigning the Phase 3 architecture.

The review concludes that Phase 3 provides a solid architectural foundation for Phase 4.