export function promptValue(label, defaultValue = "") {
  const value = window.prompt(label, defaultValue);
  if (value === null) {
    return null;
  }
  return value.trim();
}

export function defaultAltText(file) {
  const stem = file.name.replace(/\.[^.]+$/, "").trim();
  return stem || "Illustration";
}

export function isImageFile(file) {
  return file?.type?.startsWith("image/") ?? false;
}

export const IMAGE_INPUT_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
