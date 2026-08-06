# Phase 3 — Editorial, Preferences, and Capabilities

**Status:** complete; later deployment decisions supersede obsolete storage and role plans.

## Delivered

- Local editorial workspaces for website, Manual, Glossary, and Knowledge Base content.
- Draft, translation, review, publish, image-upload, and cross-reference workflows.
- Published content snapshots and public-language configuration.
- Device preferences for interface language and units.
- Free/subscriber capability catalog and account billing surface.

## Current state

- Romanian is the canonical editorial source locale. Public languages are configured from the editorial corpus.
- Editorial routes and UI require the local-only `backend/private` source, which is excluded from the Docker build context. Any authenticated local user may use them; there is no administrator Cognito group or entitlement bypass. Editorial routes are never deployed to AWS, so the deployment boundary is already the access control.
- Preferences are device-local browser storage. They are not synchronized through a backend API.
- Local editorial content uses the filesystem. Production serves the packaged public corpus; it does not use S3 or a content DynamoDB table.

Server-synchronized preferences and cloud editorial storage are not current requirements.