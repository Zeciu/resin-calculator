import { useRef } from "react";
import { defaultAltText, IMAGE_INPUT_ACCEPT, isImageFile, promptValue } from "./editorialMedia.js";
import { deriveVideoTitle, normalizeVideoEmbedUrl } from "../admin/manual/videoEmbed.js";

/**
 * @param {{
 *   media?: Array<Record<string, unknown>>;
 *   onMediaChange?: (media: Array<Record<string, unknown>>) => void;
 *   onUploadImage: (file: File) => Promise<{ url: string }>;
 *   disabled?: boolean;
 *   ariaLabel?: string;
 * }} props
 */
export default function EditorialMediaPanel({
  media = [],
  onMediaChange,
  onUploadImage,
  disabled = false,
  ariaLabel = "Editorial media",
}) {
  const fileInputRef = useRef(null);

  async function insertUploadedImage(file) {
    if (!isImageFile(file)) {
      window.alert("Only image files can be uploaded.");
      return;
    }

    try {
      const { url } = await onUploadImage(file);
      const alt = promptValue("Alt text", defaultAltText(file)) ?? defaultAltText(file);
      const caption = promptValue("Caption (optional)") ?? "";
      onMediaChange?.([
        ...media,
        {
          type: "image",
          src: url,
          alt,
          ...(caption ? { caption } : {}),
        },
      ]);
    } catch (error) {
      window.alert(error.message || "Image upload failed.");
    }
  }

  function openImagePicker() {
    fileInputRef.current?.click();
  }

  async function handleImageInputChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    await insertUploadedImage(file);
  }

  function insertVideo() {
    const url = promptValue("Video URL (YouTube, Vimeo, or embed URL)");
    if (!url) {
      return;
    }
    const embedUrl = normalizeVideoEmbedUrl(url);
    const title = deriveVideoTitle(url, embedUrl);
    const caption = promptValue("Caption (optional)") ?? "";
    onMediaChange?.([
      ...media,
      {
        type: "video",
        title,
        embedUrl,
        ...(caption ? { caption } : {}),
      },
    ]);
  }

  function removeMedia(index) {
    onMediaChange?.(media.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="editorial-media-panel" aria-label={ariaLabel}>
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_INPUT_ACCEPT}
        className="editorial-media-panel__file-input"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleImageInputChange}
      />
      <div className="editorial-media-panel__toolbar">
        <span className="editorial-media-panel__label">Media</span>
        <div className="editorial-media-panel__actions">
          <button type="button" onClick={openImagePicker} disabled={disabled}>
            Add image
          </button>
          <button type="button" onClick={insertVideo} disabled={disabled}>
            Add video
          </button>
        </div>
      </div>
      {media.length === 0 ? (
        <p className="editorial-media-panel__empty">No media attached.</p>
      ) : (
        <ul className="editorial-media-panel__list">
          {media.map((block, index) => (
            <li key={`${block.type}-${index}`} className="editorial-media-panel__item">
              <span>{block.type === "image" ? block.alt || "Image" : block.title || "Video"}</span>
              <button type="button" onClick={() => removeMedia(index)} disabled={disabled}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
