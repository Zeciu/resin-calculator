import {
  blocksToDocument,
  documentToBlocks,
  documentsSemanticallyEqual,
  emptyDocument,
} from "../manual/manualEditorAdapter.js";

export { emptyDocument, documentsSemanticallyEqual };

export function emptyEditorState() {
  return {
    term: "",
    document: emptyDocument(),
    media: [],
    relatedTermIds: [],
    synonymTermIds: [],
    seeAlso: [],
    status: "draft",
    editorialVisibility: "empty",
    exists: true,
    translationUpdateState: null,
    translationUpdateAction: null,
  };
}

export function variantToEditor(variant) {
  return {
    term: variant?.body?.term ?? "",
    document: blocksToDocument(variant?.body?.definitionBlocks ?? []),
    media: variant?.body?.media ?? [],
    relatedTermIds: variant?.body?.relatedTermIds ?? [],
    synonymTermIds: variant?.body?.synonymTermIds ?? [],
    seeAlso: (variant?.body?.seeAlso ?? []).map((reference) => ({
      contentId: reference.targetContentId,
      label: reference.label ?? "",
      contentType: reference.targetType,
      targetType: reference.targetType,
    })),
    status: variant?.status ?? "draft",
    editorialVisibility: variant?.editorialVisibility ?? "empty",
    exists: variant?.exists !== false,
    translationUpdateState: variant?.translationUpdateState ?? null,
    translationUpdateAction: variant?.translationUpdateAction ?? null,
  };
}

export function editorToVariantBody(state) {
  return {
    term: state.term.trim(),
    definitionBlocks: documentToBlocks(state.document),
    media: state.media ?? [],
    relatedTermIds: state.relatedTermIds ?? [],
    synonymTermIds: state.synonymTermIds ?? [],
    seeAlso: (state.seeAlso ?? []).map((reference) => ({
      targetContentId: reference.contentId,
      targetType: reference.targetType ?? reference.contentType,
      label: reference.label ?? "",
    })),
  };
}

export function editorStatesEqual(left, right) {
  if ((left.term ?? "").trim() !== (right.term ?? "").trim()) {
    return false;
  }
  if (!documentsSemanticallyEqual(left.document, right.document)) {
    return false;
  }
  return (
    JSON.stringify(left.media ?? []) === JSON.stringify(right.media ?? []) &&
    JSON.stringify(left.relatedTermIds ?? []) === JSON.stringify(right.relatedTermIds ?? []) &&
    JSON.stringify(left.synonymTermIds ?? []) === JSON.stringify(right.synonymTermIds ?? []) &&
    JSON.stringify(left.seeAlso ?? []) === JSON.stringify(right.seeAlso ?? [])
  );
}
