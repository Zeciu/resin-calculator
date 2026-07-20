import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import EditorialTopbar from "./EditorialTopbar.jsx";

describe("EditorialTopbar Update All Translations", () => {
  it("shows Update All for non-RO locales and hides it for RO", () => {
    const { rerender } = render(
      <MemoryRouter>
        <EditorialTopbar
          backHref="/admin"
          locale="en"
          canUpdateAll
          onLocaleChange={() => {}}
          onSaveDraft={() => {}}
          onPublish={() => {}}
          onUpdateAllTranslations={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Update All Translations" })).toBeEnabled();

    rerender(
      <MemoryRouter>
        <EditorialTopbar
          backHref="/admin"
          locale="ro"
          canUpdateAll
          onLocaleChange={() => {}}
          onSaveDraft={() => {}}
          onPublish={() => {}}
          onUpdateAllTranslations={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: "Update All Translations" })).not.toBeInTheDocument();
  });

  it("disables Update All while a bulk run is active", () => {
    render(
      <MemoryRouter>
        <EditorialTopbar
          backHref="/admin"
          locale="de"
          canUpdateAll
          isBulkUpdating
          onLocaleChange={() => {}}
          onSaveDraft={() => {}}
          onPublish={() => {}}
          onUpdateAllTranslations={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Updating all…" })).toBeDisabled();
  });

  it("keeps single-item Update Translation unchanged", () => {
    render(
      <MemoryRouter>
        <EditorialTopbar
          backHref="/admin"
          locale="en"
          canGenerate
          onLocaleChange={() => {}}
          onSaveDraft={() => {}}
          onPublish={() => {}}
          onGenerateTranslation={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Update Translation" })).toBeEnabled();
  });
});
