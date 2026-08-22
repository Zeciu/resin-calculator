import { useLayoutEffect, useRef } from "react";
import { revealPreviewUnlockedContent } from "./previewSearch.js";

const MAX_REVEAL_FRAMES = 12;

/**
 * Once per mount, after the first unlocked preview body has rendered and layout
 * has settled, scroll the measured scroll owner so that content is visible.
 */
export function useInitialUnlockedContentReveal(rootId, enabled) {
  const doneRef = useRef(false);

  useLayoutEffect(() => {
    if (doneRef.current || !enabled || !rootId) {
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;
    let outerFrame = 0;
    let innerFrame = 0;

    const attempt = () => {
      if (cancelled || doneRef.current) {
        return;
      }
      const root = document.getElementById(rootId);
      if (root && revealPreviewUnlockedContent(root)) {
        doneRef.current = true;
        return;
      }
      attempts += 1;
      if (attempts >= MAX_REVEAL_FRAMES) {
        return;
      }
      outerFrame = window.requestAnimationFrame(() => {
        innerFrame = window.requestAnimationFrame(attempt);
      });
    };

    attempt();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(outerFrame);
      window.cancelAnimationFrame(innerFrame);
    };
  }, [enabled, rootId]);
}
