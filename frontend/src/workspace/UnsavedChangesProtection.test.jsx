import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { openRestoredProjectWithWork } from "./workspaceProjectTestHelpers.js";

const SESSION_STORAGE_KEY = "hfzwood.mockAuth";

HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: () => {},
  fillRect: () => {},
  drawImage: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  setLineDash: () => {},
  measureText: () => ({ width: 0 }),
  fillText: () => {},
});

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = vi.fn();

function seedAuthenticatedSession() {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: {
        id: "stub-user",
        email: "user@example.com",
        username: "user",
      },
    }),
  );
}

function installImageMock() {
  const OriginalImage = global.Image;
  global.Image = class MockImage {
    set src(_value) {
      if (this.onload) {
        this.onload();
      }
    }
  };
  return () => {
    global.Image = OriginalImage;
  };
}

async function uploadPhoto(user) {
  const restoreImage = installImageMock();
  let input;
  await waitFor(() => {
    input = document.querySelector("input[type='file'][accept='image/*']");
    expect(input).toBeTruthy();
  });
  const file = new File(["pixels"], "photo.png", { type: "image/png" });
  await user.upload(input, file);
  await waitFor(() => {
    expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
  });
  restoreImage();
}

async function seedProjectWithWork(router) {
  await openRestoredProjectWithWork(router);
}

describe("Unsaved changes protection", () => {
  beforeEach(() => {
    sessionStorage.clear();
    seedAuthenticatedSession();
  });

  it("allows Home navigation after upload-only work", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    await uploadPhoto(user);
    await user.click(screen.getByRole("link", { name: "Home" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(screen.queryByRole("dialog", { name: /You have unsaved changes/i })).not.toBeInTheDocument();
  });

  it("shows the dialog when leaving after meaningful work", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    await seedProjectWithWork(router);
    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(screen.getByRole("dialog", { name: /You have unsaved changes/i })).toBeInTheDocument();
  });

  it("keeps the user in the workspace when Cancel is selected", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    await seedProjectWithWork(router);
    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(router.state.location.pathname).toBe("/new-project");
    expect(screen.queryByRole("dialog", { name: /You have unsaved changes/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
  });

  it("navigates Home and resets the workspace when changes are discarded", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    await seedProjectWithWork(router);
    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(screen.getByRole("button", { name: "Discard Changes" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });

    await user.click(screen.getByRole("link", { name: "New Project" }));
    expect(screen.queryByText(/Reference 1: 10.00 cm/i)).not.toBeInTheDocument();
  });

  it("opens the Save Project dialog when Save Project is selected from unsaved changes", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace("/new-project");

    await seedProjectWithWork(router);
    await user.click(screen.getByRole("link", { name: "Home" }));
    const dialog = screen.getByRole("dialog", { name: /You have unsaved changes/i });
    await user.click(within(dialog).getByRole("button", { name: "Save Project" }));

    expect(router.state.location.pathname).toBe("/new-project");
    expect(screen.queryByRole("dialog", { name: /You have unsaved changes/i })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Save Project" })).toBeInTheDocument();
    expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
  });
});
