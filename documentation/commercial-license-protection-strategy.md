# Commercial license protection strategy

## Existing controls

- Cognito `sub` is the stable authenticated user ID.
- DynamoDB stores commercial entitlement records.
- The backend resolves `free` and `subscriber` capabilities.
- Stripe webhooks are authoritative for subscription changes.
- Local project files record an owner ID and are opened read-only for other users.

These controls do not limit the number of devices using an account.

## TODO — device registry

Implement a server-side device registry only after Phase 6 live release validation.

Required behavior:

- Register an authenticated device against its user ID.
- Store a generated device ID, first/last-seen timestamps, revocation state, and minimal display metadata.
- Enforce tier-specific device limits in backend capability resolution.
- Let users list and revoke their registered devices.
- Define re-registration, lost-device, privacy, retention, and support-recovery rules before implementation.

There is no administrator exemption because the production application has no administrator role.