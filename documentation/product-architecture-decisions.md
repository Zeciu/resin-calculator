# HFZWood architecture decisions

This document records implemented architecture and explicit implementation TODOs. Code and deployment configuration take precedence.

## Implemented

### AD-001 — Application runtime

- React/Vite single-page application with a FastAPI backend.
- Interactive canvas work runs in the browser. Calculations, input validation, authentication, billing, and capability resolution run in FastAPI.
- Production is a single ECS Fargate service behind an HTTPS Application Load Balancer. AWS CDK defines the infrastructure.

### AD-002 — Authentication and commercial access

- Cognito is required in local and production environments. FastAPI validates Cognito JWTs.
- Authenticated identities have the application role `user`; production has no administrator role or bypass.
- Access tiers are `free` and `subscriber`. FastAPI resolves the capability set from the stored tier.
- DynamoDB stores commercial entitlement records. Stripe Checkout, Customer Portal, and signed webhooks manage them; a Checkout return URL does not grant access.

### AD-003 — Local project files

- Projects are `.hfzproject` files managed by the browser, not server records.
- Saving requires a project name, an image, and at least one completed reference measurement.
- The browser uses the File System Access API when available, otherwise downloads the file. Recent-project metadata and file handles stay in browser storage.
- A project file records its Cognito owner ID. The application opens files owned by another user, or without an owner, as read-only. This is a client-side write guard, not server-side project authorization.

### AD-004 — Content release

- Manual, glossary, knowledge-base, and website content are published snapshots.
- Editorial authoring, publishing, uploads, and DeepL translation currently run locally only. Any authenticated local user can use those routes; there is no separate editorial role or entitlement gate. Editorial routes are never deployed to AWS — `backend/private` is excluded from the Docker build context — so the deployment boundary is already the access control.
- Production packages a read-only public corpus and excludes editorial routes, UI, data, and DeepL integration. Content changes require a new image deployment.
- Private published snapshots are not copied into the production image automatically. After Admin Publish, package selected Manual/Knowledge Base locales with `python -m private.tools.package_published_content` (dry-run by default; `--apply` writes). That helper does not publish drafts, generate translations, or deploy; Git commit and image deployment remain required. See `backend/private/README.md`.

### AD-005 — Device preferences

Interface language and measurement units are device preferences stored in browser local storage.

### AD-006 — Calculator scope

- The calculator supports Standard Resin Area and Wood Boundary modes.
- No AI image recognition or AI service is needed.

## TODO

### TODO-001 — Enforce immutable primary images

The first save stores a SHA-256 hash of the primary image, but updates do not compare the current image with that hash. Reject an update that changes the primary image, or explicitly replace this requirement with a supported image-change workflow.

### TODO-002 — Add cloud projects only with explicit synchronization rules

There is no cloud project storage, backup, sharing, collaboration, or synchronization. If added, implement server-side project persistence keyed by owner, version/conflict detection, explicit user conflict resolution, and protection against deleting the last remaining copy.

### TODO-003 — Implement or remove AI capability fields

The capability catalog reserves AI fields and enables them for subscribers, but no AI endpoint, UI, request limit, or provider integration exists. Implement those pieces with server-side limit enforcement, or remove the fields from the catalog.
