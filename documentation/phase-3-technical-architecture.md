# Phase 3 Technical Architecture

This document defines **how** Phase 3 will be implemented. The approved product architecture is defined in [phase-3-implementation-plan.md](./phase-3-implementation-plan.md) (Tasks 58–66). All product decisions in that document are final; this document derives the technical implementation required to satisfy them.

---

## 1. Scope and Principles

Phase 3 transforms static Phase 2 educational content into an administrator-managed editorial system while preserving:

- stable content identifiers and public reading experiences;
- canonical internal units (millimeters, liters, square centimeters) for calculations and `.hfzproject` persistence;
- user preferences affecting presentation and data entry only;
- the Manual as one continuous published document assembled from chapters and sections.

### 1.1 Architectural principles

| Principle | Technical implication |
|-----------|----------------------|
| IP protection | Publish validation, cross-reference integrity, and content assembly run in the Python backend |
| Fast UX where required | Rich-text editing, preview, and canvas interactions stay in the frontend; server round-trips on save/publish |
| Fail secure | Authorization enforced on backend routes and frontend navigation; admin UI invisible to standard users |
| Immediate publish | Published content becomes the public read model without redeploying the frontend |
| Extensibility | Data model and API namespaces support future roles, locales, and preference keys without redesign |

### 1.2 Out of scope (technical)

Same as the product plan: version history, collaborative editing, AI, semantic search, automatic translation, CDN tuning, enterprise DAM, audit logs, per-document permissions.

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser (React SPA)                              │
├──────────────────────────────┬──────────────────────────────────────────┤
│  Public modules              │  Admin Panel (authenticated administrators) │
│  Manual / Glossary / KB      │  Content editors, media library, publish   │
│  Preferences UI              │  Cross-reference & asset managers          │
└──────────────┬───────────────┴──────────────────┬───────────────────────┘
               │ GET public content               │ Admin CRUD + publish
               │ GET/PUT preferences              │ Media upload
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    FastAPI backend (Fargate)                               │
│  • Public content API (published snapshots)                              │
│  • Admin content API (draft + publish pipeline)                          │
│  • Media upload & asset registry                                         │
│  • Preferences API                                                       │
│  • Auth middleware (Cognito JWT + Phase 3 mock/dev mode)               │
│  • Validation, assembly, reference integrity                             │
└──────┬──────────────────────┬──────────────────────┬───────────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  DynamoDB    │    │  S3              │    │  Cognito        │
│  Editorial   │    │  Media objects   │    │  User Pool      │
│  metadata    │    │  Published       │    │  (groups/claims)│
│  preferences │    │  snapshots       │    │                 │
└──────────────┘    └──────────────────┘    └─────────────────┘
```

**Content delivery path:** Public modules never read static `*Content.js` files in production after migration. They fetch **published snapshots** from the backend. Static files remain only as migration source input and optional local-dev fallback behind an explicit feature flag.

---

## 3. Backend Responsibilities

The Python backend owns all authoritative editorial and read-model logic.

### 3.1 Public read API

- Serve assembled Manual document per locale from published snapshots.
- Serve Glossary entry lists and entry detail per locale.
- Serve Knowledge Base entry lists, filters, and entry detail per locale.
- Resolve content language using the rules in §8.2.
- Return structured JSON matching existing Phase 2 render contracts (blocks, sections, metadata) so public React components change minimally.

### 3.2 Admin editorial API

- CRUD for logical content items and per-locale variants (Draft state).
- Chapter/section ordering for Manual; entry ordering for Glossary and Knowledge Base.
- Publish and unpublish per locale variant (independent per language).
- Media upload initiation, completion, metadata update, soft-delete protection.
- Cross-reference CRUD with integrity checks.
- Asset usage registry queries (where-used).
- Admin-only preview endpoints that return Draft or Published based on query flag.

### 3.3 Publish pipeline (backend-owned)

On publish, the backend:

1. Validates variant payload against content-type schema.
2. Validates semantic blocks, media references, and internal links.
3. Verifies all referenced content IDs exist and targets are publishable (or already published) for cross-module links.
4. Rebuilds denormalized reference indexes and asset usage records.
5. Writes an immutable **published snapshot** to S3.
6. Updates DynamoDB variant status and snapshot pointer.
7. Returns success or structured validation errors (no partial publish).

Unpublish sets variant status to Draft and removes the locale from the public snapshot assembly; existing snapshot objects may be retained for rollback during Phase 3 (no version history UI).

### 3.4 Preferences API

- `GET /api/preferences` — current user's preferences (authenticated).
- `PUT /api/preferences` — update allowed keys.
- Store per-user document in DynamoDB; validate keys and enum values server-side.

### 3.5 Authorization enforcement

- All `/api/admin/**` routes require authenticated administrator role.
- Public content routes are unauthenticated.
- Preferences routes require authenticated user (any role).
- Calculator and project APIs unchanged; continue existing auth behavior.

### 3.6 What stays out of the backend

- Rich-text caret movement, WYSIWYG formatting interactions, drag-and-drop reorder UI.
- Display-unit conversion for live calculator inputs (frontend converts to/from canonical before API calls, as today).
- Interface string localization bundles (frontend i18n files).

---

## 4. Frontend Responsibilities

### 4.1 Public product surface

- Manual, Glossary, Knowledge Base pages fetch published content from the public API.
- Preserve Phase 2 layouts, navigation patterns, TOC anchors, A–Z glossary, KB filters/search-over-local-list.
- Apply user preferences: interface language (i18n), display units via conversion helpers.
- When the requested content language is unavailable, show a localized message and an explicit “View English version” action when an English published variant exists; never switch content language automatically (§8.2).

### 4.2 Admin Panel (`frontend/src/admin/`)

- Dedicated admin layout: left navigation, wide central workspace (Task 58).
- Route namespace under `/admin/**`, separate from user workspace layout.
- Module-specific editors:
  - Manual: chapter list, chapter editor with sections, block inserter, reorder.
  - Glossary: entry list, entry editor.
  - Knowledge Base: entry list, structured section editor.
- Shared editorial shell (Task 62): language switcher, Draft/Published badge, publish controls, preview pane, media picker, cross-reference picker.

### 4.3 Shared editorial components (`frontend/src/editorial/`)

Used by Tasks 59–62:

- Rich text editor wrapper (semantic blocks palette).
- Block renderers for preview parity with public modules.
- Media library panel, upload dropzone, asset detail (tags, alt, caption).
- Cross-reference picker (searchable list by content type).
- Internal link inserter.
- Asset usage panel and delete/replace guards (calls backend where-used API).

### 4.4 Auth and routing

- Extend `authAdapter` mock mode with `role: "administrator" | "user"` for development.
- `AdminRouteGuard` — redirects non-admins without exposing admin chrome.
- Hide admin navigation entries entirely for standard users (Task 64).
- Pass Bearer token on admin and preferences API calls when Cognito is enabled.

### 4.5 Interface localization

- UI strings in `frontend/src/i18n/en.json` and `frontend/src/i18n/ro.json`.
- React context or i18n library keyed by `preferences.interfaceLanguage`.
- Content language resolved separately (§8).

---

## 5. Content Persistence Strategy

### 5.1 Storage split

| Store | Purpose |
|-------|---------|
| **DynamoDB** | Source of truth for editorial state: items, variants, ordering, references, asset registry, user preferences |
| **S3** | Binary media files; immutable published JSON snapshots per module/locale |
| **Browser sessionStorage** | Mock auth session only (unchanged pattern) |

### 5.2 Why snapshots on publish

The product requires immediate publish and a stable public read experience identical to Phase 2. Pre-computing published JSON on the backend:

- keeps public modules simple and fast;
- centralizes assembly (continuous Manual document);
- prevents draft leakage;
- allows parity testing against Phase 2 static content.

### 5.3 DynamoDB table design

Single-table design with prefixed PK/SK patterns:

| Entity | PK | SK | Notes |
|--------|----|----|-------|
| Content item | `CONTENT#<contentId>` | `META` | type, sortOrder, shared metadata, module-specific fields |
| Content variant | `CONTENT#<contentId>` | `VARIANT#<locale>` | status, body JSON, updatedAt, publishedAt, snapshotS3Key |
| Media asset | `ASSET#<assetId>` | `META` | s3Key, mime, tags, alt, caption, languageNeutral, optional localeVariantOf |
| Asset usage | `ASSET#<assetId>` | `USAGE#<contentId>#<locale>#<fieldPath>` | denormalized for where-used |
| Cross-reference | `CONTENT#<sourceId>` | `REF#<targetType>#<targetId>#<refKind>` | related, synonym, seeAlso, etc. |
| User preferences | `USER#<userId>` | `PREFS` | JSON blob |
| Publish index (Manual order) | `INDEX#manual` | `ORDER#<sortKey>` | chapter contentIds in order |
| Publish index (Glossary) | `INDEX#glossary` | `ORDER#<sortKey>` | entry contentIds |
| Publish index (KB) | `INDEX#kb` | `ORDER#<sortKey>` | entry contentIds |

**GSI1 (optional):** `GSI1PK = TYPE#<contentType>`, `GSI1SK = ORDER#<sortKey>` for admin list views.

Environment-specific table name: `hfzwood-content-<stage>`.

### 5.4 S3 bucket layout

Bucket: `hfzwood-assets-<stage>` (CDK-created, private, CloudFront out of scope for Phase 3).

```
media/
  <assetId>/<filename>                 # uploaded binaries

published/
  manual/<locale>/document.json        # assembled continuous manual
  glossary/<locale>/entries.json       # ordered published entries
  knowledge-base/<locale>/entries.json # ordered published entries
```

Media URLs for public modules: backend returns stable `/api/media/<assetId>` redirect or signed short-lived URL from the same origin (implementation choice: same-origin proxy through FastAPI to avoid CORS complexity in Phase 3).

Static Phase 2 assets under `frontend/public/` referenced in migrated content are copied into S3 during migration and re-keyed to asset IDs.

---

## 6. Data Model

### 6.1 Core entities

```
ContentItem (1) ──< ContentVariant (N locales)
      │
      ├──< CrossReference (N) ──> ContentItem (target)
      │
      └──< AssetUsage (N) ──> MediaAsset (1)
```

- **ContentItem:** one logical Manual chapter, Glossary entry, or Knowledge Base article. Stable `contentId` never changes after creation.
- **ContentVariant:** one language version of a ContentItem. Independent Draft/Published state and body.
- **MediaAsset:** reusable media object, optionally language-specific via `localeVariantOf`.
- **CrossReference:** directed edge from source item to target item with `refKind`.

### 6.2 Content types and IDs

| Module | `contentType` | ID convention |
|--------|---------------|---------------|
| Manual chapter | `manual_chapter` | kebab-case slug; migration preserves Phase 2 chapter IDs |
| Glossary entry | `glossary_entry` | kebab-case slug; migration preserves Phase 2 entry IDs |
| KB article | `kb_entry` | kebab-case slug; migration preserves Phase 2 entry IDs |

Manual **sections** are nested inside the chapter variant body, not separate ContentItems, to match the product model (`Manual → Chapter → Section → Content`) while preserving stable chapter- and section-level anchors from Phase 2.

### 6.3 Variant body schemas (JSON)

Bodies are JSON documents validated by Pydantic models in `backend/content/schemas/`.

**Manual chapter variant:**

```json
{
  "title": "string",
  "sections": [
    {
      "id": "string",
      "title": "string",
      "blocks": [ "/* ManualBlock union */" ]
    }
  ]
}
```

**ManualBlock union** (extends Phase 2):

- `heading` (level 2–4)
- `paragraph`
- `image` (assetId, alt, caption)
- `video` (assetId or embedUrl, title, caption)
- `callout` — `{ type, variant: "important"|"warning"|"tip"|"note"|"quote", blocks[] }`
- `internalLink` — `{ targetContentId, targetType, label }`

**Glossary entry variant:**

```json
{
  "term": "string",
  "definitionBlocks": [ "/* blocks */" ],
  "media": [ "/* image|video refs */" ],
  "relatedTermIds": ["contentId"],
  "synonymTermIds": ["contentId"],
  "seeAlso": [{ "targetContentId", "targetType", "label" }]
}
```

**Knowledge Base entry variant:**

```json
{
  "title": "string",
  "category": "Epoxy|Wood|Finishing|Application|Projects|Calibration",
  "difficulty": "Beginner|Intermediate|Professional",
  "problemSummary": "string",
  "symptoms": ["string"],
  "possibleCauses": ["string"],
  "solution": ["string"],
  "prevention": ["string"],
  "tips": ["string"],
  "warnings": ["string"],
  "searchKeywords": ["string"],
  "estimatedRepairTime": "string|null",
  "requiredTools": ["string"],
  "requiredMaterials": ["string"],
  "bodyBlocks": [ "/* optional rich blocks in sections */" ],
  "media": [ "/* refs */" ],
  "relatedKbEntryIds": ["contentId"],
  "relatedGlossaryEntryIds": ["contentId"],
  "relatedManualChapterIds": ["contentId"]
}
```

Shared metadata on ContentItem (language-neutral where applicable):

- Manual: none beyond sort order.
- Glossary: none beyond sort order (term text is per variant).
- KB: `category`, `difficulty` may live on item or variant; **implementation decision:** store on ContentItem for consistent admin filtering, allow variant override of display title only. Category/difficulty remain editable per item and apply to all locales unless product requires per-locale metadata later.

### 6.4 Multilingual data model

- Locales: `en`, `ro` (enum, extensible).
- Each ContentVariant keyed by `(contentId, locale)`.
- Relationships (`relatedTermIds`, `seeAlso`, KB cross-links) stored at variant level but reference **language-neutral contentIds**; public renderer resolves labels from the target's published variant in the requested content language per §8.2 and §8.4.
- Draft/Published is **per variant**, not per item.
- Admin UI shows language tabs on the same content item; switching language loads that variant's body and status.

### 6.5 Draft / Published workflow

| State | Visibility | Storage |
|-------|------------|---------|
| Draft | Administrators only (admin API + preview) | DynamoDB variant body |
| Published | All users via public API | S3 snapshot + DynamoDB status flag |

**Transitions:**

- Draft → Published: publish pipeline (§3.3).
- Published → Draft: unpublish (admin action); public snapshot rebuilt without that variant.
- Edit while Published: saving creates/updates Draft body while Published remains live until republish (implementation: keep `publishedBody` pointer separate from `draftBody`, or copy-on-write draft from published). **Decision:** variant record holds `draftBody` always; on publish, snapshot is built from current draft fields and `status=published`.

Administrators may preview Draft via `GET /api/admin/preview/...?locale=en`.

---

## 7. Content Migration from Static Phase 2 Sources

### 7.1 Sources

| Module | Source file |
|--------|-------------|
| Manual | `frontend/src/manual/manualContent.js` |
| Glossary | `frontend/src/glossary/glossaryContent.js` |
| Knowledge Base | `frontend/src/knowledgeBase/knowledgeBaseContent.js` |

### 7.2 Migration tooling

One-time idempotent script: `backend/scripts/migrate_phase2_content.py`

- Reads exported JSON (script imports parsed structures or reads a generated JSON export from the JS files).
- Creates ContentItems with **identical IDs**.
- Creates `en` variants with status **Published**.
- Maps Phase 2 shapes to Phase 3 schemas:
  - Manual: each Phase 2 chapter → one `manual_chapter` ContentItem (preserving chapter IDs); Phase 2 sections → nested sections within their parent chapter (preserving section IDs and block content). Published assembly produces one continuous document ordered by chapter order, then section order within each chapter.
  - Glossary: `definition[]` strings → paragraph blocks; `media` → asset references.
  - KB: flat fields map 1:1; add empty arrays for new optional fields (`prevention`, `searchKeywords`, etc.).
- Registers static `/public` images as MediaAssets; uploads copies to S3.
- Builds initial published snapshots.
- Emits migration report (counts, IDs, warnings).

### 7.3 Parity verification

Automated tests compare migrated published API responses against Phase 2 static content fixtures (structure and text equality for `en`). Task 65 integration testing includes this gate.

### 7.4 Rollout

1. Run migration in dev/staging.
2. Switch public modules to API via config flag `VITE_CONTENT_SOURCE=api`.
3. Remove static imports from public pages after Task 65 sign-off; keep source files until migration report passes.

---

## 8. Multilingual Runtime Behavior

### 8.1 Interface vs content language

| Layer | Source |
|-------|--------|
| UI chrome | `preferences.interfaceLanguage` → i18n bundles |
| Manual / Glossary / KB | Content variants keyed by resolved **content language** |

### 8.2 Content language resolution

The **requested content language** is `preferences.interfaceLanguage` unless an explicit user content-language preference is added later (model reserved; not in Phase 3 product scope).

**When a published variant exists for the requested locale:** display that variant.

**When the requested locale is not available:**

1. Show a **localized message** (via interface i18n) that the content is not yet available in the requested language.
2. If a published **English** variant exists, provide an explicit **“View English version”** action that loads the English content only after the user chooses it.
3. **Never** switch content language automatically without the user's decision.

If no published variant exists in the requested language and no English variant exists, show the unavailable-content message only (no silent blank page).

This satisfies the product requirement that interface and content language are related but not identical, without exposing internal complexity to users.

### 8.3 Administrator workflow

Administrators create `ro` variant on existing item, edit independently, publish independently.

### 8.4 Cross-locale references

Cross-reference labels in public UI resolve from the target item's published variant in the requested content language when available. When the target is not published in that language, apply the same workflow as §8.2: localized unavailable messaging and an explicit “View English version” action when an English published variant exists; no automatic language switch.

---

## 9. Media Storage and Asset Management

### 9.1 Upload flow

1. Admin requests `POST /api/admin/media/upload-url` with filename, mime, size.
2. Backend validates admin role, creates pending MediaAsset, returns presigned PUT URL (or accepts multipart POST through backend for simplicity in local dev).
3. Admin uploads directly to S3 (presigned) or via backend proxy.
4. Admin confirms `POST /api/admin/media/<assetId>/complete`.
5. Asset appears in media library.

### 9.2 Asset metadata

- Tags (string array, admin-defined).
- Alt text, caption, description.
- `languageNeutral: boolean` — default true for photos of materials; false when image contains readable text or narration-specific video.
- Optional `locale` + `localeVariantOf` for language-specific media (Task 62 clarification).

### 9.3 Reuse and usage tracking

- Editors insert assets by `assetId`, not raw URLs.
- On publish, backend rebuilds AssetUsage records from all block references.
- Delete: `DELETE /api/admin/media/<assetId>` blocked when usage count > 0; returns where-used list.
- Replace: upload new asset, run replace workflow updating references in Draft variants only until republish; published snapshots unchanged until affected items republished.

### 9.4 Videos

Support embedded external URLs (YouTube/Vimeo) and uploaded video assets. Embed URLs validated against an allowlist of hostnames.

---

## 10. API Architecture

Base path: `/api`. JSON request/response. Errors: `{ "detail": "..." }` or validation array.

### 10.1 Public endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/content/manual?locale=<locale>` | Assembled continuous Manual document |
| GET | `/content/glossary?locale=<locale>` | Published glossary entries (ordered) |
| GET | `/content/knowledge-base?locale=<locale>` | Published KB entries (ordered) |
| GET | `/content/knowledge-base/<entryId>?locale=<locale>` | Single KB entry |
| GET | `/media/<assetId>` | Media delivery (auth not required for published-referenced assets) |

Optional ETag/Cache-Control headers on published JSON responses; CDN deferred.

### 10.2 Admin endpoints (administrator role required)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/admin/manual/chapters` | List/create chapters |
| GET/PUT/DELETE | `/admin/manual/chapters/<id>` | Chapter metadata |
| GET/PUT | `/admin/manual/chapters/<id>/variants/<locale>` | Draft variant body |
| POST | `/admin/manual/chapters/<id>/variants/<locale>/publish` | Publish locale |
| POST | `/admin/manual/chapters/reorder` | Persist order |
| * | `/admin/glossary/...` | Parallel structure for entries |
| * | `/admin/knowledge-base/...` | Parallel structure for entries |
| GET/POST | `/admin/media` | Library list / upload initiation |
| GET/PUT/DELETE | `/admin/media/<assetId>` | Metadata / delete guard |
| GET | `/admin/media/<assetId>/usage` | Where-used |
| POST | `/admin/media/<assetId>/replace` | Replace workflow |
| GET | `/admin/references/search?q=&types=` | Cross-reference picker backing |
| GET | `/admin/preview/<module>/...` | Draft preview |

Calculator endpoints under existing paths unchanged.

### 10.3 Preferences endpoints (authenticated user)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/preferences` | Current user preferences |
| PUT | `/preferences` | Update preferences |

---

## 11. Authentication and Authorization

### 11.1 Phase 3 auth modes

| Mode | When | Behavior |
|------|------|----------|
| Mock auth | Local dev, Phase 3 before Cognito wiring | `authAdapter` stores user + role in sessionStorage |
| Cognito JWT | Production/staging with env vars set | Existing middleware validates Bearer token |

Backend reads role from:

- **Mock:** custom header `X-Mock-Role` + `X-Mock-User-Id` accepted only when `AUTH_MODE=mock`, **or** signed dev token;
- **Cognito:** `cognito:groups` claim (`administrators` group) or custom attribute `custom:role`.

**Implementation decision:** use Cognito group `administrators` for admin role in deployed environments; mock adapter defaults to `user`, with `loginAsAdmin()` dev helper or env `VITE_MOCK_ADMIN=true`.

### 11.2 Role model

| Role | Backend | Frontend |
|------|---------|----------|
| `user` | Public + preferences + calculator | User nav only; `/admin/**` blocked |
| `administrator` | All admin routes | Admin nav visible; full editorial access |

Future roles (Editor, Reviewer, etc.) map to additional Cognito groups without schema changes.

### 11.3 Authorization (Task 64 complete)

- All `/api/admin/**` routes use `require_administrator`.
- Frontend `/admin/**` routes use `AdminRouteGuard`; admin navigation hidden from standard users.
- Cognito JWT middleware attaches decoded claims to `request.state.jwt_claims`; `get_current_user` maps `administrators` group to `administrator` role.
- Mock dev: `X-Mock-Role`, `X-Mock-User-Id`, optional `X-Mock-Access-Tier` when `AUTH_MODE=mock`.

Unauthorized admin access: HTTP 403 from API; frontend redirect to Home without permission banners in user workflows.

### 11.4 Product capabilities (Task 64)

Role and access tier are independent:

| Concept | Values | Resolved by |
|---------|--------|-------------|
| Role | `user`, `administrator` | Cognito group / mock headers |
| Access tier | `free`, `subscriber`, `administrator_unlimited` | Stored entitlement (default `free`) or administrator bypass |

`GET /api/me/capabilities` returns `role`, `accessTier`, `catalogVersion`, and resolved `capabilities`. Feature code must query capability keys only — never `accessTier` or tier names in feature logic.

Backend catalog lives in `backend/product/capabilities/`. Frontend loads via `CapabilitiesProvider` (parallel to `PreferencesProvider`). Local dev may override commercial tier with `CAPABILITY_DEV_ACCESS_TIER=subscriber` when `AUTH_MODE=mock`.

No subscriptions, payments, billing, or visible commercial gating UI in Task 64.

### 11.5 Future role expansion

Future editorial roles (Editor, Reviewer, etc.) may map to additional Cognito groups without changing the capability model.

---

## 12. Content Delivery Strategy

- Public modules load content on route entry via React hooks (`useManualContent(locale)`, etc.).
- Loading and error states match existing module polish.
- Published snapshots served from backend; browser caches with ETag.
- Manual TOC anchors derived from chapter IDs and section IDs in assembled document (same as Phase 2 `#introduction` patterns).
- No service-worker offline cache for CMS content in Phase 3.

---

## 13. Validation Responsibilities

| Validation | Owner |
|------------|-------|
| JSON schema / required fields | Backend (Pydantic) |
| Semantic block structure | Backend on publish; frontend mirrors for instant feedback |
| Media asset exists | Backend on publish |
| Internal link target exists | Backend on publish |
| Cross-reference target exists | Backend on publish |
| Circular synonym integrity | Backend warning (non-blocking) / broken ref blocking |
| Category/difficulty enums (KB) | Backend |
| Locale code | Backend |
| File type/size on upload | Backend |
| Rich text empty publish guard | Backend |
| Display unit enum (preferences) | Backend |
| Calculator inputs | Backend (existing) |

Frontend validates for UX; backend validation is authoritative.

---

## 14. Cross-Reference Integrity

- References store `targetContentId` + `targetType`, not URLs.
- Publish pipeline checks targets:
  - Same-module refs: target must be published in the same locale **or** publishing in the same batch (order-dependent publishes use two-phase: validate all, then commit).
  - Cross-module refs: target must already be published in that locale, **or** publish is rejected with explicit error.
- Unpublish guard: cannot unpublish item if referenced by another **published** item (unless admin confirms break-links workflow that removes refs from drafts only).
- Admin cross-reference picker searches published + draft items via `/admin/references/search`.
- Glossary **Synonyms** modeled as `refKind: synonym` edges between glossary entries.
- **See also** supports all three module types.

---

## 15. Application Preferences (Task 63)

### 15.1 Stored preferences

```json
{
  "interfaceLanguage": "en|ro",
  "lengthUnit": "mm|cm|m|in|ft",
  "volumeUnit": "ml|L|fl_oz|pt|qt|gal"
}
```

Defaults: `en`, `mm`, `L`.

### 15.2 Unit conversion

- Canonical storage unchanged: mm, liters, cm² in backend and `.hfzproject`.
- Frontend `units/` module converts on display and input blur; calculator API receives canonical values.
- Conversion factors live in frontend for responsiveness; backend re-validates reasonable ranges.

### 15.3 Persistence

- DynamoDB `USER#<cognitoSub|mockId>` / `PREFS`.
- Loaded on session restore after login; applied globally.

### 15.4 Quick preferences (accepted UX)

- `QuickPreferences` (`frontend/src/preferences/QuickPreferences.jsx`) exposes interface language, length unit, and volume unit as compact selects.
- Mounted on the authenticated Home sidebar (below My Account, above Log out) and at the top of the New Project workspace.
- Each change calls `updatePreferences` with a partial patch (same API as the full Application Preferences page); no duplicate preference logic.
- Full settings remain at `/account/preferences`.

### 15.5 Manual admin locale list (Task 59/63 QA)

- `GET /api/admin/manual/chapters?locale=` returns only chapters that have a saved variant in the requested locale.
- Sidebar shows a per-locale empty state when none exist; chapter create writes the initial variant in the admin's active locale only.

---

## 16. Project Structure

```
backend/
  app.py                          # FastAPI entry; mount routers
  content/
    schemas/                      # Pydantic models per content type
    services/                     # publish, assembly, migration helpers
    repositories/                 # DynamoDB access
    routers/
      public_content.py
      admin_manual.py
      admin_glossary.py
      admin_knowledge_base.py
      admin_media.py
      preferences.py
  auth/
    dependencies.py               # get_current_user, require_admin
  scripts/
    migrate_phase2_content.py
  tests/
    content/                      # publish, validation, migration parity

frontend/src/
  admin/
    AdminLayout.jsx
    AdminDashboard.jsx
    manual/                       # Task 59
    glossary/                     # Task 60
    knowledgeBase/                # Task 61
  editorial/                      # Task 62 shared components
  i18n/
    en.json
    ro.json
  units/
    conversion.js
  preferences/
    PreferencesPage.jsx
    QuickPreferences.jsx
    preferencesApi.js
  manual/                         # public reader (API-backed)
  glossary/
  knowledgeBase/
  auth/                           # extended mock + guards

deployment/cdk/lib/
  infra-stack.ts                  # + S3 bucket, DynamoDB table
  app-stack.ts                    # + IAM env vars for table/bucket
```

---

## 17. Testing Strategy

### 17.1 Backend (pytest)

- Schema validation for all content types and semantic blocks.
- Publish pipeline: success, validation failures, draft isolation.
- Manual assembly: chapter order, continuous document shape.
- Cross-reference and asset usage indexing.
- Migration parity: API output vs Phase 2 fixtures.
- Preferences CRUD and enum validation.
- Admin route 403 for non-admin tokens.

Use local DynamoDB Local or moto for integration tests; mock S3 with moto.

### 17.2 Frontend (Vitest + React Testing Library)

- Admin route guard and nav visibility by role.
- Editorial components: block insertion, language switch, publish button states.
- Public modules: render from mocked API responses matching Phase 2 snapshots.
- Preferences page: save/load, unit conversion display.
- i18n smoke tests for en/ro keys on primary nav.

No Selenium; keep suite fast.

### 17.3 Integration (Task 65)

- End-to-end flows in dev: create draft → publish → visible on public module.
- Multilingual: publish `ro` only, verify localized unavailable message, explicit “View English version” action, and no automatic language switch.
- Media reuse and delete protection.
- Role enforcement across UI + API.

### 17.4 Regression

- Full frontend and backend test suites plus production build before Task 66 certification.

---

## 18. Implementation Sequencing

Product task order is preserved; technical prerequisites are nested within tasks as noted.

| Step | Task | Technical deliverables |
|------|------|----------------------|
| 1 | **58** | Admin layout, routes, mock admin gate; backend router skeleton; CDK S3 + DynamoDB |
| 2 | **59** | Manual admin CRUD, variant model, publish pipeline v1, public Manual API, migration for manual |
| 3 | **60** | Glossary admin + public API, migration |
| 4 | **61** | KB admin + public API, migration |
| 5 | **62** | Extract shared `editorial/` components; media library; cross-ref picker; asset usage (consolidates duplication from 59–61) |
| 6 | **63** | Preferences API + UI; i18n bundles; unit conversion (parallelizable after 58) |
| 7 | **64** | Cognito group mapping; backend `require_admin`; hide admin UI; security tests |
| 8 | **65** | Full migration run; parity tests; doc sync; integration QA |
| 9 | **66** | Release certification, baseline tag |

**Technical note on Task 62 dependency:** Product lists Task 62 after 59–61. Implementation should build **thin shared abstractions early** (block model, variant editor shell, API client) to avoid rework, then complete Task 62 by consolidating media library, usage tracking, and cross-reference manager into shared components.

**Technical note on migration:** Initial published `en` content must exist before switching public modules off static files; migration script runs as part of Task 59 completion at latest.

---

## 19. AWS / CDK Implications

### 19.1 New resources (InfraStack or nested ContentStack)

| Resource | Configuration |
|----------|---------------|
| S3 bucket | Private; block public access; CORS for admin upload origins; lifecycle rule optional for orphaned uploads |
| DynamoDB table | On-demand billing; PK/SK as §5.3; point-in-time recovery optional |
| IAM (Fargate task role) | `s3:GetObject/PutObject/DeleteObject` on assets bucket; `dynamodb:*` on content table |

### 19.2 AppStack updates

Environment variables for Fargate container:

```
CONTENT_TABLE_NAME=
ASSETS_BUCKET_NAME=
AUTH_MODE=cognito|mock
```

Existing Cognito User Pool unchanged; add CDK `CfnUserPoolGroup` for `administrators`.

### 19.3 Local development

- `docker-compose` or scripts start DynamoDB Local + LocalStack S3 optional.
- Mock auth mode without AWS credentials.
- `.env.example` documents required variables.

### 19.4 Phase 4 readiness

- Cognito already provisioned; Phase 3 wires group-based admin claims.
- No Stripe, no project cloud storage changes in Phase 3 CDK.

---

## 20. Implementation Decisions Log

Decisions required by the product plan but not specified there:

| ID | Decision |
|----|----------|
| D-01 | Editorial source of truth in DynamoDB; published public read model as S3 JSON snapshots |
| D-02 | Manual hierarchy preserved: Phase 2 chapters remain chapters; Phase 2 sections nested inside chapters with preserved section IDs |
| D-03 | Content language: display requested locale when published; otherwise localized unavailable message plus explicit “View English version” when English exists; never auto-switch |
| D-04 | Media delivered via same-origin backend proxy in Phase 3 |
| D-05 | Cognito `administrators` group maps to administrator role |
| D-06 | Mock auth extended with role for local dev; disabled in production |
| D-07 | KB category/difficulty on ContentItem (shared across locales) |
| D-08 | Cross-module publish requires target already published in same locale |
| D-09 | Static `*Content.js` retained as migration input only post-Task 65 |
| D-10 | Unpublish blocked when referenced by other published items unless break-links workflow |

---

## 21. Documentation Alignment (Task 65)

Upon implementation, update:

- `documentation/application-design.md` — CMS and preferences sections
- `README.md` — env vars, local dev auth modes
- `documentation/PROJECT_STATUS.md` — Phase 3 completion
- `.cursor/rules/architecture.mdc` and Kiro equivalent — note content backend ownership

This technical architecture document remains the authoritative **how** reference for Phase 3 engineering.

---

## 22. Traceability to Product Tasks

| Product task | Primary technical sections |
|--------------|---------------------------|
| 58 Admin Panel Foundation | §4.2, §11.3, §16, §18 step 1 |
| 59 Manual CMS | §6.3, §10.2, §7, §18 step 2 |
| 60 Glossary CMS | §6.3, §10.2, §7, §18 step 3 |
| 61 Knowledge Base CMS | §6.3, §10.2, §7, §18 step 4 |
| 62 Shared Editorial Infrastructure | §4.3, §9, §14, §18 step 5 |
| 63 Application Preferences | §15, §8.1, §10.3 |
| 64 Roles & Permissions | §11, §18 step 7 |
| 65 Integration & QA | §17, §7.3, §21 |
| 66 Release Certification | §17.4, §18 step 9 |

---

*Document status: Phase 3 Technical Architecture — derived from approved Product Architecture (phase-3-implementation-plan.md).*
