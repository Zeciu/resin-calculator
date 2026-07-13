# HFZWood — Product Architecture Decisions

This document records the major product architecture decisions made during Phase 4.

Its purpose is not to describe the product architecture itself—that is the responsibility of `phase-4-product-architecture.md`.

Instead, this document captures the key decisions, the reasoning behind them, and the architectural principles that should guide future development.

These decisions are approved product architecture constraints. They should not be reopened during Technical Architecture or implementation unless a deliberate product-level decision is made to revise them.

---

# Foundational Product Decisions

## PA-001 — Project-Centric Architecture

### Decision

HFZWood is a project-centric product.

The Project is the central product entity. Every major functional module exists to create, enrich, manage, protect, personalize, or control access to Projects.

### Rationale

Organizing the product around Projects creates a coherent architecture where all current and future functionality contributes to a single product entity rather than forming isolated workflows.

This approach allows the platform to grow without changing its fundamental organization.

### Alternatives considered

- Calculator-centric architecture. (rejected)
- Learning-centric architecture. (rejected)
- Cloud-centric architecture. (rejected)

None of these alternatives provide a stable long-term foundation for the complete product.

### Status

Approved.

---

## PA-002 — Project Creation Threshold

### Decision

A Project comes into existence only after both of the following conditions are satisfied:

- one primary image has been provided;
- at least one reference measurement has been defined.

Before these conditions are met, the user is only inside the project creation workflow. No Project exists and no persistent project artifact is created.
Authentication is a prerequisite for entering the Project creation workflow, but it is not part of the Project creation threshold itself.

### Rationale

This rule establishes a clear boundary between temporary user input and a valid Project.

It prevents incomplete or accidental projects from being stored while ensuring that every Project begins with the minimum information required to identify the physical workpiece.

### Alternatives considered

- Create a Project immediately after opening New Project. (rejected)
- Create a Project after selecting an image only. (rejected)
- Create a Project only after the first calculation. (rejected)

### Status

Approved.

---

## PA-003 — Immutable Primary Image

### Decision

Every Project contains exactly one immutable primary image.

Once a Project has been created, its primary image can never be replaced.

If a different image is required, a new Project must be created.

### Rationale

The primary image defines the identity of the Project.

Allowing it to be replaced would blur the distinction between documenting the same physical workpiece and creating a different Project.

Keeping the image immutable preserves project integrity and ensures that every Project represents one specific physical configuration.

### Alternatives considered

- Allow replacing the primary image at any time. (rejected)
- Keep multiple interchangeable primary images. (rejected)
- Let users decide whether replacing the image creates a new Project. (rejected)

### Status

Approved.

---

## PA-004 — Physical Configuration Defines Project Identity

### Decision

A Project represents one specific physical configuration of a woodworking piece.

The immutable primary image provides the operative boundary between refining an existing Project and creating a new one.

As long as the same primary image remains valid for the documented physical configuration, changes to Project information are treated as refinements of the same Project.

If the physical configuration changes in a way that requires a new primary image, a new Project must be created.

HFZWood does not attempt to automatically detect physical changes to the workpiece.
### Rationale

HFZWood documents real woodworking projects rather than abstract calculations.

A significant physical change creates a fundamentally different object, making it inappropriate to continue using the same Project.

This rule preserves traceability, project integrity, and historical consistency.

### Alternatives considered

- Allow one Project to evolve into multiple physical configurations. (rejected)
- Allow replacement of the immutable primary image while preserving the same Project identity. (rejected)
- Automatically overwrite the existing Project identity. (rejected)

### Status

Approved.

---

## PA-005 — Project Tools Own the Workflow

### Decision

Project Tools owns and enforces the complete HFZWood project workflow.

It provides the structured, sequential environment through which Projects are created, progressively enriched, reviewed, validated, and completed.

Users may return to previously completed steps to refine Project information, but the approved HFZWood methodology remains authoritative and cannot be redefined or bypassed.

### Rationale

The workflow itself is one of HFZWood's primary product assets.

It captures validated professional woodworking knowledge and transforms it into a structured process that helps users produce accurate, consistent, and repeatable results.

Project Tools are therefore responsible not only for providing functionality, but also for guiding users through the correct sequence of work.

### Alternatives considered

- Expose all tools independently and let users choose their own workflow. (rejected)
- Treat the workflow as optional guidance rather than part of the product. (rejected)
- Separate workflow management from Project Tools. (rejected)

### Status

Approved.

---

## PA-006 — The Workflow Is Mandatory

### Decision

The HFZWood workflow is mandatory.

Users are guided through the approved sequence of project creation and enrichment. The workflow may assist, validate, and restrict user actions whenever necessary to preserve project consistency and estimation accuracy.

### Rationale

The workflow represents validated professional knowledge accumulated through real woodworking practice.

Allowing arbitrary or inconsistent workflows would reduce estimation reliability, increase user mistakes, and weaken one of HFZWood's primary product values.

Consistency is considered more valuable than unrestricted flexibility.

### Alternatives considered

- Allow users to freely skip workflow steps. (rejected)
- Provide multiple parallel workflows for the same task. (rejected)
- Treat the workflow only as a recommendation. (rejected)

### Status

Approved.

---

# Learning, Workspace & Storage Decisions

## PA-007 — Learning Is Independent of Projects

### Decision

The Learning module is an independent product module composed of the Manual, Tutorials, Glossary, and Knowledge Base.

Learning supports users in understanding and applying the HFZWood methodology, but it never creates, modifies, or owns Project data.
Learning requires user authentication, but it does not require an active Project.

### Rationale

Educational content and project data serve different purposes.

Keeping Learning independent preserves a clear separation between acquiring knowledge and creating Projects, while allowing both areas of the product to evolve independently.

This architecture also makes Learning reusable across all present and future Project Tools.

### Alternatives considered

- Embed learning content directly into Projects. (rejected)
- Make Learning part of Project Tools. (rejected)
- Allow Learning modules to modify Project data. (rejected)

### Status

Approved.

---

## PA-008 — Local Workspace and Cloud Workspace Represent the Same Project

### Decision

Local Workspace and Cloud Workspace represent the same Project in different storage locations.

They do not create separate project types, separate workflows, or separate ownership models.

The Project remains a single logical entity regardless of where it is stored.

### Rationale

HFZWood is intentionally designed as a Local-First application.

Cloud storage extends the user's ability to protect, restore, and continue working on Projects, but it does not redefine what a Project is.

Treating Local and Cloud as representations of the same Project preserves conceptual simplicity, avoids duplicated product models, and ensures a consistent user experience.

### Alternatives considered

- Treat Local Projects and Cloud Projects as different product entities. (rejected)
- Make Cloud Projects the primary representation of a Project. (rejected)
- Maintain independent Local and Cloud workflows. (rejected)

### Status

Approved.

---

## PA-009 — Conflicts Are Never Resolved Silently

### Decision

HFZWood never resolves Project conflicts silently.

Safe synchronization may occur automatically when no conflict exists.

If divergent Project versions exist and user data may be overwritten or lost, automatic synchronization stops. The user must be informed that different versions exist and must remain explicitly in control of the resolution.

### Rationale

Projects represent valuable user work.

Automatic conflict resolution inevitably makes assumptions about user intent and may silently discard information.

HFZWood prioritizes user control, transparency, and data integrity over automation.

### Alternatives considered

- Automatically keep the newest version. (rejected)
- Automatically merge Project data. (rejected)
- Automatically replace one Project representation with another. (rejected)

### Status

Approved.

---

## PA-010 — Protect the Last Remaining Copy

### Decision

HFZWood must always protect the user's last remaining Project copy.

No operation may permanently remove the final existing representation of a Project without the user's explicit confirmation.

This protection applies regardless of whether the remaining copy is stored locally or in the cloud.

### Rationale

The Project is the user's primary asset.

Protecting the final remaining copy significantly reduces the risk of irreversible data loss while reinforcing the Local-First philosophy and user ownership.

### Alternatives considered

- Allow unrestricted deletion of the final Project copy. (rejected)
- Protect only cloud copies. (rejected)
- Protect only local copies. (rejected)

### Status

Approved.

---

# Identity, Subscription & Settings Decisions

## PA-011 — Free Is a Subscription State

### Decision

HFZWood recognizes every authenticated user as belonging to a subscription tier.

The Free edition is a valid subscription state rather than the absence of a subscription.

All product capabilities are determined by the active subscription tier.

### Rationale

Treating Free as a normal subscription state creates a single, consistent capability model for the entire product.

Every user follows the same architectural path, while subscription tiers simply expose different capabilities and limits.

This greatly simplifies future product evolution and commercial expansion.

### Alternatives considered

- Treat Free users as a separate product. (rejected)
- Maintain separate Free and Premium application variants. (rejected)
- Determine functionality through independent feature flags. (rejected)

### Status

Approved.

---

## PA-012 — Identity, Subscription and Settings Are Independent Modules

### Decision

Identity, Subscription, and Settings are independent product modules with distinct responsibilities.

Identity establishes who the user is.

Subscription determines which product capabilities are available.

Settings personalize how the product is experienced without changing its functionality or permissions.

### Rationale

Separating these responsibilities creates a clear and maintainable architecture.

Changes to authentication never affect subscriptions.

Subscription changes never modify user preferences.

Settings personalize the user experience without influencing identity or access rights.

This separation reduces coupling and allows each module to evolve independently.

### Alternatives considered

- Combine Identity and Subscription into a single module. (rejected)
- Store user preferences inside the Subscription model. (rejected)
- Let Settings determine product capabilities. (rejected)

### Status

Approved.

---
## PA-016 — Projects Require Authenticated Ownership

### Decision

HFZWood does not support anonymous Project ownership.

Every Project belongs to an authenticated user.

Authentication is required before entering the Project creation workflow, and no Project may be created or owned anonymously.

### Rationale

Projects represent persistent user work and may exist across local and cloud storage locations.

Requiring authenticated ownership provides a consistent identity foundation for Project lifecycle management, storage, synchronization, recovery, subscription capabilities, and future cross-device continuity.

This rule also prevents HFZWood from maintaining two incompatible ownership models: authenticated Projects and anonymous Projects.

### Alternatives considered

- Allow anonymous users to create and own Projects. (rejected)
- Allow anonymous Projects to be converted into authenticated Projects later. (rejected)
- Maintain separate ownership models for guest and authenticated users. (rejected)

### Status

Approved.
# Cross-Cutting & Deferred Product Decisions

## PA-013 — AI Is an Assistant, Not a Product Module

### Decision

Artificial Intelligence may operate within and alongside the Project Tools experience as an assistant, but it does not own the Project Tools workflow and does not replace user responsibility.

AI may assist users by providing recommendations, explanations, validations, suggestions, preliminary results, or productivity improvements while remaining subordinate to the approved HFZWood methodology.

### Rationale

The value of HFZWood lies in its validated professional methodology.

AI should enhance that methodology rather than redefine it.

Keeping AI outside the core product workflow preserves user understanding, professional accountability, and long-term product stability while allowing AI capabilities to evolve independently.

### Alternatives considered

- Make AI responsible for the project workflow. (rejected)
- Allow AI to automatically modify Project data. (rejected)
- Position AI as the central product experience. (rejected)

### Status

Approved.

---

## PA-014 — Export and Search Are Cross-Cutting Features

### Decision

Export and Search are cross-cutting product capabilities rather than independent product modules.

They operate across multiple modules without owning Projects, Learning content, Identity, Subscription, or any other core product entity.

### Rationale

Export and Search provide services that span the entire application.

Treating them as independent modules would blur module responsibilities and introduce unnecessary architectural complexity.

Keeping them as cross-cutting capabilities preserves clear module boundaries while allowing these services to evolve independently.

### Alternatives considered

- Implement Export as a standalone product module. (rejected)
- Implement Search as a standalone product module. (rejected)
- Duplicate Export and Search functionality inside individual modules. (rejected)

### Status

Approved.

---

## PA-015 — Advanced Account Protection Is Deferred

### Decision

Advanced account security features are intentionally deferred to a future commercial platform stage.

These include, but are not limited to:

- Trusted Devices;
- account-sharing detection;
- license-abuse prevention;
- advanced session management;
- additional commercial security mechanisms.

### Rationale

These capabilities support commercial operation rather than defining the core product architecture.

Introducing them during Product Architecture would unnecessarily increase complexity before the product itself has been fully designed and implemented.

Deferring these features preserves architectural clarity while leaving sufficient room for future commercial expansion.

### Alternatives considered

- Introduce advanced account protection during Product Architecture. (rejected)
- Design the commercial security platform before the core product architecture. (rejected)
- Couple account security directly to Identity or Subscription. (rejected)

### Status

Approved.