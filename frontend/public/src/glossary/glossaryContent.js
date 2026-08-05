/**
 * Static glossary content for the Glossary module.
 * Forward-compatible with future related terms and cross-links (stable ids).
 */

/** @typedef {{ type: "image", src: string, alt: string, caption?: string }} GlossaryImageMedia */
/** @typedef {{ type: "video", title: string, embedUrl: string, caption?: string }} GlossaryVideoMedia */
/** @typedef {GlossaryImageMedia | GlossaryVideoMedia} GlossaryMediaBlock */

/**
 * @typedef {{
 *   id: string;
 *   term: string;
 *   definition: string[];
 *   media?: GlossaryMediaBlock[];
 * }} GlossaryEntry
 */

/** @type {GlossaryEntry[]} */
export const GLOSSARY_ENTRIES = [
  {
    id: "bubble-removal",
    term: "Bubble removal",
    definition: [
      "Techniques used to reduce trapped air in epoxy pours before gelation, such as gentle torching, vibration, or vacuum assistance depending on the project.",
    ],
  },
  {
    id: "calibration",
    term: "Calibration",
    definition: [
      "The process of linking pixels in a project photograph to a real-world measurement by marking a known reference length in HFZWood.",
      "Accurate calibration is required before polygon areas and resin volumes can be trusted.",
    ],
  },
  {
    id: "curing-time",
    term: "Curing time",
    definition: [
      "The period after mixing during which epoxy transitions from liquid to solid. Manufacturer data sheets list handling and full-cure times separately.",
    ],
  },
  {
    id: "epoxy-resin",
    term: "Epoxy resin",
    definition: [
      "A two-component polymer system that cures when resin and hardener are mixed in the manufacturer-specified ratio.",
      "In river tables and castings, epoxy fills voids and bonds with prepared wood surfaces.",
    ],
    media: [
      {
        type: "image",
        src: "/header-wood-epoxy.png",
        alt: "Wood and epoxy resin in a workshop setting",
        caption: "Supporting images can clarify material appearance inside a definition.",
      },
    ],
  },
  {
    id: "exothermic-reaction",
    term: "Exothermic reaction",
    definition: [
      "Heat released as epoxy cures. Thick pours and large mixed batches can heat up quickly, affecting working time and finish quality.",
    ],
  },
  {
    id: "formwork",
    term: "Formwork",
    definition: [
      "The physical mold or dam that contains liquid resin until it cures. Leak-free formwork is essential for predictable pours and clean edges.",
    ],
  },
  {
    id: "hardener",
    term: "Hardener",
    definition: [
      "Component B in a two-part epoxy system. It reacts with the resin component to begin curing and must be measured accurately.",
    ],
  },
  {
    id: "live-edge",
    term: "Live edge",
    definition: [
      "A board edge that retains the natural contour of the tree rather than being cut straight. Live-edge river tables often require careful sealing before resin pours.",
    ],
  },
  {
    id: "mixing-ratio",
    term: "Mixing ratio",
    definition: [
      "The proportion of resin to hardener specified by the manufacturer, usually by volume or weight. Incorrect ratios can prevent proper cure.",
    ],
  },
  {
    id: "moisture-content",
    term: "Moisture content",
    definition: [
      "The amount of water present in wood, typically expressed as a percentage. High moisture can interfere with epoxy adhesion and cause defects.",
    ],
  },
  {
    id: "pot-life",
    term: "Pot life",
    definition: [
      "The usable working time of a mixed epoxy batch before viscosity rises enough to make pouring or spreading difficult.",
      "Pot life shortens as mix volume and ambient temperature increase because of the exothermic reaction.",
    ],
  },
  {
    id: "sealing",
    term: "Sealing",
    definition: [
      "Applying a thin epoxy coat or compatible sealer to porous wood so the main pour does not absorb resin unevenly or trap bubbles.",
    ],
    media: [
      {
        type: "video",
        title: "Sealing porous wood before a resin pour",
        embedUrl: "https://www.youtube.com/embed/EngW7tLk6R8",
        caption: "Video demonstrations are supported but expected to remain rare in glossary entries.",
      },
    ],
  },
  {
    id: "wood-movement",
    term: "Wood movement",
    definition: [
      "Dimensional change in wood as moisture content changes with seasons. Movement is a key reason moisture measurement matters before large castings.",
    ],
  },
];
