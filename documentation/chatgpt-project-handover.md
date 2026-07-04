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