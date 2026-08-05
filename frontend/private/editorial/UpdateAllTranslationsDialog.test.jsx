import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import UpdateAllTranslationsDialog from "./UpdateAllTranslationsDialog.jsx";
import { mergeBulkSummaries } from "./translationBulkApi.js";

vi.mock("./translationBulkApi.js", async () => {
  const actual = await vi.importActual("./translationBulkApi.js");
  return {
    ...actual,
    previewBulkTranslations: vi.fn(),
    runBulkUpdateAll: vi.fn(),
  };
});

import { previewBulkTranslations, runBulkUpdateAll } from "./translationBulkApi.js";

describe("mergeBulkSummaries", () => {
  it("adds chunk summaries", () => {
    expect(
      mergeBulkSummaries(
        { total: 2, generated: 1, mediaSynced: 0, skippedCurrent: 1, skippedTextOutdated: 0, skippedManualUntracked: 0, skippedInvalid: 0, failed: 0, providerCallItems: 1 },
        { total: 1, generated: 0, mediaSynced: 1, skippedCurrent: 0, skippedTextOutdated: 0, skippedManualUntracked: 0, skippedInvalid: 0, failed: 0, providerCallItems: 0 },
      ),
    ).toEqual({
      total: 3,
      generated: 1,
      mediaSynced: 1,
      skippedCurrent: 1,
      skippedTextOutdated: 0,
      skippedManualUntracked: 0,
      skippedInvalid: 0,
      failed: 0,
      providerCallItems: 1,
    });
  });
});

describe("UpdateAllTranslationsDialog", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders preflight counts and defaults includeTextOutdated to false", async () => {
    const user = userEvent.setup();
    previewBulkTranslations.mockResolvedValue({
      total: 5,
      counts: {
        missing: 2,
        current: 1,
        mediaOnlyOutdated: 1,
        textOutdated: 1,
        manualUntracked: 0,
        invalid: 0,
      },
      items: [],
    });
    runBulkUpdateAll.mockResolvedValue({
      total: 5,
      summary: {
        total: 5,
        generated: 2,
        mediaSynced: 1,
        skippedCurrent: 1,
        skippedTextOutdated: 1,
        skippedManualUntracked: 0,
        skippedInvalid: 0,
        failed: 0,
        providerCallItems: 2,
      },
      items: [],
    });

    render(
      <UpdateAllTranslationsDialog
        isOpen
        module="manual"
        locale="en"
        onClose={() => {}}
      />,
    );

    expect(await screen.findByRole("heading", { name: /Update All Translations/i })).toBeInTheDocument();
    expect(screen.getByText(/Missing: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Media-only outdated: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Text outdated: 1/)).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox", {
      name: /Include text-outdated translations/i,
    });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(screen.getByRole("status")).toHaveTextContent(/fully regenerated/i);

    await user.click(screen.getByRole("button", { name: "Start update" }));
    await waitFor(() => {
      expect(runBulkUpdateAll).toHaveBeenCalledWith(
        "manual",
        "en",
        expect.objectContaining({ includeTextOutdated: true }),
      );
    });

    expect(await screen.findByText(/Update finished/i)).toBeInTheDocument();
    expect(screen.getByText(/Generated: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Media synced: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Skipped current: 1/)).toBeInTheDocument();
  });

  it("shows partial failures in the summary", async () => {
    const user = userEvent.setup();
    previewBulkTranslations.mockResolvedValue({
      total: 2,
      counts: {
        missing: 2,
        current: 0,
        mediaOnlyOutdated: 0,
        textOutdated: 0,
        manualUntracked: 0,
        invalid: 0,
      },
      items: [],
    });
    runBulkUpdateAll.mockResolvedValue({
      total: 2,
      summary: {
        total: 2,
        generated: 1,
        mediaSynced: 0,
        skippedCurrent: 0,
        skippedTextOutdated: 0,
        skippedManualUntracked: 0,
        skippedInvalid: 0,
        failed: 1,
        providerCallItems: 1,
      },
      items: [
        {
          contentId: "a",
          label: "Good",
          status: "completed",
          action: "generate_full",
        },
        {
          contentId: "b",
          label: "Broken",
          status: "failed",
          action: "generate_full",
          error: "provider boom",
        },
      ],
    });

    render(
      <UpdateAllTranslationsDialog
        isOpen
        module="glossary"
        locale="fr"
        onClose={() => {}}
      />,
    );

    await screen.findByRole("button", { name: "Start update" });
    await user.click(screen.getByRole("button", { name: "Start update" }));
    expect(await screen.findByText(/Broken: provider boom/)).toBeInTheDocument();
    expect(screen.getByText(/Failed: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Items generated via DeepL: 1/)).toBeInTheDocument();
  });

  it("shows rate-limit pause messaging and renamed DeepL counter", async () => {
    const user = userEvent.setup();
    previewBulkTranslations.mockResolvedValue({
      total: 4,
      counts: {
        missing: 4,
        current: 0,
        mediaOnlyOutdated: 0,
        textOutdated: 0,
        manualUntracked: 0,
        invalid: 0,
      },
      items: [],
    });
    runBulkUpdateAll.mockResolvedValue({
      total: 4,
      summary: {
        total: 3,
        generated: 2,
        mediaSynced: 0,
        skippedCurrent: 0,
        skippedTextOutdated: 0,
        skippedManualUntracked: 0,
        skippedInvalid: 0,
        failed: 1,
        providerCallItems: 2,
      },
      items: [],
      stoppedEarly: true,
      stopReason: "rate_limited",
      unprocessedCount: 1,
    });

    render(
      <UpdateAllTranslationsDialog
        isOpen
        module="website"
        locale="es"
        onClose={() => {}}
      />,
    );

    await screen.findByRole("button", { name: "Start update" });
    await user.click(screen.getByRole("button", { name: "Start update" }));
    expect(
      await screen.findByText(/DeepL temporarily limited requests/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 item left unprocessed/i)).toBeInTheDocument();
    expect(screen.getByText(/Items generated via DeepL: 2/)).toBeInTheDocument();
    expect(screen.queryByText(/DeepL item calls/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Update finished/i)).not.toBeInTheDocument();
  });

  it("shows quota pause messaging", async () => {
    const user = userEvent.setup();
    previewBulkTranslations.mockResolvedValue({
      total: 3,
      counts: {
        missing: 3,
        current: 0,
        mediaOnlyOutdated: 0,
        textOutdated: 0,
        manualUntracked: 0,
        invalid: 0,
      },
      items: [],
    });
    runBulkUpdateAll.mockResolvedValue({
      total: 3,
      summary: {
        total: 2,
        generated: 1,
        mediaSynced: 0,
        skippedCurrent: 0,
        skippedTextOutdated: 0,
        skippedManualUntracked: 0,
        skippedInvalid: 0,
        failed: 1,
        providerCallItems: 1,
      },
      items: [],
      stoppedEarly: true,
      stopReason: "quota_exceeded",
      unprocessedCount: 1,
    });

    render(
      <UpdateAllTranslationsDialog
        isOpen
        module="manual"
        locale="fr"
        onClose={() => {}}
      />,
    );

    await screen.findByRole("button", { name: "Start update" });
    await user.click(screen.getByRole("button", { name: "Start update" }));
    expect(await screen.findByText(/account quota has been exceeded/i)).toBeInTheDocument();
    expect(screen.getByText(/1 item left unprocessed/i)).toBeInTheDocument();
  });
});
