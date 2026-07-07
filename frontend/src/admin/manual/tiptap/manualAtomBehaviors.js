import { Extension } from "@tiptap/core";
import { NodeSelection, Plugin } from "@tiptap/pm/state";

const MEDIA_NODE_NAMES = ["manualImage", "manualVideo"];

function isMediaNodeName(name) {
  return MEDIA_NODE_NAMES.includes(name);
}

export function resolveMediaNodePosition(doc, clickPos) {
  const clampedPos = Math.max(0, Math.min(clickPos, doc.content.size));
  const $pos = doc.resolve(clampedPos);

  const nodeAfter = $pos.nodeAfter;
  if (nodeAfter && isMediaNodeName(nodeAfter.type.name)) {
    return $pos.pos;
  }

  const nodeBefore = $pos.nodeBefore;
  if (nodeBefore && isMediaNodeName(nodeBefore.type.name)) {
    return $pos.pos - nodeBefore.nodeSize;
  }

  return null;
}

export function getSelectedMediaPosition(editor, requireUserSelection = false) {
  if (requireUserSelection && !editor.storage?.manualMediaBehavior?.userSelectedMedia) {
    return null;
  }

  const { selection } = editor.state;
  if (selection instanceof NodeSelection && isMediaNodeName(selection.node.type.name)) {
    return selection.from;
  }
  return null;
}

export function manualMediaKeyboardShortcuts() {
  function deleteSelectedMedia({ editor }) {
    const mediaPos = getSelectedMediaPosition(editor);
    if (mediaPos === null) {
      return false;
    }
    return editor.chain().setNodeSelection(mediaPos).deleteSelection().run();
  }

  return {
    Backspace: deleteSelectedMedia,
    Delete: deleteSelectedMedia,
  };
}

function selectMediaFromEvent(view, extension, event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }

  const mediaRoot = target.closest("[data-manual-image], [data-manual-video]");
  if (!mediaRoot) {
    extension.storage.userSelectedMedia = false;
    return false;
  }

  const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!coords) {
    return false;
  }

  const mediaPos = resolveMediaNodePosition(view.state.doc, coords.pos);
  if (mediaPos === null) {
    return false;
  }

  event.preventDefault();
  extension.storage.userSelectedMedia = true;
  view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, mediaPos)));
  return true;
}

function createManualMediaSelectionPlugin(extension) {
  return new Plugin({
    props: {
      handleDOMEvents: {
        mousedown(view, event) {
          return selectMediaFromEvent(view, extension, event);
        },
      },
    },
  });
}

export const ManualMediaBehavior = Extension.create({
  name: "manualMediaBehavior",

  addStorage() {
    return {
      userSelectedMedia: false,
    };
  },

  addProseMirrorPlugins() {
    return [createManualMediaSelectionPlugin(this)];
  },

  addKeyboardShortcuts() {
    return manualMediaKeyboardShortcuts();
  },
});

export function removeMediaAtPosition(editor, mediaPos) {
  if (mediaPos === null) {
    return false;
  }
  return editor.chain().setNodeSelection(mediaPos).deleteSelection().run();
}
