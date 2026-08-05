import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AuthProviderForTests } from "../auth/AuthContext.jsx";
import { sessionStorageTestAuthAdapter } from "../test/sessionStorageTestAuthAdapter.js";
import WorkspaceRouter from "./WorkspaceRouter.jsx";

export function renderWorkspace(initialPath = "/") {
  const router = createMemoryRouter(
    [{ path: "/*", element: <WorkspaceRouter /> }],
    { initialEntries: [initialPath] },
  );

  return {
    router,
    ...render(
      <AuthProviderForTests authAdapter={sessionStorageTestAuthAdapter}>
        <RouterProvider router={router} />
      </AuthProviderForTests>,
    ),
  };
}
