import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthContext.jsx";
import { useAuth } from "./useAuth.js";

const mockAdapter = {
  restoreSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
};

function AuthStateProbe() {
  const { user, isLoading, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user-id">{user?.id ?? ""}</span>
    </div>
  );
}

describe("AuthProvider cognito session restoration", () => {
  it("restores async cognito sessions through the adapter boundary", async () => {
    mockAdapter.restoreSession.mockResolvedValue({
      id: "sub-async",
      email: "async@example.com",
      username: "async",
      role: "user",
    });

    render(
      <AuthProvider authAdapter={mockAdapter}>
        <AuthStateProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("user-id")).toHaveTextContent("sub-async");
  });
});
