# Phase 3 — Technical Architecture

**Status:** implemented locally; production packaging was finalized in Phase 6.

## Architecture

- `frontend/private/` and `backend/private/` contain local-only editorial UI, routes, and DeepL integration.
- Local editorial data is stored through `FilesystemContentRepository` under `CONTENT_DATA_DIR`.
- Manual, Glossary, Knowledge Base, and website variants are drafted locally and published to snapshots.
- Production copies only the public frontend/backend runtime and the published corpus. It has no editorial routes, authoring UI, or DeepL credentials.
- Public content readers require Cognito authentication. Knowledge Base entries are limited by the resolved capability tier.
- Local editorial access has normal Cognito authentication only; it has no special administrator authorization. Editorial routes are never deployed to AWS — `backend/private` is excluded from the Docker build context — so the deployment boundary is already the access control.

## Superseded design

The proposed S3 asset store, content DynamoDB table, presigned-upload workflow, mock-auth headers, administrator Cognito group, and server-side preference API were not implemented and are not part of the current architecture.