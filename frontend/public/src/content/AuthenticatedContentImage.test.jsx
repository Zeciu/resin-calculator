import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthenticatedContentImage from "./AuthenticatedContentImage.jsx";

const fetchAuthSession = vi.hoisted(() => vi.fn());

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession,
}));

const ALBURN_SRC = "/api/content/glossary/images/d3a552fc-7f95-4c27-9494-588304928ddb.jpg";
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe("AuthenticatedContentImage", () => {
  beforeEach(() => {
    fetchAuthSession.mockResolvedValue({
      tokens: {
        accessToken: {
          toString: () => "cognito-access-token",
        },
      },
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:alburn-image");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    fetchAuthSession.mockReset();
    vi.restoreAllMocks();
  });

  it("fetches packaged glossary images with a Bearer token and renders a blob src", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      blob: async () => new Blob([JPEG_BYTES], { type: "image/jpeg" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthenticatedContentImage src={ALBURN_SRC} alt="albur" className="glossary-entry__image" />,
    );

    const image = await screen.findByRole("img", { name: "albur" });
    expect(image).toHaveAttribute("src", "blob:alburn-image");
    expect(image).toHaveClass("glossary-entry__image");
    expect(fetchMock).toHaveBeenCalledWith(
      ALBURN_SRC,
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          Authorization: "Bearer cognito-access-token",
        }),
      }),
    );
  });

  it("keeps public-preview and static image srcs on the native img element", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(
      <AuthenticatedContentImage
        src="/api/public-preview/glossary/images/preview-resin.png"
        alt="Epoxy resin preview"
      />,
    );
    expect(screen.getByRole("img", { name: "Epoxy resin preview" })).toHaveAttribute(
      "src",
      "/api/public-preview/glossary/images/preview-resin.png",
    );

    rerender(<AuthenticatedContentImage src="/header-wood-epoxy.png" alt="Workshop" />);
    expect(screen.getByRole("img", { name: "Workshop" })).toHaveAttribute(
      "src",
      "/header-wood-epoxy.png",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not render an img when the authenticated image request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        blob: async () => new Blob(),
      })),
    );

    const { container } = render(<AuthenticatedContentImage src={ALBURN_SRC} alt="albur" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    expect(screen.queryByRole("img", { name: "albur" })).not.toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });
});
