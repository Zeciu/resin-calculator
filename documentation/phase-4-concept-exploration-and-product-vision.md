# Phase 4 — Concept Exploration and Product Vision

## Purpose

This document exists to define the product vision and explore the core concepts that will shape Phase 4 of the HFZWood platform.

Unlike the implementation plan or the technical architecture, this document does not define how the system will be built.

Instead, it defines what the product should become and establishes the product decisions that will guide all subsequent architectural and implementation work.

The purpose of this exploration is to answer the fundamental questions surrounding HFZWood's evolution from a local-first desktop-style application into a cloud-enabled platform, while preserving the product philosophy established during the previous phases.

Every decision documented here should be evaluated from the perspective of the end user, product consistency and long-term maintainability before any technical implementation is considered.
## What is Phase 4?

Phase 4 represents the transition from a locally managed application into a cloud-enabled product platform.

The objective is not to replace the existing local-first philosophy, but to extend it with cloud capabilities that improve convenience, reliability and accessibility without reducing the user's ownership of their work.

By the end of Phase 4, HFZWood should support real user accounts, optional cloud project storage, synchronization across devices and a private online project library while preserving the existing desktop-style workflow established in previous phases.

Cloud functionality should enhance the product rather than redefine it.

Users who prefer to work exclusively with local project files should continue to enjoy a complete and fully functional experience.
## Core Product Philosophy

HFZWood remains, first and foremost, a local-first application.

The user's project files remain under the user's ownership and control at all times.

Cloud functionality is introduced as an extension of the existing product rather than as a replacement for the established workflow.

The cloud should provide additional value through backup, synchronization, accessibility and convenience, while preserving the ability to work entirely with local project files.

Users should never be forced to depend on cloud services in order to create, edit or maintain their projects.

Whenever a product decision involves a trade-off between local independence and cloud convenience, local independence should take priority unless a compelling product reason justifies a different approach.

This philosophy shall guide all architectural and implementation decisions throughout Phase 4.
## Local-first Philosophy

HFZWood is designed around the principle that users own their work.

The `.hfzproject` file remains the primary representation of a project and continues to provide a complete, portable and independent project format.

Users must always be able to:

- create new projects locally;
- save projects locally;
- open local projects;
- edit local projects;
- archive local projects;
- share local project files manually if they choose.

The application must remain fully functional for its core purpose even when cloud services are unavailable.

Cloud services enhance the user experience but do not replace the fundamental ability to work with local project files.

This philosophy reflects the realities of woodworking environments, where reliable internet connectivity cannot always be assumed.
## Cloud Philosophy

HFZWood introduces cloud functionality as an extension of the existing product rather than as a replacement for the established local-first workflow.

The purpose of the cloud platform is to provide:

- secure project backup;
- project recovery;
- continuity of work across multiple devices;
- convenient access to personal projects.

Cloud services are not intended to become the primary working environment.

Users should never depend on cloud connectivity to perform the core functions of the application.

The cloud exists to enhance reliability and convenience while preserving the independence of local project files.

---

## Project Ownership

All projects created with HFZWood remain the property of the user.

Saving a project to the cloud does not transfer ownership to HFZWood.

The `.hfzproject` file remains the primary representation of a project and continues to serve as the authoritative local working copy.

Cloud storage contains only backup copies that the user has explicitly chosen to create.

HFZWood never assumes ownership or editorial control over user projects.

---

## Local Editing Principle

Cloud projects are never edited directly.

Whenever a cloud project is opened, HFZWood automatically creates or updates a local working copy and opens that local copy for editing.

All project modifications are performed on the local project file.

The cloud copy remains unchanged until the user explicitly chooses to update it.

This approach preserves the local-first philosophy, reduces synchronization complexity, protects users from accidental data loss and allows uninterrupted work even when internet connectivity becomes unavailable.

---

## Cloud Backup Strategy

HFZWood never uploads projects to the cloud automatically.

After the first local save, users are invited to create a cloud backup.

Creating a cloud backup is always an explicit user decision.

If the user declines, the project remains entirely local without any loss of functionality.

At any later time, users may manually create a cloud backup using the **Save to Cloud** command.

Cloud backups are optional and should never become mandatory for using the application.

---

## Cloud Update Strategy

When a project already exists both locally and in the cloud, HFZWood never updates the cloud copy automatically.

Whenever the application or project is being closed, and unsynchronized local changes exist, the user is informed that the cloud backup is no longer current.

The user may then choose to:

- Update Cloud
- Close Without Updating
- Cancel

Updating the cloud always requires explicit user confirmation.

The application must never modify cloud content without the user's knowledge.

---

## Synchronization Philosophy

HFZWood does not perform automatic background synchronization.

Instead, the application detects differences between local and cloud copies and clearly informs the user whenever synchronization decisions are required.

Synchronization is therefore a conscious action initiated by the user rather than an invisible background process.

Whenever a decision may result in data loss or overwriting existing work, HFZWood presents the available options and allows the user to make the final decision.

---

## Conflict Resolution

If both the local copy and the cloud copy of the same project have been modified independently, HFZWood detects the conflict but never attempts to merge the projects automatically.

The application presents both versions to the user together with their modification details and allows the user to decide which version should become the current project.

Selecting one version does not automatically overwrite the other.

If the local version is selected, updating the cloud still requires an additional explicit confirmation.

Automatic conflict resolution is intentionally avoided because woodworking projects contain complex graphical information that cannot be merged safely.
## Project Organization

HFZWood maintains a clear separation between local projects and cloud projects.

The Projects module is divided into two independent sections:

- Local Projects
- Cloud Projects

The same logical project may appear in both sections because the local copy and the cloud copy are treated as separate instances with independent states.

Each project clearly communicates its current status, such as:

- Cloud backup is up to date
- Cloud backup is outdated
- Local only
- Cloud only
- Synced with local copy

Users should never have to guess where a project is stored or which version they are currently managing.

---

## New Devices

Signing in on a new computer does not automatically download cloud projects.

After authentication, users are presented with their Cloud Library and may choose which projects they wish to open.

When a cloud project is opened, HFZWood automatically creates a local working copy on the current device and continues working from that local copy.

From that moment forward, all editing is performed locally.

---

## Trusted Devices (Needs Further Exploration)

HFZWood recognizes that users may access their account from different types of computers.

Examples include:

- personal computers used regularly;
- temporary computers belonging to friends, customers or other workshops.

The product should eventually distinguish between trusted personal devices and temporary devices.

This distinction may influence:

- remembered login sessions;
- handling of local project copies;
- logout behavior;
- security policies;
- protection against account sharing and license abuse.

Because this topic affects both product usability and the commercial licensing model, the final design decision is intentionally postponed for further exploration.

---

## Cloud Storage Limits

HFZWood never limits the number of projects users may create locally.

Only cloud services are subject to product limitations.

The Free plan allows users to store a limited number of cloud projects.

Subscriber plans provide additional cloud storage capacity based on a predefined storage quota.

The exact storage allocation will be determined during the Business Platform phase after evaluating real project sizes and infrastructure costs.

The application should always communicate cloud usage clearly and allow users to manage their available storage without affecting local projects.

---

## Subscription Expiration Policy

When a subscription expires, cloud projects are not removed immediately.

Users receive a grace period of sixty days during which they may:

- renew their subscription;
- download their cloud projects;
- reorganize their cloud storage.

During this period, new cloud backups and cloud updates are unavailable.

If the subscription is not renewed before the grace period expires, users return to the Free plan limitations.

When the amount of cloud content exceeds those limits, HFZWood does not automatically decide which projects remain.

Instead, users are asked to choose which projects they wish to keep within their available cloud storage.

All remaining cloud copies are permanently removed only after explicit user confirmation.

Local project files are never affected by subscription changes.
## Project Recovery

HFZWood is designed to ensure that users can recover their work even after losing or replacing a computer.

After signing in on a new device, the application informs users that cloud projects associated with their account are available in the Cloud Library.

Projects are not downloaded automatically.

Users choose which projects they wish to restore, and each selected project becomes a new local working copy on the current device.

The cloud serves as a recovery and continuity platform rather than as the primary working environment.

---

## Project Sharing

Phase 4 does not introduce collaborative project editing or editable project sharing.

Cloud projects remain private and accessible only to their owner.

The only supported sharing mechanism is PDF export.

PDF documents allow users to share calculation results and project information without exposing editable project data or compromising the commercial licensing model.

HFZWood deliberately separates project continuity from project collaboration.

---

## Privacy and Administrative Access

User privacy is considered a fundamental product principle.

HFZWood administrators do not have implicit access to user projects stored in the cloud.

Administrative access may occur only when explicitly initiated and authorized by the user for support purposes.

Any temporary support access should be limited to the specific support request and should not become permanent.

Users should always know when a project has been shared with support personnel.

---

## User Identity

Each HFZWood account is identified internally by a permanent User ID.

The email address serves only as a login credential and communication channel.

Changing an email address must never affect project ownership, cloud storage, project history or any other user data.

The permanent internal User ID remains the authoritative identifier throughout the lifetime of the account.

---

## What Phase 4 Is Not

Phase 4 intentionally does not introduce:

- real-time collaboration;
- editable project sharing;
- marketplace functionality;
- AI-assisted project editing;
- automatic synchronization;
- automatic conflict resolution;
- cloud-only workflows;
- mandatory cloud usage;
- replacement of the existing local-first philosophy.

The purpose of Phase 4 is to extend HFZWood with reliable cloud capabilities while preserving the simplicity, predictability and independence established during the previous phases.

---

## Fundamental Product Principles

The following principles summarize the product philosophy established during the Concept Exploration phase:

- HFZWood remains a Local-First application.
- Cloud functionality extends the product but never replaces local workflows.
- Users always own their projects.
- The local project file is always the primary working copy.
- Cloud projects are never edited directly.
- Cloud services provide continuity rather than collaboration.
- Automatic synchronization is intentionally avoided.
- Automatic conflict resolution is intentionally avoided.
- Users always make the final decision whenever data may be overwritten or lost.
- HFZWood informs users before every potentially destructive operation.
- The application protects the user's last remaining copy of a project regardless of where it is stored.
- Local storage is never limited by HFZWood.
- Only cloud services are subject to commercial limitations.
- User privacy is respected by design.
- Administrative access requires explicit user authorization.
- User identity is permanent and independent of email addresses.
- Simplicity, predictability and user control take priority over automation.

---

## Conclusion

Phase 4 establishes the conceptual foundation for transforming HFZWood into a cloud-enabled platform without compromising the product philosophy developed throughout the previous phases.

Rather than redefining the application, Phase 4 strengthens it by introducing secure cloud services that complement the existing local-first workflow.

Every architectural and implementation decision made during the remainder of Phase 4 should be evaluated against the principles defined in this document.

If a future implementation conflicts with these principles, the implementation should be reconsidered before the philosophy is changed.