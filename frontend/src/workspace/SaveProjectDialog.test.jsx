import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SaveProjectDialog from "./SaveProjectDialog.jsx";

describe("SaveProjectDialog", () => {
  it("renders project name input with Cancel and Save actions", () => {
    render(
      <SaveProjectDialog onCancel={vi.fn()} onSave={vi.fn()} />,
    );

    expect(screen.getByRole("dialog", { name: "Save Project" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Project name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("rejects an empty project name", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<SaveProjectDialog onCancel={vi.fn()} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Project name is required/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("passes a trimmed project name to onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<SaveProjectDialog onCancel={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText(/Project name/i), "  My Table  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith("My Table");
  });

  it("shows a save error from the parent", () => {
    render(
      <SaveProjectDialog
        error="Could not save project file."
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/Could not save project file/i);
  });
});
