from enum import Enum

from pydantic import BaseModel


class EditorialVisibility(str, Enum):
    EMPTY = "empty"
    DRAFT = "draft"
    LIVE = "live"
    STALE = "stale"


class EditorialReferenceOption(BaseModel):
    contentId: str
    contentType: str
    label: str
    detail: str = ""
