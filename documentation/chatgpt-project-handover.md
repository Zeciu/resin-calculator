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

Task 64 — Roles & Permissions

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

The next implementation task is Task 59 — Manual Content Management.