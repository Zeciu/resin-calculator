from fastapi import UploadFile

from .editorial_images import EditorialImageService


class WebsiteImageService:
    def __init__(self, repository):
        self._service = EditorialImageService(
            repository.save_website_image,
            repository.get_website_image_path,
        )

    async def store_upload(self, upload: UploadFile) -> str:
        return await self._service.store_upload(upload)

    def resolve_public_image(self, filename: str):
        return self._service.resolve_public_image(filename)
