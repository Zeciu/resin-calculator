# Phase 4 — Product Architecture

## Current modules

- **Projects:** browser-managed `.hfzproject` files. A first save requires an image and completed reference measurement.
- **Calculator:** Standard Resin Area and Wood Boundary modes, calibration, calculation, and capability-gated exports.
- **Learning:** authenticated Manual, Glossary, and Knowledge Base readers backed by published content snapshots.
- **Identity:** Cognito identity; the user ID is the Cognito `sub`.
- **Commercial access:** `free` and `subscriber` entitlements resolved by the backend from DynamoDB state.
- **Settings:** interface language and measurement units stored on the current device.
- **Editorial:** local-only authoring and publishing; production is a read-only public-content release.

## Boundaries

There is no Cloud Workspace, project synchronization, project sharing, server-side preference sync, administrator role, or production editorial authoring.

## TODO

- Enforce immutable primary images: the hash is stored on first save and preserved unchanged on updates, but nothing compares it against the current image on update to detect a silent replacement. Add that comparison.
- Implement cloud project persistence and the conflict/last-copy safeguards defined in `product-architecture-decisions.md`.
- Implement an AI service with server-side limits, or remove the reserved AI capability fields.
