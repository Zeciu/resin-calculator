/**
 * Static manual content for the Manual & Tutorials module.
 * Forward-compatible with Task 51 (stable section IDs, typed blocks).
 */

/** @typedef {{ type: "heading", level: 2 | 3 | 4, text: string }} HeadingBlock */
/** @typedef {{ type: "paragraph", text: string }} ParagraphBlock */
/** @typedef {{ type: "image", src: string, alt: string, caption?: string }} ImageBlock */
/** @typedef {{ type: "video", title: string, embedUrl: string, caption?: string }} VideoBlock */
/** @typedef {HeadingBlock | ParagraphBlock | ImageBlock | VideoBlock} ManualBlock */

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   blocks: ManualBlock[];
 * }} ManualSection
 */

/** @type {ManualSection[]} */
export const MANUAL_SECTIONS = [
  {
    id: "introduction",
    title: "Introduction",
    blocks: [
      {
        type: "paragraph",
        text: "HFZWood helps woodworkers estimate epoxy resin volume from workshop photographs. This manual explains the core workflow: upload a photo, calibrate real-world dimensions, define mold and wood boundaries, and review calculated volumes before you mix resin.",
      },
      {
        type: "paragraph",
        text: "The application is designed for practical shop use. Each step builds on the previous one, so you can move from a single reference photo to a reliable pour plan without leaving the workspace.",
      },
    ],
  },
  {
    id: "project-workflow",
    title: "Project Workflow",
    blocks: [
      {
        type: "paragraph",
        text: "A typical HFZWood project begins on the New Project workspace. You import or capture a photo of the piece you intend to fill with resin, then work through calibration, polygon drawing, and volume review in one continuous session.",
      },
      {
        type: "image",
        src: "/header-wood-epoxy.png",
        alt: "Wood and epoxy resin in a workshop setting",
        caption:
          "Reference photographs anchor the workflow. The manual places supporting visuals directly beside the explanation they clarify.",
      },
      {
        type: "paragraph",
        text: "When you are satisfied with the estimate, save the project as an .hfzproject file. You can reopen saved projects from the Projects hub, make adjustments, and save updates to the same file.",
      },
    ],
  },
  {
    id: "calibration",
    title: "Calibration",
    blocks: [
      {
        type: "paragraph",
        text: "Calibration connects pixels in your photograph to real-world measurements. Draw a reference line along a known dimension in the image, then enter its length in millimeters. HFZWood uses that ratio for every area and volume calculation that follows.",
      },
      {
        type: "video",
        title: "Calibration walkthrough",
        embedUrl: "https://www.youtube.com/embed/EngW7tLk6R8",
        caption:
          "This sample tutorial demonstrates placing a calibration line on a reference edge and entering the measured length.",
      },
      {
        type: "paragraph",
        text: "Accurate calibration is the foundation of a trustworthy resin estimate. If the reference line does not align with a true known dimension, every subsequent polygon and volume value will be scaled incorrectly.",
      },
    ],
  },
  {
    id: "polygons-and-volume",
    title: "Polygons and Volume",
    blocks: [
      {
        type: "paragraph",
        text: "After calibration, define the mold boundary and any wood islands that displace resin. The calculator subtracts wood area from the mold footprint and applies your depth values to produce a total resin volume.",
      },
      {
        type: "paragraph",
        text: "Review the pouring plan and safety margin before mixing. Adjust polygons or depth inputs as your workshop layout becomes clearer—the workspace keeps your project editable until you export or finalize your report.",
      },
    ],
  },
];
