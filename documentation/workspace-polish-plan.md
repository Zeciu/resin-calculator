# Workspace Polish Plan (Version 2.1)

**Status:** Complete (2026-07-04). Manually verified by Product Owner. Release commit: `Workspace Polish: Complete Version 2.1`.

## Objective

Refine the user experience of the HFZWood calculator workspace by improving the interaction between the user and the uploaded image.

This milestone focuses exclusively on usability improvements discovered during real-world use after the successful completion of Phase 2.

No new product functionality is introduced.

---

## Scope

Workspace Polish is limited to small UX improvements that make the calculator faster, clearer and more comfortable to use.

The calculation engine, project format, data persistence, application architecture and workflows introduced during Phase 2 remain unchanged.

---

# WP-01 — Reposition Image and Navigation Controls

## Observation

After uploading an image, the workspace scroll position does not immediately present the optimal working area.

## Improvement

After the image is loaded:

- automatically scroll so the uploaded image is fully visible;
- place the image navigation toolbar directly below the image:
  - Fit to Screen
  - Zoom In
  - Zoom Out
  - Reset Zoom
  - Rotate Left
  - Rotate Right

## Benefit

Natural workflow:

Upload → View Image → Adjust Image → Start Measuring

---

# WP-02 — Temporary Alignment Grid for Reference Measurements

## Observation

Reference Measurements require accurate vertical and horizontal alignment, but photographs are often slightly rotated or taken from imperfect angles.

## Improvement

While the user is placing Reference Measurements:

- display a subtle alignment grid over the image;
- approximately three vertical and three horizontal guide lines;
- low opacity so the image remains clearly visible.

The grid disappears automatically after completing the Reference Measurements step.

## Benefit

More accurate reference measurements with minimal visual distraction.

---

# WP-03 — Keep the Working Area Fully Visible

## Observation

The image information overlay can cover parts of the photograph while working at higher zoom levels.

## Improvement

The informational overlay should not obscure the working image during editing.

The image should remain fully usable while placing reference points and drawing boundaries.

## Benefit

Maximum visibility and more precise editing.

---

# WP-04 — Consistent Editing Colors

## Observation

Some editing elements use colors that blend into darker wood surfaces.

## Improvement

All actively edited geometry should use a high-contrast color palette.

Examples:

- active points
- active segments
- active boundaries

After completion, the finished geometry should transition to a consistent completed-state color, following the existing Cavities workflow.

## Benefit

Better visibility, easier editing and consistent visual language across all workspace tools.

---

# WP-05 — Recommendation Placeholder for First Fill Seal Coat Thickness

## Observation

The "First Fill Seal Coat Thickness (mm)" field provides no guidance for new users.

## Improvement

Display a subtle placeholder inside the field:

Recommended: 3 mm

This is only a visual recommendation and must not become the default value.

## Benefit

Provides immediate guidance without affecting calculations.

---

# Acceptance Criteria

Workspace Polish is considered complete when:

- all five improvements have been implemented;
- no calculation logic has changed;
- no project format changes have been introduced;
- existing workflows continue to function correctly;
- usability is improved without increasing interface complexity.

---

# Out of Scope

Workspace Polish does not include:

- Admin Panel
- Cloud Save
- User Accounts
- AI functionality
- Global Search
- Knowledge Base changes
- Manual changes
- Glossary changes
- Project management redesign
- New calculator features
- Algorithm changes
- Data model changes
- Application architecture changes

These items remain part of future development phases.

---

## Success Criteria

The workspace should feel noticeably smoother and more intuitive during everyday use while preserving the stability and architecture achieved in Phase 2.

---

## Implementation notes (2026-07-04)

All five items (WP-01 through WP-05) implemented in `frontend/src/calculator/ResinCalculator.jsx` and `frontend/src/styles.css`.

- **WP-01** — `workspace-image-panel` wraps the canvas; view controls moved below the image; auto-scroll on `imageDataUrl` change (upload and project restore).
- **WP-02** — `drawReferenceAlignmentGrid()` renders a 3×3 guide over the displayed image bounds while `!measurementsComplete`; grid follows zoom and rotation.
- **WP-03** — Canvas HUD removed; status moved to DOM `canvas-status-bar` below the image.
- **WP-04** — `WORKSPACE_EDIT_COLORS` defines high-contrast active palette; completed geometry uses brighter semantic colors (mold, wood, cavity, standard).
- **WP-05** — First Fill Seal Coat Thickness input uses `placeholder="Recommended: 3 mm"` with no default value.

No calculation logic, project format, or persistence changes. Manual verification passed. Automated regression: production build succeeded; 122 frontend and 34 backend tests passed.