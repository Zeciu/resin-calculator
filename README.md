# HFZWood

HFZWood is a browser application for estimating epoxy resin volume from photographs and supporting woodworkers through integrated educational content.

The resin estimation calculator (Standard Resin Area and Wood Boundary modes) was delivered in Phase 1. Phase 2 adds the logged-in Home hub, project file workflow, and educational modules. See [`documentation/phase-2-implementation-plan.md`](documentation/phase-2-implementation-plan.md) for scope.

## Phase 2 product surface

- Logged-in **Home hub** with navigation to all modules
- **New Project** workspace (calculator)
- **Projects** hub — Open Project, Recent Projects, `.hfzproject` files
- **Manual and Tutorials**, **Glossary**, and **Knowledge Base** dedicated reading modules
- Authentication: local development uses mock/session auth; production uses AWS Cognito (see `deployment/README.md`)

## Calculator features

- Upload a photo in the browser
- Wood Boundary Mode and Standard Resin Area mode
- Multiple reference measurements for calibration
- Resin volume calculation with optional PDF export from the workspace

No AI image recognition is used.

## Project structure

```
ResinCalculator/
  backend/
    app.py          # FastAPI server
    pyproject.toml  # Python dependencies (uv)
  frontend/
    src/
      calculator/   # Resin estimation workspace
      workspace/    # Home hub, routing, project workflow
      modules/      # Manual, Glossary, Knowledge Base, Projects
      main.jsx      # Entry point
      styles.css    # Styles
    package.json    # Node dependencies
  deployment/
    README.md       # Deployment guide
    cdk/            # AWS CDK TypeScript app (infrastructure as code)
```

## Prerequisites

- **UV** - Manages Python automatically (no separate Python install needed). Install via winget:
  ```powershell
  winget install astral-sh.uv
  ```
- **Node.js 24 LTS** - Install via winget:
  ```powershell
  winget install OpenJS.NodeJS.LTS
  ```

## Setup (run all commands from project root)

### 1. Install Python dependencies

```powershell
uv venv --python 3.13 --project backend
uv sync --project backend
```

### 2. Install Node.js dependencies

```powershell
npm install --prefix frontend
```

## IDE Setup

After creating the venv, point your IDE at `backend/.venv/Scripts/python.exe`:

- **Cursor** — `Ctrl+Shift+P` → "Python: Select Interpreter" → select `backend/.venv/Scripts/python.exe`
- **IntelliJ** — Settings → Project → Python Interpreter → Add → Existing → `backend/.venv/Scripts/python.exe`

## Run locally (from project root)

Run all commands in this section from the **repository root**.

### Authoritative startup

The authoritative project-root startup command is:

```powershell
.\dev.cmd
```

The committed `dev.cmd` script:

- resolves the project root;
- installs frontend dependencies;
- runs the frontend production build;
- starts the backend in a separate terminal window;
- starts the Vite frontend development server in another terminal window.

When startup completes, the backend is available at `http://localhost:5000` and the frontend at `http://localhost:5173`.

### Manual startup

Use these commands when you need to start services manually. Run each command from the repository root in a **separate terminal**.

Backend:

```powershell
uv run --project backend uvicorn app:app --app-dir backend --host 0.0.0.0 --port 5000 --reload
```

Frontend:

```powershell
npm run dev --prefix frontend
```

### Ports and startup order

- **Backend:** port `5000` (`http://127.0.0.1:5000`)
- **Frontend:** port `5173` under the current Vite development configuration; verified local URL: `http://localhost:5173`

The backend should be available before API-dependent frontend functionality is used.

### Frontend-to-backend communication

In local development, the frontend uses **relative API paths** (for example `/api/...` and `/calculate`).

The Vite development server proxies these paths to `http://127.0.0.1:5000`:

- `/api`
- `/health`
- `/calculate`

If the backend is not running, requests to proxied paths may fail with a development proxy connection error rather than a normal API response.

### Backend health verification

Verify that the backend is running:

`http://127.0.0.1:5000/health`

Expected successful result:

- HTTP `200`
- `{"status":"ok"}`

PowerShell example:

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:5000/health' -UseBasicParsing
```

You can also open the health URL in a browser.

### Environment variables

The current local development baseline uses mock-first authentication by default.

| Variable | Scope | Notes |
|---|---|---|
| `AUTH_MODE` | Backend | Defaults to `mock` for local development. Production uses `cognito`. |
| `VITE_AUTH_MODE` | Frontend | Unset or non-`cognito` values use the mock authentication path. Production Docker builds must set `cognito`. |
| `VITE_MOCK_ADMIN` | Frontend | `true` enables local mock administrator behavior after login or session restoration. |
| `CAPABILITY_DEV_ACCESS_TIER` | Backend | When `AUTH_MODE=mock`, may override the local development commercial tier (`free` or `subscriber`) where supported. |
| `VITE_COGNITO_USER_POOL_ID` | Frontend | Required for Cognito-mode frontend builds. |
| `VITE_COGNITO_CLIENT_ID` | Frontend | Required for Cognito-mode frontend builds. |
| `VITE_COGNITO_DOMAIN` | Frontend | Cognito Hosted UI domain host. |
| `VITE_COGNITO_REDIRECT_URI` | Frontend | Must match the Cognito app-client callback URL. |
| `COGNITO_USER_POOL_ID` | Backend | Required when `AUTH_MODE=cognito`. |
| `COGNITO_CLIENT_ID` | Backend | Required when `AUTH_MODE=cognito`; used to validate JWT client/audience. |
| `COGNITO_REGION` | Backend | Required when `AUTH_MODE=cognito`. |
| `CONTENT_DATA_DIR` | Backend | Filesystem root for editorial repositories (and related local filesystem stores). Production mounts EFS at `/mnt/hfzwood-content`. |
| `REQUIRE_CONTENT_DATA_DIR` | Backend | Set to `1` in production so startup fails closed instead of using ephemeral container storage. |
| `CORS_ALLOWED_ORIGINS` | Backend | Optional comma-separated origins. Unset defaults to `*` for local development. Production sets `https://hfzwood.com`. |
| `STRIPE_SECRET_KEY` | Backend | Stripe secret key. Required for Checkout, Portal, and webhooks. |
| `STRIPE_WEBHOOK_SECRET` | Backend | Stripe webhook signing secret. |
| `STRIPE_PRICE_ID` | Backend | Allowed monthly Price ID (server-enforced). |
| `STRIPE_CHECKOUT_SUCCESS_URL` | Backend | Post-Checkout return URL (must not grant access by itself). |
| `STRIPE_CHECKOUT_CANCEL_URL` | Backend | Checkout cancel return URL. |
| `STRIPE_PORTAL_RETURN_URL` | Backend | Customer Portal return URL. |

Local frontend-only configuration can be placed in an untracked `frontend/.env.local` file. Restart the Vite development server after relevant environment changes.

Production deployment procedure, Cognito Docker build arguments, and ECS/EFS details live in `deployment/README.md` (do not duplicate that workflow here).

Do not commit secrets, tokens, or private credentials.

### Local mock authentication

The current local development model is **mock-first**.

- Developers still enter through the normal login flow; authentication is not automatic.
- The mock adapter does not provide production credential validation.
- Mock session state is browser-session based.
- Backend `AUTH_MODE` defaults to `mock` unless configured otherwise.
- Production Cognito configuration is described in `deployment/README.md`.

### Local administrator access

Local administrator access is **development-only** and is not production administrator security.

- `VITE_MOCK_ADMIN=true` gives the mock user the `administrator` role after login or session restoration.
- Administrator pages are available under `/admin` and related routes.
- The normal workspace navigation does not expose an administrator sidebar entry; direct local access may be used.
- Frontend route guards require the administrator role.
- Backend administrator API routes independently enforce administrator authorization.

### Known startup failure conditions

- Backend unavailable while the frontend calls proxied backend paths.
- Port `5000` or `5173` already in use.
- Required runtime tooling (`uv`, Node.js) or project dependencies unavailable.
- Incomplete setup (for example, missing `uv sync` or `npm install`).
- Vite environment changes requiring a frontend development server restart.
- Missing local mock-admin configuration (`VITE_MOCK_ADMIN`) causing non-administrator behavior.

For automated validation commands, see **Automated validation** below.

### Repository safety

Automated implementation work must not delete, revert, clean, stage, or commit unrelated tracked or untracked user work without explicit approval.

## Automated validation

Run all commands in this section from the **repository root**.

### Complete unified validation

The authoritative complete automated validation command for the current repository is:

```powershell
.\test.cmd
```

This runs the complete backend automated test suite first, then the complete frontend automated test suite. The script reports failure and exits with a non-zero code if either required suite fails.

### Complete backend and frontend test suites

Use these when you need to run one suite in isolation:

```powershell
uv run --project backend pytest -q
npm test --prefix frontend
```

### Production build validation

Production build validation is distinct from automated test execution. It verifies that the frontend production bundle can be created successfully:

```powershell
npm run build --prefix frontend
```

### Targeted validation

During implementation, targeted validation may be used for faster feedback on a specific changed area. Examples:

```powershell
uv run --project backend pytest backend/test_app.py -q
uv run --project backend pytest backend/tests/content/test_preferences_api.py -q
npm test --prefix frontend -- src/workspace/projectFileSave.test.js
```

Targeted validation does not replace complete unified validation when broader regression validation is required for task closure, milestone closure, or higher-risk changes.

### Validation levels

- **Targeted validation** — focused feedback during implementation on a specific test file or module.
- **Complete unified validation** — complete backend and frontend automated suites through `.\test.cmd`.
- **Production build validation** — verifies that the frontend production bundle builds successfully.

### Current observational baseline

As verified during Phase 6 Task 6.2 closure (2026-07-17), the current observational baseline is:

- 200 backend tests passed, 1 skipped;
- 572 frontend tests across 73 test files;
- unified validation through `.\test.cmd`.

These counts are observational only. They are not permanent contracts and are expected to change as legitimate tests are added, removed, reorganized, or replaced.

## Deploy (Docker)

A multi-stage Dockerfile builds the frontend and packages everything into a single Python image — no Node.js in production.

```powershell
docker build -t resin-calculator .
docker run -p 5000:5000 resin-calculator
```

## How to use

For the full logged-in product flow (Home hub, save/open projects, educational modules), run the app and sign in.

**Calculator workflow (New Project):**

1. Open the frontend URL and go to **New Project**.
2. Upload an image.
3. Add reference measurements, complete the workflow for your calculation mode, and calculate.
4. Use **Save Project** to write a `.hfzproject` file.

Wood Boundary Mode is the default workflow. Standard Resin Area mode remains available. See `PROJECT_STATUS.md` for detailed calculator behavior.

## Calculation details

- Polygon area is computed in pixel² using the shoelace formula.
- Each reference converts pixels to centimeters:
  - horizontal reference -> contributes to `scaleX` with `known_length_cm / abs(deltaX_px)`
  - vertical reference -> contributes to `scaleY` with `known_length_cm / abs(deltaY_px)`
  - diagonal references are tracked but not used as primary axis calibration
- Area conversion:
  - `area_cm2 = area_px2 * (scaleX * scaleY)`
- Volume:
  - `depth_cm = depth_mm / 10`
  - `volume_cm3 = area_cm2 * depth_cm`
  - `volume_liters = volume_cm3 / 1000`
- A 10% safety margin is added to the recommended volume.
