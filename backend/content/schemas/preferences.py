from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class InterfaceLanguage(str, Enum):
    EN = "en"
    RO = "ro"


class LengthUnit(str, Enum):
    MM = "mm"
    CM = "cm"
    M = "m"
    IN = "in"
    FT = "ft"


class VolumeUnit(str, Enum):
    ML = "ml"
    L = "L"
    FL_OZ = "fl_oz"
    PT = "pt"
    QT = "qt"
    GAL = "gal"


DEFAULT_INTERFACE_LANGUAGE = InterfaceLanguage.EN
DEFAULT_LENGTH_UNIT = LengthUnit.MM
DEFAULT_VOLUME_UNIT = VolumeUnit.L


class UserPreferences(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    interfaceLanguage: InterfaceLanguage = DEFAULT_INTERFACE_LANGUAGE
    lengthUnit: LengthUnit = DEFAULT_LENGTH_UNIT
    volumeUnit: VolumeUnit = DEFAULT_VOLUME_UNIT


class UserPreferencesResponse(UserPreferences):
    exists: bool = False


class UpdateUserPreferencesRequest(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    interfaceLanguage: InterfaceLanguage | None = None
    lengthUnit: LengthUnit | None = None
    volumeUnit: VolumeUnit | None = None

    def apply_to(self, current: UserPreferences) -> UserPreferences:
        data = current.model_dump()
        patch = self.model_dump(exclude_unset=True)
        data.update(patch)
        return UserPreferences.model_validate(data)
