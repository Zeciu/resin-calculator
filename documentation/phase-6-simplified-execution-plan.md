# Phase 6 — Release Status

## Delivered

- Local project v2 files, first-save identity, ownership read-only behavior, and capability-aware calculator limits.
- Cognito-only runtime authentication and browser-local preferences/recent project handles.
- Local editorial authoring with published snapshots; production packages a read-only corpus at `/app/public/content`.
- DynamoDB commercial entitlements with point-in-time recovery; Stripe Checkout, Portal, and signed webhook processing.
- ECS/Fargate deployment behind HTTPS ALB, CORS restriction, calculator input limits, and ALB/ECS CloudWatch alarms.
- Unified automated validation through `test.cmd`.

## Not implemented

- Cloud project storage, synchronization, conflict handling, and sharing.
- Immutable primary-image enforcement.
- AI service integration despite reserved capability fields.
- A 60-day subscription grace period.
- EFS, S3 content storage, content DynamoDB storage, production editorial authoring, and AWS Backup plans.

## TODO — Live release validation

Before release closure, validate the deployed system with real Cognito and Stripe configuration:

1. Sign in and access authenticated content.
2. Complete Checkout, Portal, and signed webhook flows; verify DynamoDB entitlement updates.
3. Restart or redeploy the task; verify published content and entitlements remain available.
4. Trigger or inspect ALB and ECS alarm delivery.

This is the remaining Phase 6 gate.