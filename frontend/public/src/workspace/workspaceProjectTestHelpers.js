import { screen, waitFor } from "@testing-library/react";
import { expect } from "vitest";
import {
  buildV2ProjectFileJsonForOwner,
  VALID_CALCULATOR_SNAPSHOT,
} from "../project/projectFileTestFixtures.js";
import { parseProjectFileText } from "./projectFileParse.js";
import { ROUTES } from "./routes.js";

export function installWorkspaceImageMock() {
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

export async function openRestoredProjectWithWork(
  router,
  {
    snapshot = VALID_CALCULATOR_SNAPSHOT,
    ownerId = "stub-user",
    projectName = "Opened Project",
  } = {},
) {
  const restoreImage = installWorkspaceImageMock();
  const parsed = parseProjectFileText(
    buildV2ProjectFileJsonForOwner(ownerId, { snapshot, projectName }),
  );

  const navigationState = {
    pendingProjectRestore: parsed.snapshot,
  };

  if (router.state.location.pathname === ROUTES.NEW_PROJECT) {
    await router.navigate(ROUTES.HOME);
  }

  await router.navigate(ROUTES.NEW_PROJECT, {
    state: navigationState,
  });

  await waitFor(() => {
    expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
  });
  restoreImage();
}
