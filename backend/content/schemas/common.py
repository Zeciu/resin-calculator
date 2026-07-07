from enum import Enum
from typing import Literal

LocaleCode = Literal["en", "ro"]
VALID_LOCALES = frozenset({"en", "ro"})


class ContentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
