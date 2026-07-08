export const KB_CATEGORIES = ["Epoxy", "Wood", "Finishing", "Application", "Projects", "Calibration"];
export const KB_DIFFICULTIES = ["Beginner", "Intermediate", "Professional"];

export function emptyEditorState() {
  return {
    title: "",
    category: "Epoxy",
    difficulty: "Beginner",
    problemSummary: "",
    symptoms: [""],
    possibleCauses: [""],
    solution: [""],
    prevention: [""],
    tips: [""],
    warnings: [""],
    searchKeywords: [],
    estimatedRepairTime: "",
    requiredTools: [""],
    requiredMaterials: [""],
    media: [],
    relatedKbEntryIds: [],
    relatedGlossaryEntryIds: [],
    relatedManualChapterIds: [],
    relatedKbSelected: [],
    relatedGlossarySelected: [],
    relatedManualSelected: [],
    status: "draft",
    editorialVisibility: "empty",
    exists: true,
  };
}

function ensureList(values, allowEmpty = true) {
  const items = (values ?? []).map((value) => String(value ?? ""));
  if (items.length === 0 && allowEmpty) {
    return [""];
  }
  return items;
}

export function variantToEditor(variant) {
  const body = variant?.body ?? {};
  return {
    title: body.title ?? "",
    category: variant?.category ?? "Epoxy",
    difficulty: variant?.difficulty ?? "Beginner",
    problemSummary: body.problemSummary ?? "",
    symptoms: ensureList(body.symptoms),
    possibleCauses: ensureList(body.possibleCauses),
    solution: ensureList(body.solution),
    prevention: ensureList(body.prevention),
    tips: ensureList(body.tips),
    warnings: ensureList(body.warnings),
    searchKeywords: body.searchKeywords ?? [],
    estimatedRepairTime: body.estimatedRepairTime ?? "",
    requiredTools: ensureList(body.requiredTools),
    requiredMaterials: ensureList(body.requiredMaterials),
    media: body.media ?? [],
    relatedKbEntryIds: body.relatedKbEntryIds ?? [],
    relatedGlossaryEntryIds: body.relatedGlossaryEntryIds ?? [],
    relatedManualChapterIds: body.relatedManualChapterIds ?? [],
    relatedKbSelected: (body.relatedKbEntryIds ?? []).map((contentId) => ({ contentId, label: contentId })),
    relatedGlossarySelected: (body.relatedGlossaryEntryIds ?? []).map((contentId) => ({
      contentId,
      label: contentId,
    })),
    relatedManualSelected: (body.relatedManualChapterIds ?? []).map((contentId) => ({
      contentId,
      label: contentId,
    })),
    status: variant?.status ?? "draft",
    editorialVisibility: variant?.editorialVisibility ?? "empty",
    exists: variant?.exists !== false,
  };
}

function cleanList(values) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

export function editorToVariantBody(state) {
  return {
    title: state.title.trim(),
    problemSummary: state.problemSummary.trim(),
    symptoms: cleanList(state.symptoms),
    possibleCauses: cleanList(state.possibleCauses),
    solution: cleanList(state.solution),
    prevention: cleanList(state.prevention),
    tips: cleanList(state.tips),
    warnings: cleanList(state.warnings),
    searchKeywords: cleanList(state.searchKeywords),
    estimatedRepairTime: state.estimatedRepairTime?.trim() || null,
    requiredTools: cleanList(state.requiredTools),
    requiredMaterials: cleanList(state.requiredMaterials),
    bodyBlocks: [],
    media: state.media ?? [],
    relatedKbEntryIds: state.relatedKbEntryIds ?? [],
    relatedGlossaryEntryIds: state.relatedGlossaryEntryIds ?? [],
    relatedManualChapterIds: state.relatedManualChapterIds ?? [],
  };
}

export function editorStatesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
