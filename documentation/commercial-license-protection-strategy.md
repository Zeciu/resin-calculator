Document title
HFZWood â€” Commercial License Protection Strategy
1. Purpose

Explain that HFZWood intends to support two paid commercial access models:

recurring subscriber access;
possible lifetime access.

Both models require proportionate protection against deliberate account credential sharing.

Project ownership alone does not solve this problem.

If several people use the same username and password, they appear to HFZWood as the same authenticated Cognito identity and can all consume the same paid entitlement.

The objective is not perfect DRM.

The objective is to make casual and repeated credential sharing inconvenient and commercially unattractive without creating unreasonable friction for legitimate customers.

2. Existing protection

Record that HFZWood already has:

stable authenticated identity through Cognito sub;
Project ownership through stable ownerId;
read-only behavior for foreign-owned Projects;
backend-owned entitlements;
backend-owned Product Capability resolution;
subscriber and administrator capability boundaries;
local-first Project persistence.

Clarify that these protections prevent ownership confusion but do not distinguish several people intentionally sharing the same authenticated account.

3. Approved product direction

Record the current preferred product direction:

one commercial device-management system for both subscribers and lifetime purchasers;
recommended limit: three active devices per paid account;
administrators remain exempt;
My Account should contain a simple device-management area;
users should be able to see and revoke registered devices;
legitimate hardware replacement should normally be self-service;
exceptional support-assisted reset should remain possible;
no browser fingerprinting;
no IP-household enforcement;
no geolocation enforcement;
no strict machine-bound licensing;
no automatic punishment based on ambiguous risk signals;
no concurrent-session blocking at the initial stage;
no hostile DRM experience.

Device-limit messages must be neutral and familiar:

explain the allowed number of devices;
show the current device list;
allow removal of an old device;
avoid accusatory anti-fraud language.
4. Subscriber and lifetime policy

Record that subscribers and lifetime purchasers should initially use the same device-limit and device-management rules.

A lifetime purchase grants permanent commercial access to one account.

It does not grant an unlimited transferable license shared permanently between unrelated people.

Normal computer replacement, browser replacement, loss, theft, or hardware failure must not permanently block a legitimate lifetime purchaser.

Do not create separate device-protection architectures for subscriber and lifetime access unless a later product requirement proves this necessary.

5. Current technical uncertainty

State explicitly that the strategy is approved only at product level.

The final technical mechanism is not yet approved.

A future repository analysis must compare at least:

Option A â€” Cognito remembered-device support

Evaluate:

whether the current Amplify and Cognito authentication flow exposes and persists device keys;
whether Cognito device tracking works with the exact HFZWood login flow;
whether a Cognito remembered device corresponds reliably to the commercial device unit HFZWood wants to count;
whether device revocation invalidates or limits existing refresh sessions as required;
whether device-count enforcement can occur safely before or during authentication;
how browser clearing, new profiles, private browsing, and reinstall behave.
Option B â€” HFZWood backend device registry

Evaluate:

a browser-generated device identifier stored locally;
a backend device record bound to Cognito sub;
registration after successful authentication;
server-side active-device counting;
self-service revocation;
token/session behavior after revocation;
how trustworthy the identifier is;
whether it is sufficient as a practical deterrent even though it cannot provide unbreakable device identity.
Option C â€” Hybrid model

Evaluate whether Cognito should provide authentication identity and session control while HFZWood maintains the commercial device registry.

Do not assume Cognito remembered devices alone are sufficient.

Do not assume a custom registry is automatically necessary.

The future analysis must inspect the actual repository and authentication behavior before selecting the mechanism.

6. Minimum possible device record

Record the provisional minimum information that may be required:

stable authenticated user ID;
device registration ID;
human-readable device label;
registration timestamp;
last-seen timestamp;
revocation timestamp or active state.

Avoid collecting unless later justified:

precise location;
full IP history;
browser fingerprint;
invasive hardware data;
behavioral profile.

Any final data model must remain proportionate to European privacy and user-trust expectations.

7. Offline behavior

Record that offline access requires a separate careful decision.

Do not adopt the claim that paid capabilities may remain available offline indefinitely.

The future analysis must reconcile device protection with the approved subscription and offline architecture, including:

periodic entitlement revalidation;
subscription expiration while offline;
lifetime access while offline;
revoked devices remaining offline;
reasonable offline grace periods;
protection against technical failures being interpreted as an immediate downgrade.

Do not implement signed license leases or offline DRM without evidence that they are necessary.

8. Explicit limitations

State clearly that no browser-based solution can completely prevent:

credentials being shared within the permitted device count;
browser storage being cleared;
a new browser profile appearing as a new device;
VPN use;
coordinated device replacement;
deliberate attempts to bypass reasonable controls.

Success means:

casual sharing becomes inconvenient;
the account owner can see registered devices;
repeated sharing creates visible device churn;
the product retains the ability to respond later if real abuse becomes material.

Perfect enforcement is not an objective.

9. Deferred mechanisms

Record as intentionally deferred unless real abuse proves they are necessary:

browser fingerprinting;
IP or geolocation household detection;
simultaneous-session blocking;
behavior-based fraud scoring;
strict hardware-bound activation;
licensing microservices;
Redis or queue-based session enforcement;
signed offline licensing infrastructure;
automatic account suspension;
team or seat-based commercial plans.

A future team plan may be considered as a commercial solution for legitimate multi-person workshop use, but it is not part of the current protection task.

10. Future task trigger

This work must not interrupt the active Stripe and commercial entitlement implementation.

The dedicated future task should be opened only after:

Task 5.2 â€” Stripe Subscription and Durable Entitlements is closed;
Task 5.3 â€” Integrated Commercial Production Validation is closed or sufficiently understood;
the final subscriber entitlement flow is known;
the lifetime commercial model is defined sufficiently to understand its entitlement representation.

Provisional future task name:

Account Device Registry and Commercial License Protection

Before implementation, the task must begin with a repository-level pre-implementation analysis.

11. Mandatory future analysis questions

The future analysis must answer:

What real device/session information is available from the current Cognito and Amplify implementation?
Can Cognito remembered devices safely serve as the commercial device registry?
Is a separate backend registry required?
What exactly counts as one device?
How and when is a device registered?
How is the three-device limit enforced?
What happens when browser storage is deleted?
How does self-service revocation affect existing tokens and sessions?
What happens to a revoked device while offline?
What persistence mechanism is sufficient for launch?
Does the solution work identically for subscriber and lifetime entitlements?
What data collection is genuinely necessary?
What Product Owner decisions remain before implementation?
12. Current Product Owner decisions

Record the provisional decisions:

commercial account sharing must be addressed before or as part of commercial release readiness;
target limit: three active devices;
same limit for subscriber and lifetime access;
self-service device management is preferred;
administrators bypass the limit;
protection must remain proportional and non-hostile;
technical implementation remains subject to future repository analysis.

Mark these decisions as approved product direction, not final technical architecture.

13. Scope rule

This document must not authorize implementation automatically.

Its purpose is to preserve the strategy and prevent the issue from being forgotten.

Implementation may begin only after:

the current commercial tasks are completed;
a dedicated pre-implementation analysis is reviewed;
the Product Owner approves the final technical scope.
