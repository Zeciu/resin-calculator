import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkspace } from "./renderWorkspaceRouter.jsx";
import { ROUTES } from "./routes.js";
import { buildPersistableCanonicalV2 } from "../project/buildPersistableCanonicalV2.js";
import {
  buildV2ProjectFileJson,
  parseSavedEnvelope,
  VALID_CALCULATOR_SNAPSHOT,
} from "../project/projectFileTestFixtures.js";

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

function installPersistentImageMock() {
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

describe("Save Open Update Open round-trip", () => {
  let restoreImage;
  let savedEnvelope;
  let updatedEnvelope;

  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    seedAuthenticatedSession();
    restoreImage = installPersistentImageMock();

    const firstSave = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: VALID_CALCULATOR_SNAPSHOT,
      user: { id: "stub-user" },
      generateProjectId: () => "project-round-trip",
      generateVersionId: () => "version-round-trip",
      computeHash: async () => "hash-round-trip",
      now: () => "2026-04-01T12:00:00.000Z",
    });
    savedEnvelope = firstSave.envelope;

    const opened = parseSavedEnvelope(savedEnvelope);
    const update = await buildPersistableCanonicalV2({
      projectName: "River Table",
      snapshot: {
        ...VALID_CALCULATOR_SNAPSHOT,
        projectNotes: "Updated notes",
      },
      user: { id: "stub-user" },
      persistedLifecycle: opened.persistedLifecycle,
      now: () => "2026-05-01T12:00:00.000Z",
    });
    updatedEnvelope = update.envelope;
  });

  afterEach(() => {
    restoreImage();
    vi.restoreAllMocks();
  });

  it("opens a saved v2 project without false dirty state and preserves lifecycle on update", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);
    const firstOpen = parseSavedEnvelope(savedEnvelope);

    await router.navigate(ROUTES.NEW_PROJECT, {
      state: {
        pendingProjectRestore: firstOpen.snapshot,
        openContext: {
          recentEntryId: "recent-1",
          projectName: "River Table",
          lastKnownFileName: "river-table.hfzproject",
          persistedLifecycle: firstOpen.persistedLifecycle,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await user.click(screen.getByRole("link", { name: "Home" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(screen.queryByRole("dialog", { name: /You have unsaved changes/i })).not.toBeInTheDocument();
  });

  it("restores updated v2 content and stable identity on second open", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.NEW_PROJECT);
    const secondOpen = parseSavedEnvelope(updatedEnvelope);

    await router.navigate(ROUTES.NEW_PROJECT, {
      state: {
        pendingProjectRestore: secondOpen.snapshot,
        openContext: {
          recentEntryId: "recent-2",
          projectName: "River Table",
          lastKnownFileName: "river-table.hfzproject",
          persistedLifecycle: secondOpen.persistedLifecycle,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo uploaded/i)).toBeInTheDocument();
    });

    expect(secondOpen.snapshot.projectNotes).toBe("Updated notes");
    expect(secondOpen.persistedLifecycle.projectMetadata.projectId).toBe("project-round-trip");
    expect(secondOpen.persistedLifecycle.projectMetadata.versionId).toBe("version-round-trip");
    expect(secondOpen.persistedLifecycle.projectMetadata.lastModifiedAt).toBe(
      "2026-05-01T12:00:00.000Z",
    );
    expect(secondOpen.snapshot.ui).not.toHaveProperty("zoomFactor");
  });

  it("opens a v2 project file from the Projects hub", async () => {
    const user = userEvent.setup();
    const { router } = renderWorkspace(ROUTES.PROJECTS);
    const input = document.querySelector("input[type='file']");
    const file = new File([buildV2ProjectFileJson({ snapshot: VALID_CALCULATOR_SNAPSHOT })], "river-table.hfzproject", {
      type: "application/json",
    });

    await user.upload(input, file);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/new-project");
    });
  });
});
