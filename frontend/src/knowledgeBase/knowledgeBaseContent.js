/**
 * Static Knowledge Base content for the troubleshooting module.
 * Forward-compatible with stable entry ids and internal metadata fields.
 */

/** @typedef {"Epoxy" | "Wood" | "Finishing" | "Application" | "Projects" | "Calibration"} KnowledgeBaseCategory */
/** @typedef {"Beginner" | "Intermediate" | "Professional"} KnowledgeBaseDifficulty */
/** @typedef {{ type: "image", src: string, alt: string, caption?: string }} KnowledgeBaseImageMedia */
/** @typedef {{ type: "video", title: string, embedUrl: string, caption?: string }} KnowledgeBaseVideoMedia */
/** @typedef {KnowledgeBaseImageMedia | KnowledgeBaseVideoMedia} KnowledgeBaseMediaBlock */

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   category: KnowledgeBaseCategory;
 *   difficulty: KnowledgeBaseDifficulty;
 *   problemSummary: string;
 *   symptoms: string[];
 *   possibleCauses: string[];
 *   solution: string[];
 *   tips: string[];
 *   warnings: string[];
 *   media?: KnowledgeBaseMediaBlock[];
 * }} KnowledgeBaseEntry
 */

/** @type {KnowledgeBaseEntry[]} */
export const KNOWLEDGE_BASE_ENTRIES = [
  {
    id: "bubbles-after-curing",
    title: "Bubbles after curing",
    category: "Epoxy",
    difficulty: "Beginner",
    problemSummary:
      "Small voids or pinholes remain visible in the cured epoxy surface after the pour has hardened.",
    symptoms: [
      "Tiny round pits across the pour surface",
      "Bubbles trapped near wood edges or inclusions",
      "Rough texture that appears only after cure",
    ],
    possibleCauses: [
      "Air introduced during mixing or pouring",
      "Porous wood releasing trapped air into the resin",
      "Insufficient degassing before gelation",
    ],
    solution: [
      "Seal porous wood with a thin compatible coat before the main pour.",
      "Mix slowly and pour from a low height to reduce air entrapment.",
      "Use gentle torching or vibration only while the resin is still fluid and within pot life.",
      "For deep pours, consider thinner layers to limit exothermic heat and trapped air.",
    ],
    tips: [
      "Work in a warm, dry shop so viscosity stays predictable during bubble release.",
    ],
    warnings: [
      "Do not over-torch a nearly gelled pour; surface scorching can create new defects.",
    ],
  },
  {
    id: "sticky-resin-after-cure",
    title: "Resin remains sticky",
    category: "Epoxy",
    difficulty: "Intermediate",
    problemSummary:
      "The epoxy surface stays tacky or soft long after the expected handling time has passed.",
    symptoms: [
      "Fingerprints remain in the surface hours or days after pouring",
      "Uncured or rubbery patches in thicker areas",
      "Surface never reaches a hard, glassy finish",
    ],
    possibleCauses: [
      "Incorrect resin-to-hardener ratio",
      "Inadequate mixing of part A and part B",
      "Ambient temperature too low for the selected system",
      "Expired or contaminated components",
    ],
    solution: [
      "Verify the manufacturer mixing ratio by weight or volume before starting a new batch.",
      "Scrape the sides and bottom of the mixing container while combining components.",
      "Maintain shop temperature within the product data sheet range until full cure.",
      "If the pour will not harden, remove uncured material and recoat after surface preparation.",
    ],
    tips: [
      "Label mixed batches with time and ratio so troubleshooting is easier on repeat pours.",
    ],
    warnings: [
      "Never add extra hardener hoping to force cure; the batch may overheat or remain unstable.",
    ],
  },
  {
    id: "fish-eyes-in-finish",
    title: "Fish-eyes in the finish",
    category: "Finishing",
    difficulty: "Intermediate",
    problemSummary:
      "Small circular bare spots appear where the epoxy pulls away and refuses to wet the surface.",
    symptoms: [
      "Crater-like gaps in an otherwise smooth coat",
      "Defects that appear immediately after spreading",
      "Repeating spots in the same workpiece areas",
    ],
    possibleCauses: [
      "Silicone, oil, or wax contamination on the substrate",
      "Incompatible release agents on formwork",
      "Moisture or dust on the surface before pouring",
    ],
    solution: [
      "Clean the substrate with a method approved for your wood and epoxy system.",
      "Remove silicone contamination from molds or switch to epoxy-safe release practices.",
      "Wipe and allow the surface to dry fully before the next coat.",
      "Apply a thin seal coat to stabilize absorption before the fill pour.",
    ],
    tips: [],
    warnings: [
      "Household furniture polish residues are a common hidden cause of fish-eyes.",
    ],
  },
  {
    id: "cloudy-epoxy",
    title: "Cloudy epoxy",
    category: "Epoxy",
    difficulty: "Beginner",
    problemSummary:
      "The cured or curing epoxy looks hazy, milky, or inconsistently transparent.",
    symptoms: [
      "Loss of clarity in river channels or cast areas",
      "White haze near wood boundaries",
      "Cloudiness that deepens as the pour sets",
    ],
    possibleCauses: [
      "Moisture in wood or ambient humidity during cure",
      "Cold shop temperature causing micro-bubbles or blush",
      "Incompatible sealers bleeding into the resin",
    ],
    solution: [
      "Confirm wood moisture content is appropriate before pouring.",
      "Warm the resin components and workspace within manufacturer limits.",
      "Use a moisture-tolerant primer or sealer only when specified by the epoxy supplier.",
      "If clarity is critical, plan a controlled post-cure finish pass after full hardness.",
    ],
    tips: [
      "Store opened resin containers sealed and away from humid environments.",
    ],
    warnings: [],
  },
  {
    id: "sanding-scratches-visible",
    title: "Sanding scratches visible through finish",
    category: "Finishing",
    difficulty: "Professional",
    problemSummary:
      "Scratches reappear under the final epoxy coat even after careful sanding.",
    symptoms: [
      "Fine lines visible after the flood coat cures",
      "Swirl marks highlighted by overhead light",
      "Uneven gloss after the final polish",
    ],
    possibleCauses: [
      "Skipping grit progression between sanding steps",
      "Dust contamination before recoating",
      "Sanding through thin areas into softer wood",
    ],
    solution: [
      "Work through grits sequentially without jumping more than one step at a time.",
      "Remove all dust with vacuum and tack cloth before recoating.",
      "Seal exposed grain with a thin coat before applying the final aesthetic pour.",
      "Allow full cure between mechanical prep and the next resin layer.",
    ],
    tips: [
      "Side lighting makes remaining scratches easier to catch before the final coat.",
    ],
    warnings: [
      "Sanding uncured or soft epoxy can smear resin and lock defects into the surface.",
    ],
    media: [
      {
        type: "image",
        src: "/header-wood-epoxy.png",
        alt: "Finished wood and epoxy surface in a workshop",
        caption: "Supporting images can clarify the surface quality you are troubleshooting.",
      },
    ],
  },
  {
    id: "pour-overheating",
    title: "Pour overheating",
    category: "Epoxy",
    difficulty: "Professional",
    problemSummary:
      "A large mixed batch or thick pour heats up rapidly and may crack, yellow, or cure unpredictably.",
    symptoms: [
      "Mix cup becomes too hot to hold",
      "Smoke or strong odor from an exothermic reaction",
      "Cracks, distortion, or sudden viscosity rise in the mold",
    ],
    possibleCauses: [
      "Mass of resin too large for a single pour",
      "High ambient temperature accelerating exotherm",
      "Deep section without staged pours",
    ],
    solution: [
      "Reduce batch size and pour in controlled layers within pot life.",
      "Lower shop temperature or use a system rated for thicker pours.",
      "Monitor pour depth against manufacturer maximum single-pass limits.",
      "Allow partial cure between layers when building depth.",
    ],
    tips: [
      "Use separate smaller mixing containers for wide tables instead of one oversized batch.",
    ],
    warnings: [
      "An overheating batch can exotherm violently; stop pouring and protect the work area.",
    ],
  },
  {
    id: "mold-leakage",
    title: "Mold leakage",
    category: "Wood",
    difficulty: "Beginner",
    problemSummary:
      "Liquid resin escapes the formwork before gelation, causing material loss and messy edges.",
    symptoms: [
      "Resin pooling outside the intended cavity",
      "Dropping level in the river channel during cure",
      "Wet lines along tape seams or board joints",
    ],
    possibleCauses: [
      "Gaps at live-edge transitions",
      "Failed tape dam or inadequate clamp pressure",
      "Warped boards opening seams under pour weight",
    ],
    solution: [
      "Seal all potential escape paths with epoxy-safe damming before the main pour.",
      "Clamp and verify the formwork is square and tight under load.",
      "Run a thin seal coat to reveal pinholes before the fill pour.",
      "Pour in stages if hydrostatic pressure exposes weak seams.",
    ],
    tips: [],
    warnings: [
      "A slow leak can drain enough resin to leave the cavity under-filled and structurally weak.",
    ],
  },
  {
    id: "incorrect-resin-ratio",
    title: "Incorrect resin ratio",
    category: "Epoxy",
    difficulty: "Beginner",
    problemSummary:
      "The mixed batch was prepared with the wrong proportion of resin to hardener.",
    symptoms: [
      "Soft or tacky cure",
      "Brittle or chalky cured material",
      "Uneven hardness across the pour",
    ],
    possibleCauses: [
      "Volume and weight ratios confused",
      "Unmarked or reused mixing cups",
      "Partial pump strokes on dispensing equipment",
    ],
    solution: [
      "Stop using the affected batch and mix a new one at the verified ratio.",
      "Use digital scale measurement when the data sheet specifies by weight.",
      "Mark dedicated mixing containers for part A and part B.",
      "Remove uncured material before applying a corrected recoat.",
    ],
    tips: [
      "Photograph the product label ratio and keep it visible at the mixing station.",
    ],
    warnings: [
      "Adding more hardener to salvage a batch can create dangerous exotherm.",
    ],
  },
  {
    id: "warped-boards-after-cure",
    title: "Warped boards after cure",
    category: "Wood",
    difficulty: "Intermediate",
    problemSummary:
      "The table blank cups, twists, or opens joints after the epoxy pour cures.",
    symptoms: [
      "Visible bow across the width of the slab",
      "Gaps opening at glue lines",
      "Uneven river channel depth after demolding",
    ],
    possibleCauses: [
      "Moisture imbalance between wood faces",
      "Insufficient restraint during cure",
      "Wood movement after a one-sided seal",
    ],
    solution: [
      "Acclimate lumber before milling and check moisture on both faces.",
      "Keep the assembly flat with cauls or a level press until initial cure completes.",
      "Balance sealing so one face does not absorb humidity differently.",
      "Allow the piece to stabilize in the shop before final flattening.",
    ],
    tips: [
      "Record moisture readings when the defect appears to compare with future projects.",
    ],
    warnings: [],
  },
  {
    id: "calibration-inaccurate",
    title: "Calibration problems",
    category: "Calibration",
    difficulty: "Intermediate",
    problemSummary:
      "HFZWood volume estimates do not match the real-world pour after calibration.",
    symptoms: [
      "Calculated resin volume consistently too high or too low",
      "Polygon areas look correct but totals feel unrealistic",
      "Reference length changes produce unstable results",
    ],
    possibleCauses: [
      "Reference measurement placed on a distorted part of the photo",
      "Known length entered in the wrong unit",
      "Camera angle too steep for reliable scale on the work surface",
    ],
    solution: [
      "Place the reference on the same plane as the pour surface.",
      "Re-enter the known length and confirm unit selection.",
      "Retake the photo square to the table when perspective error is visible.",
      "Mark multiple references and compare consistency before drawing polygons.",
    ],
    tips: [
      "A steel rule photographed flat on the slab is often more reliable than edge estimates.",
    ],
    warnings: [
      "Do not mix millimeter and inch values when entering the known reference length.",
    ],
  },
  {
    id: "image-upload-issues",
    title: "Image upload issues",
    category: "Application",
    difficulty: "Beginner",
    problemSummary:
      "A project photograph fails to load or appears unusable in the HFZWood workspace.",
    symptoms: [
      "Upload appears to complete but the canvas stays blank",
      "Image looks extremely dark or low resolution on import",
      "Browser stalls when selecting a very large file",
    ],
    possibleCauses: [
      "Unsupported or corrupted image file",
      "File size exceeds practical browser memory limits",
      "Very high resolution without need for the calculation task",
    ],
    solution: [
      "Use a common format such as JPEG or PNG from a direct camera export.",
      "Resize extremely large photos to a workshop-appropriate resolution before upload.",
      "Retry with a fresh export if the file may be corrupted.",
      "Close other heavy browser tabs and attempt the upload again.",
    ],
    tips: [
      "A well-lit photo with the full pour area in frame reduces rework later in the workflow.",
    ],
    warnings: [],
  },
  {
    id: "project-import-problems",
    title: "Project import problems",
    category: "Projects",
    difficulty: "Beginner",
    problemSummary:
      "A saved HFZWood project file cannot be opened or restores incomplete state.",
    symptoms: [
      "Import rejected as invalid project data",
      "Image missing after restore",
      "Calibration or polygons absent after opening",
    ],
    possibleCauses: [
      "File is not a valid .hfzproject export",
      "Project saved from a much older build with incompatible structure",
      "File truncated during transfer or incomplete download",
    ],
    solution: [
      "Confirm the file extension and reopen from the original save location.",
      "Use Open Project from the Projects hub and select the file again.",
      "If the handle is stale, use Locate Project File to rebind the recent entry.",
      "Re-save a known-good project and compare file size with the failing copy.",
    ],
    tips: [
      "Keep a second copy of important project files until a pour is complete.",
    ],
    warnings: [
      "Editing project JSON by hand can break validation and prevent restore.",
    ],
    media: [
      {
        type: "video",
        title: "Working with saved HFZWood projects",
        embedUrl: "https://www.youtube.com/embed/EngW7tLk6R8",
        caption: "Video walkthroughs are supported but expected to remain rare in Knowledge Base entries.",
      },
    ],
  },
];
