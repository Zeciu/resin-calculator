# Phase 5 — Technical Architecture

## Current architecture

- React/Vite frontend; FastAPI backend; relative browser API paths.
- Cognito authentication is required in every environment. There is no mock-auth mode.
- Project persistence is local `.hfzproject` JSON with browser file handles, recent-project index, dirty-state checks, and unsaved-change protection.
- Project files carry `projectId`, `ownerId`, primary-image hash, creation time, and stable initial version metadata.
- Entitlements are persisted in DynamoDB. Stripe Checkout, Portal, and signed webhooks manage their state.
- Local editorial content is filesystem-backed. Production packages the read-only public corpus in the Docker image.
- AWS CDK defines Cognito, ECR, ECS/Fargate, ALB, DynamoDB entitlements, CloudWatch alarms, DNS, and TLS.
- `test.cmd` runs the full backend and frontend suites.

## TODO

### TODO-001 — Immutable primary image

Reject project updates whose primary image no longer matches the hash captured at first save.

### TODO-002 — Cloud project workspace

Implement owner-scoped cloud persistence, synchronization status, conflict detection and explicit resolution, and last-copy deletion protection.

### TODO-003 — Offline capability cache

If offline use is required, cache the last server capability response with an expiry and define fail-closed behavior after expiry. No offline capability window exists today.

### TODO-004 — Image import validation

Validate image MIME type, file size, decoded dimensions, and malformed input before loading or saving project images.

The former EFS, S3, content-DynamoDB, mock-auth, and server-synchronized-preference plans were superseded and are not TODOs.