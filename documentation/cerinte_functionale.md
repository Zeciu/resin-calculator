Resin Volume Estimator — Functional Specification

1. Purpose

Resin Volume Estimator is a professional tool for estimating epoxy resin volume for river tables and woodworking projects based on a project photo.

The goal is not to provide an absolute laboratory-grade measurement, but to give woodworkers a practical, reliable estimate that reduces guesswork, resin waste, and calculation errors.

---

2. Target Users

The application is intended for:

- woodworkers
- epoxy resin artists
- river table makers
- furniture makers
- small workshops
- makers who need to estimate resin volume before pouring

---

3. Main Workflow

The application follows a guided step-by-step workflow:

1. Upload project photo
2. Add reference measurements
3. Define mold boundary
4. Define wood islands
5. Define resin cavities
6. Enter resin depths
7. Calculate resin volume
8. Plan optional pour strategy

---

4. Photo Upload

The user uploads a top-down photo of the project.

Guidance shown to user:

For best results, upload a clear top-down photo of your project that includes the entire mold and all wood pieces.

The uploaded photo is used as the working canvas for all measurements and tracing.

---

5. Reference Measurements

The user draws one or more reference measurements using known real-world dimensions visible in the photo.

These measurements are used to calibrate the image scale before calculating resin volume.

Guidance shown to user:

Draw reference measurements using known dimensions visible in the photo. These measurements are used to calibrate the image scale before calculating resin volume. For best accuracy, add multiple horizontal and vertical references, especially when the photo is not perfectly top-down.

The application should support multiple reference measurements.

Future improvement:

- detect inconsistent references
- warn the user when the photo may be distorted or not taken directly from above

---

6. Mold Boundary

The user defines the internal mold boundary.

This represents the outer perimeter of the resin calculation area.

The application should allow the user to:

- draw mold boundary
- edit mold boundary
- clear mold boundary
- finish mold boundary

The mold boundary defines the maximum outer area available for resin.

---

7. Wood Islands

The user defines all wood islands inside the mold.

Wood islands represent solid wood areas that must be excluded from resin volume calculation.

The application should allow the user to:

- add wood island
- complete current island
- delete selected wood island
- clear wood islands
- finish wood stage

Wood islands should be editable through their points.

The pour planning and volume calculations must exclude wood island areas from resin volume.

---

8. Resin Cavities

The user defines resin cavities that may have different depths from the main resin area.

The application should allow the user to:

- add resin cavity
- finish cavity
- edit selected cavity
- clear all cavities
- finish cavities

Each cavity can have its own depth.

Cavity volume must be included in the total resin volume calculation.

---

9. Main Resin Depth

The user enters the main resin depth in millimeters.

This depth is applied to the main resin area.

Cavities may override this depth with their own individual depth values.

---

10. Resin Volume Calculation

The application calculates:

- total resin required
- recommended amount with +10%

The +10% recommendation accounts for:

- small leaks
- hidden gaps under wood
- resin left on mixing containers
- resin left on mixing sticks
- absorption into wood
- practical workshop loss

The application should clearly display:

- Total Resin Required
- Recommended Amount (+10%)

---

11. First Fill Seal Coat Calculator

The application includes an optional First Fill Seal Coat Calculator.

Purpose:

To calculate the resin needed for a thin first sealing layer used to seal pores, cracks, small leaks, and potential flow paths before the main pour.

Inputs:

- First Fill Seal Coat Thickness (mm)

Outputs:

- First Fill Seal Coat Volume
- Recommended First