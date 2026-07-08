import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "../workspace/renderWorkspaceRouter.jsx";
import { ROUTES } from "../workspace/routes.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedAuthenticatedSession() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ user: { id: "stub-user", email: "user@example.com", username: "user" } }),
  );
}

function mockStatefulPreferencesFetch(initial) {
  let stored = { interfaceLanguage: "en", lengthUnit: "mm", volumeUnit: "L", exists: true, ...initial };
  const fetchMock = vi.fn(async (url, options) => {
    const requestUrl = String(url);
    if (requestUrl.includes("/api/preferences")) {
      if (options?.method === "PUT") {
        stored = { ...stored, ...JSON.parse(options.body), exists: true };
      }
      return { ok: true, json: async () => stored };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Quick preferences controls", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows compact language and unit controls on the authenticated Home sidebar", async () => {
    seedAuthenticatedSession();
    mockStatefulPreferencesFetch({});
    renderWorkspace(ROUTES.HOME);

    const region = await screen.findByRole("region", { name: "Quick preferences" });
    expect(within(region).getAllByRole("combobox")).toHaveLength(3);
  });

  it("shows compact language and unit controls on the New Project workspace", async () => {
    seedAuthenticatedSession();
    mockStatefulPreferencesFetch({});
    renderWorkspace(ROUTES.NEW_PROJECT);

    const region = await screen.findByRole("region", { name: "Quick preferences" });
    expect(within(region).getAllByRole("combobox")).toHaveLength(3);
  });

  it("updates and persists a unit change from the quick controls", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    const fetchMock = mockStatefulPreferencesFetch({ lengthUnit: "mm" });
    renderWorkspace(ROUTES.HOME);

    const region = await screen.findByRole("region", { name: "Quick preferences" });
    const [, lengthSelect] = within(region).getAllByRole("combobox");

    await user.selectOptions(lengthSelect, "cm");

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
      expect(putCall).toBeTruthy();
      expect(JSON.parse(putCall[1].body).lengthUnit).toBe("cm");
    });

    // The stored value is reflected back into the control (persists on reload).
    await waitFor(() => {
      expect(within(region).getAllByRole("combobox")[1]).toHaveValue("cm");
    });
  });

  it("switches the interface language from the quick controls", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    mockStatefulPreferencesFetch({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    const region = await screen.findByRole("region", { name: "Quick preferences" });
    const [languageSelect] = within(region).getAllByRole("combobox");

    await user.selectOptions(languageSelect, "ro");

    // The quick-preferences region title localizes once ro is stored.
    expect(await screen.findByRole("region", { name: "Preferințe rapide" })).toBeInTheDocument();
  });
});
