# Local-only editorial backend

This directory contains authoring routes and DeepL integration. Normal Cognito authentication still applies, but any authenticated local user may use these routes: there is no editorial role or entitlement gate.

These routes are never deployed to AWS — `backend/private` is excluded from the Docker build context, so only the dev team runs them, and only locally. That deployment boundary is the access control.

It must never be copied into a production Docker stage. Production `public.app` has no static private imports and does not mount `/api/admin` routes because `backend/private` is not present in the image.
