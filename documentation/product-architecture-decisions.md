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
- Editorial authoring, publishing, uploads, and DeepL translation currently run locally only, gated by the `HFZWOOD_LOCAL_EDITORIAL` flag. Any authenticated local user can use those routes; there is no separate editorial role or entitlement gate. Editorial routes are never deployed to AWS, so the deployment boundary is already the access control — see TODO-004 to remove the redundant flag gate.
- Production packages a read-only public corpus and excludes editorial routes, UI, data, and DeepL integration. Content changes require a new image deployment.

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

### TODO-004 — Remove the local-only flag gate on editorial content

Editorial routes are never deployed to AWS; only the dev team runs them, and only locally. That deployment boundary is the access control, so no additional authorization is needed — authentication alone is sufficient, matching the no-editorial-role model. The `HFZWOOD_LOCAL_EDITORIAL` environment-flag gate in `backend/public/app.py` (and the corresponding `dev.cmd` setting) is redundant with that deployment boundary and should be removed, so the editorial routers mount whenever Cognito authentication is configured, without a separate local-only flag.
