from fastapi import UploadFile

from .editorial_images import EditorialImageService


class KnowledgeBaseImageService:
    def __init__(self, repository):
        self._service = EditorialImageService(
            repository.save_kb_image,
            repository.get_kb_image_path,
        )

    async def store_upload(self, upload: UploadFile) -> str:
        return await self._service.store_upload(upload)

    def resolve_public_image(self, filename: str):
        return self._service.resolve_public_image(filename)
