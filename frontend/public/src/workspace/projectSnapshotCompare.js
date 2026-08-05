function normalizeImageForCompare(image) {
  if (!image || typeof image !== "object") {
    return image ?? null;
  }

  if (typeof image.dataUrl === "string") {
    return { dataUrl: image.dataUrl };
  }

  return image;
}

function normalizeProjectSnapshotForCompare(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const { savedAt: _savedAt, appVersion: _appVersion, image, ...rest } = snapshot;

  return {
    ...rest,
    image: normalizeImageForCompare(image),
  };
}

export function areProjectSnapshotsEqual(left, right) {
  return (
    JSON.stringify(normalizeProjectSnapshotForCompare(left)) ===
    JSON.stringify(normalizeProjectSnapshotForCompare(right))
  );
}
