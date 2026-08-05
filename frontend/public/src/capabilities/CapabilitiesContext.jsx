import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth.js";
import { fetchCapabilities } from "./capabilitiesApi.js";
import { GUEST_CAPABILITIES_RESPONSE } from "./capabilityDefaults.js";

const CapabilitiesContext = createContext(null);

export function CapabilitiesProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [capabilities, setCapabilities] = useState(GUEST_CAPABILITIES_RESPONSE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const resetToGuest = useCallback(() => {
    setCapabilities(GUEST_CAPABILITIES_RESPONSE);
    setError("");
  }, []);

  const reloadCapabilities = useCallback(async () => {
    if (!isAuthenticated) {
      resetToGuest();
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const loaded = await fetchCapabilities();
      setCapabilities(loaded);
    } catch (loadError) {
      // Technical failures must not look like entitlement revocation.
      setError(loadError.message || "Failed to load capabilities.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, resetToGuest]);

  useEffect(() => {
    void reloadCapabilities();
  }, [isAuthenticated, reloadCapabilities]);

  const value = useMemo(
    () => ({
      capabilities,
      isLoading,
      error,
      reloadCapabilities,
    }),
    [capabilities, error, isLoading, reloadCapabilities],
  );

  return <CapabilitiesContext.Provider value={value}>{children}</CapabilitiesContext.Provider>;
}

export function useCapabilities() {
  const context = useContext(CapabilitiesContext);
  if (!context) {
    throw new Error("useCapabilities must be used within CapabilitiesProvider.");
  }
  return context;
}

export function useCapability(key) {
  const { capabilities } = useCapabilities();
  return capabilities.capabilities[key];
}

export function useCapabilityLimit(key) {
  const value = useCapability(key);
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
}
