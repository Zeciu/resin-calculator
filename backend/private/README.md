# Local-only editorial backend

This directory holds everything editorial:

- `routers/` — authoring routes plus the local content reader that reads back what they write.
- `services/`, `schemas/`, `repositories/` — editorial domain logic, validation, and the filesystem store.
- `translation/` — DeepL integration.
- `content/` — the editorial source of truth. Admin Publish writes snapshots under `content/published/`. Production still reads only `backend/public/content/`, so a separate packaging step copies selected published snapshots there.
- `tools/` — local developer utilities. Never packaged into the production image.

Normal Cognito authentication still applies, but any authenticated local user may use these routes: there is no editorial role or entitlement gate.

These routes are never deployed to AWS — `backend/private` is excluded from the Docker build context, so only the dev team runs them, and only locally. That deployment boundary is the access control.

It must never be copied into a production Docker stage. Production `public.app` has no static private imports and does not mount `/api/admin` routes because `backend/private` is not present in the image.

## Packaging published content for production

Admin Publish writes `backend/private/content/published/`. Production Docker copies only `backend/public/`, so selected snapshots must be packaged with:

```
uv run --project backend python backend/private/tools/package_published_content.py --module MODULE --locale LOCALE
```

From `backend/`, the equivalent is `python -m private.tools.package_published_content`. Dry-run is the default and writes nothing.

- Source of truth: `backend/private/content/published/**` (already-published snapshots). Not the editorial store.
- Romanian (`ro`) is the canonical editorial corpus. Translations are created intentionally from Romanian in Admin, then published, then packaged. Non-RO locales are not auto-filled from Romanian.
- Supported modules: `manual`, `knowledge-base`, `glossary`. Repeat `--module` to package more than one. Website, config, and editorial data are not supported.
- Locale is required. There is no silent “all locales” default. Packaging `ro` does not touch `en`. There is no automatic all-locale destructive synchronization.
- `--apply` writes the requested JSON and any missing/different images those snapshots reference. Unrelated public images are never deleted.
- If destination IDs would be removed, `--apply` refuses unless `--allow-id-removal` is also passed.
- The tool does not publish drafts, generate translations, talk to AWS, commit, or deploy. After `--apply`, production still requires a normal Git commit and image deployment.

Examples (dry-run unless `--apply` is added):

```
uv run --project backend python backend/private/tools/package_published_content.py --module manual --locale ro
uv run --project backend python backend/private/tools/package_published_content.py --module knowledge-base --locale ro
uv run --project backend python backend/private/tools/package_published_content.py --module glossary --locale ro
uv run --project backend python backend/private/tools/package_published_content.py --module manual --module knowledge-base --module glossary --locale ro
uv run --project backend python backend/private/tools/package_published_content.py --module knowledge-base --locale en --apply --allow-id-removal
```
