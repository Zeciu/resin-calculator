import { vi } from "vitest";
import { DEFAULT_PREFERENCES } from "./preferencesConstants.js";

export function mockPreferencesFetch(preferences = DEFAULT_PREFERENCES) {
  return vi.spyOn(global, "fetch").mockImplementation((url, init) => {
    const path = String(url);
    if (path.endsWith("/api/preferences")) {
      if ((init?.method ?? "GET") === "PUT") {
        const body = JSON.parse(init.body);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ...preferences,
            ...body,
            exists: true,
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => preferences,
      });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${path}`));
  });
}
