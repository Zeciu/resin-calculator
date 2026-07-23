HFZWood — ChatGPT Project Handover
Purpose

This document exists to allow a brand-new ChatGPT conversation to immediately continue the HFZWood project without losing workflow discipline or product decisions.

Before giving any recommendation, implementation advice or Cursor prompt, always read this document together with:

documentation/phase-2-implementation-plan.md
documentation/implementation-roadmap.md

These documents are the source of truth.

Never ignore them.

Development Environment

HFZWood development is started from the project root using:

.\dev.cmd

Do not suggest generic npm commands or generic development startup procedures unless explicitly requested.

The project already contains its own development launcher.

General Project Context

HFZWood is a browser application for calculating epoxy resin volume from photographs.

The application is intentionally being developed with strong product discipline.

The goal is not only working software.

The goal is a coherent product.

Product decisions always have priority over quick technical solutions.

Current Status

Phase 1 is complete (Tasks 1–42).

Phase 2 is complete and Release Certified (Tasks 43–57).

Workspace Polish Version 2.1 is complete (WP-01 through WP-05).

Baseline before Workspace Polish: `81ed9a0` — Phase 2: Complete Release Certification.

Refer to `documentation/workspace-polish-plan.md` for Workspace Polish scope and `documentation/phase-2-implementation-plan.md` for Phase 2 history.

Always verify roadmap and implementation plan before suggesting implementation.

Development Workflow

Every task follows exactly this workflow.

Never skip any step.

Step 1

Pre-Implementation Analysis.

Cursor receives only analysis instructions.

No code.

No file modifications.

No implementation.

Step 2

ChatGPT reviews Cursor analysis.

If architecture or scope is wrong:

Stop.

Correct specification first.

Never implement from a bad specification.

Step 3

Implementation Prompt.

Only after product review.

Step 4

Cursor implements.

Step 5

ChatGPT reviews:

Architecture

Scope

UX

Product behavior

Manual testing scenarios

Step 6

Only after approval:

Keep All

Step 7

Cursor performs post-task workflow:

Frontend build

Full test suite

Documentation update

Roadmap update

Commit

Push

Repository clean confirmation

No future-task functionality confirmation

Important Rules

Never skip Pre-Implementation Analysis.

Never approve Keep All before review.

Never mix multiple tasks.

One task = one commit.

Repository must always be clean before starting the next task.

Product Philosophy

HFZWood is being designed as a real desktop-quality application running inside the browser.

Whenever product decisions are made:

Prefer familiar desktop application behavior.

Do not invent unnecessary workflows.

Examples:

Open Project should feel like File → Open.

Save Project should feel like Save.

Users own their project files.

The application never "owns" projects.

Project files remain the source of truth.

Browser storage is only lightweight metadata.

Current Architecture

Projects are stored as:

.hfzproject

The Recent Projects list is only a convenience index.

It is NOT project persistence.

Current Project identity exists only while a project is open.

The calculator remains responsible only for calculator state.

Workspace owns project orchestration.

Scope Discipline

Never implement functionality belonging to future tasks.

If implementation naturally suggests future features:

Stop.

Document them.

Do not implement them.

UX Discipline

Always think like a Product Owner.

Before accepting any implementation ask:

Does this feel natural?

Would Photoshop do this?

Would Word do this?

Would Visual Studio do this?

Users should never have to understand implementation details.

Review Discipline

Manual testing is mandatory.

Passing tests are never sufficient.

Every completed task must be manually verified.

Communication Style

All discussion with the user must be in Romanian.

Cursor prompts remain in English.

Future Conversations

When a new chat starts:

Read this document first.

Then read:

phase-2-implementation-plan.md

implementation-roadmap.md

Only then continue development.

Never assume.

Never skip workflow.

Always preserve previous product decisions.

Additional Notes

If any previous product decision conflicts with a technical shortcut:

The product decision always wins.

HFZWood is intentionally being built slowly and carefully.

Correct architecture is preferred over faster implementation.

The project is expected to evolve for many months.

Maintain consistency above all.
HFZWood Manual Design Principles

The HFZWood Manual should resemble the reading experience of a high-quality university textbook, not a software documentation portal.

The interface should communicate:

calm;
clarity;
trust;
craftsmanship;
tradition;
professionalism.

It should avoid:

visual noise;
excessive colors;
dashboard aesthetics;
decorative UI elements;
unnecessary cards and panels.

The content is the primary visual element.

The interface should quietly support reading rather than compete for attention.
Support semantic content blocks (Important, Warning, Tip, Note, Quote, etc.) instead of plain bold formatting.
Phase 2 Progress Update — 2026-07-03 (Tasks 43–54 and Task 56 complete)
Current project status

Phase 2 implementation tasks 43–54 are complete. Task 56 documentation alignment is complete.

Remaining Phase 2 tasks: 55 (Release Candidate validation), 57 (closure).

Completed tasks:

Task 43 through Task 54

Task 56

Refer to `documentation/implementation-roadmap.md` for the authoritative progress table.

Product philosophy confirmed

By the end of Task 54, four distinct interaction models are established:

Projects

Behaves like a desktop application.

Focus:

project management
save/update
reopening
continuity
Manual

Behaves like a university textbook.

Focus:

long-form reading
explanation
learning
embedded illustrations
embedded videos
Glossary

Behaves like a technical dictionary.

Focus:

quick lookup
terminology
concise definitions
supporting images
occasional video
immediate access
Knowledge Base

Behaves like a technical support library.

Focus:

troubleshooting
structured problem-solving sections
practical recovery guidance
module-local search
expandable entries

Although visually consistent, these modules intentionally create different user experiences.

This distinction is now considered a permanent HFZWood design principle.

Workflow reminder

Continue using the established workflow for every remaining Phase 2 task:

Review Task specification.
Rewrite Task specification if necessary.
Cursor performs Pre-Implementation Analysis.
Review analysis together.
Resolve remaining product decisions.
Implement.
Manual UX review.
Apply small polish if needed.
Keep All.
Build.
Tests.
Documentation update.
Commit.
Push.

This workflow has produced significantly better implementations than coding directly.

Continue following it.

Next task

Next Phase 2 work:

Task 55 — Release Candidate validation (manual QA; no feature implementation)

Then Task 57 — Phase 2 closure after documentation and QA are complete.

The goal is not merely to implement the roadmap, but to produce a cohesive, premium user experience across the entire HFZWood application.
HFZWood Project — Phase 2 officially completed

Read the current project documentation before proposing any work, especially:

- documentation/phase-2-implementation-plan.md
- documentation/implementation-roadmap.md
- documentation/application-design.md
- README.md

Workflow

Continue using the established HFZWood development workflow:

1. Product Review
2. Architecture Review
3. Implementation
4. Manual Verification
5. UX / Integration Polish
6. QA
7. Documentation Alignment
8. Release Certification

Do not skip review stages.

Current project status

Phase 2 has been officially completed and Release Certified.

Workspace Polish Version 2.1 is complete (2026-07-04). All five workspace improvements (WP-01 through WP-05) implemented, manually verified, and regression-tested.

Final certification (Phase 2):
- Production build passed.
- 122 frontend tests passed.
- 34 backend tests passed.
- Manual Release Candidate QA completed successfully.
- Documentation synchronized.
- Repository clean and pushed to origin/main.
- Phase 2 officially certified.

Workspace Polish verification:
- Production build passed.
- 122 frontend tests passed.
- 34 backend tests passed.
- Manual verification passed (Product Owner).

Current baseline commit:
See latest commit on `origin/main` — `Workspace Polish: Complete Version 2.1`

Prior Phase 2 baseline:
81ed9a0 — Phase 2: Complete Release Certification

Current product

HFZWood now includes:

- Authentication
- Home Hub
- Dedicated Module Architecture
- New Project Workspace
- Save / Open / Update Project
- .hfzproject persistence
- Recent Projects
- Manual & Tutorials
- Glossary
- Knowledge Base
- Documentation synchronized with implementation

Important

Phase 2 is CLOSED.

Do not reopen completed Phase 2 tasks.

Do not propose additional polish or refactoring unless specifically requested.

Any new functionality belongs to the next development stage.

Next work

Workspace Polish Version 2.1 is complete. Phase 3 planning may begin when requested.

Do not reopen Phase 2 or Workspace Polish unless specifically requested.

Planned long-term roadmap

~~Workspace Polish~~ ✓ Complete (Version 2.1)
↓

Phase 3
Admin Panel
(Content management for Manual, Glossary, Knowledge Base and future administration.)

↓

Phase 4
Cloud Platform
(Real authentication, cloud projects, synchronization, online project library.)

↓

Phase 5
Business Platform
(Stripe, subscriptions, licensing, user management, notifications.)

↓

Phase 6
Intelligence
(Global search, semantic search, AI assistance when product maturity justifies it.)

↓

Phase 7
Ecosystem
(API, integrations, mobile, offline mode, multi-language.)

Development philosophy

Protect release discipline.

If an improvement does not block the current milestone, defer it to the next appropriate phase.

Prioritize shipping over perfection while maintaining professional quality.
# Current Project Status

HFZWood is currently in a stable post-Phase 2 state.

Completed milestones:

- Phase 1 — Complete
- Phase 2 — Complete and Release Certified
- Workspace Polish (Version 2.1) — Complete

Workspace Polish delivered:

- Automatic scroll to the uploaded/restored image.
- View & Navigation controls moved below the image.
- Temporary alignment grid during Reference Measurements.
- Canvas status HUD moved outside the image.
- High-contrast editing colors.
- Recommendation placeholder for First Fill Seal Coat Thickness.

Current repository state:

- Phase 2 Release Certification:
  Commit: 81ed9a0

- Workspace Polish:
  Commit: 39568e1

Current product status:

The calculator workspace is considered mature and stable.

The following areas are considered complete:

- Authentication
- Home Hub
- Dedicated Module Architecture
- New Project Workspace
- Save / Open / Update Project
- .hfzproject persistence
- Recent Projects
- Manual
- Glossary
- Knowledge Base
- Navigation consistency
- Documentation alignment
- Workspace usability polish

Build, automated tests, manual QA and documentation are all synchronized.

The repository is clean and pushed to origin/main.

---

# Next Milestone

The next development stage is:

# Phase 3 — Product Maturity

Primary objective:

Transform HFZWood from a developer-maintained application into a product whose educational content can be managed without modifying the source code.

Planned Phase 3 scope:

- Admin Panel
- Manual management
- Glossary management
- Knowledge Base management
- Content editing directly from the application
- User preferences
- Roles and permissions
- Global documentation search

Expected result:

The Manual, Glossary and Knowledge Base become editable through an administrative interface rather than by editing project files.

No calculator algorithm changes are planned unless a genuine product need is discovered.

---

# Long-term Roadmap

Phase 3 — Product Maturity

↓

Phase 4 — Cloud Platform

- Real authentication
- Cloud project storage
- Project synchronization
- Online project library
- Project sharing

↓

Phase 5 — Business Platform

- Stripe
- Subscriptions
- Licensing
- User management
- Notifications
- Emails

↓

Phase 6 — Intelligence

This phase will likely be postponed until after the Business Platform is complete.

Potential scope:

- AI Knowledge Base
- Semantic Search
- Natural language questions
- Intelligent assistant
- AI-assisted cavity and defect recognition
- Future AI-powered workflow assistance

Development philosophy remains unchanged:

Product Review
→ Architecture Review
→ Implementation
→ Manual Verification
→ QA
→ Documentation Alignment
→ Release Certification

No implementation begins before the documentation for that milestone has been completed and approved.
# HFZWood — Phase 3 Planning Completed

## Current Status

Phase 3 planning has been completed and approved.

The following documents are now considered final:

- documentation/phase-3-implementation-plan.md
- documentation/phase-3-technical-architecture.md

Both documents have been reviewed multiple times by ChatGPT and Cursor.

The final technical architecture incorporates the last approved changes:

- Manual migration preserves the Chapter → Section hierarchy.
- Language fallback no longer switches automatically to English. Users see a localized "content unavailable" message and may explicitly choose to open the English version if it exists.

Both documents are now frozen and should not be modified unless implementation reveals a real architectural problem.

---

# Phase 3 Final Task List

Task 58 — Admin Panel Foundation

Task 59 — Manual Content Management

Task 60 — Glossary Content Management

Task 61 — Knowledge Base Content Management

Task 62 — Shared Editorial Infrastructure

Task 63 — Application Preferences

Task 64 — Roles, Authorization & Product Capability Foundation (complete)

Task 65 — Phase 3 Integration, QA & Documentation Alignment

Task 66 — Phase 3 Release Certification

---

# Important Product Decisions

## Product Architecture and Technical Architecture are now separated

From Phase 3 onward every phase follows this workflow:

Roadmap

↓

Product Architecture

↓

Technical Architecture

↓

Implementation

↓

Integration QA

↓

Release Certification

Implementation must always follow the approved Product Architecture.

Technical Architecture defines HOW.

Product Architecture defines WHAT.

---

## Global Documentation Search

Originally planned for Phase 3.

Decision:

Removed from Phase 3.

Moved to Phase 6 (AI / Intelligence).

Reason:

Manual, Glossary and Knowledge Base are independent workspaces.

Users search only inside the module they are currently using.

A future AI-powered semantic search will replace the original idea.

---

## Manual Structure

The public Manual remains one continuous document.

Internally:

Chapter

↓

Section

↓

Content Blocks

Migration preserves chapter hierarchy and section identifiers.

---

## Multilingual Philosophy

Each logical content item owns all language variants.

Each language has independent:

- Draft
- Published

The administrator switches between language variants while editing.

Users always experience one language across the application.

Interface language and educational content remain synchronized.

If a requested language is unavailable:

- show localized unavailable message;
- offer explicit "View English version" if English exists;
- never switch languages automatically.

---

## Editorial Philosophy

Manual

=

Book

Glossary

=

Dictionary

Knowledge Base

=

Troubleshooting Manual

Each module preserves its own identity.

No global documentation search in Phase 3.

---

## Shared Editorial Infrastructure

Task 62 introduces the common editorial platform:

- shared editor
- media library
- upload manager
- asset manager
- reusable assets
- cross references
- internal links
- semantic blocks
- asset reuse
- asset protection
- media metadata

The goal is consistency rather than enterprise CMS complexity.

---

## Roles

Phase 3 supports only:

- User
- Administrator

Architecture is prepared for future roles.

Administrative functionality remains completely invisible to standard users.

---

## Preferences

Users may configure:

- interface language
- measurement units
- volume units

Internal calculations always use canonical units.

Preferences affect presentation only.

---

## Workflow Decision

Architecture discussions are finished.

From now on implementation starts.

New product ideas discovered during implementation should normally be added to future phases instead of modifying the approved Phase 3 documents.

Only implementation blockers justify architectural changes.

---

# Next Session

Start implementation.

Task:

Task 58 — Admin Panel Foundation

Follow the existing implementation workflow:

1. Read Task 58.
2. Analyze existing code.
3. Produce implementation plan.
4. Implement.
5. Build.
6. Run complete test suite.
7. Manual verification.
8. Fix issues immediately.
9. Commit.
10. Push.
11. Update documentation.
12. Close the task.

Only then continue with Task 59.

---

# Repository Status

Phase 3 planning completed.

Product Architecture approved.

Technical Architecture approved.

Repository synchronized.

Task 58 is complete and approved.

Task 59 (Manual Content Management) is complete and approved.

The next implementation step is Task 60 — Glossary Content Management.
Future Documentation Consolidation (after Phase 3)

This is a planned documentation task that must be completed after finishing Phase 3 (Tasks 60–64) and before starting Phase 4.

The goal is to consolidate everything learned during the implementation of the editorial system into permanent project documentation.

The following documents must be created:

1. architecture-decisions.md

Create a permanent Architecture Decision Log (ADR).

Every important product or technical decision must be recorded using a standard format:

Date
Decision
Motivation
Alternatives considered
Alternatives rejected
Impact on the project

Purpose:

Avoid rediscovering or accidentally reversing important architectural decisions months later.

2. development-workflow.md

Document the complete development methodology established during Phase 3.

Include at least:

Product Freeze before implementation
UX Freeze before coding
Product before Code
Reuse before Rewrite
Cleanup before task closure
Test → Build → Documentation → Commit → Push workflow
Definition of Done
"When to stop polishing" rule
Rules for eliminating obsolete code (junk code) after every refactor

Purpose:

Create a repeatable workflow that keeps development consistent for the remainder of the project.

3. technical-standards.md

Document the permanent technical rules.

Include topics such as:

Rollback strategy
Commit discipline
Repository cleanliness
Performance checkpoints
Scalability checkpoints
Coding conventions
Build and testing requirements

Purpose:

Keep the codebase maintainable as the project grows.

4. editorial-strategy.md

Document the long-term editorial architecture.

Include:

Save vs Publish workflow
Editorial lifecycle
Backup strategy
Restore/version history
Disaster recovery
Export/Import
Future multilingual strategy

Purpose:

Ensure that user-generated editorial content can never be lost accidentally.

Important

Do NOT implement these documents immediately.

Continue implementing Phase 3 normally.

During Tasks 60–64 we will probably discover additional rules and architectural decisions.

Only after Phase 3 is complete should these documents be written, using the final implementation as the source of truth.
Workflow Improvement — Local Development Baseline Verification (2026-07-08)
Context

During the start of Task 60, approximately one hour was lost diagnosing what initially appeared to be an Admin Panel regression.

The actual issue was not related to Task 58, Task 59, or the application architecture, but to the local development environment.

Several independent issues occurred at the same time:

frontend/.env.local existed in the editor but had not actually been saved to disk (0-byte file).
Because of this, VITE_MOCK_ADMIN was not loaded by Vite.
The application therefore logged in with the user role instead of administrator.
Existing browser sessions complicated diagnosis because sessionStorage may contain stale values while the in-memory authentication state behaves differently.
Multiple backend/frontend instances were started during troubleshooting, making it difficult to determine which process was actually serving requests.
HTTP 500 errors observed in the Admin UI were ultimately caused by the Vite proxy being unable to reach the backend (ECONNREFUSED), not by failures in the Manual CMS implementation.

No architectural regression was found.

New Mandatory Workflow

Before starting any implementation task in Phase 3 or later, perform the following Pre-flight Verification.

1. Environment
Verify frontend/.env.local exists.
Verify it is saved to disk.
Verify it contains:
VITE_MOCK_ADMIN=true

If the file is modified, restart the frontend dev server.

2. Backend

Verify:

http://127.0.0.1:5000/health

returns HTTP 200.

No frontend work should begin if the backend health endpoint is unavailable.

3. Frontend

Start a single Vite development server.

Avoid multiple frontend instances running simultaneously.

4. Authentication

Login using mock authentication.

Verify administrator access by opening:

/admin

Admin access must be confirmed before starting implementation.

5. Repository

Verify:

clean working tree (unless continuing an active task)
documentation synchronized
correct task selected
6. Baseline Verification

Before modifying any code, confirm:

backend starts cleanly
frontend starts cleanly
login works
administrator panel opens
existing functionality behaves as expected

Only after all checks pass may implementation begin.

Lessons Learned

Today's investigation confirmed several important principles:

Never assume a regression before verifying the development environment.
Verify configuration before debugging application logic.
Distinguish infrastructure failures (proxy/backend unavailable) from application failures.
Eliminate environmental uncertainty before analysing implementation.
Every implementation day should begin from a verified, stable baseline.
Additional Improvement

To avoid repeating this situation, the project should permanently include:

frontend/.env.example

documenting the required local development variables (currently VITE_MOCK_ADMIN=true).

This file should be committed to the repository, while .env.local remains ignored by Git.
# HFZWood — Daily Project Handover (2026-07-08)

## Phase 3 Official Closure

Today marks the successful completion of **Phase 3** of the HFZWood application.

Beyond implementing the remaining tasks, today's work focused on Product Owner QA, multiple QA repair iterations, architecture refinement, code hygiene, and a complete release audit.

Phase 3 is now considered complete, stable, documented, and ready to become the foundation for future development.

---

# Task 63 — Application Preferences

The initial implementation was technically complete but Product Owner QA identified several important UX and workflow issues.

Major findings included:

- Application Preferences were difficult to discover.
- Language and measurement units were hidden too deeply.
- Manual CMS incorrectly handled locale-specific chapter creation.
- Calculator display units contained rendering issues.
- Overall user experience required refinement.

Several QA Repair Passes were performed.

Final implementation includes:

- Quick Preferences available directly from the Home sidebar.
- Quick Preferences also available inside New Project.
- Immediate access to:
  - Interface Language
  - Length Units
  - Volume Units
- Preferences persist correctly after reload.
- Manual CMS now creates locale-specific variants correctly.
- Manual sidebar displays only chapters that exist in the active language.
- Overall usability significantly improved.

Task 63 was accepted only after complete manual Product Owner verification.

---

# Task 64 — Roles, Authorization & Product Capability Foundation

Task 64 evolved significantly beyond the original roadmap.

Instead of implementing only Roles & Permissions, the architecture was expanded into a complete Product Capability foundation for future commercial editions.

Final architecture separates three independent concepts:

Identity

↓

Role

↓

Product Capabilities

Role determines:

- user
- administrator

Access Tier determines:

- free
- subscriber
- administrator_unlimited

Administrator access remains completely independent from commercial access.

A backend-owned Product Capability Catalog was introduced.

Initial capability examples include:

- calculator.maxPolygonPoints
- calculator.pdfExport
- calculator.exportFormat
- calculator.formworkMode
- calculator.layerCalculation
- calculator.advancedReports
- projects.maxSavedProjects
- knowledgeBase.maxArticles
- tutorial.maxVideos
- ai.enabled
- ai.maxRequestsPerDay

One of the most important architectural decisions of the project was established:

**Application modules must never check access tiers directly.**

Modules only query Product Capabilities.

This completely removes future duplication between Free and Subscriber editions.

No subscriptions, payments, Stripe integration, billing, pricing UI, or commercial workflows were implemented.

Only the infrastructure required for future commercial expansion was created.

---

# Product Decisions

Several important long-term product decisions were finalized.

Calculator:

- One calculator only.
- No separate Free and Premium calculators.
- Differences are controlled exclusively through Product Capabilities.

Free Edition:

- Maximum polygon size: 4 points.
- Rectangle/simple formwork workflow.
- Unlimited reference measurements.
- Total volume calculation available.
- No layer calculation.
- No PDF export.
- No advanced reports.

Manual:

- Full access.

Glossary:

- Full access.

Knowledge Base:

- Limited number of free articles.

Tutorials:

- Limited number of free videos.

Administrator:

- Unlimited access regardless of access tier.

This "Single Product + Product Capabilities" philosophy becomes one of the core architectural principles of HFZWood.

---

# Task 65 — Phase 3 Release Audit

Task 65 was intentionally transformed from a simple Integration & QA task into a complete Release Audit.

The audit included:

- Code Hygiene Audit
- Regression Audit
- Documentation Audit
- Technical Debt Review
- Release Readiness Assessment

Cleanup performed:

- Removed leftover debug code.
- Removed dead code.
- Removed obsolete helper functions.
- Removed unused CSS.
- Removed redundant implementation artifacts created during previous QA repair passes.

All automated tests passed successfully.

Documentation was synchronized across all Phase 3 documents.

Phase 3 was officially declared:

**COMPLETE**

---

# Workflow Improvements

Today's work finalized the development workflow that will be used for all future phases.

Final workflow:

1. Pre-Implementation Analysis
2. Implementation
3. Automated Testing
4. Product Owner Manual QA
5. QA Repair Passes (if required)
6. Code Hygiene Audit
7. Release Audit
8. Push
9. Official Task Closure

This workflow proved extremely effective and will remain the standard process for future development.

---

# Technical Debt

No blocking issues remain for Phase 3.

Deferred items for Phase 4 include:

- Frontend Cognito authentication integration.
- DynamoDB persistence.
- Capability-based commercial feature gating.
- Shared API client consolidation.
- Frontend code splitting.
- Legacy content fallback removal.

These items are documented but intentionally deferred.

---

# Phase 3 Status

Phase 3 is officially complete.

Completed tasks:

- Task 58
- Task 59
- Task 60
- Task 61
- Task 62
- Task 63
- Task 64
- Task 65

The platform now includes:

- Manual CMS
- Glossary CMS
- Knowledge Base CMS
- Editorial Infrastructure
- Draft / Live Publishing Workflow
- Localization
- Application Preferences
- Quick Preferences
- Product Capability Foundation
- Authorization Infrastructure
- Release Audit Workflow

HFZWood now has a mature, maintainable, and scalable foundation ready for Phase 4.

---

# Looking Ahead

Phase 4 will build on the foundation established during Phase 3.

The focus will shift from platform infrastructure toward commercial product capabilities, advanced calculator functionality, AI-assisted features, export workflows, and the first monetization mechanisms built on top of the Product Capability architecture completed today.
HFZWood — Phase 4 Product Architecture handover

We have completed and closed **Phase 4 – Product Architecture**.

The main document finalized today is:

* `phase-4-product-architecture.md`

This document is now considered the official Product Architecture source of truth for HFZWood.

It defines HFZWood as a **project-centric product**, where the Project is the central product entity and all other modules either create, enrich, manage, support, protect, personalize, or control access to Projects.

The following sections and modules have been completed:

1. Purpose
2. Product Principles
3. Core Product Entity
4. Product Modules Overview
5. Product Module Design Principles
6. Project Module
7. Project Tools Module
8. Local Workspace Module
9. Cloud Workspace Module
10. Learning Module
11. Identity Module
12. Subscription Module
13. Settings Module
14. Architecture Closure

Key approved Product Architecture decisions:

* The Project is the central product entity.
* HFZWood is intentionally project-centric.
* A Project exists only after a primary image and at least one reference measurement exist.
* Every Project has exactly one immutable primary image.
* If the image changes or the physical configuration changes, a new Project must be created.
* Project Tools define how Projects are created and enriched.
* Project Tools own and enforce the HFZWood workflow.
* The workflow is mandatory and represents validated professional knowledge.
* AI is not part of Project Tools; future AI capabilities may assist but never replace user validation.
* Local Workspace manages locally stored Project representations.
* Cloud Workspace manages cloud-stored Project representations for backup, continuity, restore, and sync.
* Local and Cloud represent the same Project in different locations.
* Conflicts are never resolved silently; the user remains in control.
* The last remaining copy of a Project must be protected, whether local or cloud.
* Learning is an authenticated educational ecosystem composed of Manual, Tutorials, Glossary, and Knowledge Base.
* Learning is read-only and does not modify Projects.
* Identity establishes who the authenticated user is.
* No anonymous Project ownership exists.
* Initial authentication is required before Project creation.
* Subscription controls capabilities, limits, and content access.
* Free is a subscription state, not the absence of subscription.
* Settings manages preferences, not permissions.
* Settings may include both account-level and device-specific preferences.
* Trusted Devices, account-sharing protection, license-abuse prevention, and advanced account security are intentionally deferred to a future Business Platform phase.
* Export and Search remain cross-cutting features, not product modules.

External adversarial review:

Claude reviewed the document adversarially and identified several issues. The valid ones were resolved:

* Local Workspace vs Project Tools creation/editing responsibility was clarified.
* Authentication vs Local-First was clarified.
* Last remaining copy protection was added for Cloud Workspace.
* Subscription downgrade / entitlement restrictions were assigned conceptually.
* Sync responsibility between Local Workspace and Cloud Workspace was clarified.
* Learning authentication was clarified.

After these corrections, the document was reviewed internally one final time. Only small copy/formatting issues remained, not architectural problems.

Final assessment:

**Phase 4 – Product Architecture is complete.**

Do not reopen Product Architecture unless a major product decision changes.

Next logical step:

Before starting Phase 5 Technical Architecture, create a short document:

* `product-architecture-decisions.md`

Purpose:

To capture the most important Product Architecture decisions and their rationale, so future work understands not only what was decided, but why.

Suggested structure for each decision:

* Decision ID
* Title
* Decision
* Rationale
* Alternatives considered
* Status

Likely decisions to include:

* PA-001 Project-centric architecture
* PA-002 Project creation threshold
* PA-003 Immutable primary image
* PA-004 Project physical configuration defines identity
* PA-005 Project Tools own the workflow
* PA-006 Workflow is mandatory
* PA-007 Learning is independent but authenticated
* PA-008 Local and Cloud represent the same Project
* PA-009 Conflicts are never resolved silently
* PA-010 Last remaining copy protection
* PA-011 Free is a Subscription state
* PA-012 Identity vs Subscription vs Settings separation
* PA-013 AI is a future assisting module, not part of Project Tools
* PA-014 Export and Search are cross-cutting features
* PA-015 Trusted Devices deferred to Business Platform phase

Workflow rule going forward:

* Product Architecture decisions are made in ChatGPT discussion.
* Cursor does not decide Product Architecture.
* Cursor implements or refactors only from approved documents.
* Technical Architecture must not invent product decisions.
* If Technical Architecture reveals a missing product decision, stop and resolve it at Product Architecture level first.

When work resumes, continue with:

1. Create `product-architecture-decisions.md`.
2. Extract the key decisions from `phase-4-product-architecture.md`.
3. Keep the document short, disciplined, and decision-focused.
4. After that, begin preparation for **Phase 5 – Technical Architecture**.
# HFZWood — Phase 5 Technical Architecture Continuity Context

## Date and current status

Date: 10 July 2026.

HFZWood is a project-centric application for woodworking and epoxy resin projects, built with React/Vite, FastAPI, and Cursor.

The project is being developed under one fundamental workflow rule:

**Work step by step. Do not move to the next step until the current step is completed. Give short, clear, precise instructions about what to modify, where to modify it, what to delete, and what to add. Do not provide multiple implementation steps at once unless necessary.**

Current high-level status:

* Phase 1 — Foundation: COMPLETE.
* Phase 2 — Logged-in Product Experience: COMPLETE.
* Phase 3 — Product Maturity: COMPLETE.
* Phase 4 — Product Architecture: COMPLETE and definitively closed.
* Phase 5 — Technical Architecture: IN PROGRESS.
* Phase 6 — Architecture Implementation & Refactoring: follows Phase 5.
* Release Preparation: follows Phase 6.
* Product Evolution: post-launch.

The immediate objective is to finish Phase 5 only to the level necessary for Phase 6 to implement the architecture without inventing unauthorized major technical or product decisions.

Do not extend Phase 5 indefinitely merely to produce more documentation.

---

## Phase 5 document

The main document currently being written is:

`documentation/phase-5-technical-architecture.md`

The document is complete through:

**Section 19 — Identity and Authentication Architecture**

Section 19 has been added and saved successfully.

Do not rewrite completed sections unless a genuine inconsistency is discovered.

---

## Major Phase 5 architecture already defined

The Technical Architecture document currently contains, among other earlier sections, the following completed areas:

* Project identity;
* Project version identity;
* Project ownership;
* primary image architecture;
* technical version boundaries;
* Project persistence lifecycle;
* Project file format and migration;
* local Project persistence;
* cloud Project persistence and branching;
* synchronization and conflict detection;
* conflict resolution;
* identity and authentication.

The most recently completed sections are:

### Section 13 — Project Persistence Lifecycle

Approved rules include:

* A Project becomes technically valid when it has one primary image and at least one reference measurement.
* At that point it receives:

  * `projectId`;
  * `ownerId`;
  * `primaryImageHash`;
  * `createdAt`.
* It does not yet receive a `versionId`.
* The first `versionId` is generated only after the first successful explicit Save.
* The first persistent version has:

  * `parentVersionId = null`;
  * `ancestorVersionIds = []`.
* Technical changes generate a new `versionId`.
* Metadata-only changes do not generate a new technical `versionId`.
* `lastModifiedAt` tracks technical modification.
* `metadataModifiedAt` tracks metadata-only modification.
* Save with no changes creates no artificial version or timestamp.
* Failed persistence must never be reported as successful.

### Section 14 — Project File Format and Migration Architecture

Approved rules include:

* `.hfzproject` is the complete portable local representation of a Project.
* It remains a single JSON file for the current target architecture.
* `formatVersion: 2` is the Phase 6 target.
* Existing files are treated as legacy `formatVersion: 1`.
* v1 files can be opened and migrated in memory.
* Opening a v1 file does not silently rewrite it.
* Migration to v2 is persisted only through an explicit successful Save.
* New HFZWood versions support explicitly supported older formats.
* Old HFZWood versions are not guaranteed to open newer Project formats.
* Unsupported future formats must fail safely and must not be rewritten or downgraded.

### Section 15 — Local Project Persistence Architecture

Approved rules include:

* The `.hfzproject` file is authoritative for persisted local Project data.
* Local Workspace indexes, browser storage, caches, thumbnails, and file handles are auxiliary and rebuildable.
* If a known Project file is missing from its previous location, it is marked unavailable or missing, not automatically deleted.
* The user may relocate it.
* Relocation succeeds only if the selected file has the expected `projectId`.
* A different `projectId` cannot repair the missing link.
* Multiple files with the same `projectId` are multiple local representations of one logical Project, not separate Projects.

### Section 16 — Cloud Project Persistence and Branching Architecture

Approved rules include:

* Cloud stores a complete autonomous representation capable of reconstructing a complete valid `.hfzproject`.
* Cloud storage does not need to physically mirror the single local JSON file.
* Neither local nor cloud is universally authoritative.
* `projectId`, version identity, and ancestry determine relationships.
* Open from Cloud creates a local representation of the same Project without generating a new Project or technical version.
* First Local → Cloud persistence preserves existing identity and version.
* Safe Local → Cloud synchronization may occur automatically when demonstrably non-divergent and protected by conditional writes.
* Cloud → Local replacement requires explicit user action before overwriting the local file.
* Divergence creates branches of the same Project, not new Projects.
* Divergent branches preserve the same `projectId`.
* Selecting one branch as principal does not delete the others.
* Divergent branches are retained until explicitly deleted.

### Section 17 — Synchronization and Conflict Detection Architecture

Approved version relationship metadata:

* `projectId`;
* `versionId`;
* `parentVersionId`;
* `ancestorVersionIds`.

Approved classification:

* Different `projectId` → different Projects.
* Same `projectId` + same `versionId` → identical technical version.
* One version appears in the other's `ancestorVersionIds` → known succession.
* Same `projectId`, different `versionId`, and neither can be proven as descendant of the other → divergent or unresolved.
* Unprovable succession must never authorize automatic destructive overwrite.

`ancestorVersionIds` preserves the complete known ancestry of the branch and is not arbitrarily truncated.

Example:

A → B → C

C contains conceptually:

* `versionId = C`;
* `parentVersionId = B`;
* `ancestorVersionIds = [A, B]`.

Historical complete Project versions do not need to be retained merely for ancestry determination.

The key rule is:

**Timestamps inform. Identity and ancestry decide version relationships.**

### Section 18 — Conflict Resolution Architecture

Approved rules include:

* Conflict resolution UI must remain simple.

* When divergent branches exist, the user sees a message equivalent to:

  **You have multiple branches of the same Project. Which one do you want to open?**

* Each branch shows minimal useful information, especially `lastModifiedAt`.

* The most recently modified branch may be marked:

  **Recommended — Most recently modified**

* This recommendation is informational only.

* Timestamp does not automatically make a branch authoritative.

* The user explicitly chooses which branch to open.

* Opening one branch preserves all other branches.

* No separate Keep Both action is required because preservation is the default.

* The selected branch becomes the principal working branch.

* Future technical saves continue the selected branch's ancestry.

* The user is informed that other branches remain preserved and may be opened or deleted later.

* A Project with multiple branches appears once in Local Workspace or Cloud Workspace, with an indicator such as:

  **2 branches available**

* Branches remain variants of one Project, not separate Projects.

* Deleting an alternate branch is explicit and requires one clear confirmation.

* Deleting one branch must not imply deleting the entire Project.

* A principal branch cannot be deleted while it remains principal.

* Another branch must first be designated principal.

* No automatic merge of divergent technical Project data is part of the current target architecture.

### Section 19 — Identity and Authentication Architecture

Approved rules include:

* `ownerId` derives from the stable immutable identifier supplied by the authoritative authentication system.
* Ownership must not depend on email, username, display name, subscription tier, or device identity.
* The architecture should not be unnecessarily tied to a specific identity provider.
* Backend derives authenticated identity from validated authentication context.
* Backend never trusts client-supplied `ownerId` as authorization.
* Backend is the final authority for:

  * ownership;
  * cloud operations;
  * protected capabilities;
  * subscription-tier enforcement;
  * other protected backend actions.
* Frontend gating is not a security boundary.
* Mock authentication is allowed only for development and testing, never production.
* Passive session expiration does not interrupt local work on an already open Project.
* When a session expires:

  * local viewing may continue;
  * local editing may continue;
  * local Save may continue;
  * remote protected operations are suspended.
* Reauthentication requires reevaluation of current ownership, authorization, version, synchronization, and integrity state.
* Explicit logout triggers unsaved-changes protection where necessary.
* After logout, local `.hfzproject` files remain untouched.
* Project editing requires authentication again after explicit logout.
* Local Workspace discovery and indexing are logically scoped by authenticated `ownerId`.
* Projects belonging to another user are not automatically shown as ordinary Projects in the current user's normal Workspace.
* If a foreign-owned `.hfzproject` is explicitly opened, it is read-only.
* A foreign-owned Project cannot be edited, claimed, synchronized to the current user's cloud, or silently reassigned.

---

## Critical new launch decision: Project Cloud is not a launch blocker

A major decision was made at the end of the working session:

**The initial HFZWood production launch must not depend on Project Cloud availability.**

The intended initial launch may operate for approximately the first one or two months without Project Cloud storage and synchronization.

The product must be fully usable through the Local-First Project workflow:

* authenticated user enters Project creation;
* creates Projects;
* works locally;
* saves complete `.hfzproject` files;
* reopens them;
* edits and continues them;
* uses Project Tools;
* uses available Learning modules according to access rules.

Project Cloud is an additive capability that may be introduced after launch as:

* backup;
* continuity between devices;
* protection for valuable Projects;
* additional subscription value.

The launch philosophy is:

**HFZWood launches Local-First. Project Cloud is additive value, not a prerequisite for product usefulness or initial production launch.**

Important distinction:

**No Project Cloud does not necessarily mean no backend.**

Authentication, accounts, capabilities, subscription state, editorial content, or other application services may still use backend infrastructure.

The specific rule is that:

**Project Cloud persistence, synchronization, branching, and conflict resolution must not block the initial product launch.**

Phase 6 should implement the local Project architecture in a way that allows Project Cloud to be added later without redefining:

* Project identity;
* ownership;
* `.hfzproject` format;
* versioning;
* ancestry;
* local persistence;
* the core Local-First workflow.

When Phase 5 resumes, this decision should be explicitly incorporated into the appropriate Technical Architecture section and likely clarified in the roadmap so that Project Cloud is not accidentally treated as a launch blocker.

---

## Critical new requirement: AI-Assisted Editorial Translation Architecture

The final major discussion introduced a new launch-related requirement.

The product owner wants to create editorial content primarily in Romanian inside the HFZWood Admin Panel and use AI to automatically generate faithful translations into multiple supported languages.

The purpose is to avoid the manual workflow of:

1. copying each Manual, Glossary, Knowledge Base, or Tutorial text outside HFZWood;
2. translating it externally;
3. copying every translation manually back into each module.

This capability is considered important for launch preparation and must be explicitly addressed in Phase 5.

The intended architecture is:

**AI-Assisted Editorial Translation**, available only in the Admin/editorial environment.

It is not a public AI feature for ordinary HFZWood users.

### Intended workflow

The administrator creates or edits source content, initially expected to be Romanian.

Then the Admin Panel provides actions such as:

* **Generate translation**
* **Generate missing translations**
* potentially **Generate all translations**

The AI generates translations for enabled target languages.

Generated translations are saved as drafts and are not automatically published.

The intended status flow may conceptually be:

**Missing → AI Generated Draft → Reviewed → Published**

The exact status model should be decided during Technical Architecture rather than assumed prematurely.

### Target modules

AI-assisted editorial translation should support:

* Manual;
* Glossary;
* Knowledge Base;
* textual content associated with Tutorials.

Video tutorials themselves may remain English-only at initial launch.

The translated textual Tutorial content may include:

* title;
* description;
* summary;
* other user-facing textual metadata.

The YouTube video itself does not need to be automatically translated for initial launch.

### Intended languages

The architecture must not hard-code only Romanian and English.

The product owner explicitly wants the possibility of supporting many languages, including:

* Romanian;
* English;
* Czech;
* Polish;
* Bulgarian;
* French;
* Italian;
* Spanish;
* Portuguese;

and potentially additional languages later.

The system should be designed so that adding another supported language does not require rebuilding each editorial module's architecture.

### Translation fidelity

The goal is not crude literal word-for-word translation.

The required principle is:

**The translation must be semantically faithful, complete, structurally equivalent to the source, and must not introduce additions or omissions.**

The AI translation contract should require preservation of:

* meaning;
* structure;
* headings;
* paragraphs;
* lists;
* links;
* internal references;
* technical identifiers that must not be translated;
* numerical values;
* technical facts;
* HFZWood terminology.

The AI must not invent information.

For technical content involving woodworking and epoxy resin, terminology consistency is important.

### Source changes and stale translations

If the Romanian source changes after translations already exist, HFZWood must not silently overwrite manually reviewed or corrected translations.

Instead, existing translations should be marked conceptually as potentially outdated, for example:

**Source changed — translation may be outdated**

The administrator may then explicitly choose to regenerate the translation.

The exact stale-translation detection mechanism must be decided in Technical Architecture.

### Draft and Publish control

AI-generated translations must not automatically become published content.

The intended rule is:

**AI may generate editorial translation drafts. Publication remains an explicit administrator-controlled action.**

This must integrate with the existing Draft/Publish editorial infrastructure created in Phase 3.

### Launch relevance

This capability is important because the product owner wants to populate HFZWood with technical content efficiently and make that content available to a much broader international audience.

The desired strategic principle is:

**Write once in the source language, generate faithful draft translations in Admin, review where necessary, and publish in multiple languages without manually moving content through external translation workflows.**

When Phase 5 resumes, this should be the first major subject addressed.

The next section should likely be:

**AI-Assisted Editorial Translation Architecture**

Do not immediately write the final section without first discussing and approving the necessary architectural decisions one at a time, according to the established workflow.

---

## Immediate next step when work resumes

Resume exactly from this point.

Do not restart Phase 5.

Do not reopen already approved decisions unless a genuine contradiction is discovered.

The first subject to address is:

**AI-Assisted Editorial Translation Architecture for the Admin Panel.**

Work one decision at a time.

The first architectural question should establish the authoritative source-language model:

* Is Romanian always the single canonical source language?
* Or can each editorial item define its own source language?

A strong initial recommendation may be made, but the product owner must approve the decision before moving forward.

After AI-Assisted Editorial Translation Architecture is sufficiently defined and documented, continue only with the remaining genuine Technical Architecture gaps necessary for Phase 6.

Before closing Phase 5, perform a final consistency audit to verify that:

* Phase 6 can implement without inventing unauthorized major decisions;
* Project Cloud is not treated as an initial-launch blocker;
* AI-assisted editorial translation is properly integrated into the admin/editorial architecture;
* the Technical Architecture remains aligned with Phase 4 Product Architecture;
* no unnecessary architecture work is being added merely for completeness.

The goal is to finish Phase 5 efficiently, implement Phase 6, and then shift the center of gravity toward:

* technical and editorial content population;
* Manual;
* Tutorials;
* Glossary;
* Knowledge Base;
* production authentication and deployment;
* payments where required;
* final QA;
* launch.

Do not allow the architecture phase to expand indefinitely.
# HFZWood — Phase 5 Technical Architecture Handover

## Status at end of July 11, 2026 — Sections 1–20 complete

We are continuing the HFZWood application project.

The current phase is:

**Phase 5 — Technical Architecture**

The authoritative current document is:

`phase-5-technical-architecture.md`

The user will provide the latest version of this file in the new chat. It contains all approved Technical Architecture decisions through **Section 20**, which has been completed, inserted into the document, and verified.

The new chat must read the complete current `phase-5-technical-architecture.md` before proposing the next section.

Do not reconstruct Phase 5 from memory when the authoritative document is available.

Do not reopen already approved decisions unless a genuine contradiction is discovered.

---

## 1. Current project state

HFZWood has completed:

* **Phase 1 — Application Foundation**
* **Phase 2 — Workspace and Core Product Modules**
* **Phase 3 — Product Maturity**
* **Phase 4 — Concept Exploration and Product Architecture**

Phase 5 is now in progress.

The purpose of Phase 5 is to define the Technical Architecture required to transform the current local prototype into a production-ready application while preserving all approved product decisions.

The working method is strict:

> **Work one step at a time. Do not move to the next step until the current step is complete.**

The user is the Product Owner and final decision-maker.

The assistant must:

* explain architectural questions in accessible language;
* ask one meaningful decision question at a time when decisions are required;
* give a recommendation, not merely present abstract options;
* explain trade-offs clearly;
* avoid unnecessary enterprise complexity;
* avoid premature implementation detail;
* preserve approved product decisions;
* distinguish clearly between product decisions, technical architecture decisions, implementation details, and deferred decisions;
* never ask the user to make technical choices that should properly be recommended by the architect;
* not proceed to the next step until the current one is explicitly closed.

The user is not a professional software developer. Technical explanations must therefore remain precise but understandable.

---

## 2. Phase 5 status

**Sections 1–20 are complete.**

The latest completed section is:

**Section 20 — AI-Assisted Editorial Translation Architecture**

Section 20 was completed after an extensive decision process and inserted directly after:

**Section 19 — Identity and Authentication Architecture**

The document was then checked, and Section 20 was confirmed to be complete and correctly positioned.

The next task is:

> **Read the complete updated `phase-5-technical-architecture.md`, evaluate what has already been covered, and determine the correct subject of Section 21.**

Do not assume automatically that Section 21 is Subscription and Capability Architecture merely because that was discussed as a possible next topic.

First inspect the authoritative Phase 5 document and identify:

1. which architectural domains are already complete;
2. which domains remain genuinely unresolved;
3. whether any remaining topic deserves its own section;
4. what the most logical next section is.

Then explain the recommendation to the user before beginning the decision process for Section 21.

---

## 3. Section 20 — decisions now closed

Section 20 defines the complete architectural direction for AI-assisted multilingual editorial translation.

The following decisions are approved and must not be reopened without a genuine architectural contradiction.

### Canonical languages

* Romanian is the canonical source language for editorial content:

  * Manual;
  * Tutorials;
  * Glossary;
  * Knowledge Base;
  * other administrator-authored educational content.

* English is the canonical source language for the application interface.

* English remains the product fallback language.

### Initial public language behavior

On first use:

1. HFZWood reads the browser's preferred language list.
2. If a supported and publicly active language matches, that language is used.
3. Otherwise, English is used.

An explicit user selection overrides browser detection.

Geolocation is not required for language selection.

### Language lifecycle

Languages may be configured internally without being visible publicly.

The primary administrative distinction is:

* `Inactive`
* `Active`

Internal readiness may also be tracked.

A language may be activated publicly for the first time only when the required complete product experience is ready in that language, including interface and mandatory editorial content.

After activation, later `Outdated` content does not automatically deactivate the language.

Languages are not normally deleted. They are activated or deactivated.

Deactivation preserves:

* translations;
* manual corrections;
* publication state;
* metadata;
* ability to reactivate later.

### Translation granularity

Use translation units appropriate to the actual HFZWood content model:

* Manual → complete chapter;
* Knowledge Base → complete entry or question-and-answer item;
* Glossary → complete term entry;
* Tutorials → relevant complete translatable metadata/editorial item;
* UI → individual stable translation key.

Manual chapters are compact. Therefore, if one or two paragraphs are added or changed, the complete affected chapter is regenerated by default.

Do not introduce paragraph-level incremental translation complexity unless future real usage proves it necessary.

Internal structured blocks may still exist for:

* paragraphs;
* warnings;
* notes;
* images;
* captions;
* YouTube embeds;
* other semantic elements.

But they are not required to be independent translation units.

### Translation states

Relevant states include:

* `Missing`
* `AI Generated`
* `Needs Attention`
* `Approved for Publication`
* `Published`
* `Outdated`
* `Failed`

`Failed` is for technical or processing failure, not merely imperfect wording.

A usable translation containing a minor linguistic problem may be manually corrected and then approved.

### Source revision tracking

Every canonical translatable item has:

* stable identity;
* trackable source revision.

Every generated translation records the exact source revision from which it was produced.

If the canonical source changes:

* dependent translations become `Outdated`;
* they are not deleted;
* existing manual corrections are not silently overwritten;
* an older published translation may remain visible until explicitly replaced.

### New content visibility

New Romanian canonical content may be published immediately.

If no translation exists in another language:

* the item is `Missing`;
* it remains temporarily hidden in that target language;
* HFZWood does not display Romanian or English as cross-language fallback for that new editorial item.

Once the target-language version is approved and published, the item becomes visible automatically in that language.

Distinction:

* `Missing` → no published target-language version exists; item is hidden.
* `Outdated` → an older published target-language version exists; it remains visible until explicitly replaced.

### Translation generation actions

The Admin Panel should support:

* Generate all translations;
* Generate selected languages;
* Update outdated translations;
* Retry failed translation;
* Regenerate entire item when explicitly requested.

`Generate all translations` must not blindly retranslate all current content.

It generates only translation work actually required by current state.

### Sequential translation queue

Translation processing is sequential by default.

Target languages are processed one at a time.

Example:

* English — Completed
* French — Completed
* German — Generating
* Spanish — Waiting
* Portuguese — Waiting
* Bulgarian — Waiting
* Czech — Waiting
* Polish — Waiting

The next language begins automatically when the current one reaches a terminal result.

The administrator does not need to click Continue after every language.

The administrator may:

* monitor progress;
* pause after the current language;
* stop remaining queued work;
* retry failed translations;
* regenerate selected languages.

Every successful translation is saved immediately.

Failure in one language does not block or roll back the others.

The initial local implementation may use a lightweight backend job mechanism.

Enterprise-scale distributed queue infrastructure is not required initially.

### Structural validation

Every AI-generated translation passes deterministic structural validation.

The validator does not attempt to judge linguistic beauty or native-level fluency.

It checks objective integrity, including where applicable:

* required fields are present;
* expected content has not disappeared;
* result is not empty;
* result is not obviously truncated;
* structural elements remain present;
* URLs remain intact;
* YouTube references remain intact;
* internal references remain intact;
* media references remain intact;
* stable identifiers remain unchanged;
* protected technical elements are preserved.

If an anomaly is detected, preserve the generated result and mark it:

`Needs Attention`

The administrator may then:

* inspect it;
* retry;
* manually correct it;
* approve it after resolution.

`Needs Attention` and `Failed` results must not accidentally enter bulk approval or bulk publication.

### Protected technical content

AI translates linguistic content only.

HFZWood retains authority over:

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

Numerical values, formulas, dimensions, temperatures, percentages, and units must preserve semantic meaning.

AI translation must not independently convert measurement systems.

Unit conversion belongs to HFZWood preferences, calculator logic, and display systems.

### Images and media

Editorial images use stable media asset identifiers, not permanent local Windows paths and not hard-coded storage URLs.

Expected production flow:

Admin selects image → HFZWood backend uploads image → durable object storage stores image → stable asset identifier is created → editorial content references that asset identifier.

Local development may use local media storage.

Production media is expected to use durable object storage such as Amazon S3 or equivalent.

The initial public launch is expected to contain no editorial images.

Therefore:

* no initial image migration workflow is required;
* image upload architecture must still be ready for future production use;
* images will be added progressively after launch through the AWS-hosted Admin Panel;
* adding images must not require Git commits or redeployment.

By default, all language variants inherit the same image and structural position.

Exceptional language-specific image overrides may be supported for cases such as:

* image containing localized text;
* localized screenshot;
* genuinely language-specific media need.

### YouTube

YouTube videos may remain English-only for all users.

The same video reference is shared across languages and remains in the same structural position.

Translatable associated metadata may include:

* title;
* caption;
* description;
* explanatory text.

YouTube embeds may be added before or after launch.

Adding or updating them through the Admin Panel must not require Git commits or redeployment.

### Media changes versus translation changes

HFZWood distinguishes linguistic changes from non-linguistic structural/media changes.

Examples:

* changed paragraph text → affected translation unit becomes `Outdated`;
* new paragraph in Manual chapter → complete affected chapter becomes `Outdated`;
* changed caption or alt text → corresponding translation update required;
* replaced shared image without translatable metadata change → no unnecessary AI translation required;
* new YouTube embed → shared structure propagates;
* changed translatable video metadata → translation update may be required.

### Glossary-guided terminology

Approved multilingual Glossary terminology is authoritative translation context.

Translation requests should include only:

* relevant approved terms;
* or a compact essential domain terminology set.

Do not send the entire Glossary unnecessarily.

AI may propose terminology when no approved translation exists, but proposals do not automatically become official Glossary terminology.

Changing an approved Glossary translation later does not silently rewrite published content.

The system may identify affected content for review.

### Translation Context Profile

HFZWood must maintain a controlled, versioned Translation Context Profile.

It is not raw ChatGPT conversation history.

It is a compact, curated, translation-specific distillation of relevant HFZWood knowledge, potentially including:

* what HFZWood is;
* woodworking and epoxy-resin domain context;
* product purpose;
* target audience;
* professionals versus beginners;
* editorial tone;
* clarity and concision requirements;
* technical terminology rules;
* safety and warning preservation;
* prohibition against invented information;
* handling of dimensions, temperatures, formulas, values, and units;
* requirement for natural target-language prose rather than mechanical word-for-word translation.

Conceptually, a translation request contains:

Translation Context Profile

* translation rules
* relevant approved Glossary terminology
* canonical source item
* target language

The complete historical ChatGPT conversations are not sent to the AI provider.

The profile is versioned.

Example:

`translationProfileVersion: 1`

If later updated:

`translationProfileVersion: 2`

the new version applies prospectively only.

Changing the Translation Context Profile:

* does not mark existing translations `Outdated`;
* does not require published translations to be regenerated;
* does not silently modify existing content.

Every generated translation should record which profile version was used.

### Provider-agnostic AI architecture

Do not hard-code the workflow permanently to one AI provider.

The initial implementation may use one provider, such as OpenAI or Gemini, but the architecture should permit:

* provider replacement;
* model replacement;
* future independent second-AI review.

Second-AI review is explicitly deferred from the initial implementation.

Future possible flow:

AI Provider A generates → AI Provider B reviews → structured findings → administrator decision.

A future review AI must not silently overwrite translations.

It may report findings such as:

* omission detected;
* terminology inconsistency;
* changed meaning;
* numerical discrepancy;
* possible invented information;
* review recommended.

### AI credentials and execution environment

AI credentials must never be exposed to the frontend.

Flow:

Admin Panel → HFZWood backend → AI provider → HFZWood backend → translation draft

For initial launch preparation, AI translation may run only through the local backend.

The private API key:

* stays outside Git;
* is never committed;
* is never exposed to frontend code.

Production AWS AI execution is optional for the initial release but must remain architecturally possible later without redesigning the system.

Future production flow:

Production Admin Panel → production HFZWood backend → AI provider → production editorial draft

This enables post-launch editorial updates without:

* local development synchronization;
* Git commits;
* developer intervention;
* redeployment.

Exact provider and model remain deferred until implementation.

### Data minimization

Send only what translation requires:

* selected canonical source content;
* source language;
* target language;
* necessary structural context;
* relevant approved Glossary terminology;
* Translation Context Profile;
* translation instructions.

Do not send unrelated:

* user identities;
* account data;
* subscriptions;
* user Projects;
* project images;
* authentication data;
* secrets;
* unrelated editorial content.

### Minimal AI audit metadata

Preserve minimal metadata such as:

* source language;
* target language;
* source item identity;
* exact source revision;
* generation timestamp;
* provider;
* model;
* Translation Context Profile version;
* generation status;
* simplified failure information when applicable.

Do not require permanent storage of complete prompts, raw provider responses, verbose diagnostics, or unnecessary internal reasoning artifacts.

### Approval and publication

Because the administrator does not understand every supported language, approval must not pretend to represent native-speaker linguistic verification.

Use the concept:

`Approved for Publication`

The administrator may:

* inspect selected translations;
* perform spot checks;
* use another AI externally for additional verification;
* manually correct translations;
* accept the generated batch.

Bulk actions are required.

After a queue completes:

1. the administrator may approve an entire eligible batch for publication;
2. publication remains a separate explicit action;
3. all approved translations may then be published in bulk.

Approval and publication remain separate to prevent accidental publication.

`Needs Attention` and `Failed` items are excluded automatically.

Manual administrator corrections are authoritative and must not be silently overwritten.

### Translation Context Profile changes

Changes apply prospectively only.

Existing translations do not automatically become outdated.

Published translations are not regenerated merely because the profile changed.

Each new translation records the profile version used.

---

## 4. Important architectural context from earlier Phase 5 sections

The new chat must read the authoritative Phase 5 document for complete details.

However, the following high-level decisions are important context.

### Project identity

A Project is a stable domain entity.

Project identity must not depend on:

* filename;
* image filename;
* user-facing name;
* filesystem path;
* storage location.

### Project versions

A Project has immutable version identity.

Version identity is separate from Project identity.

Saving new content creates a new immutable version rather than mutating historical state.

### Ownership

All Projects belong to authenticated users.

Guest project creation is not part of the approved product model.

Ownership is explicit and immutable.

### Primary image

Each Project has exactly one immutable primary image.

The image is foundational to project geometry and measurement context.

Changing the image requires creating a new Project.

### Local-first architecture

HFZWood is local-first.

Local data is the normal working authority.

Cloud exists primarily for:

* backup;
* continuity;
* restoration;
* device transfer.

Cloud is not the primary live-editing authority.

### Cloud behavior

Cloud does not use silent automatic synchronization.

Cloud conflicts are explicit and user-resolved.

The user chooses what to keep.

Cloud content is not edited directly.

Opening from Cloud creates a local working copy.

### Conflict philosophy

Conflict means meaningful content divergence, not merely timestamp difference.

Timestamps may help signal divergence but do not define truth.

### Authentication

Authentication and authorization are separate.

The production system must replace mock authentication.

Credentials must never be stored in plaintext.

Password reset uses short-lived, single-use tokens.

Protected routes require backend enforcement.

Administrative authorization must never depend only on frontend hiding.

### Production persistence

Development filesystem persistence is not sufficient for production.

Production requires durable persistence for:

* identity;
* editorial data;
* Projects;
* version metadata;
* ownership;
* cloud backup state;
* translation state;
* other production domain data.

### Existing product tiers

Current known tier concepts include:

* `free`;
* `subscriber`;
* `administrator_unlimited`.

Known capability decisions include:

* free users have restricted calculator capabilities;
* free users have limited cloud project capacity;
* subscriber users receive expanded access;
* administrator access is unlimited.

However, the new chat must verify the exact authoritative state in the current documents before writing a new section.

Do not infer unresolved commercial rules without evidence.

---

## 5. Workflow rules for the new chat

The user prefers a strict sequential workflow.

Do not give five steps at once.

Do not ask a large questionnaire.

Do not write the final Section 21 before the architectural decisions for that section are actually closed.

The correct process is:

1. Read the latest complete `phase-5-technical-architecture.md`.
2. Identify the correct next architectural domain.
3. Explain why it should be Section 21.
4. Ask one meaningful decision question at a time if decisions are needed.
5. Give a concrete recommendation with understandable reasoning.
6. Wait for explicit user approval or correction.
7. Continue until all essential decisions for that section are closed.
8. Only then draft the complete Section 21 in English for direct insertion into the Technical Architecture document.
9. After insertion, verify the updated file if the user provides it.
10. Then determine the next step.

Do not reopen Section 20 unless a genuine contradiction appears.

Do not prematurely implement code during Phase 5.

Do not create unnecessary architecture for hypothetical enterprise-scale needs.

The governing architectural principle remains:

> **Use the simplest architecture that safely preserves approved product behavior, production durability, future evolution, and explicit user control.**

---

## 6. Immediate next action

When the new chat begins and the latest `phase-5-technical-architecture.md` is provided:

* read it fully;
* confirm that Sections 1–20 are complete;
* identify the correct topic for Section 21;
* explain the recommendation;
* begin with one decision at a time.

Do not jump directly into drafting Section 21.

Do not assume its subject before reading the authoritative document.

The continuation point is:

> **Phase 5 — Technical Architecture complete through Section 20. Determine and begin Section 21.**
# HFZWood — Phase 5 Technical Architecture Handover After Section 21

## Date and current status

Date: 11 July 2026.

HFZWood is currently in:

**Phase 5 — Technical Architecture**

The main working document is:

`documentation/phase-5-technical-architecture.md`

Phase 5 is still in progress.

Sections 1–21 are now complete and approved.

The most recently completed section is:

**Section 21 — Subscription and Capability Architecture**

Do not reopen completed sections unless a genuine architectural contradiction or implementation blocker is discovered.

The next session must begin by identifying the correct subject for **Section 22** based on the remaining architectural gaps in Phase 5.

Do not assume automatically what Section 22 should be. First review the complete Phase 5 document, the Phase 4 Product Architecture decisions, and this handover.

---

## Mandatory workflow

Continue using the established HFZWood architecture workflow:

1. Read the current Phase 5 Technical Architecture document.
2. Read this handover.
3. Identify the next genuine architectural gap.
4. Discuss one architectural decision at a time with the Product Owner.
5. Explain technical questions in clear, non-technical language when necessary.
6. Do not write the final section before all important decisions for that section are resolved.
7. Once decisions are complete, write the full section in English for direct insertion into `phase-5-technical-architecture.md`.
8. Do not move to the next section until the current section is copied into the document and confirmed complete.

Fundamental working rule:

**Work step by step. Do not move to the next step until the current step is completed.**

Cursor does not make Product Architecture decisions.

Technical Architecture must not reopen approved Product Architecture decisions.

If a missing Product Architecture decision is discovered, stop and resolve it explicitly before continuing.

Do not extend Phase 5 indefinitely merely to create more documentation. The objective is to define enough architecture for Phase 6 to implement the approved product model without inventing unauthorized major technical or product decisions.

---

## Phase status

Current high-level project status:

* Phase 1 — Foundation: COMPLETE.
* Phase 2 — Logged-in Product Experience: COMPLETE.
* Phase 3 — Product Maturity: COMPLETE.
* Phase 4 — Product Architecture: COMPLETE and definitively closed.
* Phase 5 — Technical Architecture: IN PROGRESS.
* Phase 6 — Architecture Implementation & Refactoring: follows Phase 5.
* Release Preparation: follows Phase 6.
* Product Evolution: post-launch.

---

## Phase 5 completion status

The Phase 5 Technical Architecture now contains completed Sections 1–21.

The completed architectural areas include, among others:

* Purpose and relationship with Product Architecture;
* Current System Baseline;
* Project Identity Architecture;
* Project Version Architecture;
* Project Ownership Architecture;
* Primary Image Architecture;
* Project Data Separation and Technical Versioning Rules;
* Project Persistence Lifecycle;
* Project File Format and Migration Architecture;
* Local Workspace Architecture;
* Cloud Workspace Architecture;
* Synchronization and Conflict Resolution Architecture;
* Frontend Architecture;
* Backend and API Architecture;
* Identity and Authentication Architecture;
* AI-Assisted Editorial Translation Architecture;
* Subscription and Capability Architecture.

Before starting Section 22, inspect the actual current Phase 5 document to determine which original architecture areas remain genuinely uncovered.

Do not rely only on section numbering or assumptions.

---

# Section 21 — Subscription and Capability Architecture: Decisions Completed

Section 21 is complete and approved.

The following decisions were made and must be preserved.

## 1. Backend authority

The backend is authoritative for:

* subscription state;
* entitlements;
* account-level effective capabilities.

Frontend modules must not infer product permissions directly from tier names such as `free` or `subscriber`.

Modules consume resolved capabilities.

Example:

Instead of:

`if tier == free → maximum 4 polygon points`

the module consumes:

`calculator.maxPolygonPoints = 4`

This preserves the ability to change commercial models without rewriting the Resin Calculator or other product modules.

---

## 2. Separation of concepts

HFZWood maintains strict separation between:

* Identity — who the authenticated user is;
* Role — user or administrator;
* Subscription — one possible commercial access model;
* Entitlements — valid sources of access;
* Capabilities — the final effective permissions and limits consumed by the application.

The general model is:

**Role + valid entitlements → effective capabilities**

Administrator authority remains separate from commercial subscription state.

---

## 3. Multiple entitlement sources

Subscription is only one possible source of entitlement.

The architecture may support:

* recurring subscriptions;
* future permanent or lifetime purchases;
* temporary promotions;
* administrative grants;
* separately purchased capabilities;
* other future commercial models.

Product modules must not know where access came from.

They consume only the resulting effective capabilities.

---

## 4. Capability combination

When multiple valid entitlement sources provide different capability values, the backend normally resolves the most permissive valid result for the user.

Examples:

* boolean capability: enabled if any valid entitlement enables it;
* quantitative limit: highest valid limit;
* unlimited access overrides lower limits.

Explicit administrative or security restrictions may override normal permissive combination rules.

---

## 5. Capability catalog versioning

The backend-owned capability catalog is versioned.

Capability responses should include sufficient version information to identify stale locally cached capability data.

New authoritative capability data replaces older cached account-level data after successful reconnection.

Project structural capability snapshots remain separate from the current account-level capability catalog.

---

## 6. Seven-day offline validation window

For time-sensitive commercial access, especially recurring subscriptions, the last successfully validated account-level capability set may remain usable offline for up to seven days from the last successful backend validation.

The seven-day period is based on elapsed time since validation, not on active application usage.

If a user does not open the application for weeks and later returns online, capabilities may be revalidated immediately.

If the user returns offline after the seven-day period has expired:

* existing Projects remain available according to their legitimate structural capability snapshots;
* stale recurring-subscription capabilities are not treated as indefinitely current;
* new premium Project creation may require revalidation;
* independent premium services may remain unavailable until successful revalidation.

---

## 7. Permanent or lifetime entitlement principle

A possible future permanent or lifetime purchase is not subject to expiration merely because the user has remained offline for more than seven days.

Permanent access must be modeled as a durable entitlement rather than as a recurring subscription with an artificial expiration.

However:

**Permanent entitlement does not mean unlimited account sharing or unlimited device activation.**

Future account protection may include:

* trusted devices;
* device limits;
* email verification codes;
* reauthentication;
* device revocation;
* account-sharing detection;
* license-abuse prevention.

The exact mechanism is intentionally deferred to a future Business Platform and account-protection architecture.

---

## 8. Project structural capability snapshot

Each valid Project stores a minimal Project-specific snapshot of the structural capabilities necessary to continue that Project legitimately.

This snapshot is separate from:

* current subscription state;
* current account capabilities;
* the commercial source of access.

Structural capabilities may include:

* maximum polygon complexity;
* layer calculation;
* other future capabilities that directly affect the creation or modification of Project technical structure.

The snapshot does not include independent commercial services such as:

* PDF export;
* Cloud Workspace access;
* cloud storage limits;
* AI services;
* other independent online services.

---

## 9. Existing Project continuation after normal downgrade

A Project legitimately created with premium structural capabilities remains fully editable after normal subscription expiration or downgrade.

HFZWood must not:

* degrade the Project;
* delete premium structures;
* simplify geometry;
* invalidate premium Project content;
* force the Project into current Free restrictions.

The Project inherits the complete structural capability set legitimately available to it when its snapshot is established.

It is not limited only to features that happened to be used before downgrade.

Example:

If layer calculation was available when the Project snapshot was established but had not yet been used, the Project may still use layers later.

---

## 10. New Projects after downgrade

New Projects follow the user's current effective capabilities.

A former Subscriber who is now Free may:

* continue existing premium Projects according to their structural snapshots;
* create new Projects only under current Free restrictions.

The immutable primary image rule prevents an old premium Project from being reused as a different Project to bypass current restrictions.

A different primary image requires:

* a new Project;
* a new `projectId`;
* current capability evaluation.

Copying, moving, or renaming a `.hfzproject` file does not create a new Project if the `projectId` remains unchanged.

---

## 11. Project capability expansion after upgrade

A Project structural capability snapshot may expand but must not contract after normal commercial downgrade.

Example:

A Free user creates several local Projects.

Later, the user becomes a Subscriber.

HFZWood does not bulk-modify every existing local Project file.

Instead:

* a Project becomes eligible for broader capabilities only when that specific Project is opened under broader valid entitlements;
* snapshot expansion is lazy and Project-specific;
* unopened Project files remain untouched.

The rule is:

**Project structural entitlements may expand through legitimate upgrade, but normal downgrade does not reduce them.**

---

## 12. Successful Save required for persistent expansion

Simply opening a Project under premium capabilities does not permanently change its stored snapshot.

Snapshot expansion becomes persistent only after a successful Save.

Existing unsaved-changes protection applies:

* Save — persists the expanded snapshot;
* Discard — abandons the unpersisted expansion and other unsaved changes;
* Cancel — remains in the Project.

No snapshot expansion may be represented as permanently stored unless persistence succeeds.

---

## 13. Future structural capabilities

A structural capability introduced in the future is not automatically granted to all historical Projects.

An existing Project may acquire it when:

* the current user has the corresponding valid entitlement;
* the Project is opened under that entitlement;
* the expanded snapshot is successfully saved.

Existing Projects preserve already acquired structural capabilities, but do not automatically inherit every future premium capability.

---

## 14. Local snapshot trust boundary

The structural capability snapshot stored inside `.hfzproject` supports legitimate local and offline Project continuation.

However, it is not authoritative proof for protected backend or cloud operations.

A local JSON file may be manually edited.

Therefore:

* local continuation may use the Project snapshot;
* protected server operations require independent backend validation;
* modifying local JSON must not grant unauthorized cloud access, premium services, or account-level capabilities.

Do not over-engineer local anti-tampering merely to prevent users from editing their own files.

---

## 15. Frontend and backend enforcement

Capability enforcement occurs in both frontend and backend.

Frontend responsibilities:

* user experience;
* hiding or disabling unavailable actions where appropriate;
* early prevention of invalid interactions;
* clear explanations of limits;
* enforcement of local-only functionality according to valid capabilities and Project snapshots.

Backend responsibilities:

* authoritative account-level capability resolution;
* authorization of protected operations;
* rejection of manipulated requests;
* cloud limit enforcement;
* protected service enforcement.

The frontend improves UX.

The backend is the final authority for protected operations.

---

## 16. Free cloud limit

The Free state permits a maximum of:

**5 Projects in Cloud Workspace.**

If a Subscriber downgrades to Free while having more than five cloud Projects:

* no immediate deletion occurs;
* a 60-day grace period begins;
* all existing cloud Projects remain accessible during the grace period;
* the user may open, edit, synchronize, download locally, or manually delete Projects;
* the user may choose which Projects remain in cloud storage;
* no new cloud Project may be added while the account remains above the Free limit.

The purpose of the 60-day period is to allow the user to preserve excess Projects locally as `.hfzproject` files.

---

## 17. Automatic retention after 60 days

If the 60-day grace period expires and the Free user still has more than five cloud Projects:

* HFZWood automatically preserves the five Projects with the most recent real Project modification timestamps;
* excess older cloud Projects may be deleted.

Simply opening or viewing a Project must not change its retention priority.

Users must receive clear warnings about:

* the five-Project Free limit;
* the deletion deadline;
* which Projects are at risk;
* the possibility of downloading Projects locally.

---

## 18. Local preservation and later cloud restoration

A Project downloaded locally remains the same logical Project and preserves its original `projectId`.

If the user later acquires sufficient cloud entitlement again, the locally preserved Project may be uploaded to Cloud Workspace while retaining the same Project identity.

Local and cloud representations remain representations of the same logical Project.

---

## 19. Independent services follow current capabilities

Project continuation rights do not preserve independent commercial services.

The following remain governed by current account-level capabilities:

* PDF export;
* Cloud Workspace access;
* cloud storage capacity;
* AI services;
* future independent online services.

Therefore, a user may continue editing an old premium Project after downgrade while being unable to generate a new premium PDF until the corresponding current entitlement is restored.

---

## 20. Normal expiration versus confirmed fraud

Normal subscription expiration, cancellation, or downgrade follows standard Project continuation rules.

It must not:

* destroy local Project data;
* degrade legitimate Project structures;
* be treated as fraud or abuse.

Confirmed fraud or serious abuse is an exceptional security condition.

Examples may include:

* confirmed fraudulent payment;
* confirmed use of stolen payment credentials;
* serious license abuse;
* other explicitly validated serious security violations.

Authoritative fraud revocation may:

* immediately remove premium account entitlements;
* invalidate cached account capabilities upon next successful server contact;
* override normal Project structural continuation rights for that account;
* block all Cloud Workspace access;
* remove the normal five-Project Free allowance;
* remove the normal 60-day downgrade grace period;
* suspend cloud data according to internal security and retention policy.

A completely offline device cannot receive remote revocation until it reconnects.

Local Project files must not be remotely deleted, corrupted, or silently destroyed.

---

## 21. Capability resolution failure

A technical failure must never be interpreted as:

* downgrade;
* subscription expiration;
* revocation;
* fraud.

Examples include:

* backend outage;
* AWS service disruption;
* network timeout;
* HTTP 5xx response;
* capability resolver failure;
* malformed response;
* temporary infrastructure problem.

In such cases:

* previously validated capabilities may continue within their valid offline window;
* legitimate Project structural snapshots remain usable;
* user data is not degraded, deleted, or structurally modified;
* if no valid capability state exists, HFZWood does not invent premium access;
* operations requiring current online authorization may remain temporarily unavailable;
* the user receives a clear message that capability verification is temporarily unavailable.

An authoritative response stating that an entitlement has actually expired or been revoked is different from a technical failure.

This distinction is mandatory.

---

## 22. Capability classification rule

The authoritative classification rule is:

**A capability belongs in the Project structural capability snapshot only when it is required to create, modify, or continue the technical structure of that specific Project.**

Independent services remain current account-level capabilities.

Examples:

Project structural snapshot:

* polygon complexity;
* layers;
* future Project Tool capabilities that directly affect technical Project structure.

Current account-level capabilities:

* PDF export;
* cloud access;
* cloud storage limits;
* AI;
* other independent online services.

---

## Section 21 final architectural rule

The final rule is:

**HFZWood resolves product access through backend-owned effective capabilities rather than direct subscription checks. Existing Projects preserve legitimately acquired structural continuation rights through Project-specific capability snapshots. These snapshots may expand through valid upgrades but do not contract through normal downgrade. Independent commercial services follow current account-level capabilities. Temporary infrastructure failures never masquerade as entitlement loss, while confirmed fraud or serious abuse may trigger exceptional security revocation.**

Section 21 is complete and approved.

---

# Important continuity note for the next conversation

The previous conversation initially made an incorrect assumption that Section 21 should be Identity and Authentication Architecture.

This was corrected.

Identity and Authentication Architecture was already completed earlier as Section 19.

Do not repeat or reopen that mistake.

Section 21 is:

**Subscription and Capability Architecture**

and it is now complete.

The next conversation must begin with:

1. Read the complete current `phase-5-technical-architecture.md`.
2. Read the current ChatGPT Project handover.
3. Confirm that Sections 1–21 are complete.
4. Compare completed architecture against the original Phase 5 structure.
5. Identify the next genuine remaining architectural gap.
6. Determine whether Section 22 is necessary and what its correct subject should be.
7. Continue one decision at a time.

Do not begin by writing Section 22 immediately.

First identify and discuss the correct architectural domain.

The goal remains:

**Complete Phase 5 only to the level necessary for Phase 6 to implement HFZWood without inventing unauthorized major technical or product decisions. Avoid both under-specification and unnecessary over-engineering.**
# HFZWood — Arthur Project Continuity Update

## Date and current status

Date: 12 July 2026.

The ChatGPT Project used for HFZWood continuity is now named:

# Arthur Project

Arthur Project is the long-term reasoning, architecture, workflow, and continuity space for the HFZWood application.

All future HFZWood conversations must preserve the established working rule:

**Work step by step. Do not move to the next step until the current step is complete. Product Architecture defines WHAT. Technical Architecture defines HOW. Cursor must never invent major product or architectural decisions.**

Current high-level project status:

* Phase 1 — Foundation: COMPLETE.
* Phase 2 — Logged-in Product Experience: COMPLETE.
* Workspace Polish Version 2.1: COMPLETE.
* Phase 3 — Product Maturity: COMPLETE.
* Phase 4 — Product Architecture: COMPLETE and CLOSED.
* Phase 5 — Technical Architecture: IN PROGRESS.
* Phase 6 — Architecture Implementation & Refactoring: follows Phase 5.
* Release Preparation: follows Phase 6.
* Product Evolution: post-launch.

The active Technical Architecture document is:

`documentation/phase-5-technical-architecture.md`

Sections 1–21 were already complete before the current session.

Section 22 has now been fully discussed, approved, written, and added to the document.

The document is therefore complete through:

# Section 22 — Production Persistence and Infrastructure Architecture

Do not rewrite Sections 1–22 unless a genuine architectural inconsistency is discovered.

---

# Section 22 — Decisions Completed

Section 22 establishes the production persistence and AWS infrastructure model for HFZWood.

The approved architecture is:

## 1. AWS production persistence

HFZWood production data is stored in managed AWS services.

The system uses a strict separation between:

* structured, authoritative, and indexable data;
* large files, media, images, and complete Project representations.

## 2. DynamoDB

Amazon DynamoDB stores structured production data and authoritative metadata, including:

* Project identity;
* Project ownership;
* current version pointers;
* synchronization metadata;
* subscription and entitlement information;
* account preferences;
* editorial structure;
* Draft and Published states;
* locale variants;
* translation state;
* asset metadata;
* references to S3 objects.

DynamoDB must not be used for large images, media, or complete large Project payloads.

## 3. Amazon S3

Amazon S3 stores:

* complete cloud Project representations;
* primary Project images;
* thumbnails;
* limited technical recovery versions;
* Manual images;
* Glossary images;
* Knowledge Base images;
* other editorial media;
* generated exports;
* temporary large files where required.

All S3 buckets remain private.

S3 objects are identified through stable internal object keys or asset identifiers.

Temporary signed URLs must never become durable identifiers.

## 4. Complete cloud Project snapshot

Each current cloud Project version has a complete, self-contained Project representation stored in S3.

It must contain enough information to reconstruct a valid local `.hfzproject` file without data loss.

DynamoDB stores the authoritative metadata and the pointer to the current complete Project representation in S3.

## 5. Current cloud version and technical retention

For normal user behavior, each Project has one current authoritative cloud version.

A new successful version logically replaces the previous current version.

HFZWood does not expose a permanent save history or operate as a full version-control system.

A small, automatically managed set of previous technical versions may be retained only for:

* recovery;
* synchronization safety;
* conflict investigation;
* protection against accidental overwrite;
* protection against failed cloud operations.

Exact retention periods and version counts remain configurable operational parameters to be finalized before production launch.

## 6. Safe cloud commit

A new cloud version becomes authoritative only after its complete Project representation has been successfully stored and verified in S3.

The authoritative DynamoDB pointer is changed only afterward.

If upload, verification, authorization, synchronization validation, or DynamoDB update fails:

* the previous cloud version remains authoritative;
* the Project is not reported as synchronized;
* partial data must not become the current Project state.

The old authoritative S3 object must never be overwritten before the replacement exists successfully.

## 7. Editorial persistence migration

The existing editorial workflow remains unchanged.

Phase 6 changes only the persistence mechanism.

Structured editorial content moves from filesystem-backed repositories to DynamoDB.

Editorial media moves to S3.

The following validated behavior must be preserved:

* Manual Chapter → Section → Content Block hierarchy;
* Glossary workflow;
* Knowledge Base workflow;
* Draft and Publish;
* published snapshots;
* locale variants;
* independent publication state per language;
* AI-assisted translation state;
* semantic blocks;
* cross-references;
* asset reuse;
* media metadata;
* asset protection;
* administrator editing behavior.

## 8. Private delivery

S3 remains private in all cases.

The backend authenticates and authorizes access.

For large uploads and downloads, the backend may issue temporary signed URLs after validating:

* identity;
* ownership;
* capabilities;
* requested operation.

Published editorial content may be delivered through CloudFront while the S3 origin remains private.

Private user Projects must never become accessible through the editorial delivery path.

## 9. Storage separation

Production storage distinguishes at least:

* user Project storage;
* editorial media;
* generated and temporary exports;
* operational recovery storage.

Project storage and editorial media should use separate buckets or equivalently isolated storage boundaries with separate access and retention rules.

## 10. Backup and recovery

DynamoDB uses point-in-time recovery or an equivalent managed recovery mechanism.

Critical S3 storage uses versioning and lifecycle-managed retention where appropriate.

Recovery restores data into separate resources or isolated locations for validation.

Recovery must never silently overwrite the current authoritative production state.

## 11. Encryption

All production data is encrypted:

* in transit;
* at rest.

Browser-to-backend communication uses HTTPS.

S3 and DynamoDB use AWS-managed encryption and centrally controlled key management.

The initial production architecture does not require separate encryption keys for every user account.

## 12. Secrets and configuration

Production secrets and sensitive configuration remain outside source code and deployed application artifacts.

HFZWood should use AWS-managed systems such as:

* AWS Secrets Manager;
* AWS Systems Manager Parameter Store;
* IAM roles.

Services use least-privilege IAM permissions.

Production secrets must never be:

* committed to the repository;
* exposed to the browser;
* placed in `.hfzproject` files;
* included in logs;
* hard-coded into containers or scripts;
* reused by local development.

## 13. AWS production region

HFZWood launches in one primary AWS region located in the European Union.

Core production services and authoritative data should remain in that region whenever practical.

Multi-region architecture is not required for launch.

It may be introduced later only when justified by real scale, availability, disaster recovery, regulatory, or business continuity requirements.

The exact EU region remains a deployment decision based partly on the infrastructure already created with Alfred.

## 14. Environment separation

Local development and production use strictly separated:

* data;
* credentials;
* configuration;
* identity resources;
* databases;
* storage;
* secrets;
* service boundaries.

Development and automated tests must not implicitly access or modify real production data.

A permanent staging environment is not required initially, but the architecture must allow one to be introduced later without redesign.

## 15. Deletion and recovery state

User-visible deletion does not necessarily mean immediate irreversible physical destruction.

HFZWood may use short soft-deletion or recovery states where appropriate.

Project deletion must preserve the approved protection of the last remaining copy.

Account deletion requires a separate complete-data deletion workflow.

Exact retention and permanent deletion periods remain configurable and must be finalized before launch according to product, legal, and operational requirements.

## 16. Storage limits and AWS cost control

HFZWood uses scalable pay-as-you-go AWS services.

The architecture must include:

* cost visibility;
* budget alerts;
* anomaly detection where practical;
* storage monitoring;
* lifecycle policies;
* cleanup of expired temporary objects;
* cleanup of expired recovery versions.

User storage limits are enforced through HFZWood Product Capabilities and backend rules.

AWS spending thresholds alert operators.

They must not automatically disable production services or delete user data.

Phase 5 establishes the mechanism but does not establish arbitrary numeric limits.

Exact values such as:

* Free storage quota;
* Subscriber storage quota;
* AWS budget alert thresholds;
* technical-version retention;
* recovery duration;
* export expiration;

must be decided before production launch using real measurements, AWS pricing, commercial policy, and expected usage.

## 17. Production observability

HFZWood uses AWS-native observability for the initial production architecture.

Amazon CloudWatch is the preferred initial service for:

* backend logs;
* persistence errors;
* S3 failures;
* DynamoDB failures;
* authorization failures;
* ownership-validation failures;
* synchronization failures;
* failed cloud commits;
* recovery operations;
* service health;
* metrics;
* alarms;
* operational alerts.

A separate external monitoring platform is not required initially.

Observability data must not unnecessarily contain:

* Project images;
* complete Project contents;
* private notes;
* authentication tokens;
* authorization headers;
* credentials;
* secrets;
* signed URLs;
* encryption keys.

Safe technical identifiers may be logged where necessary for diagnosis.

## 18. Safe failure principle

Production persistence must fail safely.

A failure must never silently:

* replace a valid Project with incomplete data;
* advance metadata before the S3 object exists;
* report an unsaved Project as synchronized;
* delete the previous authoritative cloud state;
* expose private S3 content;
* change ownership;
* bypass capability rules;
* corrupt editorial Draft or Published states;
* overwrite current production data during recovery.

The previous valid authoritative state remains in force whenever a new operation cannot complete safely.

---

# Current exact position

The file:

`documentation/phase-5-technical-architecture.md`

has been updated and saved through Section 22.

No Cursor prompt is required yet.

No implementation begins yet.

The next HFZWood session must start by:

1. Reading this Arthur Project continuity update.
2. Reading the complete current `phase-5-technical-architecture.md`.
3. Confirming that Sections 1–22 are present.
4. Identifying whether a Section 23 is genuinely necessary.
5. Determining the correct remaining architectural domain, if any.
6. Avoiding additional documentation unless it prevents Phase 6 from inventing a major unauthorized decision.

The immediate next question is:

# Does Phase 5 require Section 23, and if so, what unresolved architectural subject must it cover?

Possible remaining areas must be evaluated against the complete document, not assumed from the original outline.

The likely candidates include:

* Settings Architecture;
* Learning and Editorial Architecture closure;
* Search and Export cross-cutting architecture;
* Security Architecture;
* migration and Phase 6 implementation sequencing;
* architecture completion criteria.

However, do not create a Section 23 merely because these subjects appeared in the original Phase 5 outline.

First determine whether they are already sufficiently covered by Sections 1–22.

Phase 5 must end when Phase 6 can implement the approved architecture without inventing major product or technical decisions.

Do not extend Phase 5 indefinitely.

---

# Workflow reminder

Continue using the established HFZWood workflow:

1. Product decision, when necessary.
2. Technical Architecture discussion.
3. One decision at a time.
4. Close all necessary decisions.
5. Write the complete section only after the decisions are approved.
6. Add the section to the document.
7. Verify whether another section is actually required.
8. Begin Phase 6 only after Phase 5 is explicitly closed.

All discussion with Cristian remains in Romanian.

All document text and Cursor prompts remain in English.

Never skip steps.

Never reopen approved Product Architecture without a genuine contradiction.

Never allow Cursor to decide Product Architecture or invent major Technical Architecture.
HFZWOOD — ARTHUR PROJECT HANDOVER
PHASE 5 CLOSED / NEXT STEP: PHASE 6 IMPLEMENTATION PLAN

Date: July 12, 2026
Session closing time: approximately 22:50

This entry records the definitive closure of HFZWood Phase 5 — Technical Architecture and establishes the exact starting point for the next working session.

IMPORTANT:
Phase 5 is CLOSED.

Do not reopen Phase 5 merely to search for additional theoretical improvements, generic SaaS concerns, enterprise-scale architecture patterns, or optional future optimizations.

The next phase is the creation of the Phase 6 Implementation Plan.

No Phase 6 implementation code should be written before that plan is deliberately constructed and approved.

==================================================
1. CURRENT PROJECT STATUS
==================================================

HFZWood has completed:

- Phase 1 — Foundation and Core Workspace
- Phase 2 — Project Workflow and Product Foundation
- Phase 3 — Product Maturity
- Phase 4 — Concept Exploration and Product Architecture
- Phase 5 — Technical Architecture

The next phase is:

PHASE 6 — IMPLEMENTATION PLAN AND CONTROLLED IMPLEMENTATION

Phase 5 produced the authoritative Technical Architecture document that will guide Phase 6.

The architecture was developed incrementally through detailed Product Owner decisions, internal review, consistency checks, an external Claude audit, finding-by-finding critical reassessment, document corrections, and a final contextual reassessment.

The final conclusion is that Phase 5 is sufficiently coherent, explicit, proportionate, and implementation-ready to proceed to Phase 6.

==================================================
2. FINAL PHASE 5 AUDIT STATUS
==================================================

An external architecture audit identified findings F1–F8.

Each finding was reviewed critically rather than accepted mechanically.

The final status is:

F1 — CLOSED
Last-known-managed-copy deletion protection was clarified.

HFZWood warns strongly before deletion of the last known managed copy but does not absolutely prohibit an informed authenticated user from deliberately deleting their own final known copy.

Section 15.9 was added.

F2 — CLOSED
The contradiction around the technical version boundary was corrected.

Section 9.3 now routes ambiguous Project-content classification through the authoritative rules in Section 12.

After a final contextual reassessment, the remaining explicit references to:
- materials;
- Project notes;

were removed from the Section 9.3 list of real technical Project modifications because they could contradict the descriptive-metadata rules in Sections 12.4–12.6.

F3 — CLOSED
The Project Structural Capability Snapshot was explicitly classified as technical Project metadata.

A snapshot-only change:
- must persist only through successful explicit Save;
- does not by itself generate a new versionId;
- does not by itself change parentVersionId;
- does not by itself update lastModifiedAt;
- updates metadataModifiedAt;
- must be recognized by the Save pipeline as a persistent metadata change.

Sections 12.2 and 21.13 were updated.

F4 — CLOSED
Primary-image serialization, image boundaries, malformed-image handling, and general input/API boundary protection were clarified.

Section 11.2 now requires:
- a JSON-safe primary-image representation;
- preservation of the existing validated serialization mechanism if suitable;
- explicit supported image formats before launch;
- explicit source-file-size limits before launch;
- explicit safely decoded dimension limits before launch;
- rejection of malformed, corrupted, unsupported, misleading, or undecodable images;
- clear user-facing feedback;
- preservation of sufficient visual fidelity for accurate Project work.

Exact numerical limits are intentionally deferred to Phase 6 codebase inspection and realistic testing with modern smartphone photographs, browser memory behavior, Save/Open workflows, and future cloud-transfer implications.

Section 22.24 was added for External Input and API Boundary Protection.

F5 — CLOSED
The architecture clarified that not every architectural responsibility listed in Section 6 requires a standalone dedicated section.

Security is a cross-cutting responsibility.

Global Search is not required for the initial Local-Only launch and must not become a Phase 6 blocker unless explicitly approved later as a product requirement.

Manual & Tutorials, Glossary, and Knowledge Base may continue to use module-specific search appropriate to their actual product purpose.

No dedicated global index, semantic-search system, vector infrastructure, or other search complexity should be introduced without a concrete product requirement.

Section 6 was updated.

F6 — CLOSED
Browser download initiation was explicitly separated from technically confirmed persistence.

Browser download initiation alone must not:
- clear unsaved state;
- advance the persisted baseline;
- report successful Save.

When technical confirmation is unavailable, HFZWood may use explicit user confirmation that the downloaded file was successfully saved.

That confirmation is an informed user statement, not independent technical verification.

Sections 13.8 and 14.7 were updated.

F7 — CLOSED
The theoretical unbounded growth of ancestorVersionIds was acknowledged without introducing premature pruning, checkpointing, compression, or compaction complexity.

The real HFZWood Project lifecycle is expected to involve relatively few technical revisions.

Typical later changes may include:
- adding or correcting a reference measurement;
- adding a forgotten cavity;
- correcting a thickness or depth;
- adjusting geometry;
- completing missing technical information.

Metadata-only changes do not create new technical versions.

Section 17.7 now requires realistic testing of long ancestry chains but does not impose arbitrary truncation.

Any future ancestry optimization may be introduced only if measured evidence demonstrates a material need and only if correct succession and divergence detection remain preserved.

F8 — CLOSED
The primaryImageHash algorithm is now explicitly SHA-256.

The same byte representation and SHA-256 computation rules must be used consistently across:
- local Project creation;
- Project reopening;
- integrity verification;
- future cloud persistence;
- server-side verification.

Section 11.3 was updated.

FINAL AUDIT STATUS:

F1 — CLOSED
F2 — CLOSED
F3 — CLOSED
F4 — CLOSED
F5 — CLOSED
F6 — CLOSED
F7 — CLOSED
F8 — CLOSED

No further Phase 5 audit is required.

==================================================
3. ESSENTIAL PRODUCT CONTEXT FOR PHASE 6
==================================================

HFZWood is not a generic enterprise SaaS platform.

It is a specialized, image-first application for woodworking and epoxy-resin Projects.

A typical user:

1. takes a photograph of a physical woodworking Project, usually with a smartphone;
2. imports that photograph as the Project's primary image;
3. establishes one or more reference measurements;
4. traces formwork, wood areas, cavities, and other relevant geometry;
5. enters depths, layers, mix ratio, and other technical parameters;
6. receives resin-volume and related calculations;
7. saves the complete Project locally as a portable .hfzproject file;
8. may later reopen the Project and make occasional corrections or additions.

A valid Project requires:

- exactly one primary image;
- at least one reference measurement.

Once a Project exists, its primary image is immutable.

If the user wants to use a different photograph, different crop, different angle, or otherwise replace the primary image, that creates a new Project.

This is an explicit Product Owner decision.

The Product Owner considers recreating geometry and measurements acceptable because a typical Project can be reconstructed relatively quickly and image replacement would introduce unnecessary identity and integrity complexity.

==================================================
4. LOCAL-FIRST AND LOCAL-ONLY LAUNCH STRATEGY
==================================================

The initial launch must not depend on operational Cloud Workspace Project storage.

The approved sequence is:

1. implement and stabilize .hfzproject v2;
2. verify local Project creation;
3. verify authentication and ownership;
4. verify Product Capabilities;
5. verify Save/Open;
6. verify Project identity;
7. verify versioning;
8. verify integrity;
9. verify persistence behavior;
10. preserve existing validated application functionality;
11. reach Local-Only launch readiness;
12. activate operational Cloud Workspace later through a separate explicit implementation decision.

Cloud architecture must be prepared under the hood but remain invisible to users until real cloud persistence is operational and validated.

Do not introduce:
- fake cloud UI;
- inactive cloud buttons;
- placeholder synchronization controls;
- simulated cloud availability;
- user-visible cloud features that do not actually work.

The Local-Only application must be independently useful and launchable.

==================================================
5. AUTHENTICATION, OWNERSHIP, AND OFFLINE CONTINUITY
==================================================

HFZWood requires authentication before entering the Project creation workflow.

This establishes:
- authenticated identity;
- ownerId;
- Product Capability status;
- whether the user is free, subscriber, or administrator_unlimited.

Approved bounded offline continuity may later allow temporary use after successful authentication and entitlement validation.

However, indefinite offline subscription bypass must not be possible.

The architecture must balance:
- Local-First usability;
- temporary offline continuity;
- ownership;
- entitlement enforcement;
- protection against a former subscriber permanently disconnecting a device and continuing to use paid capabilities indefinitely.

At the same time, HFZWood is perceived as an online application, so unlimited permanent offline operation is not an unconditional product requirement.

==================================================
6. PHASE 6 IMPLEMENTATION PHILOSOPHY
==================================================

The Product Owner is not a professional software engineer and cannot independently verify subtle architectural correctness in implementation code.

Therefore:

RIGOR MUST EXCEED SPEED.

Phase 6 must not be implemented as one large migration.

It must be divided into small, controlled, reviewable, testable tasks.

The expected implementation workflow for each task is:

1. define the task precisely;
2. perform pre-implementation codebase analysis;
3. identify exact files and behavior affected;
4. inspect existing implementation before proposing replacement;
5. preserve validated existing behavior wherever possible;
6. implement the smallest justified change;
7. run focused automated tests;
8. run the complete relevant test suite;
9. perform static and architectural inspection where appropriate;
10. perform manual Product Owner verification where observable behavior exists;
11. update authoritative documentation;
12. commit only after successful verification;
13. stop immediately if a hard architectural failure appears.

The rule remains:

DO NOT MOVE TO THE NEXT STEP UNTIL THE CURRENT STEP IS COMPLETE.

Working code must not be rewritten merely because another architecture appears theoretically cleaner.

Existing validated functionality is an architectural asset.

This includes, where applicable:
- calculator logic;
- Project snapshot/restore behavior;
- editorial infrastructure;
- provider hierarchy;
- Product Capability foundations;
- automated tests;
- existing validated Save/Open behavior.

==================================================
7. HARD-STOP CONDITIONS
==================================================

Phase 6 implementation must stop if a task causes or reveals a material architectural failure such as:

- Project corruption;
- ownership violation;
- Product Capability bypass;
- silent destructive overwrite;
- loss of unsaved Project state;
- incorrect Project identity;
- invalid version ancestry;
- primary-image integrity failure;
- false successful persistence;
- unauthorized access;
- regression of previously validated core behavior.

Minor cosmetic imperfections do not require stopping the entire migration.

The distinction is between:
- ordinary local implementation defects that can be corrected safely;
- failures that undermine architectural correctness, ownership, integrity, persistence safety, or previously validated core behavior.

==================================================
8. IMPORTANT PHASE 6 SCOPE BOUNDARIES
==================================================

Phase 6 must not automatically implement every future feature described anywhere in the architecture.

In particular:

- operational Cloud Workspace Project persistence is deferred;
- Global Search is deferred unless separately approved;
- chat/community features are future possibilities, not current implementation requirements;
- marketplace functionality is a future product possibility, not current Phase 6 launch scope;
- AI-assisted editorial translation architecture may be prepared according to approved decisions, but implementation scope must follow the explicit Phase 6 plan;
- no enterprise-scale infrastructure should be introduced merely for theoretical completeness;
- no premature ancestry compaction should be implemented;
- no arbitrary image-size or dimension thresholds should be invented without evidence;
- no existing working mechanism should be replaced merely for architectural preference.

==================================================
9. TOMORROW'S STARTING POINT
==================================================

At the beginning of the next chat:

1. Read this Arthur Project handover completely.
2. Read the final updated Phase 5 Technical Architecture document provided by the Product Owner.
3. Read any additional authoritative project document provided by the Product Owner.
4. Do not begin writing the Phase 6 Implementation Plan immediately.
5. First establish the exact current document state and confirm which documents are authoritative.
6. Reconstruct the implementation dependencies from the approved Product Architecture and Technical Architecture.
7. Determine the correct structure and sequencing for the Phase 6 Implementation Plan.
8. Preserve the existing incremental task workflow.
9. Do not write implementation code until the Phase 6 Implementation Plan has been constructed and approved.
10. Do not reopen Phase 5 unless a genuine implementation-blocking contradiction is discovered.

The first objective of the next session is:

TO DEFINE HOW THE PHASE 6 IMPLEMENTATION PLAN SHOULD BE STRUCTURED BEFORE WRITING OR IMPLEMENTING ITS TASKS.

The first question should not be:
"What code should we write?"

The first question should be:
"What is the safest, smallest, dependency-correct sequence of implementation tasks that transforms the current validated HFZWood application into the architecture approved through Phases 4 and 5?"

==================================================
10. FINAL STATE AT SESSION CLOSE
==================================================

Session closing date:
July 12, 2026

Approximate closing time:
22:50 local time.

Phase 5 — Technical Architecture:
CLOSED.

External findings:
F1–F8 CLOSED.

Final residual F2 contradiction:
CORRECTED by removing "materials" and "Project notes" from the Section 9.3 explicit list of real technical Project modifications.

Next major document:
Phase 6 Implementation Plan.

Next implementation code:
NONE until the Phase 6 Implementation Plan is deliberately constructed and approved.

Governing principle:

RIGOR MUST EXCEED SPEED.

Workflow rule:

DO NOT MOVE TO THE NEXT STEP UNTIL THE CURRENT STEP IS COMPLETE.
# HFZWood — Arthur Project Handover: M1.1 Formally Closed, M1.2 Next, Workflow Simplified

We are continuing the HFZWood application project under the Phase 6 implementation workflow.

The assistant is called **Arthur**.

The Product Owner is **Cristian**.

The fundamental working rule remains:

> **Work step by step. Do not begin implementation until the current task has been analyzed, reviewed, and explicitly approved.**

A second rule is now equally authoritative:

> **Use the smallest professional process that keeps HFZWood safe, coherent, testable, reversible, and realistically finishable. Document each decision once. Avoid repetition, artificial task fragmentation, and unnecessary architectural detail.**

---

## 1. Current Authoritative Status

Current Phase 6 status:

* **Milestone 0 — FORMALLY CLOSED**
* **Milestone 1 — IN PROGRESS**
* **M1.1 — FORMALLY CLOSED, COMMITTED, AND PUSHED**
* **M1.2 — NOT STARTED**

The immediate continuation point is:

> **M1.2 — Project Creation Threshold, Identity, and Primary Image Hash: Pre-Implementation Analysis**

Do not begin M1.2 implementation automatically.

The first M1.2 action must be repository-grounded analysis followed by Product Owner review and explicit implementation authorization.

---

## 2. Authoritative Documents

Use these as the primary sources:

* `documentation/phase-6-implementation-plan.md`
* `documentation/phase-5-technical-architecture.md`
* `documentation/phase-4-product-architecture.md`
* `documentation/product-architecture-decisions.md`

The Phase 6 plan contains the complete Milestone 1 planning in Sections `11.1–11.10`.

Do not repeat those sections in future task analyses.

Reference and apply them.

The current `phase-6-implementation-plan.md` is approximately **10,700 lines long**. Its size is itself a reason to avoid further repetition and unnecessary expansion.

---

## 3. M1.1 Formal Closure

M1.1 established:

* the canonical `.hfzproject` v2 contract;
* the approved lifecycle metadata contract and factory;
* a pure inactive calculator-snapshot-to-v2 mapper;
* reusable v2 test foundations;
* an additive v2 format constant.

The canonical v2 envelope is:

```json id="w7e1hk"
{
  "format": "hfzwood-project",
  "formatVersion": 2,
  "projectMetadata": {},
  "technicalContent": {},
  "descriptiveMetadata": {},
  "derivedData": {}
}
```

M1.1 deliberately did **not** implement:

* runtime lifecycle-state wiring;
* Project creation-threshold behavior;
* permanent Project identity generation;
* `primaryImageHash` generation;
* production authentication;
* technical version advancement;
* Save/Open v2 cutover;
* strict v2 Open validation;
* cloud behavior.

These remain responsibilities of M1.2 and later tasks.

### M1.1 verification

* targeted tests: **8 passed**;
* backend: **115 passed**;
* frontend: **242 passed across 50 files**;
* total observational automated-test count: **357**;
* frontend production build passed;
* **2,778 modules transformed**.

### M1.1 commits

* `43e9d57 — Phase 6 M1.1: add canonical project v2 foundation`
* `5417aa9 — Phase 6 M1.1: record task closure`

Both commits were pushed successfully to `main`.

M1.1 is formally closed.

---

## 4. Current Repository Preservation State

The following unrelated pre-existing work remains outside M1.1 and must remain untouched without explicit authorization:

* modified `dev.cmd`;
* deleted `documentation/chatgpt-project-handover.md`;
* modified `documentation/implementation-roadmap.md`;
* untracked `documentation/Arthur-project-handover.md`;
* untracked `documentation/external-architecture-review.md`;
* untracked `frontend/.env.local`.

Do not modify, revert, restore, delete, clean, rename, stage, or commit unrelated repository work without explicit authorization.

Use explicit-path staging when isolated staging is required.

---

## 5. Milestone 1 Task Structure

The documented Milestone 1 structure remains:

1. **M1.1 — Canonical Project v2 Schema and Lifecycle Foundation — CLOSED**
2. **M1.2 — Project Creation Threshold, Identity, and Primary Image Hash — NEXT**
3. **M1.3 — Change Classification and Version Transition Semantics**
4. **M1.4 — Confirmed Persistence, Save Integration, and Browser-Download Safety**
5. **M1.5 — Strict v2 Validation and Safe Open/Restore**
6. **M1.6 — Canonical v2 Round-Trip and Workspace Compatibility**
7. **M1.7 — Conditional Browser `beforeunload` Protection**
8. **M1.8 — Milestone 1 Integration Validation and Formal Closure**

For historical continuity, do not renumber these tasks.

However, following the external workflow review:

> **M1.6 should be treated operationally as verification scope rather than a full independent implementation cycle, unless actual repository evidence demonstrates that new production code is required. Its verification responsibilities should normally be absorbed into M1.8 final integration validation and closure.**

M1.7 is expected to use a reduced low-risk workflow unless repository evidence reveals broader persistence or navigation consequences.

After M1.8 is formally closed:

> **STOP.**

Do not begin Milestone 2 automatically.

First evaluate and explicitly approve the documentation and planning structure for Milestones 2–14.

---

## 6. Workflow Correction Adopted After External Review

An external review of the Phase 6 process confirmed:

> **The core workflow is technically sound, but its execution became disproportionate, repetitive, and over-documented relative to HFZWood's actual complexity.**

The following must be preserved:

* analysis before implementation;
* explicit Product Owner approval before Cursor writes code;
* read-only repository investigation where needed;
* preservation boundaries;
* fail-closed validation for risky persistence/Open work;
* confirmed-persistence-before-history-advance for Save;
* controlled commits and rollback discipline.

The following must change:

* do not apply maximum workflow ceremony to every task;
* do not repeat the same architecture in analysis, implementation report, closure record, and later task sections;
* do not create separate tasks merely because technical concepts can be separated conceptually;
* do not create separate documentation commits automatically for every task;
* do not run every possible verification step for every low-risk change unless justified by actual impact.

The authoritative principle is:

> **Proportionality changes workflow depth, not engineering discipline.**

---

## 7. Risk-Tiered Task Workflow

Before each task, classify it by actual engineering risk.

### Full analysis track

Use for tasks affecting:

* Project persistence format or schema;
* Project identity or ownership;
* Save/Open behavior;
* version transitions or ancestry;
* authentication or security boundaries;
* irreversible or potentially data-corrupting behavior.

The full track is:

1. focused repository investigation;
2. Pre-Implementation Analysis;
3. Product Owner review;
4. explicit implementation authorization;
5. implementation;
6. risk-appropriate verification;
7. discrepancy repair if needed;
8. controlled commit;
9. concise closure evidence;
10. push at the appropriate controlled boundary.

M1.2, M1.3, M1.4, and M1.5 are expected to use the full track.

M1.4 and M1.5 are especially high-risk because they govern Save, persistence confirmation, validation, and safe Open behavior.

### Short implementation track

Use for:

* isolated UI behavior without persistence consequences;
* documentation-only changes;
* tooling or scripts;
* verification-only work;
* small changes that cannot corrupt, lose, or misclassify Project data or identity.

The short track should contain only what is materially necessary, typically:

1. brief objective and scope;
2. affected files;
3. preservation boundary;
4. implementation;
5. proportionate verification;
6. controlled commit and concise closure.

Do not write a full architectural analysis for a low-risk task merely because the workflow permits one.

---

## 8. Risk-Tiered Verification

Verification must match the change.

### Schema, persistence, identity, Save/Open

Normally require:

* targeted tests;
* complete authoritative test suite;
* production build where applicable;
* manual QA where behavior requires it.

### Backend logic without persistence impact

Normally require:

* targeted tests;
* complete suite where regression surface justifies it;
* frontend build only if frontend behavior is affected.

### Frontend logic

Normally require:

* targeted tests;
* production build;
* complete suite when regression surface justifies it;
* manual QA for relevant user-visible behavior.

### Isolated low-risk UI

Normally require:

* targeted tests where meaningful;
* production build where relevant;
* full suite only when justified by regression surface.

### Documentation-only changes

Do not automatically require application tests or production build.

### Milestone closure

Always require comprehensive integration verification appropriate to the milestone.

For Milestone 1 closure, this includes the full authoritative test suite, production build, and relevant manual QA.

---

## 9. Reporting and Documentation Rules

Do not duplicate information between Pre-Implementation Analysis, Implementation Report, and closure records.

The analysis should establish:

* what must change;
* why;
* scope;
* risks;
* preservation boundaries;
* acceptance criteria.

The Implementation Report should primarily record:

* what actually changed;
* verification results;
* discrepancies from the approved plan;
* remaining risks or blockers;
* closure status.

Do not restate the entire analysis after implementation.

Closure evidence should normally be concise:

* status;
* essential implementation evidence;
* tests/build results where applicable;
* commit hash;
* relevant deferred boundary.

A separate documentation-closure commit is **not automatically required for every task**.

Reserve separate documentation commits primarily for:

* formal milestone closure;
* selected high-risk audit checkpoints;
* genuinely independent documentation changes.

Do not add process merely because more process is possible.

---

## 10. Immediate Next Task: M1.2

The next task is:

> **M1.2 — Project Creation Threshold, Identity, and Primary Image Hash**

M1.2 is a full-analysis task because it affects Project identity and lifecycle semantics.

Its Pre-Implementation Analysis should focus only on unresolved repository-specific questions:

* where canonical lifecycle state should be wired into active runtime;
* how the application detects the first transition to the valid-Project threshold;
* how stable `projectId` is generated and preserved;
* how stable `createdAt` is established;
* what exact deterministic input produces `primaryImageHash`;
* how the temporary `ownerId` foundation works before Milestone 3 production authentication without permanently cementing `"stub-user"` as real ownership identity;
* which files actually need modification;
* which targeted tests protect the behavior;
* what existing behavior must remain untouched.

Do not repeat the complete Milestone 1 architecture.

Do not implement M1.2 before the analysis has been reviewed and explicitly approved.

---

## 11. Product Owner Responsibility Boundary

Cristian is the Product Owner and should decide:

* desired user behavior;
* UX expectations;
* business rules;
* free versus subscriber behavior;
* visible information;
* product priorities;
* genuine product trade-offs.

Do not ask Cristian to choose between low-level technical implementation alternatives when the decision can be derived from:

* approved architecture;
* repository evidence;
* engineering safety;
* reversibility;
* proportionality.

Arthur should explain important technical decisions in understandable language and recommend the safest justified path.

---

## 12. Milestones 2–14: Future Planning Rule

Do not reproduce the Milestone 1 documentation pattern.

Before each future milestone, the default planning format should be compact and contain:

* milestone purpose;
* what already exists in the repository;
* actual new work required;
* dependencies;
* complexity estimate: S / M / L;
* task list.

The default expectation is a concise milestone brief, not thousands of lines.

Expand beyond that only when real technical risk justifies it.

After Milestone 1 closes, first perform a pragmatic high-level review of Milestones 2–14 to understand:

* actual complexity;
* how much functionality already exists;
* real remaining implementation work;
* dependencies;
* approximate relative effort.

This review should help answer the Product Owner's practical question:

> **How much work genuinely remains before HFZWood is ready for release?**

---

## 13. Release Perspective

Phase 6 runs from Milestone 0 through Milestone 14 and is intended to bring HFZWood to the approved release-readiness state.

Not every future milestone should be assumed to have the size, task count, or complexity of Milestone 1.

After the Phase 6 implementation sequence, remaining work may include operational production activities such as:

* AWS deployment and production infrastructure;
* Stripe production configuration according to approved scope;
* production secrets and environment configuration;
* domain and deployment work;
* real content population;
* final production verification;
* launch.

There should not be an undisclosed additional giant implementation phase merely to obtain the application already defined by the approved architecture.

---

## 14. Next Session Instruction

At the beginning of the next work session:

1. read this Arthur Project handover;
2. use `documentation/phase-6-implementation-plan.md` as the authoritative Phase 6 and Milestone 1 source;
3. confirm that M1.1 is formally closed;
4. confirm that M1.2 has not begun;
5. apply the newly adopted risk-tiered and proportional workflow;
6. prepare a focused M1.2 Pre-Implementation Analysis prompt;
7. do not implement M1.2 automatically;
8. do not repeat architecture already documented in Sections 11.1–11.10;
9. continue one controlled step at a time.

The exact continuation point is:

> **Begin M1.2 Pre-Implementation Analysis — Project Creation Threshold, Identity, and Primary Image Hash.**

M1.1 is formally closed.

M1.2 has not begun.

The Phase 6 workflow remains disciplined, but from this point forward it must also remain proportionate, concise, and realistically finishable.
# HFZWood — Project Continuity Update

## Current status

Phase 6 continues under the simplified, pragmatic execution plan.

The governing workflow remains:

* preserve the existing functional application;
* reuse existing architecture and code wherever possible;
* implement only what is necessary for launch or to prevent a genuine future foundational rewrite;
* avoid speculative infrastructure;
* avoid excessive milestones, subdivisions, and documentation;
* each task must produce a concrete and justified result;
* use the workflow: focused analysis → implementation → automated tests → manual QA when relevant → review/repair if needed → Keep All → documentation → commit/push;
* do not expand scope without concrete repository-backed necessity.

## Phase 6 status

### Block 1 — CLOSED

The canonical local Project v2 foundation is complete and validated.

### Block 2 — IN PROGRESS

#### Task 2.1 — Local Project Ownership Enforcement: CLOSED

Implementation commit:

`fa256ac`

Documentation commit:

`793ce4c`

Validated behavior:

* owned Project → fully editable;
* foreign-owned Project → read-only;
* persistent mutations blocked in read-only mode;
* Save/Update authoritatively blocked for foreign-owned Projects;
* foreign-owned Projects excluded from Recent Projects;
* owned Projects deduplicated by canonical `projectId`;
* zoom/pan/fit remain available in read-only mode.

#### Task 2.2 — Production Cognito Authentication: CLOSED for implementation and automated validation

Main implementation commit:

`5538d89`

Post-closure environment-isolation fix:

`b251169`

Final backend baseline:

* 130 passed with `AUTH_MODE=mock` and no Cognito variables;
* 130 passed with `AUTH_MODE=mock` and Cognito variables present.

Frontend baseline:

* 491 passed across 66 files;
* two consecutive full frontend-suite runs passed.

Production Cognito build:

* passed.

Implemented:

* real AWS Cognito authentication through the existing HFZWood auth adapter boundary;
* existing HFZWood Login, Registration, Confirmation, and Password Recovery UI preserved;
* direct Amplify v6 authentication APIs used instead of Hosted UI as the default experience;
* immutable Cognito `sub` normalized to canonical `user.id`;
* canonical identity chain:

```text
Cognito sub
    ↓
user.id
    ↓
projectMetadata.ownerId
    ↓
Task 2.1 ownership enforcement
```

* asynchronous Cognito session restoration;
* Cognito login, registration, confirmation, password recovery/reset, and logout;
* bearer-token API authentication;
* mock authentication preserved for local development and automated tests;
* explicit frontend/backend mock-versus-Cognito mode selection;
* production mock-auth leakage prevented;
* missing or empty Cognito `sub` rejected;
* protected routes wait for asynchronous session restoration;
* `AUTH_MODE` is the authoritative backend authentication-mode switch;
* incidental `COGNITO_*` shell variables do not activate Cognito middleware in mock mode.

Task 2.1 ownership logic was not modified.

Development Projects owned by `stub-user` are not migrated and remain foreign-owned under a real Cognito identity.

## Important remaining Cognito validation boundary

Task 2.2 is implementation-closed but must not be described as fully production-ready until live AWS Cognito end-to-end validation passes.

Release certification must still verify against deployed AWS Cognito:

* registration;
* email confirmation;
* successful and failed login;
* session restoration after browser reload;
* live `user.id === Cognito sub`;
* logout;
* password recovery/reset;
* token refresh and expiry behavior;
* protected API requests;
* missing and invalid token rejection;
* owned Project remains editable;
* foreign-owned Project remains read-only;
* production deployment cannot activate mock authentication.

These checks remain pending and must not be marked as passed.

## Exact next starting point

The next task is:

**Task 2.3 — Product Capability Enforcement**

It has not started.

Do not begin implementation immediately.

The next session must start with a focused repository analysis to determine:

1. what capability infrastructure already exists and can be reused;
2. which approved free/subscriber/administrator rules are already represented in the capability catalog;
3. where capability rules are currently not enforced in the real product;
4. which restrictions require frontend enforcement;
5. which restrictions also require authoritative backend enforcement;
6. what can be implemented now without Stripe or a production entitlement database;
7. what must remain deferred until Stripe or production infrastructure exists.

## Known existing capability foundation

The repository already contains substantial capability infrastructure, including:

* capability catalog;
* backend capability resolver;
* tiers:

  * `free`;
  * `subscriber`;
  * `administrator_unlimited`;
* `CapabilitiesProvider`;
* capability hooks such as `useCapability()` and `useCapabilityLimit()`;
* `EntitlementsRepository`.

The expected Task 2.3 principle is:

```text
Feature code asks:
"Does this user have this capability?"

Feature code must not ask:
"Is this user a subscriber?"
```

Reuse the existing capability architecture.

Do not create a second commercial-access model.

## Expected Task 2.3 product rules

The focused analysis must verify the actual repository and approved architecture before implementation, but known capability areas include:

* free-user polygon-point limits;
* layer calculation access;
* PDF/export access;
* advanced report access;
* relevant calculator restrictions;
* Learning-module access rules where already approved;
* subscriber full access;
* administrator unlimited access.

Do not assume every historical idea must be implemented.

Only enforce rules that are approved, represented in the current architecture, and genuinely required for launch.

## Explicitly out of scope for Task 2.3

Do not implement:

* Stripe;
* billing;
* subscription checkout;
* production entitlement purchasing;
* Cloud Workspace;
* Project cloud persistence;
* sharing;
* ownership transfer;
* Save As;
* beforeunload;
* image hardening;
* MFA;
* advanced Cognito workflows;
* migration of `stub-user` Projects;
* Global Search;
* marketplace;
* speculative future capabilities.

## Remaining Phase 6 path after Task 2.3

After Task 2.3:

1. close Block 2;
2. Block 3 — complete only genuine Local Workspace launch gaps;
3. Block 4 — production backend and durable data;
4. Block 5 — AWS deployment, live Cognito validation, Stripe, and minimum cloud foundation;
5. populate and publish the required editorial/multilingual content;
6. Block 6 — security, backup/recovery, observability, integrated QA, external audit, and release certification;
7. production launch.

Do not predefine excessive task granularity for Blocks 3–6.

At the beginning of each block, inspect the real repository and create only the minimum justified tasks.

## Current overall assessment

The core HFZWood application is functional.

The calculator, local Project workflow, canonical Project v2 format, Save/Open/Update, Recent Projects, ownership enforcement, Cognito integration, Manual, Glossary, Knowledge Base, Admin functionality, preferences, and capability foundations already exist.

The remaining work is primarily concentrated in:

1. commercial access enforcement and Stripe;
2. production infrastructure and durable data;
3. content population;
4. security, recovery, integrated QA, and release certification.

The application itself is estimated to be substantially built, but significant launch infrastructure and validation work remains.

## Next-session instruction

Start directly from:

**Task 2.3 — Product Capability Enforcement**

First perform a focused pre-implementation analysis.

Preserve the simplified workflow.

Do not reopen closed tasks unless a concrete repository-backed blocker requires it.

Do not start future blocks prematurely.

Do not expand scope.

The governing principle remains:

**Preserve what works. Reuse what exists. Implement only what is necessary for launch or to prevent a genuine future foundational rewrite.**
## HFZWood — Session Handover after Task 3.3 Closure

Phase 6 implementation continues under the simplified, pragmatic workflow.

Current status:

- Block 1 — CLOSED.
- Block 2 — COMPLETE.
  - Task 2.1 — Local Project Ownership Enforcement — CLOSED.
  - Task 2.2 — Production Cognito Authentication — CLOSED for implementation and automated validation. Live AWS Cognito E2E remains mandatory before release certification.
  - Task 2.3 — Product Capability Enforcement — CLOSED.
- Block 3 — IN PROGRESS.
  - Task 3.1 — Local Project File Integrity and Relocation Safety — CLOSED.
  - Task 3.2 — Device-Local Preferences Authority — CLOSED.
  - Task 3.3 — Remove Redundant Calculator Import Project and Repair Existing Project Save — CLOSED.

Latest commits:

- `17f4d0c` — Phase 6 Block 3.3: simplify project open and update safety
- `b5c0465` — docs: correct Task 3.3 closure commit hash

Current validated baseline:

- Backend: 130 passed.
- Frontend: 571 passed across 72 files.
- Production Cognito build: passed.
- Product Owner manual QA for Task 3.3: passed.
- Tracked working tree: clean.
- Branch pushed successfully to `origin/main`.

Approved pre-existing untracked files remain untouched:

- `documentation/Arthur-project-handover.md`
- `documentation/external-architecture-review.md`
- `frontend/.env.local`

Important Task 3.3 outcomes:

- Calculator-level Import Project was removed.
- Projects → Open Project is now the sole authoritative Project-open path.
- No Logout infrastructure was added because it was not justified by the actual product flow.
- A pre-existing Task 3.1 regression was discovered during PO QA:
  - invalid File System Access permission mode `"write"` was corrected to `"readwrite"`;
  - opened owned Projects can now be updated successfully from both Project Actions → Save Project and the Unsaved Changes dialog;
  - successful update clears dirty state;
  - denied permission produces no false success.

Task 3.2 also established:

- device-local localStorage authority for interface language, length unit, and volume unit;
- calculator UI follows the selected interface language for the primary workflow, results, planning, breakdown, and validation messages;
- Romanian calculator terminology uses `Cofraj`, not `Mulaj`.

Next session:

Do not automatically start Task 3.4.

First perform a short, focused Block 3 remaining-scope review based on the authoritative `documentation/phase-6-simplified-execution-plan.md` and the actual repository state.

The remaining deferred candidates include:

- Save As;
- Remove from Recent Projects UI;
- local Project deletion UI;
- beforeunload/tab-close protection;
- Logout unsaved protection;
- thumbnails.

The purpose of the review is to determine whether any of these is genuinely required for launch and justifies additional complexity, or whether Block 3 can be closed now and work can proceed to Block 4.

Preserve the governing rule:

Implement only what materially improves launch safety, correctness, verification, reversibility, or essential user experience. Do not implement features merely because they appear in an old deferral list. Reuse existing behavior, avoid speculative infrastructure, and keep documentation compressed and non-duplicative.

Working rule:

Proceed step by step. Do not move to the next implementation step without explicit Product Owner approval.
## 2026-07-16 — Phase 6 Block 4 Completion, External Architecture Audit, and Transition to Block 5

Today Phase 6 Block 4 was officially completed.

### Task 4.1 — Production-Durable Editorial Persistence
The approved implementation was finalized, validated, committed, and pushed.

Delivered scope:
- EFS-backed production-durable editorial persistence while preserving the existing FilesystemContentRepository model.
- Production Docker packaging corrections.
- Strict production content-root validation with fail-fast behavior.
- Canonical editorial initialization and safe first-run seeding.
- Legacy compatibility and lazy migration for existing content.
- Atomic JSON writes.
- Single-writer deployment model for the initial commercial launch.
- Docker build-context hygiene through a repository-level `.dockerignore`.

Validation completed successfully:
- Backend: 163 passed (1 skipped)
- Frontend: 571 passed (72 files)
- Production Cognito build: passed
- CDK build and synth: passed

Task 4.1 implementation and documentation were committed separately and pushed to `origin/main`. Block 4 is now officially CLOSED.

### External Architecture Audit (Claude)

An independent read-only architecture audit was performed after the completion of Blocks 1–4.

The audit conclusion was:

> Blocks 1–4 are architecturally sound. No Release-Critical architectural defects were found. Development should continue with Block 5.

Claude reported two Category B observations only:

1. Documentation divergence regarding `versionId`.
2. Single-writer deployment assumptions should be verified during production deployment.

The first observation was immediately resolved by synchronizing Phase 5 Technical Architecture with the approved Phase 6 Block 1 implementation. No application code changed.

The second observation was accepted as an operational deployment validation item and remains part of the production release-certification process, not a development task.

### Current Project Status

Blocks 1–4 are now fully closed.

The project currently has:
- synchronized Product decisions;
- synchronized Technical Architecture;
- synchronized Phase 6 implementation plan;
- successful automated validation;
- successful Product Owner manual QA;
- successful independent external architecture audit.

No known Release-Critical architectural issues remain.

The next active implementation block is Block 5, which will focus on the commercial production platform (Stripe, durable entitlements, production deployment completion, and commercial release preparation).

This concludes the implementation phase covering Blocks 1–4.
Commercial account-sharing protection has been researched and preserved in documentation/commercial-license-protection-strategy.md. A dedicated device-registry task must be analyzed after Tasks 5.2–5.3; no implementation has started.
## Phase 6 — Block 5 Progress Update

Task 5.2 **Stripe Subscription and Durable Entitlements** has been completed and officially closed.

Delivered scope:

* Durable commercial entitlement persistence on EFS with atomic writes.

* Stripe Checkout, Customer Portal, signed webhook processing, and commercial status endpoint.

* Commercial architecture finalized:

  Stripe → Commercial State → Entitlement → CapabilityResolver

* Product modules remain completely isolated from Stripe.

* My Account commercial interface implemented.

* Capability refresh remains fail-soft.

* AWS Secrets Manager integration and billing environment configuration prepared.

During post-implementation review an important correctness issue was identified regarding cross-subscription out-of-order Stripe events (cancel → resubscribe scenario). A dedicated QA repair was implemented before closure, followed by:

* focused automated regression tests;
* Cursor repair audit (**PASS**);
* independent Claude review (**PASS**).

Task 5.2 is therefore considered production-ready within the approved implementation scope.

A separate strategic document has also been created:

`documentation/commercial-license-protection-strategy.md`

This document captures the long-term strategy for protecting commercial subscriptions and future lifetime licenses against account credential sharing. No implementation has been started. A dedicated repository analysis will be performed later before any implementation work.

---

### Current Block 5 status

* ✅ Task 5.1 — CLOSED
* ✅ Task 5.2 — CLOSED
* ⏳ Task 5.3 — pending

During today's review it became clear that Task 5.3 naturally separates into two distinct stages:

### Task 5.3A — Local Commercial Readiness Validation

This stage will be completed by our team.

Objectives:

* verify that the complete commercial implementation is internally consistent;
* validate configuration, deployment readiness, documentation, environment variables, secrets, endpoint behavior, and local integration without requiring real commercial infrastructure;
* identify any remaining implementation gaps that can be resolved before involving AWS and Stripe production resources.

No real Stripe account, AWS deployment, live payments, or production infrastructure are required.

### Task 5.3B — Live Commercial Infrastructure Validation

This stage will be performed together with Alfred after the local implementation is fully complete.

Objectives:

* configure the real Stripe account;
* create Products and Price IDs;
* configure Stripe webhooks;
* configure AWS Secrets Manager;
* deploy the application to the production infrastructure;
* validate the complete commercial flow using Stripe Test Mode;
* certify the production commercial pipeline.

Only after Task 5.3B will the commercial integration be considered fully production-certified.

---

### Work planned for the next session

Begin with **Task 5.3A — Local Commercial Readiness Validation**.

As always:

1. Pre-implementation repository analysis.
2. Product Owner review.
3. Minimal implementation where required.
4. Cursor audit.
5. Claude independent review.
6. Closure.

The objective is to complete everything that is under our control before handing the project to Alfred for the final AWS and Stripe production integration.

After Block 5 and Block 6 are complete, prepare a comprehensive Romanian technical onboarding document for Alfred describing the complete evolution of the project, the architectural decisions, the implementation rationale, the final product architecture, and the remaining production deployment work. This document will later be translated into English if needed.
## Phase 6 — Block 5 Local Closure and Block 6 Handover

Date: 2026-07-17

### Current repository state

Branch: main

Latest commit:

- b732fc6 — docs: close Task 5.3A and defer live validation

Previous documentation alignment commit:

- 204a549 — docs: align Phase 5 versionId rule with Block 1

Tracked working tree: clean.

The following approved local/untracked paths remain untouched:

- deployment/cdk/dist/
- documentation/Arthur-project-handover.md
- documentation/commercial-license-protection-strategy.md
- documentation/external-architecture-review.md
- frontend/.env.local

### Phase 6 status

Blocks 1–4: CLOSED

Block 5:

- Task 5.1 — Production Deployment and Environment Completion: CLOSED
- Task 5.2 — Stripe Subscription and Durable Entitlements: CLOSED
- Task 5.3A — Local Commercial Readiness Validation: CLOSED WITHOUT IMPLEMENTATION
- Task 5.3B — Live Commercial Infrastructure Validation: PENDING — LIVE VALIDATION REQUIRED

Official Block 5 wording:

“Block 5 local implementation and readiness work is complete. Block 5 live commercial certification remains pending through Task 5.3B.”

Block 5 must not yet be described as fully production-certified.

### Task 5.3A result

The initial repository analysis identified two possible implementation concerns:

1. late events from superseded Stripe subscriptions;
2. temporary inconsistency in the My Account post-checkout reconciliation UI.

A focused Product Architecture Verification demonstrated:

- the cross-subscription stale-event regression is already prevented by the global per-user `lastStripeEventCreated` guard;
- existing backend tests cover older `updated` and `deleted` events from a prior subscription;
- the concern had already been repaired during Task 5.2 QA;
- the My Account success-return flow may temporarily display a pending or partially refreshed state;
- the success URL never grants entitlement;
- backend capabilities remain authoritative;
- commercial actions are disabled during reconciliation;
- no incorrect commercial action or capability grant is possible.

Final Task 5.3A verdict:

READY FOR TASK 5.3A CLOSURE WITHOUT IMPLEMENTATION

No source code, tests, infrastructure source, or product behavior changed.

No new test or build run was claimed during the documentation-only closure.

### Task 5.3B boundary

Task 5.3B remains mandatory before commercial launch and will be performed with Alfred after all implementation work under the current development team’s control is complete.

It requires real validation of:

- production Docker image build and runtime;
- AWS CDK deployment;
- Cognito authentication;
- ECS/Fargate environment;
- AWS Secrets Manager retrieval;
- EFS mount, persistence, restart, and task replacement;
- Stripe Test Mode Product and Price configuration;
- Checkout and Customer Portal;
- signed Stripe webhook delivery;
- checkout → webhook → durable entitlement → CapabilityResolver → frontend flow;
- cancellation and resubscription lifecycle;
- replacement-subscription event ordering;
- deployment rollback and recovery;
- absence of data loss or unexpected reseeding.

Every Task 5.3B item remains:

PENDING — LIVE VALIDATION REQUIRED

Starting Block 6 does not cancel, satisfy, or replace Task 5.3B.

### Next active work

Block 6 — Security, Recovery, QA, and Release: Pre-Implementation Assessment

The next session must begin with analysis only.

Do not start implementation immediately.

The assessment must:

1. inspect the exact Block 6 obligations already present in the Phase 6 Simplified Execution Plan;
2. compare them with the current repository implementation;
3. distinguish actual remaining work from work already delivered in earlier blocks;
4. distinguish local implementation and QA from Task 5.3B live-infrastructure validation;
5. identify the smallest justified Block 6 task structure;
6. avoid reopening closed Blocks 1–5;
7. avoid speculative hardening, broad redesign, or unnecessary release bureaucracy;
8. preserve the established compressed and pragmatic workflow.

The output must recommend the first narrowly scoped Block 6 task, but no implementation prompt should be issued until the Product Owner and ChatGPT review the assessment.
Phase 6 — Block 6 Planning Decision

Today's work completed the Block 6 pre-implementation planning cycle without modifying the repository.

Independent assessments were performed using Cursor (repository inspection) and Claude (scope challenge). Both analyses agreed that Block 5 remains complete, Task 5.3B remains a mandatory live AWS/Stripe validation gate with Alfred, and no additional Block 5 implementation is justified.

Cursor identified three proposed Block 6 tasks. Claude independently reviewed the proposal and confirmed the technical conclusions while identifying unnecessary process overhead. Based on the combined review, the Product Owner approved a simplified Block 6 structure.

Approved Block 6 structure:

Task 6.1 — Production Safety Hardening
- EFS backup and recovery
- Minimal operational monitoring (ALB and ECS only)
- Proportional request/input boundaries
- Minimal auth/billing error logging
- Negative-path validation tests

Task 6.2 — Release Readiness
- Documentation alignment
- Local release readiness checklist
- PASS vs PENDING (Task 5.3B) certification matrix
- Block 6 closure documentation

The following items are intentionally deferred and are NOT considered commercial launch blockers:

- GitHub Actions / CI
- Separate independent audit task
- Formal QA program
- Enterprise observability
- WAF / rate limiting
- Structured logging platform
- Other enterprise operational features without demonstrated launch necessity

Current workflow remains unchanged:

Cursor → technical analysis / implementation
ChatGPT → architectural review and workflow control
Claude → independent scope challenge to eliminate scope creep

Next approved activity:

Begin Task 6.1 Pre-Implementation Analysis.
No implementation prompt has been produced yet.
Implementation begins only after Product Owner approval of the Task 6.1 scope.
## AI Translation Strategy Approved (2026-07-17)

Today's work completed the product strategy for the AI-assisted editorial translation system. No implementation has started yet. The following decisions are now considered approved and will guide the upcoming implementation.

### Product decisions

* Romanian remains the canonical editorial language. All editorial content is authored only once in Romanian.
* The initial AI translation provider will be DeepL.
* AI translations are always generated as Draft. Automatic publishing is not allowed.
* Existing Draft / Publish workflow remains unchanged.
* Translation infrastructure will support all approved languages from the beginning.
* Public language availability is independent from translation availability.
* Every supported language may exist in Admin even when not publicly available.
* Public languages are controlled through language activation (enabled / disabled).
* Initial public launch will include all approved supported languages.
* Romanian remains the canonical editorial language used by the Admin workflow. Romanian may also be available as a public language at launch. The canonical authoring language and the public language list are independent concerns.
* All approved languages will be available at launch. The language activation mechanism remains part of the architecture so languages can still be enabled, disabled, or expanded in future releases without architectural changes.
* Generate Translation creates or updates one target language.
* Generate All updates every configured language sequentially.
* Translation status follows the approved model:

  * Missing
  * Current
  * Outdated
* Translation infrastructure is intentionally separated from public language activation so new languages can be enabled later without additional development.

### Documentation strategy

No immediate updates will be made to Phase 5 Technical Architecture or the Phase 6 execution documentation.

Those documents will be updated only after the implementation is completed and validated so they reflect the final implemented behavior rather than intermediate design decisions.

The previous Phase 6 implementation-plan documents are now considered historical references. After Phase 6 is fully completed they should be archived under the documentation archive instead of being deleted.

### Next implementation task

Next active development work:

**Task 7.1 — AI-Assisted Editorial Translation Infrastructure**


Implementation scope:

* Romanian canonical editorial model.
* Revision tracking.
* DeepL backend integration.
* Shared translation service.
* Generate Translation.
* Generate All.
* Translation status tracking.
* Public language activation mechanism.
* Full automated validation.
### Public Language Availability at Launch

Romanian remains the canonical editorial language for all content created and maintained in Admin.

DeepL is the approved translation provider.

All approved public languages will be available from the initial commercial launch.

Each translated language variant must follow the existing editorial workflow:

Draft → Review → Publish

AI-generated translations must never be published automatically.

The existing Active/Inactive language mechanism remains part of the architecture for future operational flexibility, temporary language suspension, or later language expansion.

For the initial commercial launch, all approved languages are intended to be Active and publicly available once their required editorial content has been generated, reviewed, and published.

Any previous English-only launch decision is superseded and must no longer guide implementation.

Only after the infrastructure is complete will the editorial migration begin:

* remove temporary English demonstration content;
* author canonical Romanian content;
* generate all translations;
* review translations;
* publish English only for the initial public release.
### Pre-Implementation Architecture Review

Status: APPROVED

The existing editorial architecture defined in Phase 5 remains valid and requires no structural redesign.

Implementation of AI-Assisted Editorial Translation will extend the existing editorial infrastructure by reusing the current repositories, services, routing, Draft/Review/Publish workflow, snapshots, and multilingual content model.

No separate CMS, translation microservice, background queue, or automatic publishing mechanism will be introduced.

The implementation objective is to add AI-assisted translation capabilities with the smallest possible architectural footprint while preserving the existing editorial workflow and maintainability.

Next step: repository-level pre-implementation analysis to identify the minimum code changes required before implementation begins.
### Repository Validation Summary (Pre-Implementation)

Status: COMPLETE

Two independent repository inspections were completed before implementation.

#### Validation Outcome

The existing editorial architecture is fully suitable for AI-assisted multilingual translation.

The current META/VARIANT model, Draft → Review → Publish workflow, locale snapshots, repositories, services, and editorial Admin interface already provide the required foundation.

No architectural redesign is justified.

No separate CMS, translation microservice, alternate publishing pipeline, or duplicate editorial infrastructure will be introduced.

#### Canonical Romanian Alignment

Repository analysis confirmed that Romanian can become the canonical editorial language without changing the underlying architecture.

Required implementation work is limited to historical English-first defaults, including authoring defaults, creation paths, identity fallback order, initialization detection, and related tests.

The Draft/Publish workflow, snapshot architecture, META/VARIANT model, locale-based storage, and public publication pipeline remain unchanged.

Existing English editorial content is treated as historical editorial data and will not be migrated or rewritten as part of this infrastructure work.

#### Implementation Strategy

Task 7.1 will be implemented incrementally in small, independently validated sub-tasks.

Each sub-task must preserve the existing editorial architecture and minimise repository impact by extending existing components rather than introducing new infrastructure.

Next step:

Task 7.1.1 — Canonical Romanian Alignment.
## Task 7.1.1 Closure

**Status:** CLOSED

### Objective

Align the repository with the approved product decision that Romanian is the canonical editorial authoring language while preserving the existing editorial architecture.

### Implementation Summary

Completed:

* Romanian is now the default editorial authoring language.
* Manual, Glossary, and Knowledge Base creation default to Romanian.
* Admin editorial workspace defaults to Romanian.
* Editorial identity and label fallback now prefer Romanian after the requested locale.
* Published-corpus initialization detection is language-neutral.
* Existing English authoring remains fully supported when explicitly selected.

Intentionally unchanged:

* META/VARIANT architecture
* Draft → Review → Publish workflow
* Snapshot architecture
* Public API default language
* Interface language preferences
* Existing English editorial content
* Existing migration and seed data

### Validation

Repository implementation validated.

Final scoped diff review: PASS.

Backend validation:

* 109 passed
* 1 skipped

Frontend editorial validation:

* 37 passed

Implementation approved.

### Repository

Commit:
`cf9a3a7`

Status:
Committed, pushed to `origin/main`.

### Next Active Task

**Task 7.1.2 — Editorial Translation Metadata Foundation**
## Task 7.1.2 Closure — Editorial Translation Metadata Foundation

**Status:** CLOSED

### Objective

Implement the minimum metadata foundation required for AI-assisted editorial translation while preserving the existing META / VARIANT architecture and Draft → Review → Publish workflow.

### Delivered Scope

Romanian canonical variants now support:

- `sourceRevision`

Target-language variants now support:

- `generatedFromSourceRevision`
- `translationProvider`
- `generatedAt`

All metadata is stored on the existing locale `VARIANT` records.

No separate translation store, translation job model, or architectural redesign was introduced.

### Romanian Source Revision Behaviour

For `VARIANT#ro`:

- a newly created Romanian variant starts with `sourceRevision = 1`;
- the revision increments only when `draftBody` changes;
- saving an identical body does not increment the revision;
- Publish and Unpublish do not increment the revision;
- target-language saves and publishes do not modify the Romanian revision;
- existing Romanian variants without a revision remain valid and are safely initialised on their first save.

No content hashes or revision-history documents were introduced.

### Target Translation Behaviour

Existing and newly created target-language variants remain manually editable and publishable.

A user may:

- enter a translation manually;
- paste a translation produced by another AI or translation service;
- modify an AI-generated draft;
- save the target-language draft;
- review and publish it through the existing editorial workflow.

Ordinary manual saves preserve existing generation metadata.

Existing target variants without translation metadata remain valid and are treated as manual or untracked translations.

### Derived Translation Freshness

Translation freshness is derived rather than stored as a duplicated status field:

- **Missing** — the target variant does not exist;
- **Current** — `generatedFromSourceRevision` equals the current Romanian `sourceRevision`;
- **Outdated** — the target was generated from an older Romanian revision;
- **Manual / Untracked** — the target exists but has no generation revision.

Manual / Untracked content is not classified as Missing.

This distinction protects manually entered translations from future silent replacement by Generate All.

Post-generation manual modification can be derived from:

`updatedAt > generatedAt`

No stored `manuallyEdited` flag was added.

### Compatibility

Backward compatibility was preserved:

- no destructive content migration;
- absent legacy metadata safely defaults to null or uninitialised;
- existing editorial content remains readable, editable, and publishable;
- public published-content responses remain unchanged;
- frontend behaviour remains unchanged.

The implementation applies consistently to:

- Manual;
- Glossary;
- Knowledge Base.

### Validation

Final scoped diff review: **PASS**

Validation completed:

- focused and related Admin tests: **68 passed**
- full `backend/tests/content`: **127 passed, 1 skipped**

The implementation was confirmed to be strictly scoped.

### Explicitly Not Implemented

Task 7.1.2 did not introduce:

- DeepL integration;
- Generate Translation;
- Generate All;
- provider adapters;
- translation UI;
- language activation;
- background jobs or translation queues;
- stored translation-status enums;
- translation history, prompt history, or audit storage;
- public API behaviour changes.

### Repository

Commit:

`659bac1b7d09a9a7365d6e0465cce6c86e17ad5a`

Short hash:

`659bac1`

Commit message:

`feat: add editorial translation metadata foundation`

Branch:

`main`

Push:

Successfully pushed to `origin/main`.

Repository status:

Branch is up to date with `origin/main`.

The working tree is clean except for approved unrelated untracked files, which remain untouched.

### Residual Non-Blocking Notes

The following items were identified during final review but do not require correction for this task:

- Publish and Unpublish update `updatedAt`, so future overwrite-protection logic must not assume that every `updatedAt > generatedAt` condition represents a body edit.
- Inconsistent revision metadata currently degrades conservatively to `Outdated`.
- The canonical Romanian locale constant currently exists in two locations and must remain aligned.
- Additional edge-case tests may be added later when Generate behaviour is implemented.

### Next Active Task

**Task 7.1.3 — DeepL Translation Provider Integration**

The next task will introduce the translation-provider boundary and DeepL integration only.

Generate Translation, Generate All, and translation UI remain outside the next task unless explicitly approved after pre-implementation analysis.
Task 7.1.3 — DeepL Translation Provider Integration

Status: CLOSED

Implementation completed, reviewed, committed and pushed.

Commit:
a6438f9 — Phase 7 Task 7.1.3: add DeepL translation provider

Implemented:
- Provider-neutral TranslationProvider interface
- DeepL adapter using httpx
- Environment-based configuration
- Fixed locale mapping (RO canonical source)
- Request-size guard
- Provider-neutral exception hierarchy
- Conservative retry policy
- Secure logging
- Complete mocked backend test suite

Validation:
- Translation provider tests: 74 passed
- Backend content: 201 passed, 1 skipped
- Full backend: 294 passed, 1 skipped

Scope remained intentionally minimal.

No Generate Translation orchestration, editorial persistence, metadata updates, Admin UI, frontend, or AWS/CDK changes were introduced.

Next active task:

Task 7.1.4 — Generate Translation orchestration

Before implementation perform a complete pre-implementation analysis focused on:
- editorial text extraction
- provider orchestration
- draft persistence
- translation metadata updates
- manual translation protection
- JSON reconstruction
- scope boundaries

No implementation should begin before the architecture review for Task 7.1.4 is completed.
Task 7.1.4 — Editorial Translation Generation

Status: CLOSED

Commit:
f62fbbe — Phase 7 Task 7.1.4: add editorial translation generation

Summary

Task 7.1.4 completed the editorial translation workflow by connecting the existing TranslationProvider (Task 7.1.3) to the editorial system.

Delivered:

• editorial text extraction and reconstruction
• translation orchestration service
• generation metadata persistence
• atomic draft generation
• Admin Generate endpoints
• prepared Admin locale support
• overwrite confirmation
• unsaved editor protection
• minimal Admin Generate UI
• comprehensive backend/frontend validation

Key Product Owner decisions implemented:

• Romanian remains the canonical editorial source.
• Prepared Admin locales are separated from public language activation.
• Generate always creates or updates drafts only; it never publishes content.
• Translation validates all preconditions before contacting DeepL.
• Existing target drafts always require explicit overwrite confirmation.
• Technical Knowledge Base fields remain translatable and subject to editorial review before Publish.

Validation

Backend:
308 passed, 1 skipped

Content:
215 passed, 1 skipped

Translation generation:
13 passed

Frontend:
5 passed

Production frontend build:
PASS

Scope remained intentionally minimal.

No Generate All, queues, workers, public language activation, automatic publishing, workflow redesign, or persistence redesign were introduced.

Next active work:
Phase 7 — next planned task after Task 7.1.4.
AI Translation Module — Implementation Status

Current status

The initial AI-assisted editorial translation module has been fully implemented and closed.

Completed tasks

• Translation metadata
• Provider-neutral translation infrastructure
• Editorial translation generation
• Admin translation workflow integration

Final implementation commit

f62fbbe — Phase 7 Task 7.1.4: add editorial translation generation

Current repository state

The implementation has passed:
- Product Owner review
- Cursor implementation review
- Claude architecture review
- Final closure review
- Commit and push

No implementation work remains for the initial translation module.

Current priority

Before any further AI translation development, perform complete functional validation of the implemented workflow.

Validation objectives

• verify DeepL account type (Free or Pro)
• verify correct API endpoint
• verify authentication key configuration
• verify backend provider initialization
• verify Admin translation workflow
• verify draft generation
• verify overwrite protection
• verify unsaved-changes protection
• verify publish workflow
• verify public language visibility rules

No additional implementation should begin until the translation workflow has been validated end-to-end.

After successful validation, evaluate possible future improvements only if justified by real usage.
Product QA phase started.
documentation/product-qa-observations.md created as the authoritative Product QA document.
First QA session identified two confirmed implementation defects and several previously designed but intentionally deferred product capabilities.
Development temporarily shifts from feature implementation to a Product QA–driven refinement cycle before continuing editorial population.

Observation 004 (HTML entity double-escaping after AI translation) was corrected in the frontend rich-text editor adapter and closed after Product QA PASS.

Observation 008 (locale deletion removed entire multilingual entities) was implemented and closed after Product QA PASS: non-RO locales delete only that translation; Romanian cannot be deleted in isolation; full-entity delete remains a separate explicit action. Multilingual locale deletion is now safe across Manual, Glossary, and Knowledge Base.

Next active Product QA priority: Observation 001 — Generate All (Update All Translations) Product QA Scenarios 1–7.

## Task A — Translation Update Engine

Status: CLOSED (Product Owner validated)

Approved Option B with two revision counters (not fingerprints):

- RO: `sourceRevision`, `sourceTextRevision`
- Target: `generatedFromSourceRevision`, `generatedFromSourceTextRevision`

Delivered: shared classify / media-sync / full-generate engine; single-item Generate Translation uses it; zero DeepL for media-only and current; manual/untracked never silently overwritten; segment-level incremental translation deferred.

## Task B — Update All Translations (Generate All)

Status: IMPLEMENTED (awaiting Product QA CLOSE of Observation 001)

Scope: one editorial module + one target locale per run; sequential chunked HTTP; orchestration only over `TranslationUpdateService`.

Policy: generate missing; skip current; sync media-only (0 DeepL); skip text-outdated unless `includeTextOutdated`; always protect manual/untracked; drafts only; no auto-publish; process-local lock; no queues/workers/new AWS infrastructure.

API:

- `POST /api/admin/{manual|glossary|knowledge-base}/translations/{locale}/bulk-preview`
- `POST /api/admin/{manual|glossary|knowledge-base}/translations/{locale}/bulk-update` (`offset`/`limit`, default chunk 5)

Admin UX: **Update All Translations** with preflight, confirmation, progress, summary.

Deferred: multi-locale batch; cancellation; automatic retries; segment-level DeepL; distributed locks.

## Session Closure — Product QA Translation Workflow

Today's session completed the multilingual editorial Product QA cycle.

Completed

- Observation 004 (HTML entity encoding) — CLOSED — Product QA PASS.
- Observation 008 (safe locale-specific deletion) — CLOSED — Product QA PASS.
- Multilingual editorial workflow manually validated across:
  - Manual & Tutorials
  - Glossary
  - Knowledge Base
- Commit:
  161845e7286f3fc1c5de9c7189b230171ccb415a
- Branch:
  main (pushed successfully)

Important operational finding

A local DeepL configuration failure was diagnosed as an orphan backend process running without the required environment variables, not an application defect.

When troubleshooting local DeepL translation, first verify that only one backend instance is serving port 5000.

Current Product QA status

Remaining observations:

1. Observation 001 — Generate All / Update All Translations (IMPLEMENTED; awaiting Product QA Scenarios 1–7).
2. Observation 002 — Incremental translation (media-only DONE in Task A/B; segment DeepL deferred; CLOSE after PO confirms media-only QA).

Observation 005 — Editorial Collection Edit / legacy sibling migration — CLOSED (see closure record below).
Observation 007 — Public Language Activation — completed (see prior status update).

Next major activity

After the remaining Product QA observations are completed, begin preparing the comprehensive HFZWood Product Evolution & Architectural Decision document.

The document will describe:

- product origin;
- architectural evolution;
- major design decisions;
- rejected alternatives;
- implementation philosophy;
- commercial decisions;
- current architecture;
- future roadmap.

Its purpose is to serve as the primary technical and product reference for Alfred, future collaborators, technical audits, and potential investors.
### Editorial Product QA Status Update

The following Product QA observations have been completed and accepted:

- Observation 006 — Translation workflow / Generate All completed and accepted.
- Public publication pipeline corrected. Published snapshots are now the sole public source of truth. Legacy seed fallback no longer reappears when published snapshots exist.
- Observation 007 — Public Language Activation completed.
  - Public language visibility is now independent from translation generation and publication.
  - Admin Dashboard contains the Public Languages management table.
  - English is the default and initially the only active public language.
  - Additional languages can be activated explicitly by the Product Owner without triggering translation or publication.
  - Translation status and Published Content are informational only and do not block activation.

### Observation 005 — CLOSED

Original Observation 005 wording (“Create/Delete only; no Edit”) was outdated. Direct select-to-edit + Save Draft already existed under a stable `contentId`.

The real defect was legacy→typed migration: saving the first Romanian variant removed all legacy keys for that entity without promoting sibling locales, so English (and other) variants could be lost.

Fix: every legacy META/VARIANT for the entity is promoted to typed keys and verified complete before legacy keys are removed. Draft Save still does not mutate published snapshots.

Product Owner QA confirmed:

- Romanian variants can be saved and published;
- English sibling variants remain preserved;
- public Romanian Glossary becomes available after successful Publish;
- Knowledge Base Product QA for the same migration path passed.

Post-QA UX (same observation closure):

- Glossary Related Terms and Synonyms only offer entries already published in the active admin locale;
- Publish relationship validation surfaces the backend `detail` (human-readable term labels) instead of a generic HTTP 500 string.

Final validation for this closure: full backend suite, full frontend suite, and frontend production build — all passed.

### Step 6 — Editorial cleanup — CLOSED

Dedicated editorial junk cleanup completed after the Step 5 audit.

- Only evidence-backed dead code was removed (unused helpers/exports, superseded unused admin CSS).
- Snapshot rebuild unused-parameter cleanup remains with Keep All WIP (always-write snapshot ownership) so that WIP product behavior is not landed under this cleanup commit.
- No architectural refactoring.
- No intentional behavior changes on committed main.
- Validation: full backend pytest, frontend vitest (ownership flake re-ran clean; editorial suites green), frontend production build — passed.

`frontend/src/admin/publicLanguagesApi.js` and other Keep All WIP were left untouched for feature landing.

Remaining approved pre-release sequence:

1. Alfred handover.
2. Task 5.3B live production validation.

### Editorial store Windows file-contention reliability — CLOSED

Local Glossary Publish could fail with HTTP 500 when Windows denied access to `backend/data/editorial/content-store.json` (`PermissionError` / WinError 5 on `os.replace`, and EACCES on store open during reference search), typically under transient sync/antivirus locks. Save Draft could succeed while the immediate follow-up Publish write failed; drafts and snapshots stayed intact (no partial publish).

Correction (shared filesystem repository):

- Bounded retry for classified transient access errors only (WinError 5, WinError 32, EACCES, EPERM) on atomic `os.replace` and on editorial store open/read.
- 7 attempts with delays 0.05s, 0.10s, 0.20s, 0.40s, 0.80s, 1.00s (~2.55s max sleep).
- Atomic write design preserved (same-directory temp, fsync, replace, cleanup; destination unchanged on final failure).
- Applies automatically to Manual, Glossary, Knowledge Base, and Website persistence.
- No repository locks, request serialization, or Save-then-Publish workflow changes.

Product Owner verified after backend restart: Save Draft, single Publish (including a previously failing entry), consecutive Publish, reference search, and Publish all drafts succeeded without content loss.

### Glossary editorial read-amplification — CLOSED

Steady-state Glossary Add/Save/Publish latency (~2–4s) was dominated by repeated full `content-store.json` reads inside `list_entries` (~741 reads / ~3.8s) and publish snapshot rebuild (~192–198 reads / ~1.0–1.2s), not by the Windows retry helper on the successful path.

Correction (operation-scoped only; no cross-request cache, no persistence redesign):

- Glossary `list_entries` loads the store once and derives ordering, meta, and locale variants in memory.
- Glossary `build_admin_snapshot` likewise uses one editorial-store read per rebuild (including relation label resolution).
- Standalone getters still load independently; Windows transient-access retries unchanged.

Measured on the local 74-entry store: list **741→1** reads (~3803→~21 ms); snapshot **~198→1** reads (~1020→~24 ms). Response/snapshot parity covered by focused tests; full backend suite green.

Note: `backend/data/` (including `editorial/content-store.json`) remains gitignored — local editorial content is not preserved by GitHub commits.

### Release A — Backend Editorial Write Guard — CLOSED

Centralized backend guard for the approved Git-packaged, production-read-only editorial release model. Default behavior remains fully writable.

- `EDITORIAL_CONTENT_MODE=writable|release` (`backend/content/editorial_content_mode.py`).
- Missing/blank defaults to `writable`.
- `release` blocks all editorial mutations with backend-enforced HTTP 403; invalid values fail closed (HTTP 500).
- Editorial Admin reads remain available; billing, entitlements, preferences, and authentication are unaffected.
- Docker, CDK, EFS, `CONTENT_DATA_DIR`, strict-root initialization, frontend, and content packaging were not changed.
- Validation: 29 focused tests passed; full backend suite 523 passed, 1 skipped.
- Release B has not started.

### Task B1 — Release-Mode Startup — CLOSED

When `EDITORIAL_CONTENT_MODE=release`, startup validates a packaged editorial corpus and performs no editorial-root writes.

- Requires the editorial root to exist and be a directory; validates required release artifacts for existence and valid JSON (`editorial/content-store.json` with a `records` object; published Manual/Glossary/KB/Website `en` snapshots; `config/public-languages.json`).
- Does not seed, create directories, create an empty store, auto-create website pages, or require editorial-root writability.
- Writable/default behavior remains unchanged (including existing `REQUIRE_CONTENT_DATA_DIR` strict init).
- Validation: 49 focused tests passed; full backend suite 534 passed, 1 skipped.

### Task B2 — Commercial Data Root — CLOSED

Introduced `COMMERCIAL_DATA_DIR` so durable commercial/user filesystem state can be separated from the editorial content root.

- Resolution order: explicit non-blank `COMMERCIAL_DATA_DIR`; otherwise `CONTENT_DATA_DIR`; otherwise local default `backend/data`.
- `FilesystemEntitlementsRepository` uses `<commercial_root>/entitlements`.
- `FilesystemPreferencesRepository` uses `<commercial_root>/preferences`.
- Editorial content and public-language configuration remain on `CONTENT_DATA_DIR`.
- Explicit constructor paths still override environment resolution.
- Docker, Git tracking, CDK, EFS, frontend, and production release activation remain untouched.
- Validation: 49 focused tests passed; full backend suite 575 passed, 1 skipped.

### Task B3 — Selective Git Tracking of Editorial Release Corpus — CLOSED

Approved editorial corpus is now Git-tracked via selective `.gitignore` rules (42 corpus files, approximately 23.97 MB).

- Tracked scope: `editorial/content-store.json`; published Manual, Glossary, Knowledge Base and Website snapshots; editorial images; `config/public-languages.json`.
- Preferences, entitlements, legacy, initialization markers and temporary/runtime files remain ignored.
- Secret scan found no credentials.
- `.dockerignore`, Dockerfile, backend code, CDK, frontend and production activation remain untouched.

### Task B4 — Docker Packaging of Editorial Release Corpus — CLOSED

Implementation closed: `.dockerignore` selectively permits only the approved editorial corpus; Dockerfile packages it under `/app/content` (42 corpus files, approximately 23.97 MB). Preferences, entitlements, legacy and runtime artifacts are excluded. CDK, EFS and production activation remained untouched.

- Release-mode equivalent validation passed; focused B4 validation: 15 passed.
- Remaining validation (real `docker build`, image filesystem inspection, container startup, container-level HTTP smoke): **DEFERRED TO ALFRED RELEASE GATE**.
- Reason: Docker is not available in the current local environment; actual image/deployment validation belongs to the production deployment owner.
- This deferral is not an implementation blocker for B5.

### Task B5 — Production Editorial/Commercial Data Wiring — CLOSED

Production editorial root changed from EFS to `/app/content`; commercial root remains on EFS at `/mnt/hfzwood-content`.

- `CONTENT_DATA_DIR=/app/content`
- `EDITORIAL_CONTENT_MODE=release`
- `COMMERCIAL_DATA_DIR=/mnt/hfzwood-content`
- `REQUIRE_CONTENT_DATA_DIR` removed from production configuration.
- EFS remains attached, writable and transit-encrypted; existing EFS filesystem/access-point identities were preserved.
- No path collision between editorial and commercial roots.
- Seed-data/export path retained for local writable mode, tests, rollback and strict-init compatibility.
- Focused B5 validation: 6 passed; related validation suite: 27 passed; CDK synth passed.
- No live deployment performed. Alfred release gate (including deferred Docker runtime validation) remains pending.

Next step: Task B6 — Release B cleanup, final validation and handover preparation.