import re
import uuid
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


class KnowledgeBaseImageService:
    def __init__(self, repository):
        self._repository = repository

    async def store_upload(self, upload: UploadFile) -> str:
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
        return self._repository.save_kb_image(filename, data)

    def resolve_public_image(self, filename: str) -> tuple[Path, str]:
        if not IMAGE_FILENAME_PATTERN.match(filename):
            raise FileNotFoundError(filename)

        image_path = self._repository.get_kb_image_path(filename)
        if image_path is None:
            raise FileNotFoundError(filename)

        extension = image_path.suffix.lower()
        media_type = next(
            (content_type for content_type, suffix in ALLOWED_IMAGE_TYPES.items() if suffix == extension),
            "application/octet-stream",
        )
        return image_path, media_type
