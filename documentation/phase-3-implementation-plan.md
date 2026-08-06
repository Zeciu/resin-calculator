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
- Editorial routes and UI currently require the local-only `HFZWOOD_LOCAL_EDITORIAL` flag. Any authenticated local user may use them; there is no administrator Cognito group or entitlement bypass. Editorial routes are never deployed to AWS, so the deployment boundary is already the access control. See `product-architecture-decisions.md` TODO-004: the flag gate is redundant with that boundary and should be removed.
- Preferences are device-local browser storage. They are not synchronized through a backend API.
- Local editorial content uses the filesystem. Production serves the packaged public corpus; it does not use S3 or a content DynamoDB table.

Server-synchronized preferences and cloud editorial storage are not current requirements. Removing the local-only editorial gate (TODO-004) is the one remaining Phase 3 item.