import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth/AuthContext.jsx";
import { I18nProvider } from "../i18n/I18nContext.jsx";
import { PreferencesProvider } from "../preferences/PreferencesContext.jsx";
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
      <PreferencesProvider>
        <I18nProvider>
          <AuthRouteGuard>
            <div>Protected content</div>
          </AuthRouteGuard>
        </I18nProvider>
      </PreferencesProvider>
    </AuthProvider>,
  );
}

describe("AuthRouteGuard", () => {
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
