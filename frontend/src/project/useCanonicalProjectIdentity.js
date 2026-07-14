import { useCallback, useEffect, useRef, useState } from "react";
import { createEmptyCanonicalLifecycle } from "./canonicalProjectLifecycle.js";
import { ensureCanonicalProjectIdentity } from "./ensureCanonicalProjectIdentity.js";
import {
  hasCanonicalProjectIdentity,
  resolveAuthenticatedOwnerId,
} from "./projectCreationThreshold.js";

/**
 * @param {{
 *   user: { id?: unknown } | null | undefined;
 *   enabled?: boolean;
 * }} params
 */
export function useCanonicalProjectIdentity({ user, enabled = true }) {
  const [canonicalLifecycle, setCanonicalLifecycle] = useState(
    createEmptyCanonicalLifecycle,
  );
  const [identityError, setIdentityError] = useState("");

  const canonicalLifecycleRef = useRef(canonicalLifecycle);
  canonicalLifecycleRef.current = canonicalLifecycle;

  const imageGenerationTokenRef = useRef(0);
  const lastTrackedImageDataUrlRef = useRef("");
  const identityOperationIdRef = useRef(0);
  const activeIdentityOperationIdRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (enabled) {
      return;
    }

    setIdentityError("");
    imageGenerationTokenRef.current += 1;
    identityOperationIdRef.current += 1;
    activeIdentityOperationIdRef.current = identityOperationIdRef.current;
  }, [enabled]);

  const resetCanonicalProjectSession = useCallback(() => {
    setCanonicalLifecycle(createEmptyCanonicalLifecycle());
    setIdentityError("");
    imageGenerationTokenRef.current += 1;
    lastTrackedImageDataUrlRef.current = "";
    identityOperationIdRef.current += 1;
    activeIdentityOperationIdRef.current = identityOperationIdRef.current;
  }, []);

  const handleCreationThresholdInputsChange = useCallback(
    (inputs) => {
      if (!enabledRef.current) {
        return;
      }

      const imageDataUrl = inputs?.imageDataUrl ?? "";
      const previousImage = lastTrackedImageDataUrlRef.current;

      if (imageDataUrl !== previousImage) {
        imageGenerationTokenRef.current += 1;

        if (
          hasCanonicalProjectIdentity(canonicalLifecycleRef.current) &&
          previousImage &&
          imageDataUrl &&
          imageDataUrl !== previousImage
        ) {
          setCanonicalLifecycle(createEmptyCanonicalLifecycle());
          setIdentityError("");
        }

        lastTrackedImageDataUrlRef.current = imageDataUrl;
      }

      identityOperationIdRef.current += 1;
      const operationId = identityOperationIdRef.current;
      activeIdentityOperationIdRef.current = operationId;
      const generationToken = imageGenerationTokenRef.current;

      void (async () => {
        const ownerId = resolveAuthenticatedOwnerId(user);
        const isOperationCurrent = () =>
          enabledRef.current &&
          generationToken === imageGenerationTokenRef.current &&
          operationId === activeIdentityOperationIdRef.current;

        const result = await ensureCanonicalProjectIdentity({
          lifecycle: canonicalLifecycleRef.current,
          inputs,
          ownerId,
          isOperationCurrent,
        });

        if (result.stale || !enabledRef.current) {
          return;
        }

        if (result.identityError) {
          setIdentityError(result.identityError);
          return;
        }

        if (result.adopted) {
          setCanonicalLifecycle((current) => {
            if (
              !enabledRef.current ||
              hasCanonicalProjectIdentity(current)
            ) {
              return current;
            }

            return result.lifecycle;
          });
          setIdentityError("");
        }
      })();
    },
    [user],
  );

  useEffect(() => {
    return () => {
      identityOperationIdRef.current += 1;
      imageGenerationTokenRef.current += 1;
      activeIdentityOperationIdRef.current = identityOperationIdRef.current;
    };
  }, []);

  return {
    canonicalLifecycle,
    identityError,
    handleCreationThresholdInputsChange,
    resetCanonicalProjectSession,
  };
}
