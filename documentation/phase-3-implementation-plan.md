Phase 3 Technical Foundation

The purpose of Phase 3 is to transform the static educational content introduced in Phase 2 into a fully manageable editorial system.

Existing Manual, Glossary and Knowledge Base content will be migrated from static application resources into the new content management architecture while preserving stable identifiers, user experience and public URLs where applicable.

Internally, the application will continue using canonical measurement units for calculations and data persistence, while user preferences affect only presentation and data entry.

The public Manual will continue to behave as a single continuous document composed from published chapters and sections, preserving the navigation model introduced in Phase 2.

Phase 3 focuses on product architecture. Detailed persistence models, storage technologies, APIs and infrastructure decisions belong to the implementation architecture and are intentionally excluded from this document.
The existing static educational content introduced in Phase 2 will be migrated into the new content management system while preserving stable identifiers, public behavior and the overall user experience.

The public Manual shall continue to be presented as one continuous document composed from published chapters and sections.

Manual, Glossary and Knowledge Base shall continue to preserve their distinct user experiences established in Phase 2.

Internally, calculations and project data shall continue using canonical measurement units. User preferences affect only presentation and data entry.

This document defines Product Architecture only. Technical implementation decisions regarding persistence, APIs, infrastructure, AWS services and deployment are intentionally left to the implementation architecture.
## Task 58 — Admin Panel Foundation

Objective:
Create the foundational Admin Panel workspace for HFZWood.

This task establishes the administration area as a dedicated workspace where future content management and product administration tools will live.

Expected result:
An authenticated administrator can enter the Admin Panel and see a clean, spacious administration dashboard with navigation toward all major product-management areas.

The Admin Panel should not feel like a marketing page or hero landing page. It should feel like a calm professional workspace.

Main areas visible from the Admin dashboard:

- Manual & Tutorials management
- Glossary management
- Knowledge Base management
- Projects / Open Project access
- Future completed content sections
- Future administration sections

Layout direction:
The Admin Panel should preserve the visual language of the existing HFZWood platform, but without the Home hero-style presentation.

The layout should include:

- a clear left-side navigation menu;
- a wide central working area;
- generous spacing;
- calm typography;
- enough empty space to understand the structure at a glance;
- no visual clutter;
- no unnecessary cards or dashboard noise.

The central area should be reserved for written information, overview text, status summaries and future management panels.

Scope:
This task creates only the Admin Panel foundation.

It does not implement editing of Manual, Glossary or Knowledge Base content yet.

It does not implement roles and permissions beyond the minimum necessary placeholder for administrator access.

It does not implement real CMS functionality.

It does not implement global search.

Acceptance criteria:
- Admin Panel route exists.
- Admin Panel uses a dedicated administration layout.
- Left-side navigation is visible and clear.
- Central dashboard area is clean and spacious.
- Navigation placeholders exist for Manual & Tutorials, Glossary, Knowledge Base and future admin areas.
- Existing product modules remain unchanged.
- No content editing functionality is introduced in this task.
## Phase 3B — Content Management

This section transforms the educational modules introduced in Phase 2 into fully manageable product content.

Instead of maintaining documentation directly inside the source code, administrators will be able to create, edit, organize and maintain educational content through dedicated management interfaces.

Each content type preserves its own identity and user experience:

- Manual & Tutorials remain a structured textbook.
- Glossary remains a technical dictionary.
- Knowledge Base remains a troubleshooting library.

Although these modules share common editing principles, each receives its own dedicated management workflow optimized for its specific purpose.
## Task 59 — Manual Content Management

| Field | Detail |
|-------|--------|
| Objective | Transform the Manual & Tutorials module from a static document into a fully manageable content system. Administrators should be able to create, edit, organize and maintain the complete Manual directly from the Admin Panel without modifying the application's source code. |
| Dependencies | Task 58 |
| Expected result | The Manual becomes an administrator-managed product. Chapters, sections, text, images and embedded tutorial videos can be maintained entirely through the administration interface while preserving the existing reading experience introduced in Phase 2. |
| Acceptance criteria | Administrators can create, edit, delete and reorder chapters and sections. The reading experience of the Manual remains unchanged for end users. The administration interface provides a comfortable editing environment with live preview where appropriate. Images and embedded videos can be inserted into the content. The editor supports the semantic content blocks already established for the Manual (Important, Warning, Tip, Note, Quote, etc.). Manual content supports **Draft** and **Published** states. Administrators may freely edit Draft content without affecting end users. Only Published content is visible inside the Manual. Publishing immediately makes the new version available to users. |

**Status:** Complete (2026-07-07).

### Product Clarifications

The administrator edits the Manual itself, not HTML or source files.

The editing experience should resemble a modern document editor rather than a traditional CMS.

The administrator should work on complete chapters instead of individual database records.

The editing interface should prioritize writing and content organization over technical configuration.

The Manual continues to behave like a university textbook.

The administration interface must preserve that philosophy instead of turning the Manual into a collection of disconnected pages.

The content lifecycle is intentionally simple:

- Draft
- Published

Draft content is visible only to administrators.
### Multilingual Content

The content management system must support multiple language versions of the same content item.

A Manual chapter, Glossary entry or Knowledge Base article represents one logical content item that may contain multiple published language variants.

Initially, the system should support:

- English
- Romanian

Administrators can create, edit and publish each language version independently.

Publishing a Romanian version does not automatically publish the English version, and vice versa.

When a user selects a language, HFZWood should automatically display the published version matching that language.

This multilingual capability is considered a core architectural requirement of the content management system.

Automatic translation is intentionally out of scope.

Published content is the version presented to all users.

Support should include:

- chapter management;
- section management;
- rich text editing;
- semantic content blocks;
- image insertion;
- embedded tutorial videos;
- internal links between chapters;
- Draft / Published workflow.
### Content Variants

Each logical content item owns all of its language versions.

Administrators switch between language variants from within the same content item.

Adding a new language variant does not create a new chapter, glossary entry or Knowledge Base article.

Instead, it creates another language version of the same logical content.

All language variants share the same identity, relationships and metadata while maintaining independent text, media and publication status.
The published Manual shall always be rendered as one continuous document assembled from the published chapters and sections while preserving stable navigation anchors.

### Out of Scope

This task does not implement:

- AI-assisted writing;
- automatic translation;
- version history;
- collaborative editing;
- comments or review workflows;
- global documentation search;
- roles and permissions beyond the administrator access established in Task 58.
## Task 60 — Glossary Content Management

| Field | Detail |
|-------|--------|
| Objective | Transform the Glossary from a static collection of terms into a fully manageable technical dictionary. Administrators should be able to create, edit, organize and maintain glossary entries directly from the Admin Panel without modifying the application's source code. |
| Dependencies | Task 58 |
| Expected result | The Glossary becomes an administrator-managed reference library. Terms, definitions, images and supporting media can be maintained entirely through the administration interface while preserving the fast dictionary-style experience introduced in Phase 2. |
| Acceptance criteria | Administrators can create, edit, delete and organize glossary entries. Each entry supports a title, rich-text definition, optional images and optional embedded videos. Entries support **Draft** and **Published** states. Draft entries remain visible only to administrators until published. The public Glossary immediately reflects newly published entries while preserving the existing user experience. |

**Status:** Complete (2026-07-08).

### Product Clarifications

The administrator edits glossary entries directly rather than modifying source files.

The editing experience should resemble writing and maintaining a professional technical dictionary rather than configuring database records.

Each glossary entry is an independent knowledge object.

The administration interface should make it easy to:

- create new terms;
- edit existing definitions;
- reorganize terminology;
- maintain supporting media;
- keep terminology consistent across the product.

The content lifecycle is intentionally simple:

- Draft
- Published

Draft entries are visible only to administrators.
### Multilingual Content

The content management system must support multiple language versions of the same content item.

A Manual chapter, Glossary entry or Knowledge Base article represents one logical content item that may contain multiple published language variants.

Initially, the system should support:

- English
- Romanian

Administrators can create, edit and publish each language version independently.

Publishing a Romanian version does not automatically publish the English version, and vice versa.

When a user selects a language, HFZWood should automatically display the published version matching that language.

This multilingual capability is considered a core architectural requirement of the content management system.

Automatic translation is intentionally out of scope.

Published entries become immediately available inside the Glossary.

Each glossary entry should support:

- term;
- rich-text definition;
- semantic content blocks where appropriate;
- one or more images;
- embedded tutorial videos;
- related terms;
- synonyms;
- see also references;
- Draft / Published workflow.

**Related Terms** connect closely associated concepts and encourage exploration within the Glossary.

**Synonyms** allow different names for the same concept, ensuring users can locate entries regardless of the terminology they use.

**See Also** creates curated cross-references to other relevant content across the HFZWood ecosystem, including Manual chapters, Glossary entries and Knowledge Base articles.

The editing experience should feel closer to maintaining a professional technical dictionary than operating a traditional CMS.
### Content Variants

Each logical content item owns all of its language versions.

Administrators switch between language variants from within the same content item.

Adding a new language variant does not create a new chapter, glossary entry or Knowledge Base article.

Instead, it creates another language version of the same logical content.

All language variants share the same identity, relationships and metadata while maintaining independent text, media and publication status.

### Out of Scope

This task does not implement:

- AI-generated definitions;
- automatic terminology extraction;
- automatic translation;
- collaborative editing;
- version history;
- comments or editorial workflow;
- global documentation search;
- semantic search;
- automatic relationship generation;
- roles and permissions beyond the administrator access established in Task 58.
## Task 61 — Knowledge Base Content Management

| Field | Detail |
|-------|--------|
| Objective | Transform the Knowledge Base from a static troubleshooting library into a fully manageable technical support system. Administrators should be able to create, edit, organize and maintain practical troubleshooting content directly from the Admin Panel without modifying the application's source code. |
| Dependencies | Task 58 |
| Expected result | The Knowledge Base becomes an administrator-managed support library where troubleshooting articles can be created, maintained and published while preserving the structured problem-solving experience introduced in Phase 2. |
| Acceptance criteria | Administrators can create, edit, delete and organize Knowledge Base entries. Each entry supports structured troubleshooting sections, images, embedded videos and cross-references to related product content. Entries support **Draft** and **Published** states. Draft entries remain visible only to administrators until published. The public Knowledge Base immediately reflects newly published content while preserving the existing user experience. |

**Status:** Complete (2026-07-08).

### Product Clarifications

The administrator edits Knowledge Base articles directly rather than modifying source files.

The editing experience should resemble maintaining a professional technical support library rather than operating a traditional CMS.

Each Knowledge Base article represents one specific problem and its solution.

The administration interface should make it easy to:

- create new troubleshooting articles;
- organize articles into categories;
- maintain practical repair and recovery procedures;
- update existing solutions as product knowledge evolves;
- connect articles with other educational resources across the HFZWood ecosystem.

The content lifecycle is intentionally simple:

- Draft
- Published

Draft articles are visible only to administrators.
### Multilingual Content

The content management system must support multiple language versions of the same content item.

A Manual chapter, Glossary entry or Knowledge Base article represents one logical content item that may contain multiple published language variants.

Initially, the system should support:

- English
- Romanian

Administrators can create, edit and publish each language version independently.

Publishing a Romanian version does not automatically publish the English version, and vice versa.

When a user selects a language, HFZWood should automatically display the published version matching that language.

This multilingual capability is considered a core architectural requirement of the content management system.

Automatic translation is intentionally out of scope.

Published articles become immediately available inside the Knowledge Base.

Each Knowledge Base article should support:

- article title;
- category;
- difficulty level;
- problem summary;
- symptoms;
- possible causes;
- step-by-step solution;
- prevention;
- tips;
- warnings;
- rich-text editing;
- semantic content blocks where appropriate;
- one or more images;
- embedded tutorial videos;
- related Knowledge Base articles;
- related Glossary terms;
- related Manual chapters;
- search keywords;
- estimated repair time;
- required tools;
- required materials;
- Draft / Published workflow.

Categories help organize troubleshooting topics into logical technical areas.

Difficulty levels help users understand the expected level of experience required before attempting a solution.

Search keywords allow administrators to improve article discoverability without relying on AI or semantic search.

Cross-references create a connected learning ecosystem by linking troubleshooting articles with relevant Glossary terms and Manual chapters.

The editing experience should feel closer to maintaining a professional service manual than operating a traditional CMS.
### Content Variants

Each logical content item owns all of its language versions.

Administrators switch between language variants from within the same content item.

Adding a new language variant does not create a new chapter, glossary entry or Knowledge Base article.

Instead, it creates another language version of the same logical content.

All language variants share the same identity, relationships and metadata while maintaining independent text, media and publication status.

### Out of Scope

This task does not implement:

- AI-generated troubleshooting;
- semantic search;
- natural language questions;
- automatic keyword generation;
- automatic article relationships;
- collaborative editing;
- version history;
- comments or discussion threads;
- attachments;
- author management;
- automatic translation;
- roles and permissions beyond the administrator access established in Task 58.
## Task 62 — Shared Editorial Infrastructure

| Field | Detail |
|-------|--------|
| Objective | Build the shared editorial infrastructure used by Manual, Glossary and Knowledge Base content management. This task creates the common tools for editing, media management, uploads, semantic blocks, cross-references and asset reuse so administrators can manage content clearly and consistently across all educational modules. |
| Dependencies | Tasks 59, 60, 61 |
| Expected result | Administrators have a clear, unified editorial system for managing text, images, videos, reusable assets, internal links, tags and cross-references without confusion. The system should reduce the risk of incorrect content appearing in the user-facing Manual, Glossary or Knowledge Base. |
| Acceptance criteria | Manual, Glossary and Knowledge Base content management use shared editorial tools instead of separate inconsistent editors. Administrators can insert existing media, upload new media, tag assets, manage captions and alt text, create semantic content blocks, add internal cross-references and understand where each asset or reference is used. The workflow is clear, predictable and easy to navigate. |

### Product Clarifications

The purpose of this task is clarity, consistency and editorial safety.

The administrator should always understand:

- what content item is being edited;
- which language variant is active;
- whether the content is Draft or Published;
- what images, videos or assets are attached;
- where each internal link points;
- where each asset is reused;
- whether deleting or replacing something may affect published content.

The editorial system should feel calm and structured, not like a complicated enterprise CMS.

When adding content, the administrator should be able to move naturally between:

- text editing;
- semantic blocks;
- images;
- videos;
- asset selection;
- tags;
- captions;
- internal links;
- cross-references;
- preview;
- publish controls.

Shared editorial infrastructure should include:

- shared rich text editor;
- semantic content blocks;
- media library;
- image library;
- video library;
- upload manager;
- asset manager;
- asset tagging;
- captions;
- alt text;
- asset descriptions;
- internal link manager;
- cross-reference manager;
- reusable assets;
- asset usage tracking;
- broken-reference protection;
- replace asset workflow;
- content preview.

Media and assets should be reusable across Manual, Glossary and Knowledge Base.

The same image or video should not need to be uploaded multiple times for different articles.

When an asset is reused, the system should make reuse visible and understandable.

Before deleting or replacing an asset, the administrator should see where that asset is currently used.

Internal links should be created by selecting existing Manual chapters, Glossary entries or Knowledge Base articles, not by manually typing URLs.

Tags should help administrators find and organize assets quickly.

The system should prioritize preventing mistakes over offering many advanced options.

The user-facing educational modules must remain clean and reliable. Editorial complexity should stay inside the Admin Panel and should never leak into the user experience.

### Multilingual Editorial Clarification

Assets and references may need language awareness.

Some images, captions or videos may be language-neutral.

Other assets may have language-specific variants when they contain visible text or narration.

The system should allow future support for language-specific media variants without requiring a redesign.
The shared editorial infrastructure should provide a consistent editing experience across all educational modules.

### Out of Scope

This task does not implement:

- AI tagging;
- OCR;
- automatic translation;
- CDN configuration;
- enterprise digital asset management;
- version history;
- collaborative editing;
- editorial comments;
- approval workflows;
- watermarking;
- advanced image optimization.
## Task 63 — Application Preferences

| Field | Detail |
|-------|--------|
| Objective | Introduce a centralized Application Preferences system that allows every user to personalize their HFZWood experience without affecting the application for other users. |
| Dependencies | Task 58 |
| Expected result | Authenticated users can configure personal application preferences that are automatically remembered between sessions. The preferences system supports interface language, measurement units and future user-specific settings. |
| Acceptance criteria | Users can access an Application Preferences page from their account. Users can select their preferred interface language, preferred length unit and preferred volume unit. Preferences are stored per user and automatically applied when the user signs in. The system is designed to support additional personal preferences in future versions without requiring architectural changes. |

### Product Clarifications

Application Preferences define how the application behaves for an individual user.

Changing personal preferences never affects:

- other users;
- application content;
- administrator settings;
- product configuration.

The initial version should support:

- interface language;
- preferred length unit;
- preferred volume unit.

The interface language selector should initially support:

- English
- Romanian

Application language controls the interface only:

- navigation;
- buttons;
- forms;
- dialogs;
- system messages;
- validation messages.

Application language does not automatically translate Manual, Glossary or Knowledge Base content.

Educational content language is managed separately inside the content management system.

Manual, Glossary and Knowledge Base content should support language-specific versions, initially:

- English
- Romanian

Administrators are responsible for creating, editing and publishing each language version of the content.

A translated content version becomes visible to users only after it is published.

The selected interface language may be used as the preferred content language when a published version is available, but the system must not assume that interface language and content language are always identical.

The preferred length unit should support:

- millimeters (mm);
- centimeters (cm);
- meters (m);
- inches (in);
- feet (ft).

The preferred volume unit should support:

- milliliters (ml);
- liters (L);
- fluid ounces (fl oz);
- pints (pt);
- quarts (qt);
- gallons (gal).

Selected units become the default throughout the application wherever measurements and volumes are entered or displayed, while preserving calculation accuracy internally.
Internally, all calculations should continue using a single canonical measurement system to guarantee numerical consistency regardless of the user's preferred display units.

The preferences interface should remain intentionally simple and uncluttered.

Future user-specific preferences can be added without changing the overall structure.
When a user selects a language, HFZWood should present the entire product experience in that language wherever published content exists.

This includes:

- navigation;
- interface labels;
- buttons;
- forms;
- dialogs;
- validation messages;
- Manual content;
- Glossary entries;
- Knowledge Base articles.

The user-facing experience should feel fully localized.

Internally, the system may distinguish between interface localization and content localization, but this distinction must not be exposed as complexity to the user.

Administrators are responsible for creating and publishing content versions for each supported language.

If a content item does not yet have a published version in the selected language, the application should handle the situation gracefully, for example by showing a clear unavailable-content message or a controlled fallback defined by the product owner.

Automatic translation is out of scope.

### Out of Scope

This task does not implement:

- automatic content translation;
- AI-assisted translation;
- localization workflow for Manual, Glossary or Knowledge Base;
- theme customization;
- notification settings;
- dashboard personalization;
- administrator preferences;
- content management settings;
- roles and permissions.



## Task 64 — Roles & Permissions

| Field | Detail |
|-------|--------|
| Objective | Introduce a secure and scalable Roles & Permissions system that protects administrative functionality while providing a simple and seamless experience for end users. |
| Dependencies | Tasks 58, 59, 60, 61, 62, 63 |
| Expected result | HFZWood distinguishes between standard users and administrators. Administrative functionality is protected consistently across the application while remaining completely hidden from users who do not have permission to access it. The authorization architecture is designed to support future expansion without increasing complexity in Phase 3. |
| Acceptance criteria | The application supports role-based authorization. Standard users can access the complete user-facing product but cannot access administrative functionality. Administrators can access the Admin Panel and all content management tools. Authorization is enforced consistently across navigation, protected routes and administrative actions. Unauthorized access attempts are handled safely without exposing administrative functionality or internal implementation details. |

### Product Clarifications

The authorization system exists to protect product administration while keeping the user experience simple.

The initial role model intentionally remains minimal:

- User
- Administrator

A standard User can access:

- Home
- New Project
- Projects
- Manual
- Glossary
- Knowledge Base
- Application Preferences

A standard User cannot access:

- Admin Panel
- Manual Content Management
- Glossary Content Management
- Knowledge Base Content Management
- Shared Editorial Infrastructure
- Media Library
- Asset Management
- Publishing tools
- Product administration features

Administrators have access to all user functionality together with all administration tools.

Administrative functionality should remain invisible to users who do not have permission to access it.

Users should never see disabled administration controls or unnecessary permission warnings during normal product usage.

Navigation, menus and available actions should automatically adapt to the current user's role.

Authorization must protect both the user interface and the application routes.

Direct navigation attempts (for example by manually entering an administrative URL) must always be validated and blocked when the current user does not have sufficient permissions.

The system should always fail securely while providing a clear and user-friendly response.

The authorization architecture should support future expansion to additional roles such as:

- Editor
- Reviewer
- Translator
- Support
- Owner

without requiring a redesign of the authorization system.

### Out of Scope

This task does not implement:

- advanced permission matrices;
- per-document permissions;
- editorial approval workflows;
- user management;
- organization or team management;
- audit logs;
- activity history;
- billing permissions;
- multi-tenant administration.
## Task 65 — Phase 3 Integration, QA & Documentation Alignment

| Field | Detail |
|-------|--------|
| Objective | Validate, integrate and finalize all Phase 3 functionality into a stable, coherent and production-ready product. Ensure that all newly introduced modules work together consistently and that the project documentation accurately reflects the implemented solution. |
| Dependencies | Tasks 58–64 |
| Expected result | All Phase 3 modules operate as a unified system. Editorial workflows, multilingual content management, permissions, shared infrastructure and user preferences are fully integrated, thoroughly tested and accurately documented. |
| Acceptance criteria | All Phase 3 functionality passes integration testing. Editorial workflows operate correctly from Draft to Published. Multilingual content behaves consistently across the application. Shared editorial infrastructure functions correctly in every module. Roles and permissions are enforced consistently. Project documentation is synchronized with the final implementation. All identified issues are resolved before Phase 3 is certified as complete. |

### Product Clarifications

This task introduces no new product functionality.

Its purpose is to ensure that all Phase 3 components operate together as one coherent system.

Integration testing should verify:

- Admin Panel;
- Manual Content Management;
- Glossary Content Management;
- Knowledge Base Content Management;
- Shared Editorial Infrastructure;
- Application Preferences;
- Roles & Permissions.

Editorial workflow validation should include:

- Draft creation;
- Draft editing;
- Publishing;
- Published content visibility;
- content updates after publication.

Multilingual validation should verify:

- independent language variants;
- Draft / Published state for each language;
- correct language selection for users;
- graceful handling of unpublished language variants.

Shared editorial infrastructure should be validated for:

- media reuse;
- uploads;
- asset replacement;
- asset deletion protection;
- cross-references;
- internal links;
- reusable editorial components.

Authorization testing should confirm that administrative functionality remains inaccessible and invisible to standard users.

Documentation should be reviewed and updated to reflect the final implementation of Phase 3.
All Phase 3 architectural decisions should be reflected consistently across the project documentation.

The project should remain clean, consistent and maintainable before release certification.
Existing Phase 2 educational content shall be migrated into the new content management system while preserving stable identifiers, public behavior and user experience.

### Out of Scope

This task does not introduce:

- new product features;
- UI redesign;
- architectural refactoring unrelated to Phase 3;
- AI functionality;
- semantic search;
- future roadmap features.
## Task 66 — Phase 3 Release Certification

| Field | Detail |
|-------|--------|
| Objective | Officially certify the successful completion of Phase 3 by validating that all implementation, testing, documentation and release requirements have been satisfied. Establish Phase 3 as the new stable baseline for future development. |
| Dependencies | Task 65 |
| Expected result | Phase 3 is formally completed, certified and documented. The project repository is clean, stable and fully synchronized with the implementation. The application is ready to become the official starting point for Phase 4 development. |
| Acceptance criteria | All Phase 3 tasks are completed and verified. All planned functionality has been implemented according to the approved specifications. Integration and regression testing have been successfully completed. Documentation accurately reflects the implemented product. The repository is clean. The final release commit is created. Phase 3 is officially marked as completed and becomes the new development baseline. |

### Product Clarifications

This task introduces no new functionality.

Its purpose is to formally close Phase 3 and certify that the product is stable, maintainable and ready for future development.

Release certification should confirm:

- successful completion of Tasks 58–65;
- successful integration of all Phase 3 components;
- completion of integration testing;
- completion of regression testing;
- successful production build;
- synchronized project documentation;
- clean repository state;
- final release commit;
- updated implementation roadmap;
- establishment of Phase 3 as the official project baseline.

No new implementation work should begin until Phase 3 has been formally certified and accepted.

The certification process confirms both technical quality and product quality.

The completion of Phase 3 authorizes the project to begin planning and implementation of Phase 4.

### Out of Scope

This task does not implement:

- new product features;
- UI improvements;
- architectural redesign;
- future roadmap items;
- Phase 4 planning;
- AI functionality;
- postponed backlog items.