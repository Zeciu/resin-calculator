# 1. Purpose

This document defines the official Product Architecture of the HFZWood cloud platform.

Its purpose is to translate the principles established during Concept Exploration into concrete product structure, responsibilities, user workflows, and functional behavior without describing technical implementation.

While the Concept Exploration document explains why the product is designed the way it is and establishes its guiding philosophy, this document defines what the product is expected to do, how its functional components interact, and how users experience those interactions.

This document serves as the authoritative product specification for all functional behavior that is not already defined by the approved product philosophy. It establishes the product boundaries, module responsibilities, user workflows, lifecycle rules, and interaction models that will guide all subsequent implementation.

Technical Architecture is intentionally outside the scope of this document. Decisions regarding infrastructure, cloud services, databases, APIs, synchronization mechanisms, security implementation, file formats, and other engineering details are defined separately within the Technical Architecture documentation.

Together, these documents form a clear architectural progression:

* **Concept Exploration** defines the product philosophy and guiding principles.
* **Product Architecture** defines the official functional behavior of the product.
* **Technical Architecture** defines how the approved product behavior is implemented.
# 2. Product Principles

The principles established during Concept Exploration are the foundation of the HFZWood product architecture and apply to every functional module defined in this document.

This document does not redefine or replace those principles. Instead, it translates them into a coherent product structure, user workflows, module responsibilities, and product behavior.

The current Product Architecture is intentionally designed around the approved Local-First philosophy. All functional behavior, workflows, and product modules must remain consistent with this architectural model unless the product vision itself is formally revised during a future architectural phase.

HFZWood is designed to evolve over time. Whenever possible, new architectural decisions should preserve reasonable opportunities for future product evolution without increasing the complexity of the current product or compromising its approved principles. Future extensibility should never become a justification for introducing unnecessary complexity into the present product.

As a result, every product decision should satisfy three conditions:

* It must remain consistent with the approved product philosophy.
* It must improve or preserve the simplicity and predictability of the current user experience.
* It should avoid unnecessarily limiting future product evolution when this can be achieved without affecting the current architecture.
# 3. Core Product Entity

The Project is the central entity of the HFZWood product architecture.

Every functional module within the product exists to create, modify, enrich, protect, store, export, or manage projects throughout their lifecycle.

While the Resin Calculator is the primary value-generating tool of the current product, it is not the architectural center of the platform. Instead, it is the first member of a growing family of project tools that contribute information to a single project.

This project-centric architecture allows additional tools and capabilities to be introduced over time without changing the fundamental organization of the product. Regardless of how many calculators or specialized tools are added in future versions, they all operate on the same project rather than creating independent workflows or isolated data.

Supporting modules such as Cloud Storage, Learning Resources, Identity, Subscription, Export, and Settings exist to support the project lifecycle. None of these modules represent the primary purpose of the product; their role is to enhance, protect, or extend the user's ability to create and manage projects.

As a result, every major architectural decision should be evaluated by asking a single question:

**Does this improve the user's ability to create, manage, protect, or complete a project while remaining consistent with the approved product principles?**
# 4. Product Modules Overview

HFZWood is organized into a small set of clearly defined product modules. Each module has a specific responsibility within the product and contributes to the overall project lifecycle without duplicating the responsibilities of other modules.

The product architecture is intentionally project-centric. Every module either creates, enriches, manages, protects, or extends the user's ability to successfully complete a project.

## Project

The Project is the central product entity. It represents a complete woodworking or resin work, or a distinct element of a larger work, and serves as the foundation for all product workflows.

## Project Tools

Project Tools provide the functionality required to create, calculate, modify, and enrich projects. The Resin Calculator is the first project tool, while future tools such as cost estimation or additional planning utilities will contribute to the same project rather than creating independent workflows.

## Learning

The Learning module provides the knowledge required to use the product confidently and correctly. It consists of the Manual, Tutorials, Glossary, and Knowledge Base, which together form a unified learning ecosystem supporting users before and during project creation.

## Local Workspace

The Local Workspace manages the user's locally stored Projects by providing organization, access, search, and lifecycle management for local Project representations. Project creation and Project editing belong to the Project Tools Module.


## Cloud Workspace

The Cloud Workspace extends the Local Workspace by providing cloud storage, backup, recovery, and continuity. It complements local work but never replaces it, and always operates according to the product principles established during Concept Exploration.

## Identity

The Identity module manages user identity and account ownership. It provides a consistent user identity across devices and subscriptions while remaining separate from project ownership and project content.

## Subscription

The Subscription module manages access to product capabilities according to the user's subscription plan. It determines which features and cloud resources are available without affecting ownership of existing projects.

## Settings

The Settings module manages user preferences and application configuration. It allows users to personalize their experience without changing project data or product behavior.

## Cross-Cutting Features

Some product capabilities operate across multiple modules rather than belonging to a single one. These capabilities support the overall user experience while remaining independent of the core product modules.

Examples include:

* Export
* Search
* Future shared platform capabilities
Search is a shared cross-cutting product capability that may be consumed by individual modules according to their own scope and content.

A module may expose search functionality over the information it manages without owning a separate Search architecture or redefining Search as an independent module responsibility.

# 5. Product Module Design Principles

Each product module in HFZWood exists because it provides a distinct and necessary responsibility within the product architecture.

A module should not be defined only because it corresponds to a screen, feature, technical component, or future implementation concern. It should be defined only when the product cannot fulfill its purpose without that responsibility being clearly represented.

Every module must have one primary responsibility. A module may support several workflows, but it should not own unrelated product behavior or duplicate the responsibilities of another module.

Modules should remain clearly separated from one another. The Project module defines the central product entity, Project Tools create and enrich projects, Learning builds user knowledge, Workspaces manage project environments, Identity manages user identity, Subscription manages access to capabilities, and Settings manages preferences.

Cross-cutting features are not product modules. They operate across modules without owning the core product entities themselves.

Whenever a new feature is introduced, it should be evaluated by asking:

**Does this feature belong inside an existing module, require a new module, or operate as a cross-cutting feature?**

This rule prevents the product architecture from becoming a collection of loosely related features and preserves HFZWood as a coherent, project-centric product.
## Project Module

### Purpose

The Project Module defines the central entity of the HFZWood product. Every meaningful activity performed by the user ultimately contributes to creating, enriching, or completing a Project.

A Project represents a single, well-defined woodworking configuration documented through one primary image and the information required to estimate resin usage and, in future product versions, project costs.

HFZWood is intentionally project-centric. Projects are the product's primary asset, while all other functional modules either support project creation, enrich project data, or provide services around projects.

A Project is considered to exist only after both of the following conditions have been met:

* a primary image has been provided;
* at least one reference measurement has been defined.

Before these conditions are satisfied, the user is only in the project creation workflow. No Project is created, no draft exists, and leaving the workflow produces no persistent artifact.

### Responsibilities

The Project Module is responsible for defining what constitutes a Project and what information belongs to it.

Every Project contains exactly one immutable primary image, which defines the identity of the Project. Once a Project has been created, its primary image can never be replaced. If a different image is required, a new Project must be created.

A Project contains:

* one primary image;
* reference measurements;
* project geometry;
* calculation results;
* documentation and notes;
* project materials;
* future project cost information.

Projects may evolve incrementally over time. Users may begin with only the primary image and reference measurements, then continue adding geometry, calculations, materials, notes, and future cost information whenever additional information becomes available.

A completed calculation is not required for a valid Project. A Project becomes a valid product entity as soon as its creation conditions have been satisfied.

Every Project represents one specific physical configuration of a woodworking piece. If the underlying workpiece changes in a way that alters its physical configuration, a new Project must be created. The immutable primary image provides the operative boundary between refining an existing Project and creating a new one.

As long as the same primary image remains valid for the documented physical configuration, changes to reference measurements, geometry, calculations, materials, notes, or other Project information are treated as refinements of the same Project.

If the physical configuration changes in a way that requires a new primary image, a new Project must be created. HFZWood does not attempt to automatically detect physical changes to the workpiece.

Project names are optional. If the user does not provide a name, HFZWood assigns a default generated name. The project name is a convenience for identification and organization, not part of the Project's identity.

### Out of Scope

The Project Module does not manage:

* project lists;
* project storage locations;
* local or cloud synchronization;
* authentication or user identity;
* subscription information;
* learning content;
* application settings;
* cloud storage policies;
* export functionality.

The Project Module defines Projects but does not define where Projects are stored or how they are accessed.

### Relationships with Other Modules

The Project Module is the central module of the HFZWood product architecture.

Project Tools operate on Projects by creating and enriching project data.

Local Workspace manages Projects stored on the user's device.

Cloud Workspace manages Projects stored in cloud environments.

Identity associates Projects with user accounts without becoming part of the Project itself.

Subscription determines which project capabilities are available to a user but does not modify the Project definition.

Learning modules (Manual, Tutorials, Glossary, and Knowledge Base) support users in working with Projects but never become part of a Project.

Cross-cutting features such as Export operate on Projects without owning or redefining the Project entity.
## Project Tools Module

### Purpose

The Project Tools Module provides the complete working environment through which Projects are created, progressively enriched, and completed.

Unlike the Project Module, which defines what a Project is, the Project Tools Module defines how a Project is built.

Project Tools embodies the HFZWood methodology by transforming professional woodworking knowledge into a structured, guided workflow. Rather than exposing a collection of unrelated functions, the module provides a disciplined process that helps users achieve accurate, consistent, and repeatable project results.

The workflow itself is part of the product's value and represents validated professional knowledge accumulated through practical experience.

### Responsibilities

The Project Tools Module is responsible for providing every tool required to progressively construct a Project.

It owns and enforces the complete project workflow, ensuring that every Project is created following the methodology defined by HFZWood.

The module guides users through the complete project lifecycle, including:

* preparing the project;
* defining reference measurements;
* constructing project geometry;
* progressively enriching project information;
* producing calculation results;
* supporting future project cost estimation.

The workflow is intentionally sequential. Users are guided through each step in the recommended order because the workflow has been designed and validated to maximize estimation accuracy and reduce user mistakes.

Although users may return to previously completed steps to refine project information, the overall methodology remains fixed and cannot be redefined or bypassed.

The module may provide contextual guidance, validation messages, warnings, and short recommendations that help users correctly complete the current step without interrupting their work.

These contextual aids support the workflow but do not replace the educational content provided by the Learning ecosystem.

Project Tools always remains the authoritative environment where users create, review, validate, and refine project data.

### Out of Scope

The Project Tools Module does not define:

* what constitutes a Project;
* where Projects are stored;
* project synchronization;
* user identity;
* subscription management;
* application settings;
* learning content;
* tutorials;
* glossary entries;
* knowledge base articles;
* cloud storage policies.

The module also does not replace future Artificial Intelligence capabilities.

AI may assist users by generating suggestions or preliminary results, but Project Tools remains the environment where every Project is reviewed, refined, validated, and finalized by the user.

### Relationships with Other Modules

The Project Tools Module operates directly on the Project Module by creating and enriching Project data throughout the project lifecycle.

Local Workspace provides access to locally stored Projects that are opened and modified through Project Tools.

Cloud Workspace provides access to cloud-based Projects that are edited using the same workflow and methodology.

The Learning ecosystem supports Project Tools by explaining the methodology, best practices, and reasoning behind the workflow, while Project Tools focuses exclusively on guiding users through its practical execution.

Identity associates project work with the authenticated user without affecting the workflow itself.

Subscription determines which Project Tool capabilities are available to individual users without changing the methodology or workflow.

Future AI capabilities may assist Project Tools by proposing or accelerating specific tasks, but AI never replaces the workflow or the user's responsibility for validating the final Project.
## Local Workspace Module

### Purpose

The Local Workspace Module is responsible for managing Projects stored on the user's local device.

It provides the environment where users organize, access, and manage their locally available Projects while maintaining a clear separation between project management and project definition.

The Local Workspace Module does not define what a Project is or how a Project is created. Its responsibility is to make locally stored Projects accessible and manageable throughout their lifecycle.

### Responsibilities

The Local Workspace Module is responsible for managing the user's local project collection.

Its responsibilities include:

* providing access to locally stored Projects;
* organizing the local project collection;
* displaying available Projects;
* searching Projects;
* optionally sorting and filtering Projects;
* renaming Projects;
* deleting local Project copies;
* coordinating synchronization with Cloud Workspace.

The Local Workspace Module treats locally stored Projects and cloud-stored Projects as representations of the same Project rather than different entities.

Whenever differences exist between the local and cloud versions of a Project, the module informs the user that synchronization is recommended in order to keep both representations consistent.

Deleting a Project from Local Workspace removes only the local copy of that Project.

If the local Project represents the user's last remaining copy, the module informs the user before deletion so that the user clearly understands the consequences of the action.
When local and cloud versions of the same Project differ, HFZWood must never resolve the conflict silently. The user must be informed that different versions exist and must remain in control of the synchronization decision.
HFZWood uses a hybrid synchronization model.

Safe synchronization may occur automatically when connectivity is available and no conflict exists.

When offline, users continue working locally and synchronization is deferred until connectivity returns.

When connectivity returns, synchronization may proceed automatically if no conflict exists.

If divergent Project versions exist and user data may be overwritten or lost, automatic synchronization stops and the user remains explicitly in control of the resolution.

### Out of Scope

The Local Workspace Module does not:

* define what constitutes a Project;
* create the Project methodology or workflow;
* modify the Product Architecture of Projects;
* perform project calculations;
* provide educational content;
* manage user identity;
* manage subscriptions;
* manage application settings.

The module is responsible for managing Project availability, not Project content.

### Relationships with Other Modules

The Local Workspace Module manages Projects defined by the Project Module.

Projects are created, edited, and enriched through the Project Tools Module while remaining accessible through Local Workspace.

Cloud Workspace represents the complementary storage environment for the same Projects. Together, Local Workspace and Cloud Workspace provide different locations for the same project entities while maintaining user awareness of synchronization status.

Identity determines ownership of locally managed Projects without affecting Local Workspace responsibilities.

Subscription may determine which Local Workspace capabilities are available to a user but does not change the module's core responsibilities.

Learning modules remain independent of Local Workspace and provide educational support without becoming part of project management.
## Cloud Workspace Module

### Purpose

The Cloud Workspace Module is responsible for managing Projects stored in the user's cloud environment.

Its primary purpose is to provide backup, continuity, and availability for Projects beyond the user's local device.

Cloud Workspace is optional. HFZWood remains fully functional without it, and users may choose to work entirely through Local Workspace.

Cloud Workspace does not redefine Projects. A cloud-stored Project and a locally stored Project represent the same Project in different locations.

### Responsibilities

The Cloud Workspace Module is responsible for managing the user's cloud project collection.

Its responsibilities include:

* providing access to cloud-stored Projects;
* displaying available cloud Projects;
* searching Projects;
* optionally sorting and filtering Projects;
* renaming Projects;
* deleting cloud Project copies;
 If a cloud Project represents the user's last remaining copy of a Project, the module informs the user before deletion so that the user clearly understands the consequences of the action.
* restoring Projects to a local device;
* synchronizing Projects between cloud and local environments;
* informing users when synchronization is recommended or when a newer version exists.

Cloud Workspace supports project continuity by allowing users to access and restore their Projects when needed, provided they choose to use cloud storage.

Cloud Workspace may inform users when differences exist between local and cloud versions of the same Project, but it does not change the definition or identity of the Project.

### Out of Scope

The Cloud Workspace Module does not:

* define what constitutes a Project;
* create or modify the project workflow;
* perform project calculations;
* provide educational content;
* manage user identity;
* determine who is allowed to access an account;
* manage subscriptions;
* manage application settings.

The module is responsible for cloud availability and backup of Projects, not for identity, access policy, or product methodology.

### Relationships with Other Modules

The Cloud Workspace Module manages cloud-stored representations of Projects defined by the Project Module.

Project Tools creates, edits, and enriches Projects, while Cloud Workspace provides cloud availability and backup for those Projects.

Local Workspace is the complementary local environment for the same Project entities. Together, Local Workspace and Cloud Workspace allow users to manage the same Projects across local and cloud locations.

Synchronization is a shared responsibility between Local Workspace and Cloud Workspace. Local Workspace coordinates synchronization from the user's working environment, while Cloud Workspace maintains the cloud representation of the same Project.

Identity determines account ownership and access rules, but those responsibilities remain outside Cloud Workspace.

Subscription may determine whether Cloud Workspace capabilities are available to a user, without changing the module's purpose or the definition of a Project.

Learning modules remain independent and provide educational support without becoming part of cloud project management.
## Learning Module

### Purpose

The Learning Module is responsible for providing the knowledge required to successfully design, build, and complete woodworking and epoxy resin projects.

Its primary purpose is not to teach users how to operate the application, but to transfer the professional knowledge, methodology, and best practices required to achieve high-quality real-world results.

HFZWood is built around the woodworking and epoxy resin domain. The application is one of the tools through which this knowledge is applied, rather than the primary subject of learning.

Learning exists independently of Project creation. Users may access Learning solely for educational purposes without creating or managing Projects. Access to the Learning Module requires user authentication. Users may use Learning without creating Projects, but Learning remains part of the authenticated HFZWood ecosystem regardless of the selected subscription plan.

### Responsibilities

The Learning Module provides the complete educational ecosystem of HFZWood.

It consists of four independent but complementary learning components:

* Manual
* Tutorials
* Glossary
* Knowledge Base

Each component serves a different learning style and user preference while contributing to the same educational objective.

The Manual provides structured and comprehensive knowledge.

Tutorials provide guided, practical learning experiences.

The Glossary provides precise definitions of terminology used throughout the woodworking, epoxy resin, and HFZWood ecosystem.

The Knowledge Base provides quick access to practical questions, solutions, recommendations, and frequently encountered situations.

Learning content explains the professional methodology behind the product, including the reasoning, best practices, and principles that support the workflow implemented by Project Tools.

Future premium educational content, including advanced courses, remains part of the Learning Module. Access to such content is determined by the Subscription Module rather than by Learning itself.

### Out of Scope

The Learning Module does not:

* define Projects;
* modify Project data;
* perform calculations;
* execute project workflows;
* manage project storage;
* manage synchronization;
* manage user identity;
* manage subscriptions;
* manage application settings.

Learning remains a read-only educational environment. It provides knowledge but never changes Projects or participates in Project creation.

### Relationships with Other Modules

The Learning Module complements the Project Tools Module by explaining the methodology, reasoning, and best practices behind the workflow implemented within the application.

Manuals and Tutorials may reference Project Tools, guiding users through practical workflows while remaining separate from the workflow execution itself.

The Learning Module supports users before, during, and after Project creation without becoming part of the Project lifecycle.

Project Module, Local Workspace, and Cloud Workspace remain independent of Learning, although Learning may reference them when explaining product concepts.

Identity associates educational progress with the authenticated user when appropriate, without affecting Learning content.

Subscription determines which Learning resources are available to each user while remaining independent of the educational content itself.
## Identity Module

### Purpose

The Identity Module is responsible for establishing and maintaining the identity of every HFZWood user throughout the product ecosystem.

Its purpose is to ensure that every user is known, authenticated, and consistently associated with their activity across HFZWood.

HFZWood does not support anonymous project ownership. Every Project belongs to an authenticated user, regardless of whether the user has free or paid access.

### Responsibilities

The Identity Module is responsible for user identity and authentication.

Initial user authentication is required before a Project can be created. Once authenticated, the product may continue to support approved offline workflows according to the product's Local-First philosophy.

Its responsibilities include:

* user registration;
* login;
* logout;
* password reset;
* email verification;
* authentication status;
* maintaining the association between users and their HFZWood activity.

Identity determines who the user is.

It does not determine what the user is allowed to access or which capabilities are available. Those responsibilities belong to the Subscription Module.

Identity may support user awareness of their associated product activity, such as the existence of Projects connected to the authenticated account, but it does not manage Project content, Project storage, or Project capabilities.

### Out of Scope

The Identity Module does not:

* define Projects;
* create or edit Projects;
* manage project storage;
* manage synchronization;
* determine subscription plans;
* control product capabilities;
* manage educational content;
* define Learning access rules;
* manage application preferences;
* define the project workflow.

User profile preferences, such as language, units, display preferences, or other personalization choices, belong to the Settings Module.
Trusted Devices, account-sharing protection, license abuse prevention, and advanced account security rules are recognized product concerns, but they are intentionally deferred to a future commercial platform stage. They are not defined by the Identity Module in this Product Architecture document.


### Relationships with Other Modules

The Identity Module associates users with Projects defined by the Project Module.

Local Workspace and Cloud Workspace rely on Identity to associate stored Projects with the authenticated user.

Subscription relies on Identity to determine which authenticated user a plan or entitlement belongs to.

Learning may be accessed by authenticated users, while access to specific Learning resources is governed by Subscription rather than Identity.

Settings stores user preferences associated with the authenticated user but remains separate from Identity.

Project Tools operates within the context of an authenticated user but does not redefine or manage Identity.
## Subscription Module

### Purpose

The Subscription Module is responsible for determining which product capabilities, limits, and content are available to each authenticated user based on their plan.

Subscription applies to all users, including users on the Free plan. Free access is not the absence of subscription; it is a subscription state with its own defined capabilities and limitations.

The module does not define product functionality. It controls access to capabilities provided by other modules.

### Responsibilities

The Subscription Module is responsible for managing product access rules.

It controls access to:

* Project Tools capabilities;
* Cloud Workspace capabilities;
* Learning content;
* future AI capabilities.

Subscription activates, limits, or disables capabilities without changing how those capabilities function.

For example, the same Project Tools methodology applies to all users, but different plans may allow different limits or advanced capabilities.

The module manages plans, entitlements, and access rights. Payment is treated as an external event that may change a user's subscription state, but payment processing itself is not part of the product definition of Subscription.

Subscription is designed to support future extensibility. New modules may declare capabilities, while Subscription determines which users are allowed to access them.
When a subscription change affects cloud storage limits or other entitlement-based restrictions, the Subscription Module defines the applicable product rules, while the corresponding operational workflow is executed by the affected module, such as Cloud Workspace.

### Out of Scope

The Subscription Module does not:

* define Projects;
* create or edit Projects;
* define the Project Tools workflow;
* change how Project Tools work;
* manage user identity;
* manage project storage;
* perform synchronization;
* create Learning content;
* manage application settings;
* process payments as a product capability.

Subscription determines access, not functionality.

### Relationships with Other Modules

Subscription relies on Identity to associate plans and entitlements with authenticated users.

Project Tools provides product capabilities that may be enabled, limited, or disabled by Subscription.

Cloud Workspace may be enabled or limited by Subscription without changing its purpose as a backup and continuity environment.

Learning provides educational content whose availability may be controlled by Subscription.

Future AI capabilities may be exposed through Subscription according to the user's plan.

Project Module remains independent of Subscription. Subscription never changes what a Project is.
## Settings Module

### Purpose

The Settings Module manages user preferences and personalization without changing the product itself.

Its purpose is to allow users to adapt their HFZWood experience to their personal context, working habits, and device environment while keeping the underlying product architecture unchanged.

### Responsibilities

The Settings Module is responsible for managing user preferences.

Its responsibilities include:

* user profile information;
* language preferences;
* measurement units;
* display preferences;
* notification preferences;
* other personal preferences.

Settings may include both account-level preferences and device-specific preferences.

Account-level preferences follow the authenticated user across devices when consistency is required, such as language and measurement units.

Device-specific preferences may be used when the working context depends on the device or environment.

The exact separation between account-level and device-specific settings will be defined in Technical Architecture.

The Settings Module changes how the user experiences HFZWood, but it does not change what HFZWood is or how its core modules function.

### Out of Scope

The Settings Module does not:

* define Projects;
* create or edit Projects;
* modify Project data;
* manage project storage;
* manage synchronization;
* manage user identity;
* determine subscription plans;
* control access rights;
* provide Learning content;
* define the Project Tools workflow.

Settings manages preferences, not permissions.

### Relationships with Other Modules

Settings is associated with Identity because preferences belong to an authenticated user, but it remains separate from authentication and identity management.

Settings may influence how Project Tools, Learning, Local Workspace, and Cloud Workspace are presented to the user, but it does not change their responsibilities or capabilities.

Subscription controls access rights and product capabilities, while Settings controls user preferences.

Project Module remains independent of Settings. Settings never changes what a Project is.
## Architecture Closure

This Product Architecture defines HFZWood as a project-centric product.

The Project is the central product entity. All major product modules either define, create, enrich, manage, support, protect, or personalize the user's interaction with Projects.

The Project Module defines what a Project is.

The Project Tools Module defines how Projects are created, enriched, and completed through the HFZWood methodology.

Local Workspace and Cloud Workspace manage where Projects are available and how users access them across local and cloud environments.

The Learning Module provides the professional knowledge required to understand and correctly apply the woodworking and epoxy resin methodology behind the product.

The Identity Module establishes who the user is.

The Subscription Module determines which capabilities, limits, and content are available to that user.

The Settings Module manages user preferences and personalization without changing the product itself.

Each module has a single, clearly defined responsibility. Modules collaborate with one another, but no module may assume the primary responsibility of another module.

Cross-cutting features may operate across multiple modules, but they do not own core product entities and do not redefine module boundaries.

This separation ensures that HFZWood remains coherent, maintainable, extensible, and product-centric as it evolves.

