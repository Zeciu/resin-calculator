import { useEffect, useRef, useState } from "react";
import { firstUnlockedPreviewId } from "./previewSearch.js";

/**
 * Select preview items from API `locked` flags. Hash wins when it changes;
 * search keeps the current item or falls back to the first visible unlocked item.
 *
 * Selection is applied in an effect so React Strict Mode cannot skip it.
 * A render-time ref snapshot previously swallowed setState on the retry render,
 * leaving selectedId null in the real Vite app.
 */
export function usePreviewSelection(items, loadState, hashId) {
  const [selectedId, setSelectedId] = useState(null);
  const appliedHashRef = useRef("");

  useEffect(() => {
    if (loadState !== "ready") {
      return;
    }
    const preferred = hashId || "";
    setSelectedId((current) => {
      if (
        preferred &&
        preferred !== appliedHashRef.current &&
        items.some((item) => item.id === preferred)
      ) {
        appliedHashRef.current = preferred;
        return preferred;
      }
      if (current && items.some((item) => item.id === current)) {
        return current;
      }
      return firstUnlockedPreviewId(items);
    });
  }, [hashId, items, loadState]);

  return [selectedId, setSelectedId];
}
