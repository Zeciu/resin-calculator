# Phase 3 — Technical Architecture

**Status:** implemented locally; production packaging was finalized in Phase 6.

## Architecture

- `frontend/private/` and `backend/private/` contain local-only editorial UI, routes, and DeepL integration.
- Local editorial data is stored through `FilesystemContentRepository` under `CONTENT_DATA_DIR`.
- Manual, Glossary, Knowledge Base, and website variants are drafted locally and published to snapshots.
- Production copies only the public frontend/backend runtime and the published corpus. It has no editorial routes, authoring UI, or DeepL credentials.
- Public content readers require Cognito authentication. Knowledge Base entries are limited by the resolved capability tier.
- Local editorial access has normal Cognito authentication only; it has no special administrator authorization. It is currently also gated behind the local-only `HFZWOOD_LOCAL_EDITORIAL` flag. Editorial routes are never deployed to AWS, so the deployment boundary is already the access control and the flag is redundant — see `product-architecture-decisions.md` TODO-004 to remove it.

## Superseded design

The proposed S3 asset store, content DynamoDB table, presigned-upload workflow, mock-auth headers, administrator Cognito group, and server-side preference API were not implemented and are not part of the current architecture.

One Phase 3 technical TODO remains: TODO-004 in `product-architecture-decisions.md` (remove the local-only editorial gate).