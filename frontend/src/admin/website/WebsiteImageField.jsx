import { useRef } from "react";
import { defaultAltText, IMAGE_INPUT_ACCEPT, isImageFile } from "../../editorial/editorialMedia.js";
import { uploadWebsiteImage } from "./websiteAdminApi.js";

/**
 * @param {{
 *   label: string;
 *   src: string;
 *   alt: string;
 *   visible?: boolean;
 *   showVisibility?: boolean;
 *   visibilityLabel?: string;
 *   onChange: (value: { src: string; alt: string; visible?: boolean }) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function WebsiteImageField({
  label,
  src,
  alt,
  visible = true,
  showVisibility = false,
  visibilityLabel = "Visible on page",
  onChange,
  disabled = false,
}) {
  const fileInputRef = useRef(null);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!isImageFile(file)) {
      window.alert("Only image files can be uploaded.");
      return;
    }
    try {
      const { url } = await uploadWebsiteImage(file);
      onChange({
        src: url,
        alt: alt || defaultAltText(file),
        visible,
      });
    } catch (error) {
      window.alert(error.message || "Image upload failed.");
    }
  }

  function removeImage() {
    onChange({ src: "", alt: "", visible });
  }

  return (
    <div className="website-image-field">
      <div className="website-image-field__header">
        <span className="manual-admin__field-label">{label}</span>
        <div className="website-image-field__actions">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
            {src ? "Replace image" : "Upload image"}
          </button>
          {src ? (
            <button type="button" onClick={removeImage} disabled={disabled}>
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_INPUT_ACCEPT}
        className="website-image-field__file-input"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
      />
      {src ? (
        <div className="website-image-field__preview">
          <img src={src} alt={alt || label} />
        </div>
      ) : (
        <p className="website-image-field__empty">No image uploaded.</p>
      )}
      <label className="manual-admin__field">
        <span className="manual-admin__field-label">Image alt text</span>
        <input
          type="text"
          value={alt}
          onChange={(event) => onChange({ src, alt: event.target.value, visible })}
          disabled={disabled || !src}
        />
      </label>
      {showVisibility ? (
        <label className="website-admin__checkbox">
          <input
            type="checkbox"
            checked={visible}
            onChange={(event) => onChange({ src, alt, visible: event.target.checked })}
            disabled={disabled}
          />
          {visibilityLabel}
        </label>
      ) : null}
    </div>
  );
}
