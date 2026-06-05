# Resin Volume Prototype (React + Flask)

Very simple prototype web app for estimating epoxy resin volume from a photo.

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

```text
ResinCalculator/
  backend/
    app.py
    requirements.txt
  frontend/
    index.html
    package.json
    vite.config.js
    src/
      App.jsx
      main.jsx
      styles.css
```

## Requirements (Windows)

- Python 3.10+ installed
- Node.js 18+ installed

## Run locally (Windows PowerShell)

### 1) Start backend (Flask)

```powershell
cd D:\ResinCalculator\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Backend runs at: `http://127.0.0.1:5000`

### 2) Start frontend (React + Vite) in a new terminal

```powershell
cd D:\ResinCalculator\frontend
npm install
npm run dev
```

Vite will print a local URL (usually `http://127.0.0.1:5173`).

## How to use

1. Open frontend URL in browser.
2. Upload an image.
3. Click **Add Reference Measurement**, then click two points on the image for a segment with known real-world length.
4. Enter that segment length in **cm** and save it. Repeat up to 5 times.
5. Keep **Polygon Mode** active and click around the resin boundary.
6. Enter resin depth in **mm**.
7. Click **Calculate**.

## Calculation notes

- Polygon area is computed in pixel² using the shoelace formula.
- Each reference converts pixels to centimeters:
  - horizontal reference -> contributes to `scaleX` with `known_length_cm / abs(deltaX_px)`
  - vertical reference -> contributes to `scaleY` with `known_length_cm / abs(deltaY_px)`
  - diagonal references are tracked but not used as primary axis calibration
- Area conversion is direction-aware:
  - `area_cm2 = area_px2 * (scaleX * scaleY)`
- The app shows calibration quality with separate horizontal/vertical averages and counts.
- Area conversion:
  - `area_cm2 = area_px2 * (cm_per_pixel_avg^2)`
- Volume:
  - `depth_cm = depth_mm / 10`
  - `volume_cm3 = area_cm2 * depth_cm`
  - `volume_liters = volume_cm3 / 1000`
