# Local-only editorial frontend

Everything in this directory is editorial-authoring code. It may be resolved by the local Vite development server and Vitest, but it must never enter a production build or Docker image.

Production Vite builds resolve `@private-editorial-routes` to the null module in `frontend/public/src/private/`. Do not add a static import from `frontend/public/` to this directory. Docker must copy only `frontend/public/`.
