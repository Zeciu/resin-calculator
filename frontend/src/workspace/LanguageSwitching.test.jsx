import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "./routes.js";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { mockStatefulPreferencesFetch } from "../preferences/testHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

function seedAuthenticatedSession() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: { id: "stub-user", email: "user@example.com", username: "user" },
    }),
  );
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

    // My Account is reachable from the authenticated Home screen.
    const myAccountLink = await screen.findByRole("link", { name: "My Account" });
    await user.click(myAccountLink);

    // Application Preferences is linked from My Account.
    await user.click(await screen.findByRole("link", { name: "Application Preferences" }));
    expect(
      await screen.findByRole("heading", { name: "Application Preferences" }),
    ).toBeInTheDocument();

    // Change interface language to Romanian and save.
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

  it("saves length and volume unit preferences and persists them", async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    const fetchMock = mockStatefulPreferencesFetch({ lengthUnit: "mm", volumeUnit: "L" });
    renderWorkspace(ROUTES.PREFERENCES);

    await screen.findByRole("heading", { name: "Application Preferences" });

    const [, lengthSelect, volumeSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(lengthSelect, "cm");
    await user.selectOptions(volumeSelect, "ml");
    await user.click(screen.getByRole("button", { name: /Save preferences/i }));

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
      expect(putCall).toBeTruthy();
      const body = JSON.parse(putCall[1].body);
      expect(body.lengthUnit).toBe("cm");
      expect(body.volumeUnit).toBe("ml");
    });

    // Selected units remain reflected after the save round-trip.
    await waitFor(() => {
      expect(screen.getAllByRole("combobox")[1]).toHaveValue("cm");
      expect(screen.getAllByRole("combobox")[2]).toHaveValue("ml");
    });
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
