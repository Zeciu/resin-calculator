import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CrossReferencePicker from "./CrossReferencePicker.jsx";
import { searchEditorialReferences } from "./editorialAdminApi.js";

vi.mock("./editorialAdminApi.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    searchEditorialReferences: vi.fn(),
  };
});

describe("CrossReferencePicker publishedOnly", () => {
  beforeEach(() => {
    vi.mocked(searchEditorialReferences).mockReset();
  });

  it("requests published-only glossary options for the active locale", async () => {
    vi.mocked(searchEditorialReferences).mockResolvedValue([
      {
        contentId: "epoxy-resin",
        contentType: "glossary_entry",
        label: "Epoxy resin",
        detail: "Glossary entry",
      },
    ]);

    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CrossReferencePicker
        label="Related terms"
        selected={[]}
        onChange={onChange}
        locale="ro"
        allowTypes={["glossary_entry"]}
        publishedOnly
      />,
    );

    await user.type(screen.getByRole("searchbox"), "epoxy");

    await waitFor(() => {
      expect(searchEditorialReferences).toHaveBeenCalledWith("epoxy", "ro", { publishedOnly: true });
    });
    expect(await screen.findByRole("button", { name: /Epoxy resin/i })).toBeInTheDocument();
  });

  it("does not list unpublished options returned by a non-filtered search when publishedOnly is on", async () => {
    // Backend should already filter; picker still only shows what search returns.
    vi.mocked(searchEditorialReferences).mockResolvedValue([]);

    const user = userEvent.setup();
    render(
      <CrossReferencePicker
        label="Synonyms"
        selected={[]}
        onChange={vi.fn()}
        locale="ro"
        allowTypes={["glossary_entry"]}
        publishedOnly
      />,
    );

    await user.type(screen.getByRole("searchbox"), "calibration");
    await waitFor(() => {
      expect(searchEditorialReferences).toHaveBeenCalledWith("calibration", "ro", {
        publishedOnly: true,
      });
    });
    expect(screen.queryByRole("list", { name: "Synonyms options" })).not.toBeInTheDocument();
  });
});
