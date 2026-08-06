# Local-only editorial backend

This directory contains authoring routes and DeepL integration. It is currently mounted only when `HFZWOOD_LOCAL_EDITORIAL=1` in local development. Normal Cognito authentication still applies, but any authenticated local user may use these routes: there is no editorial role or entitlement gate.

These routes are never deployed to AWS — only the dev team runs them, and only locally — so the deployment boundary is already the access control. TODO (see `documentation/product-architecture-decisions.md` TODO-004): remove the `HFZWOOD_LOCAL_EDITORIAL` flag gate, since it is redundant with that boundary.

It must never be copied into a production Docker stage. Production `public.app` has no static private imports and does not mount `/api/admin` routes unless this local-only flag is set.
