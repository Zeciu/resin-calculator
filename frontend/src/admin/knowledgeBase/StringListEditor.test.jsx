import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import StringListEditor from "./StringListEditor.jsx";

describe("StringListEditor", () => {
  it("adds and removes troubleshooting list rows", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <StringListEditor
        label="Symptoms"
        items={["First symptom"]}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText("Symptoms row 1")).toHaveValue("First symptom");

    await user.click(screen.getByRole("button", { name: "Add row" }));
    expect(onChange).toHaveBeenCalledWith(["First symptom", ""]);

    await user.click(screen.getByRole("button", { name: "Remove Symptoms row 1" }));
    expect(onChange).toHaveBeenLastCalledWith([""]);
  });
});
