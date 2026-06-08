# Architecture Rules

## IP Protection — Computation Logic

All non-trivial computation logic must live in the Python backend, not in JavaScript.

The guiding principle for deciding where logic belongs:

- **Fast feedback required** (mouse movement, mouse clicks, live canvas drawing): logic may stay in JS because a network round-trip would hurt UX.
- **Slow feedback acceptable** (button clicks, text input updates): logic must move to the backend to protect IP.

### What belongs in the backend (Python)
- Area calculations (shoelace formula on polygon points)
- Volume calculations (area × depth, unit conversions)
- Scale/calibration resolution from reference measurements
- Pour layer planning (layer count, thickness distribution, per-layer volumes)
- First fill seal coat volume calculation
- Any future resin quantity or planning computation triggered by a button or input change

### What may stay in the frontend (JavaScript)
- Live canvas drawing and rendering
- Polygon point hit-testing (`pointInPolygon`) used during mouse interaction
- Live preview calculations that update on every mouse click while drawing (e.g. `referenceQuality`, `cavitySummaries`, `woodLiveSummary`) — these are acceptable duplicates of backend logic purely for drawing-time UX
- Trivial display helpers: unit formatting, ratio lookups, label generation
- UI state management

### Summary
If a calculation is triggered by a button click or a text field change, it belongs in the backend.
If it must update on every mouse click or mouse move to give live drawing feedback, it may stay in JS.
