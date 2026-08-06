# Phase 6 — Implementation Record, Part 2

## Delivered

- First save creates a canonical project envelope with `projectId`, Cognito `ownerId`, primary-image hash, creation time, and stable initial version metadata.
- Opening a project owned by another user, or without an owner, makes it read-only in the application.
- Cognito is the only runtime authentication path. Test adapters are test-only.
- Capability limits, recent project handles, local preferences, calculator input limits, Stripe billing, and DynamoDB entitlements are implemented.
- Production serves `/app/public/content` from the packaged image. Editorial authoring is local-only.
- DynamoDB point-in-time recovery protects entitlements. There is no EFS filesystem or AWS Backup plan.

## TODO

### TODO-001 — Primary-image enforcement

The primary-image hash is recorded at first save but not checked on update. Enforce the immutable-image rule or replace it with a supported change workflow.

### TODO-002 — Live release validation

Complete the deployed-environment validation recorded in `phase-6-simplified-execution-plan.md`.

Historical EFS and filesystem-entitlement records are superseded by the current DynamoDB design.