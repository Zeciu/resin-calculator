import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthProvider } from "../auth/AuthContext.jsx";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
import { PublicLanguagesProvider } from "../publicLanguages/PublicLanguagesContext.jsx";
import AuthRouteGuard from "./AuthRouteGuard.jsx";

const mockAdapter = {
  restoreSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
};

function renderGuardedRoute(restoreResult) {
  mockAdapter.restoreSession.mockImplementation(() => restoreResult);
  return render(
    <AuthProvider authAdapter={mockAdapter}>
      <PublicLanguagesProvider>
        <PreferencesProvider>
          <I18nProvider>
            <AuthRouteGuard>
              <div>Protected content</div>
            </AuthRouteGuard>
          </I18nProvider>
        </PreferencesProvider>
      </PublicLanguagesProvider>
    </AuthProvider>,
  );
}

describe("AuthRouteGuard", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (String(url).includes("/api/content/public-languages")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            defaultPublicLocale: "en",
            activePublicLocales: ["en", "ro"],
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });
  });

  it("does not show the locked state while session restoration is loading", () => {
    renderGuardedRoute(new Promise(() => {}));

    expect(
      screen.queryByText("Create your free HFZWood account to unlock this section."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("shows protected content after authenticated session restoration completes", async () => {
    renderGuardedRoute(
      Promise.resolve({
        id: "sub-restored",
        email: "restored@example.com",
        username: "restored",
        role: "user",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Protected content")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Create your free HFZWood account to unlock this section."),
    ).not.toBeInTheDocument();
  });
});
