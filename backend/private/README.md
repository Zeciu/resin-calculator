# Local-only editorial backend

This directory contains authoring routes and DeepL integration. It is loaded only when `HFZWOOD_LOCAL_EDITORIAL=1` in local development.

It must never be copied into a production Docker stage. Production `backend/app.py` has no static private imports and does not mount `/api/admin` routes unless this local-only flag is set.
