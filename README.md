# HFZWood

HFZWood is a browser application for estimating epoxy resin volume from photographs and supporting woodworkers through integrated educational content.

The resin estimation calculator (Standard Resin Area and Wood Boundary modes) was delivered in Phase 1. Phase 2 adds the logged-in Home hub, project file workflow, and educational modules. See [`documentation/phase-2-implementation-plan.md`](documentation/phase-2-implementation-plan.md) for scope.

## Phase 2 product surface

- Logged-in **Home hub** with navigation to all modules
- **New Project** workspace (calculator)
- **Projects** hub — Open Project, Recent Projects, `.hfzproject` files
- **Manual and Tutorials**, **Glossary**, and **Knowledge Base** dedicated reading modules
- Mock/session authentication (production Cognito wiring deferred)

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

From the project root:

```powershell
.\dev.cmd
```

This starts the backend and frontend development servers. Alternatively:

### Start backend

```powershell
uv run --project backend uvicorn app:app --app-dir backend --host 0.0.0.0 --port 5000 --reload
```

Backend runs at `http://127.0.0.1:5000`.

### Start frontend (in another terminal)

```powershell
npm run dev --prefix frontend
```

Vite will print a local URL (usually `http://127.0.0.1:5173`). Open this in your browser.

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
