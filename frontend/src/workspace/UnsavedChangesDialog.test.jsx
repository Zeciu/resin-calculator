import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import UnsavedChangesDialog from "./UnsavedChangesDialog.jsx";

describe("UnsavedChangesDialog", () => {
  it("renders the required copy and actions", () => {
    render(
      <UnsavedChangesDialog
        onSaveProject={() => {}}
        onDiscardChanges={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole("dialog", { name: /You have unsaved changes/i })).toBeInTheDocument();
    expect(
      screen.getByText(/If you leave this workspace now, your current project work will be lost/i),
    ).toBeInTheDocument();
    expect(screen.getByText("What would you like to do?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Project" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard Changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls the selected action handlers", async () => {
    const user = userEvent.setup();
    const onSaveProject = vi.fn();
    const onDiscardChanges = vi.fn();
    const onCancel = vi.fn();

    render(
      <UnsavedChangesDialog
        onSaveProject={onSaveProject}
        onDiscardChanges={onDiscardChanges}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save Project" }));
    await user.click(screen.getByRole("button", { name: "Discard Changes" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onSaveProject).toHaveBeenCalledTimes(1);
    expect(onDiscardChanges).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
