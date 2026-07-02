import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import WorkspaceRouter from "./WorkspaceRouter.jsx";

export function renderWorkspace(initialPath = "/") {
  const router = createMemoryRouter(
    [{ path: "/*", element: <WorkspaceRouter /> }],
    { initialEntries: [initialPath] },
  );

  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
}
