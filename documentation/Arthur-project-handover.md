# Project handover

## Current implementation

- Frontend: React/Vite under `frontend/public/src/`; local-only editorial UI under `frontend/private/`.
- Backend: FastAPI public runtime under `backend/public/`; local-only editorial routes and DeepL integration under `backend/private/`.
- Authentication: Cognito in every environment; no mock-auth or administrator-role bypass.
- Projects: local canonical `.hfzproject` v2 files. Foreign-owned or ownerless files are read-only in the application.
- Content: authored locally, committed to Git, then packaged as the read-only production corpus at `/app/public/content`.
- Commercial access: Stripe webhooks update DynamoDB entitlements; the backend resolves `free` or `subscriber` capabilities.
- Deployment: CDK defines Cognito, ECR, ECS/Fargate, ALB, DNS/TLS, CloudWatch alarms, and DynamoDB entitlements.

## Commands

- Start locally: `./dev.cmd`
- Full validation: `./test.cmd`
- Production frontend build: `npm run build --prefix frontend`

## Local setup prerequisites

- Copy `dev.local.example.cmd` to `dev.local.cmd` (gitignored) and set a real `DEEPL_AUTH_KEY`/`DEEPL_API_BASE_URL`. `dev.cmd` loads it automatically if present.
- AWS CLI must be installed and configured with an `hfzwood` profile (or set `HFZWOOD_AWS_PROFILE` to override). `dev.cmd` assumes the ECS task role through that profile to reach DynamoDB entitlements, and fails fast if the CLI or role assumption is unavailable.
- Local editorial routes mount whenever `backend/private` is importable, which is only true when running from source. Production never has that source, since `backend/private` is excluded from the Docker build context.

## Open work

- Phase 6 live release validation.
- Product-owner QA record for bulk translation scenarios.
- Deferred product work listed in `product-architecture-decisions.md` and `application-design.md`.

Do not use older EFS, mock-auth, S3/content-DynamoDB, or administrator-role notes; they are superseded.