# HFZWood — Project Status

> **Note (Phase 2):** Phase 2 is **complete** (certified 2026-07-03, Task 57). This document focuses on **calculator workspace behavior** (Phase 1). The logged-in product shell, project file workflow (`.hfzproject`), and educational modules (Manual, Glossary, Knowledge Base) are documented in [`documentation/phase-2-implementation-plan.md`](documentation/phase-2-implementation-plan.md) and [`documentation/application-design.md`](documentation/application-design.md) §2.1.

## Current Working Version

HFZWood is a React + FastAPI application for estimating epoxy resin volume from manually traced photo measurements. The application currently supports two calculation workflows:

- Standard Resin Area mode
- Wood Boundary Mode

The project does not use AI image recognition yet. All measurement and tracing is manual.

Wood Boundary Mode is the default selected workflow when the app starts and appears first in the calculation mode selector. Standard Resin Area mode remains available as the secondary option.

### Calculation Mode Help

The calculation mode selector includes contextual help for first-time users:

- **Standard Resin Area** explains that it is for regular resin areas where the resin zone can be outlined directly, such as rectangles, squares, circles, trays, countertops, shelves, and other straight or regular shapes.
- **Wood Boundary Mode** explains that it is for live-edge slabs, river tables, natural wood edges, cracks, cavities, and other irregular organic wood shapes, where resin volume is calculated from mold area minus wood area.

On desktop, the explanations appear on hover. On mobile or touch devices, the user can tap the ⓘ icon beside each mode to open the same help popup.

## Current Features Implemented

### Standard Resin Area Mode

Standard Resin Area mode lets the user trace the resin area directly.

Current behavior:

1. Upload a photo.
2. Add one or more reference measurements for calibration.
3. Select Polygon Mode.
4. Click points around the resin area.
5. Enter resin depth in millimeters.
6. Calculate selected area and resin volume.

The backend calculates polygon area using the shoelace formula, converts the pixel area to square centimeters using calibrated scale values, then converts area and depth into liters.

### Wood Boundary Mode

Wood Boundary Mode supports projects where the user defines a mold/coffrage boundary and traces the wood instead of tracing resin directly.

This is the primary visible workflow by default. The normal user path is:

```text
Upload -> References -> Mold -> Wood -> Cavities -> Calculate -> Result
```

A compact progress tracker near the top shows the current step and checks off completed steps. Before a photo is uploaded, the upload control is the only highlighted action; workflow steps stay muted until the photo exists. After upload, only the next required stage receives the primary accent color.

Current area logic:

```text
Main Resin Area = Mold Area - Wood Area
```

Where:

- Mold Area is either the full uploaded/calibrated image rectangle or a manually drawn mold boundary polygon.
- Wood Area is the manually traced outer wood boundary.
- Isolated cavities are manually traced and calculated separately from the main resin area.

Wood Boundary Mode preserves the existing Standard Resin Area mode and does not replace it.

### Mold Boundary Support

Wood Boundary Mode keeps two mold boundary implementations internally:

- **Use image border as mold**: still supported internally for future development and project compatibility, but hidden from the normal user workflow.
- **Draw mold boundary**: the normal visible workflow. The user manually traces the inside edge of the mold/coffrage as a polygon.

In both cases, Wood Boundary Mode uses:

```text
Main Resin Area = Mold Area - Wood Area
```

Isolated cavities remain separate volume calculations and are not added to the main resin area.

### Reference Measurement System

The app supports multiple reference measurements.

Current behavior:

1. Click **Add Reference Measurement**.
2. Click two points on the uploaded image.
3. Enter the real-world length of that segment in centimeters.
4. Save the reference measurement.
5. Repeat up to 5 reference measurements as needed.
6. Click **Done with Measurements** before moving to the tracing/calculation steps.

Saved references appear in a visible list and can be deleted.

The workflow intentionally stays on the Reference Measurement step after each saved measurement. If the user clicks **Done with Measurements** before saving at least one reference, the UI shows:

```text
Add at least one reference measurement before continuing.
```

The saved reference list is collapsible. It stays expanded while references are being created or edited, then collapses after references are marked complete.

### Horizontal And Vertical Calibration

Reference measurements are classified by direction:

- Horizontal reference: `deltaX` is much larger than `deltaY`.
- Vertical reference: `deltaY` is much larger than `deltaX`.
- Diagonal reference: both directions are significant.

The calibration system uses:

- Horizontal references primarily for `scaleX`.
- Vertical references primarily for `scaleY`.

Area conversion uses:

```text
area_cm2 = area_px2 * (scaleX * scaleY)
```

The app calculates calibration quality information internally:

- Horizontal scale average
- Vertical scale average
- Number of horizontal references
- Number of vertical references
- Number of diagonal references

These technical calibration statistics are hidden from the standard user workflow. If only one direction is calibrated, the app still reuses the available scale for the missing axis so the prototype can calculate.

### Zoom And Rotation Features

The image viewer supports:

- Fit to Screen
- Zoom In
- Zoom Out
- Reset Zoom
- Rotate Left 90 degrees
- Rotate Right 90 degrees

Drawing coordinates remain accurate after zooming or rotating because points are stored in original image coordinates and transformed only for display and click mapping.

On upload, portrait-oriented images are automatically rotated into landscape orientation to better fit table/slab analysis. Manual rotate controls remain available as a fallback.

### Project Save And Import

The app can save the current work as a downloadable JSON project file and import it later.

Saved project files include:

- app version
- uploaded image data
- calibration reference measurements
- current calculation mode and selected drawing mode
- project notes
- mold boundary mode
- mold boundary polygon
- wood boundary polygon
- isolated cavity polygons
- cavity names
- cavity depths
- main resin depth
- latest calculated results, if available

After import, the image and project state are restored so the user can continue editing polygons, add more measurements, change depths, and recalculate.

If the imported file is invalid or the embedded image cannot be loaded, the UI shows a warning/error message.

### PDF Export

The app can export a client-side PDF report using the browser.

The PDF report includes:

- report title and generated date/time
- the current project image exactly as shown on the canvas, including visible overlays
- calculation mode
- reference measurements and entered dimensions
- Standard Resin Area results, when in Standard mode
- Wood Boundary Mode mold/wood/main resin results, when in Wood Boundary Mode
- per-cavity area, depth, and volume
- total resin volume
- recommended amount with 10% margin
- project notes
- horizontal/vertical scale information

PDF export is enabled only after a valid calculation result exists.

### Main Resin Volume Calculation

In Wood Boundary Mode, the app separates main resin volume from isolated cavity volume.

The mold boundary can be defined in two ways internally:

- **Use image border as mold**: the full uploaded image rectangle can still be used internally as the mold area.
- **Draw mold boundary**: the normal visible workflow. The user traces the inside edge of the mold/coffrage, and that polygon becomes the mold area.

Main Resin Area is calculated as:

```text
Main Resin Area = Mold Area - Wood Area
```

This represents the main resin pour around the wood. Isolated cavities are separate pours and are not added into the main resin area.

Main Resin Volume is calculated from:

```text
Main Resin Volume = Main Resin Area * Main Pour Depth
```

The UI exposes this as **Main Resin Depth (mm)** in the final calculation bar below the image.

### Isolated Cavity Support

Wood Boundary Mode supports isolated internal resin cavities inside the traced wood boundary.

Current behavior:

1. Click **Add Resin Cavity** near the image.
2. Click points around the cavity.
3. Click **Finish cavity** to save it.
4. Review the newly created cavity summary near the image.
5. Repeat for additional cavities.

Saved cavities are drawn separately from the wood boundary and appear in a cavity list near the image workspace. The newest saved cavity is selected and visually highlighted.

The visible cavity list keeps the main view simple:

- Cavity name
- Independent depth input
- Discreet trash icon button
- Collapsed **Details** section for area and volume

### Polygon Editing Safety Controls

Wood Boundary Mode includes first-stage correction controls for manual tracing:

- **Undo last point** removes only the most recently placed point from the currently active drawing.
- It works for the drawn mold boundary, wood boundary, and the current isolated cavity being traced.
- It does not affect completed cavities unless the user is actively drawing a new cavity.
- Completed cavities still have individual discreet trash icon buttons, so one cavity can be removed without clearing all cavities.
- **Edit Mold Boundary** and **Edit Wood Boundary** allow completed mold and wood polygons to be selected and corrected.
- Clicking a completed cavity in the cavity list selects only that cavity for editing.
- Selected polygons are highlighted, and their vertices can be dragged on the canvas.
- Dragging a cavity vertex preserves that cavity's depth and does not affect other cavities.
- Live area and volume previews update as vertices move.
- After calculation, mold, wood, and cavity polygons remain editable.
- Clicking an existing mold, wood, or cavity polygon on the canvas selects it for vertex editing.
- Editing geometry, cavity depths, or main resin depth keeps the previous result visible but marks it with: **Results need recalculation after your latest edit.**
- Completed workflow stages remain complete while the user makes targeted post-calculation edits.

The UI also reminds the user:

```text
If you place a wrong point, use Undo last point before finishing the polygon.
```

### Independent Cavity Depths

Each isolated cavity can have its own depth.

The cavity panel includes:

- Per-cavity depth inputs.
- Collapsed per-cavity details for area and volume.

The cavity depth panel appears directly below the image workspace, above the final calculation bar, so cavity area, depth, and volume stay visually connected to the drawing area.

Default behavior:

- Each cavity gets an editable depth input in millimeters.
- Cavity depths are independent by default.

### Per-Cavity Volume Calculation

Each cavity has its own:

- Name
- Area
- Depth
- Volume

Cavity volume is calculated as:

```text
Cavity Volume = Cavity Area * Cavity Depth
```

The backend receives `cavityDepthsMm` and calculates each cavity volume independently.

### Total Project Volume Calculation

In Wood Boundary Mode, total resin volume is calculated as:

```text
Total Resin Volume = Main Volume + Sum(All Cavity Volumes)
```

The main results panel first displays:

- Total Resin Required
- Recommended Amount (+10%)

The results panel also includes a visible **Project Notes** text area for free-form notes such as client requests, pigment choice, staged pours, workshop temperature, or milling/depth reminders. Project notes are informational only; they are saved/imported with the project and included in PDF export, but they do not affect calculations or mark results stale.

Detailed technical results are available inside a collapsed **Detailed Breakdown** section:

- Main resin area
- Main depth
- Main volume
- Each cavity area
- Each cavity depth
- Each cavity volume
- Total resin volume

Live technical estimate information is also treated as optional and appears under **Advanced Details**.

### Recommended Amount Calculation

The app currently applies a 10% safety margin to the calculated resin volume.

For Standard Resin Area mode:

```text
Recommended Amount = Resin Volume * 1.10
```

For Wood Boundary Mode:

```text
Recommended Amount = Total Resin Volume * 1.10
```

This is a simple prototype recommendation and does not yet account for staged pours, waste behavior, edge loss, bubbles, overfill, or resin-specific working constraints.

## Current Workflow

### Standard Resin Area Workflow

1. Start the FastAPI backend.
2. Start the React frontend.
3. Open the frontend in the browser.
4. Upload a photo.
5. Add at least one reference measurement.
6. Prefer adding both horizontal and vertical references.
7. Click **Done with Measurements**.
8. Select **Standard Resin Area** mode.
9. Select **Polygon Mode**.
10. Click points around the resin area.
11. Enter resin depth in millimeters.
12. Click **Calculate**.
13. Review selected area, resin volume, and recommended amount.

### Save/Import Workflow

1. Work on a project normally.
2. Click **Save Project** to download a JSON file containing the image and current project state.
3. Later, click **Import Project**.
4. Select the saved JSON file.
5. Continue editing polygons, depths, references, and results from the restored state.

### Wood Boundary Mode Workflow

1. Start the FastAPI backend.
2. Start the React frontend.
3. Open the frontend in the browser.
4. Upload a photo.
5. Add reference measurements.
6. Prefer adding both horizontal and vertical references.
7. Click **Done with Measurements**.
8. Stay in the default **Wood Boundary Mode** workflow, or switch back to it if another mode was selected.
9. Click **Draw Mold Boundary** and trace the inside edge of the mold/coffrage.
10. Click **Finish Mold**.
11. Click **Draw Wood Boundary** and trace the outer boundary of the wood.
12. Click **Finish Wood**.
13. Click **Add Resin Cavity**.
14. Trace a cavity inside the wood.
15. Click **Finish cavity**.
16. Review the highlighted cavity summary near the image.
17. Repeat cavity add/edit/delete steps as needed.
18. Click **Finish Cavities**.
19. Enter **Main Resin Depth (mm)** in the final calculation bar below the image.
20. Enter per-cavity depths as needed.
21. Click **Calculate Resin Volume**.
22. Review **Total Resin Required** and **Recommended Amount (+10%)** first.
23. Open **Detailed Breakdown** if mold area, wood area, main resin area, main volume, each cavity volume, total resin volume, and recommended amount are needed.

## Known Limitations

- All tracing is manual; there is no AI segmentation or automatic wood detection.
- Polygon editing is limited; points cannot yet be dragged, inserted, or individually deleted.
- Multiple cavity workflow is basic; cavities can be added and deleted, but the flow could be smoother.
- Calibration is global and direction-aware, but it does not perform spatial interpolation.
- Diagonal references are tracked but not used as primary axis calibration.
- If only one calibration direction is available, the prototype reuses that scale for the missing axis and warns the user.
- Perspective distortion is not corrected.
- Lens distortion is not corrected.
- Drawing a custom mold boundary is manual; there is no snapping, straight-edge constraint, or rectangle helper yet.
- Cavity area/volume previews depend on available calibration.
- Safety margin is a fixed 10% and may not fit every real pour.
- No undo/redo exists yet.
- Mobile usability is limited.
- The UI is functional but intentionally minimal.

## Next Planned Improvements

- Multiple cavity workflow improvements
- Better resin recommendation logic for final pours
- Optional AI-assisted wood detection
- Mobile usability improvements
