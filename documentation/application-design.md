# HFZWood application design

## Current product

- Public Home route with Cognito-protected New Project, Projects, Manual, Glossary, Knowledge Base, and Account modules.
- Local `.hfzproject` files with browser save/open, recent-project handles, ownership read-only behavior, and unsaved-change protection.
- Resin calculator with Standard Resin Area and Wood Boundary modes, reference calibration, backend calculation, and capability-gated export.
- Manual, Glossary, Knowledge Base, and website content read from published snapshots. Local editorial tooling authors and publishes that content.
- `free` and `subscriber` capabilities are resolved by the backend from DynamoDB entitlements. Stripe Checkout, Portal, and webhooks manage subscription state.
- Interface language and measurement units are device-local preferences.

## Boundaries

- Production has no editorial UI or routes.
- Projects have no cloud storage, sharing, or synchronization.
- There is no AI image recognition, user-management admin area, support inbox, analytics dashboard, or notification system.

## TODO

- Build a public marketing landing page; the app currently enters through the workspace shell and has no marketing route.
- Add project rename, duplicate, archive, delete, and organization operations to the local project workflow.
- Add per-project calculation history.
- Add cross-module content search and article bookmarks.
- Add a notification system; the Account page currently shows a placeholder string with no underlying notifications, storage, or delivery mechanism.
- Add separate administration for users, support, and analytics if those operations are required. Do not extend the local editorial UI implicitly.
