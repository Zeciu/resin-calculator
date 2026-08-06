# Phase 4 — Product Direction

## Implemented foundation

- HFZWood is local-first: projects are `.hfzproject` files saved by the browser.
- A saved project records the Cognito owner ID. Files opened by another user are read-only in the application.
- Free and subscriber tiers exist. Stripe webhooks update persisted entitlements.
- PDF export is available through the calculator capability model. Editable project sharing is not implemented.

## TODO

### TODO-001 — Cloud projects and synchronization

Implement owner-scoped cloud project persistence, a Cloud Library, upload/download status, version/conflict detection, explicit conflict resolution, and last-copy deletion protection. Do not add automatic merge or silent overwrite behavior.

### TODO-002 — 60-day subscription grace period

The documented 60-day grace policy is not implemented. The Stripe mapper currently changes canceled or unpaid subscriptions to `free`. Persist a grace deadline and make capability resolution enforce the intended access and retention behavior until it expires.

Trusted-device controls, marketplace features, and AI-assisted editing are not current requirements.