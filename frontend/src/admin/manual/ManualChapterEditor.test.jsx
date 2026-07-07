import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManualChapterEditor from "./ManualChapterEditor.jsx";

vi.mock("./manualAdminApi.js", () => ({
  uploadManualImage: vi.fn(),
}));

import { uploadManualImage } from "./manualAdminApi.js";

const emptyDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

describe("ManualChapterEditor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    uploadManualImage.mockResolvedValue({ url: "/api/content/manual/images/test.png" });
    vi.spyOn(window, "prompt").mockImplementation((_label, defaultValue = "") => defaultValue);
  });

  it("uploads a selected local file and inserts it at the cursor", async () => {
    const user = userEvent.setup();
    const onDocumentChange = vi.fn();
    const file = new File([new Uint8Array([137, 80, 78, 71])], "diagram.png", {
      type: "image/png",
    });

    const { container } = render(
      <ManualChapterEditor document={emptyDocument} onDocumentChange={onDocumentChange} />,
    );

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(uploadManualImage).toHaveBeenCalledWith(file);
      expect(onDocumentChange).toHaveBeenCalled();
    });

    const nextDocument = onDocumentChange.mock.calls.at(-1)[0];
    const imageNode = nextDocument.content.find((node) => node.type === "manualImage");
    expect(imageNode.attrs.src).toBe("/api/content/manual/images/test.png");
    expect(imageNode.attrs.alt).toBe("diagram");
  });

  it("keeps Remove media disabled until a media block is selected", async () => {
    const twoImageDocument = {
      type: "doc",
      content: [
        { type: "manualImage", attrs: { src: "/a.png", alt: "Image A" } },
        { type: "manualImage", attrs: { src: "/b.png", alt: "Image B" } },
      ],
    };

    render(<ManualChapterEditor document={twoImageDocument} onDocumentChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Remove media" })).toBeDisabled();
    });
  });

  it("renders undo, redo, and alignment controls", async () => {
    render(<ManualChapterEditor document={emptyDocument} onDocumentChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Redo" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Align left" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Align center" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Align right" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Justify" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
  });
});
