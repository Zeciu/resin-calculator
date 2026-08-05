# Local-only editorial backend

This directory contains authoring routes and DeepL integration. It is mounted only when `HFZWOOD_LOCAL_EDITORIAL=1` in local development. Normal Cognito authentication still applies, but any authenticated local user may use these routes: there is no editorial role or entitlement gate.

It must never be copied into a production Docker stage. Production `public.app` has no static private imports and does not mount `/api/admin` routes unless this local-only flag is set.
