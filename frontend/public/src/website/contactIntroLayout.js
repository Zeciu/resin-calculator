/**
 * Split the published Contact intro into layout groups without rewriting copy.
 * Blank-line blocks in the CMS already correspond to lead / resources / feedback.
 *
 * @param {unknown} intro
 * @param {unknown} publicTitle
 * @returns {{
 *   lead: { heading: string, body: string },
 *   resources: { heading: string, body: string } | null,
 *   feedbackBlocks: Array<{ heading: string, body: string }>,
 * }}
 */
export function partitionContactIntro(intro, publicTitle = "") {
  const normalized = String(intro ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!normalized) {
    return { lead: { heading: "", body: "" }, resources: null, feedbackBlocks: [] };
  }

  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => parseContactIntroBlock(block, index === 0 ? publicTitle : ""));

  const lead = blocks[0] ?? { heading: "", body: "" };
  if (blocks.length === 1) {
    return { lead, resources: null, feedbackBlocks: [] };
  }

  return {
    lead,
    resources: blocks[1],
    feedbackBlocks: blocks.slice(2),
  };
}

function parseContactIntroBlock(block, publicTitleToStrip) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { heading: "", body: "" };
  }

  const title = String(publicTitleToStrip ?? "").trim();
  const usable =
    title && lines[0].toLowerCase() === title.toLowerCase() ? lines.slice(1) : lines;
  if (usable.length === 0) {
    return { heading: "", body: "" };
  }

  // The page H1 already shows the public title; do not promote the lead block.
  if (title) {
    return { heading: "", body: joinIntroLines(usable) };
  }

  const first = usable[0];
  const rest = usable.slice(1);
  const isExistingShortHeading =
    rest.length > 0 && first.length <= 72 && !/[.!?…]$/.test(first);
  if (isExistingShortHeading) {
    return { heading: first, body: joinIntroLines(rest) };
  }
  return { heading: "", body: joinIntroLines(usable) };
}

function joinIntroLines(lines) {
  return lines.join(" ").replace(/\s+/g, " ").trim();
}
