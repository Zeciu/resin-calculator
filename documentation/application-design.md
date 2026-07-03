# HFZWood – Application Design

## 1. Purpose

This document defines the overall architecture, navigation, modules, and long-term development strategy of the HFZWood application.

Its purpose is to ensure that every future feature follows a consistent structure, user experience, and design philosophy.

This document describes **what the application should become**, not how individual features are implemented in code.

---

## 2. Application Philosophy

HFZWood is not simply a resin volume calculator.

It is a complete professional ecosystem designed to help woodworkers plan, calculate, document, and successfully complete epoxy resin projects.

The application combines practical calculation tools with educational resources, allowing users to learn the complete workflow while working on real projects.

The long-term goal is to become the reference platform for epoxy resin woodworking.

The application is built around five fundamental principles:

- Accuracy
- Simplicity
- Professional workflow
- Education
- Continuous improvement
---

## 2.1 Current Release (Phase 2)

The following describes the HFZWood product as implemented at the end of Phase 2 development tasks (Tasks 43–54). Later sections of this document describe the long-term vision; where they differ, this section reflects current product behavior.

**Authentication and Home**

After login, the user lands on the **logged-in Home hub** (the central navigation screen; referred to as the Dashboard in some long-term design sections). The Home sidebar provides access to New Project, Projects, Manual and Tutorials, Glossary, Knowledge Base, My Account, and Log out. Guests see a locked-module experience with a path to login.

**Dedicated modules**

New Project, Projects, Manual and Tutorials, Glossary, and Knowledge Base each open in a **dedicated module layout**: no Home sidebar, a consistent header (`← Home`, HFZWood branding, module title), and a focused working or reading area.

**Project workflow**

* **New Project** opens the resin estimation workspace (calculator delivered in Phase 1).
* **Save Project** writes a complete `.hfzproject` file to the user's device.
* **Projects** provides Open Project, Recent Projects (browser-stored metadata only), and New Project.
* Reopened projects support **in-place update** when a file handle is available.
* **Unsaved changes protection** prompts before leaving the workspace with unsaved work.

Project files on disk are the source of truth. Cloud sync, account-backed project libraries, and automatic saving are not part of Phase 2.

**Educational modules**

* **Manual and Tutorials** — one continuous document with a left table of contents; inline images and embedded tutorial videos.
* **Glossary** — searchable dictionary with A–Z navigation and expandable entries.
* **Knowledge Base** — searchable troubleshooting entries with expandable structured sections.

Search in Phase 2 is **module-local** (Glossary and Knowledge Base only). Global documentation search, cross-module linking, and AI-powered answers are deferred.

**Intentionally deferred in Phase 2**

See the out-of-scope list in [`documentation/phase-2-implementation-plan.md`](phase-2-implementation-plan.md), including: global documentation search, AI-powered Knowledge Base, cloud project synchronization, subscriptions and payments, content administration, and production Cognito integration (mock/session auth in current development).

---

# 3. User Journey

Every user should follow a clear and intuitive workflow.

The application should guide the user naturally through each stage without requiring previous experience.

The recommended journey is:

Landing Page
→ Log In / Sign Up
→ Home (logged-in hub)
→ Create or Open Project
→ Resin Calculator
→ Save Project
→ Access Manual, Glossary, or Knowledge Base whenever assistance is needed.

Optional in-workspace actions such as PDF export are available from the calculator workspace but are not separate navigation modules in Phase 2.

The user should never feel lost or wonder what the next step is.

Every screen should naturally suggest the next logical action.
---

# 4. Main Modules

The application is organized into independent modules.

Each module has a clear responsibility and should remain as independent as possible.

## 4.1 Landing Page

Public presentation of the application, its capabilities and benefits.

## 4.2 Authentication

- Log In
- Sign Up
- Password Recovery

## 4.3 Dashboard

The central hub of the application where users can access all available features.

## 4.4 Projects

Each project stores all information related to a specific epoxy resin project, including:

- Project information
- Original photos
- Calibration measurements
- Polygons
- Resin calculations
- Pouring stages
- PDF reports
- Future updates and revisions

## 4.5 Resin Calculator

Professional photo-based epoxy resin volume estimation.

## 4.6 Knowledge Base

- Manual
- Glossary
- Video Tutorials
- FAQ
- Troubleshooting

## 4.7 Reports

Generation of professional PDF reports.

## 4.8 User Profile

User account information and preferences.

## 4.9 Subscription

Subscription management, billing and license information.

## 4.10 Settings

Application preferences and configuration.
---

# 5. Project Lifecycle

A project represents a complete epoxy resin woodworking project.

Each project follows a logical workflow from planning to completion.

The standard lifecycle is:

1. Create Project

2. Upload Photos

3. Add Reference Measurements

4. Create Calibration Lines

5. Draw Polygons

6. Calculate Resin Volume

7. Review Results

8. Plan Pouring Stages

9. Generate PDF Report

10. Save Project

11. Reopen and Continue Working

A project should remain editable at any time.
---

# 6. Dashboard

> **Phase 2 note:** The logged-in central hub is implemented as the **Home** page with left-sidebar navigation. The role described below matches the current Home hub.

The Dashboard is the first screen the user sees after logging in.

Its role is to provide a clear starting point and quick access to the main areas of the application.

The Dashboard should not be crowded. It should present only the most important actions.

Primary actions:

1. Create New Project
2. Open Existing Project
3. Access Knowledge Base
4. View Recent Projects

Secondary actions:

1. User Profile
2. Subscription Status
3. Settings

The Dashboard should help the user immediately understand what they can do next.

The most important action should be **Create New Project**.
---

---

# 7. Project Structure

A project is the central working unit of the application.

Each project represents one epoxy resin woodworking project and is based on a single project photo taken as perpendicular as possible to the work surface.

The purpose of a project is to calculate, document, and manage the resin volume required for that specific workpiece.

Each project should store the following information:

## General Information

- Project name
- Creation date
- Last modified date
- Description or notes

## Project Image

- One main project photo
- The photo is used as the base for all measurements, polygons, and calculations

## Measurements

- Reference measurements
- Calibration lines
- Real-world dimensions entered by the user

## Drawing Data

- Mold boundary polygon
- Wood island polygons
- Refined cavity polygons
- Depth values for cavities

## Resin Calculation

- Total resin volume
- Main pour depth
- First sealing layer thickness
- Safety margin
- Resin mix ratio
- Resin volume split between component A and component B

## Pouring Plan

- Number of pouring stages
- Thickness of each pouring stage
- Resin quantity for each stage
- Component A and component B quantity for each stage

## Report

- One final PDF report containing all calculated information required for workshop use

## Notes

- User notes
- Client name
- Color preferences
- Workshop observations

A project should remain editable until the user decides to finalize or export the report.
# 8. Knowledge Base

The HFZWood Knowledge Base is an integrated educational component of the application.

Its purpose is not only to answer questions, but to teach users the correct workflow for woodworking and epoxy resin projects.

The Knowledge Base should become one of the strongest long-term assets of the HFZWood ecosystem.

## Objectives

The Knowledge Base should:

- explain woodworking concepts;
- explain epoxy resin concepts;
- answer frequently asked questions;
- reduce beginner mistakes;
- provide practical recommendations;
- centralize reliable information.

## Information Structure

The content should be organized into clear categories.

Examples include:

- Wood species
- Moisture and wood movement
- Epoxy resin basics
- Casting techniques
- Vacuum and pressure
- Pigments
- Safety
- Tools
- Finishing
- Common mistakes
- Troubleshooting
- Frequently Asked Questions (FAQ)

## Search

> **Phase 2:** Search is implemented separately inside the Glossary and Knowledge Base modules only. The global search capabilities described below remain future scope.

The Knowledge Base should include a powerful search function capable of finding articles, keywords and related topics.

Search results should prioritize relevance rather than publication date.

## Cross Linking

Articles should reference each other whenever appropriate.

For example:

"What is wood moisture?"

↓

Related articles:

• Wood drying
• Moisture meter
• Wood movement
• Cracks
• Resin adhesion

This creates an interconnected learning system instead of isolated articles.

## Continuous Expansion

The Knowledge Base is designed to grow continuously.

Every tutorial, every solved problem and every frequently asked question can later become a new article.

This allows the application to become more valuable over time without changing its core functionality.
# 9. Tutorials

Tutorials are a core component of the HFZWood ecosystem.

Their purpose is to guide users through real woodworking and epoxy resin projects using practical demonstrations rather than theoretical explanations alone.

## Objectives

The tutorial section should:

* teach complete workflows;
* demonstrate best practices;
* reduce common mistakes;
* help beginners gain confidence;
* provide advanced techniques for experienced users.

## Tutorial Format

Each tutorial may include:

* video;
* written explanation;
* images;
* downloadable resources;
* links to related Knowledge Base articles.

This allows users to choose the learning format that best suits their needs.

## Categories

Tutorials should be organized into categories, such as:

* Wood preparation
* Moisture measurement
* Sealing techniques
* Formwork construction
* Resin calculation
* Resin mixing
* Pouring techniques
* Bubble removal
* Pigments
* Finishing
* Repair techniques
* Complete projects

## Learning Path

Whenever possible, tutorials should be arranged in a logical learning sequence.

For example:

Beginner

↓

Wood preparation

↓

Sealing

↓

Building the formwork

↓

Volume calculation

↓

Mixing resin

↓

Casting

↓

Finishing

This helps new users learn progressively instead of consuming random content.

## Integration

Tutorials should be interconnected with the rest of the application.

A tutorial may reference:

* Knowledge Base articles;
* glossary terms;
* calculators;
* related tutorials.

Likewise, Knowledge Base articles may recommend relevant tutorials when visual demonstrations are useful.

## Continuous Growth

The tutorial library is intended to expand continuously.

Every new project, technique, or solved problem can become a future tutorial, increasing the educational value of the HFZWood platform over time.

# 10. Glossary

The glossary is a dedicated section of the HFZWood application that explains important terms used in woodworking, epoxy resin work and the application itself.

Its purpose is to help users understand technical language without leaving the platform.

## Objectives

The glossary should:

* define technical terms in simple language;
* reduce confusion for beginners;
* create consistency across tutorials and Knowledge Base articles;
* support users who are not familiar with woodworking or epoxy resin terminology.

## Content

Each glossary entry should include:

* the term;
* a short definition;
* an extended explanation when needed;
* related terms;
* links to relevant tutorials or Knowledge Base articles.

## Examples of Glossary Terms

Examples may include:

* Epoxy resin
* Hardener
* Mixing ratio
* Pot life
* Working time
* Curing time
* Exothermic reaction
* Moisture content
* Wood movement
* Live edge
* Formwork
* Sealing
* Pigment
* Bubble removal
* Sanding grit
* Finish

## Integration

Glossary terms should be integrated throughout the platform.

When a technical term appears in a tutorial or Knowledge Base article, the user should be able to access its definition easily.

This can be done through links, tooltips or dedicated glossary pages.

## Continuous Expansion

The glossary should grow over time.

Whenever a new technical term appears in tutorials, Knowledge Base articles or application features, it can be added to the glossary.

This helps HFZWood become clearer, more accessible and more useful for beginners and advanced users alike.
# 11. User Accounts & Subscription

HFZWood is designed as a subscription-based platform.

Users create an account to access the application's tools, educational content and future premium features.

## User Accounts

Each user should have a personal account that securely stores:

* profile information;
* subscription status;
* application preferences;
* saved projects;
* calculation history;
* bookmarked articles and tutorials.

This allows users to continue their work from any supported device.

## Subscription Model

HFZWood should support multiple subscription plans.

For example:

* Free
* Premium
* Professional

The exact features of each plan may evolve over time.

The subscription system should be flexible enough to support future business requirements without major architectural changes.

## Premium Content

Depending on the subscription level, users may gain access to:

* advanced calculation tools;
* exclusive tutorials;
* premium Knowledge Base articles;
* downloadable resources;
* future AI-assisted features;
* additional productivity tools.

## Account Management

Users should be able to manage their account independently.

Typical account functions include:

* updating profile information;
* changing passwords;
* managing subscriptions;
* viewing payment history;
* managing saved content.

## Scalability

The authentication and subscription system should be designed to support a growing number of users while maintaining security, reliability and performance.

# 12. Administration Panel

HFZWood should include a secure administration panel for managing the application's content, users and business operations.

The administration interface is intended for authorized users only and should allow the platform to be managed without requiring programming knowledge.

## Objectives

The administration panel should provide all the tools necessary to manage the HFZWood ecosystem from a single location.

## Dashboard

The dashboard should provide an overview of the platform, including:

* total registered users;
* active subscriptions;
* free users;
* premium users;
* recent activity;
* important notifications.

## User Management

Administrators should be able to:

* view all registered users;
* search and filter users;
* distinguish Free and Premium accounts;
* view subscription status;
* review user activity when necessary.

## Subscription & Payments

Administrators should be able to:

* view payment history;
* verify active subscriptions;
* review cancelled subscriptions;
* issue refunds when appropriate.

## Content Management

Administrators should be be able to create, edit and organize:

* Knowledge Base articles;
* tutorials;
* glossary entries;
* categories;
* tags;
* downloadable resources.

## Media Management

The administration panel should support media management, including:

* image uploads;
* YouTube video integration;
* document attachments;
* media organization.

Images should be inserted anywhere inside articles or tutorials to improve explanations and highlight important details.

## Messages & Support

Administrators should be able to:

* receive messages from users;
* reply to support requests;
* review previous conversations;
* manage user feedback.

The communication system should maintain a history of interactions with each user.

## Search Analytics

The administration panel should include a Search Analytics module.

This module should store search queries entered by users inside the application.

Its purpose is to identify what users are searching for and what information is missing from the platform.

The module should provide information such as:

* most searched terms;
* searches with no results;
* searches with poor results;
* search frequency;
* search trends over time.

This information can be used to improve:

* Knowledge Base articles;
* glossary entries;
* tutorials;
* FAQ content;
* search quality.

## Content Organization

Administrators should be able to:

* link related articles;
* connect tutorials with Knowledge Base entries;
* assign glossary terms;
* organize categories and tags.

This helps maintain a consistent and interconnected learning ecosystem.

## Future Expansion

The administration panel should be designed to support future features without major redesign.

Possible future modules include:

* analytics and reports;
* scheduled publishing;
* notification management;
* AI-assisted content generation;
* translation management;
* feature flags and experimental tools.

# 13. Search System

> **Phase 2:** Module-local search exists in the Glossary and Knowledge Base. Global search across Manual, Tutorials, Glossary, and Knowledge Base is not yet implemented.

The HFZWood search system should help users quickly find relevant educational and technical information inside the platform.

The main purpose of search is to provide fast access to the Manual, Tutorials, Knowledge Base and Glossary.

## Objectives

The search system should:

* help users find answers quickly;
* reduce confusion;
* connect related information;
* support learning;
* improve content discoverability.

## Search Scope

The initial search scope should include:

* Manual content;
* Tutorials;
* Knowledge Base articles;
* Glossary entries.

Saved user projects and calculation history may be searchable in a future version, but they are not part of the initial search scope.

## Search Results

Search results should be clear and easy to understand.

Each result should show:

* title;
* content type;
* short excerpt;
* category;
* relevance.

Examples of content types include:

* Manual
* Tutorial
* Knowledge Base
* Glossary

## Relevance

Search results should prioritize relevance.

Exact matches, glossary terms, manual sections and tutorial titles should be given higher priority when appropriate.

The system should help users find practical answers, not just pages that contain the searched word.

## No Results

When a search returns no results, the system should display a helpful message and may suggest:

* related terms;
* glossary entries;
* Knowledge Base categories;
* tutorials;
* contacting support.

No-result searches should also be recorded in Search Analytics so missing content can be identified and created later.

## Future Expansion

In future versions, the search system may support:

* saved project search;
* personal calculation history search;
* AI-assisted answers;
* multilingual search;
* advanced filters.

# 14. Computer Vision

Computer Vision is one of the core technologies and key differentiating features of HFZWood.

Its purpose is to assist users in analyzing uploaded images of wood pieces and epoxy resin areas, making the resin volume estimation process faster, more accurate and easier.

Computer Vision is designed to assist the user, not to replace user judgment.

## Objectives

The Computer Vision system should:

* analyze uploaded images;
* detect visible wood contours;
* suggest polygon boundaries;
* help identify resin areas;
* detect obvious cavities or cracks when possible;
* accelerate the measurement workflow;
* improve calculation accuracy.

## User Control

The user always remains in control of the measurement process.

Computer Vision should provide suggestions, while the final decisions belong to the user.

The user should be able to:

* accept or reject AI suggestions;
* adjust detected contours;
* manually edit polygon points;
* add or remove resin areas;
* define reference measurements;
* enter casting depth;
* enter cavity depths when necessary.

## Reference Measurements

Accurate reference measurements are essential for reliable calculations.

The user must provide a minimum of **four** reference measurements before the calculation process can continue.

These measurements allow the application to compensate for image perspective, lens distortion and irregular object geometry.

Additional reference measurements may further improve accuracy.

The application should not allow the user to proceed until the minimum required reference measurements have been completed.

## Depth Information

Computer Vision can analyze visible surface geometry, but it cannot reliably determine depth from a single image.

For this reason, the user must manually enter:

* the main casting depth;
* the depth of each cavity;
* different depths for separate resin zones whenever required.

## Image Analysis Workflow

After uploading an image, the user may activate Computer Vision.

The system may then suggest:

* wood contours;
* resin areas;
* possible cavities;
* polygon boundaries;
* regions requiring user confirmation.

The user reviews, edits and confirms all detected elements before the resin calculation begins.

## Limitations

Computer Vision should clearly communicate its limitations.

Results should always be presented as AI-assisted suggestions rather than final measurements.

Image quality, camera angle, lighting conditions, shadows and background complexity may affect detection accuracy.

## Future Expansion

Future versions of Computer Vision may support:

* automatic background removal;
* improved cavity detection;
* automatic perspective correction;
* intelligent placement suggestions for reference measurements;
* wood species recognition;
* surface defect detection;
* integration with future AI-assisted guidance features.

# 15. Project Management

Project Management allows users to save, organize and revisit their work inside the HFZWood platform.

Each calculation should belong to a project, enabling users to continue their work at any time and build a personal library of completed projects.

## Objectives

The Project Management system should:

* save ongoing work;
* organize projects;
* preserve calculation history;
* allow projects to be reopened and edited;
* help users build experience over time.

## Project Information

Each project may include:

* project name;
* creation date;
* last modified date;
* uploaded images;
* reference measurements;
* detected polygons;
* resin zones;
* casting depths;
* cavity depths;
* calculated resin volumes;
* user notes.

## Saving Progress

Users should be able to save a project at any stage of the workflow.

A project does not need to be completed before it can be saved.

Saved projects should remain editable until the user decides they are finished.

## Project Organization

Users should be able to:

* create projects;
* rename projects;
* duplicate projects;
* archive projects;
* delete projects;
* organize projects using folders, categories or tags in future versions.

## Project History

Projects should preserve previous calculations whenever appropriate.

This allows users to review earlier work, compare different calculations and learn from previous projects.

## Search and Filtering

Users should be able to locate projects easily using:

* project name;
* creation date;
* modification date;
* status;
* keywords.

Additional filtering options may be introduced in future versions.

## Reuse of Previous Projects

Previously completed projects may serve as useful references for future work.

Users can review similar projects, compare measurements and use previous calculations as a starting point when preparing estimates for new jobs.

## Synchronization

Projects should be securely linked to the user's account and remain available across supported devices.

## Future Expansion

Future versions may include:

* project sharing;
* collaboration with other users;
* project templates;
* project export and import;
* customer information;
* material cost estimation;
* quotation generation.

# 16. Security & Privacy

HFZWood should be designed with security and privacy as fundamental principles.

The platform should collect only the information necessary to provide its services and protect user data throughout the entire application.

## Objectives

The security and privacy architecture should:

* protect user accounts;
* protect saved projects;
* minimize the collection of personal data;
* ensure reliable authentication;
* comply with applicable privacy regulations.

## User Data

HFZWood should collect only the information required for account management and service delivery.

Typical user information may include:

* name or username;
* email address;
* subscription status;
* saved projects;
* application preferences.

Personal information that is not required by the platform should not be collected.

## Payment Information

HFZWood should not store payment card information.

Payment processing should be handled by trusted third-party payment providers.

The application should only store the information necessary to verify subscription status and payment history.

## Project Privacy

Projects uploaded by users should remain private.

Only the project owner and authorized administrators should have access when required for technical support or account management.

## Authentication

The platform should provide secure authentication and account management.

Users should be able to:

* change their password;
* reset forgotten passwords;
* manage active sessions where supported.

## Data Protection

User data should be protected against unauthorized access, accidental loss and unauthorized modification.

Appropriate backup and recovery procedures should be implemented to improve reliability.

## Future Expansion

Future versions may include:

* two-factor authentication;
* login notifications;
* device management;
* enhanced account security features;
* additional privacy controls.

# 17. Notifications

The HFZWood notification system should keep users informed about important events related to their account, projects and platform activity.

Notifications should be relevant, useful and non-intrusive.

## Objectives

The notification system should:

* inform users about important events;
* improve communication;
* increase platform usability;
* help users manage their projects and subscriptions.

## Account Notifications

Users may receive notifications regarding:

* account registration;
* email verification;
* password reset;
* successful login when appropriate;
* important account changes.

## Subscription Notifications

The platform may notify users about:

* successful subscription activation;
* payment confirmation;
* payment failure;
* upcoming subscription renewal;
* subscription expiration;
* subscription cancellation.

## Project Notifications

Project-related notifications may include:

* project successfully saved;
* calculation completed;
* export completed;
* project successfully restored;
* reminders for unfinished projects in future versions.

## Content Notifications

Users may be notified when new content becomes available, such as:

* new tutorials;
* new Knowledge Base articles;
* glossary updates;
* important application updates.

Users should be able to control whether they receive these informational notifications.

## Support Notifications

The notification system should inform users when:

* a support request has been received;
* a support reply is available;
* additional information has been requested.

## Notification Preferences

Users should be able to manage their notification preferences.

Whenever possible, users should be able to choose which categories of notifications they wish to receive.

## Future Expansion

Future versions may include:

* in-app notifications;
* email notifications;
* push notifications;
* personalized recommendations;
* intelligent reminders based on user activity.

# 18. Future AI Features

HFZWood is designed to support future AI-powered features that enhance learning, problem solving and project guidance.

These features are not part of the initial release but represent the long-term vision of the platform.

## Objectives

Future AI features should:

* simplify learning;
* provide reliable technical guidance;
* reduce common mistakes;
* improve the overall user experience.

## AI Knowledge

A future AI Knowledge assistant may answer user questions using only verified information available inside the HFZWood ecosystem.

Its knowledge sources may include:

* Manual;
* Tutorials;
* Knowledge Base;
* Glossary.

The objective is to provide accurate and consistent answers based on HFZWood content rather than generating generic internet responses.

## AI Coach

A future AI Coach may guide users through complete workflows.

Examples include:

* project preparation;
* wood inspection;
* sealing recommendations;
* formwork preparation;
* resin calculation workflow;
* finishing recommendations.

The AI Coach should support decision making while keeping the user in control of the project.

## Educational Assistance

Future AI capabilities may help users by:

* recommending relevant tutorials;
* suggesting Knowledge Base articles;
* explaining glossary terms;
* proposing the next learning step.

## Continuous Learning

Future AI systems may improve their recommendations as the HFZWood Knowledge Base, Tutorials and Glossary continue to grow.

However, all AI-generated guidance should remain aligned with the educational philosophy and technical standards of the HFZWood platform.

## Future Expansion

Possible future AI capabilities may include:

* multilingual assistance;
* voice interaction;
* project-specific guidance;
* intelligent troubleshooting;
* personalized learning recommendations.

# 19. Integrations

HFZWood should integrate with selected third-party services that improve the platform while keeping the core application independent and easy to maintain.

Only integrations that provide clear value to users should be included.

## Objectives

The integration architecture should:

* reduce development complexity;
* use reliable external services when appropriate;
* minimize unnecessary dependencies;
* allow future integrations without major architectural changes.

## Payment Integration

Subscription payments should be handled through a trusted payment provider.

The payment integration should support:

* subscription management;
* payment confirmation;
* subscription renewal;
* payment failure handling;
* refund support.

HFZWood should not store payment card information.

## Video Integration

Tutorial videos should be integrated through YouTube.

This allows:

* reliable video streaming;
* simplified content management;
* reduced storage requirements;
* easy replacement or updating of tutorial videos.

## Email Services

Email integration should support:

* account verification;
* password recovery;
* subscription notifications;
* support communication;
* important platform notifications.

## Cloud Storage

Cloud storage should be used for resources such as:

* uploaded project images;
* saved project files;
* application assets when appropriate.

The storage solution should provide reliability, scalability and secure access.

## Future Integrations

The platform architecture should allow additional integrations in future versions whenever they provide meaningful value.

Examples may include:

* additional payment providers;
* translation services;
* analytics platforms;
* AI services;
* cloud storage providers.
# 20. Design Principles

The following principles define the philosophy behind the HFZWood platform.

Every new feature and architectural decision should respect these principles whenever possible.

## Accuracy Over Speed

Accuracy is more important than speed.

HFZWood should always prioritize reliable calculations over reducing the number of user interactions.

## User Remains in Control

Artificial Intelligence should assist the user, not replace the user.

The final decision should always belong to the user.

## Real Measurements Matter

Calculations should always be based on real-world reference measurements.

AI assistance should improve the workflow but should never replace physical measurements.

## Educational First

HFZWood is not only a calculation tool.

It is an educational platform designed to help users understand woodworking and epoxy resin processes.

Every feature should contribute to learning whenever appropriate.

## Simplicity

The interface should remain clean, intuitive and easy to understand.

Complex calculations should happen behind the scenes.

## Modularity

The platform should be modular.

New features should be added without requiring major redesign of existing functionality.

## Scalability

The architecture should support continuous growth.

The platform should be capable of expanding with new tools, educational content and future AI features.

## Reliability

Users should be able to trust the results produced by the platform.

Whenever uncertainty exists, the application should clearly communicate limitations rather than providing misleading information.

## Continuous Improvement

HFZWood should evolve continuously.

New tutorials, Knowledge Base articles, glossary entries and platform features should increase the value of the ecosystem over time.

## Professional Focus

HFZWood is designed as a professional productivity and educational platform.

Every design decision should prioritize usefulness, clarity and long-term value over visual complexity or unnecessary features.

# 21. Roadmap & Future Development

HFZWood is designed as a long-term platform that will continuously evolve.

The initial release represents only the foundation of a much larger ecosystem.

Future development should focus on increasing the educational value, improving productivity and expanding the platform without compromising its core principles.

## Long-Term Vision

HFZWood aims to become a complete ecosystem for woodworking and epoxy resin professionals and enthusiasts.

The platform should combine:

* practical tools;
* educational content;
* project management;
* intelligent assistance;
* continuous learning.

## Future Functionalities

Possible future developments include:

* additional calculation tools;
* expanded Computer Vision capabilities;
* AI Knowledge;
* AI Coach;
* multilingual support;
* advanced project management;
* customer management;
* quotation generation;
* material cost estimation;
* analytics and reporting;
* collaboration features.

The inclusion and priority of these features will depend on user needs and platform evolution.

## Continuous Content Growth

The educational content should continue to expand over time.

Examples include:

* new tutorials;
* new Knowledge Base articles;
* glossary expansion;
* frequently asked questions;
* practical case studies.

The platform becomes more valuable as its educational resources continue to grow.

## Community Feedback

Future development should be guided by real user feedback.

Search Analytics, support requests, feature suggestions and common user questions should help determine future priorities.

## Flexibility

The roadmap should remain flexible.

Features may be added, modified or postponed as the platform evolves.

The objective is not to implement every possible feature, but to implement the features that provide the greatest value to users.

## Final Vision

HFZWood is intended to become more than a resin calculator.

It is designed to become a professional platform that combines practical tools, education and intelligent assistance into a single, continuously evolving ecosystem.

# 22. Conclusion

HFZWood is designed to be much more than a resin volume calculator.

Its purpose is to provide a complete ecosystem that combines practical tools, education, project management and future intelligent assistance into a single platform dedicated to woodworking and epoxy resin projects.

Every architectural decision described in this document is guided by a small number of core principles:

* accuracy over speed;
* simplicity over complexity;
* education over automation;
* user control over blind AI decisions;
* continuous improvement through real user feedback.

The first release establishes the foundation of the platform.

Future versions will continue to expand the ecosystem with new educational resources, improved tools and intelligent features, while preserving the philosophy that defines HFZWood.

The long-term objective is to create a platform that professionals, hobbyists and creators can trust as a reliable companion throughout every stage of their woodworking and epoxy resin projects.



