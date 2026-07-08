import re
import uuid
from collections.abc import Callable
from pathlib import Path

from fastapi import UploadFile

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
IMAGE_FILENAME_PATTERN = re.compile(r"^[a-f0-9-]{36}\.(jpg|png|gif|webp)$")


async def read_validated_image(upload: UploadFile) -> tuple[str, bytes]:
    content_type = (upload.content_type or "").lower()
    extension = ALLOWED_IMAGE_TYPES.get(content_type)
    if extension is None:
        raise ValueError("Only JPEG, PNG, GIF, and WebP images are supported.")

    data = await upload.read()
    if not data:
        raise ValueError("Image file is empty.")
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError("Image file is too large (max 5 MB).")

    filename = f"{uuid.uuid4()}{extension}"
    return filename, data


def resolve_public_image_path(
    filename: str,
    get_image_path: Callable[[str], Path | None],
) -> tuple[Path, str]:
    if not IMAGE_FILENAME_PATTERN.match(filename):
        raise FileNotFoundError(filename)

    image_path = get_image_path(filename)
    if image_path is None:
        raise FileNotFoundError(filename)

    extension = image_path.suffix.lower()
    media_type = next(
        (content_type for content_type, suffix in ALLOWED_IMAGE_TYPES.items() if suffix == extension),
        "application/octet-stream",
    )
    return image_path, media_type


class EditorialImageService:
    """Shared image upload validation; storage remains per content module."""

    def __init__(
        self,
        save_image: Callable[[str, bytes], str],
        get_image_path: Callable[[str], Path | None],
    ) -> None:
        self._save_image = save_image
        self._get_image_path = get_image_path

    async def store_upload(self, upload: UploadFile) -> str:
        filename, data = await read_validated_image(upload)
        return self._save_image(filename, data)

    def resolve_public_image(self, filename: str) -> tuple[Path, str]:
        return resolve_public_image_path(filename, self._get_image_path)
