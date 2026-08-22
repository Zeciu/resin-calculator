import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePreviewSelection } from "./usePreviewSelection.js";

function SelectionProbe({ items, loadState, hashId = "" }) {
  const [selectedId] = usePreviewSelection(items, loadState, hashId);
  return <div data-testid="selected-id">{selectedId ?? "null"}</div>;
}

describe("usePreviewSelection", () => {
  const items = [
    { id: "locked-first", locked: true },
    { id: "open-a", locked: false },
    { id: "open-b", locked: false },
  ];

  it("selects the first unlocked item under React Strict Mode", async () => {
    render(
      <StrictMode>
        <SelectionProbe items={items} loadState="ready" />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("selected-id")).toHaveTextContent("open-a");
    });
  });

  it("does not select while the payload is still loading", () => {
    render(
      <StrictMode>
        <SelectionProbe items={items} loadState="loading" />
      </StrictMode>,
    );

    expect(screen.getByTestId("selected-id")).toHaveTextContent("null");
  });

  it("prefers a hash target when that item exists", async () => {
    render(
      <StrictMode>
        <SelectionProbe items={items} loadState="ready" hashId="open-b" />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("selected-id")).toHaveTextContent("open-b");
    });
  });
});
