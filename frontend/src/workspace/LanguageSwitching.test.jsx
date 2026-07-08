import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "./routes.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedAuthenticatedSession() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: { id: "stub-user", email: "user@example.com", username: "user" },
    }),
  );
}

/**
 * Stateful mock for the preferences API so a PUT (save) is reflected by the
 * next render, exactly like the real backend.
 */
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

describe("Preferences reachability and language switching", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("reaches Application Preferences from Home and applies a language change", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    mockStatefulPreferencesFetch({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.HOME);

    // Fix 1: My Account is discoverable from the authenticated Home screen.
    const myAccountLink = await screen.findByRole("link", { name: "My Account" });
    await user.click(myAccountLink);

    // Fix 2: My Account -> Application Preferences.
    await user.click(await screen.findByRole("link", { name: "Application Preferences" }));
    expect(
      await screen.findByRole("heading", { name: "Application Preferences" }),
    ).toBeInTheDocument();

    // Fix 3: change interface language to Romanian and save.
    const languageSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(languageSelect, "ro");
    await user.click(screen.getByRole("button", { name: /Save preferences/i }));

    // The whole app re-renders in Romanian once the new language is stored.
    expect(
      await screen.findByRole("heading", { name: "Preferințe aplicație" }),
    ).toBeInTheDocument();
    const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
    expect(within(sidebar).getByRole("link", { name: "Proiect nou" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Contul meu" })).toBeInTheDocument();
    // The save confirmation is shown (captured in the language active at save time).
    expect(screen.getByRole("status")).toHaveTextContent(/Preferences saved\.|Preferințele au fost salvate\./);
  });

  it("renders Home and navigation in Romanian when the stored language is ro", async () => {
    seedAuthenticatedSession();
    mockStatefulPreferencesFetch({ interfaceLanguage: "ro" });
    renderWorkspace(ROUTES.HOME);

    expect(
      await screen.findByText(
        /Bine ai venit la HFZWood — spațiul tău de lucru/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Calculator profesional de rășină/i,
      }),
    ).toBeInTheDocument();

    const sidebar = screen.getByRole("navigation", { name: "Workspace navigation" });
    expect(within(sidebar).getByRole("link", { name: "Manual și tutoriale" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Contul meu" })).toBeInTheDocument();
  });

  it("keeps My Account reachable from a dedicated module page", async () => {
    seedAuthenticatedSession();
    mockStatefulPreferencesFetch({ interfaceLanguage: "en" });
    renderWorkspace(ROUTES.NEW_PROJECT);

    const header = await screen.findByRole("banner", { name: "Module header" });
    expect(within(header).getByRole("link", { name: "My Account" })).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});
