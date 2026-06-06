# Resin Volume Calculator

Web app for estimating epoxy resin volume from a photo.

## Features

- Upload a photo in the browser
- Draw a polygon manually over the resin area
- Add multiple reference measurements by clicking two points per segment with a known real-world length
- Enter resin depth in millimeters
- Compute:
  - selected area in square centimeters (cm²)
  - estimated resin volume in liters (L)

No AI image recognition is used.

## Project structure

```
resin-calculator/
  backend/
    app.py          # FastAPI server
    pyproject.toml  # Python dependencies (uv)
  frontend/
    src/
      App.jsx       # React component
      main.jsx      # Entry point
      styles.css    # Styles
    package.json    # Node dependencies
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

1. Open frontend URL in browser.
2. Upload an image.
3. Click **Add Reference Measurement**, then click two points on the image for a segment with known real-world length.
4. Enter that segment length in **cm** and save it. Repeat up to 5 times.
5. Keep **Polygon Mode** active and click around the resin boundary.
6. Enter resin depth in **mm**.
7. Click **Calculate**.

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
