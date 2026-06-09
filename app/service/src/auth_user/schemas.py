from typing import Optional
from datetime import datetime

from pydantic import EmailStr, Field, validator

from src.models import CustomModel, convert_datetime_to_date


class GoogleSignInRequest(CustomModel):
    access_token: str


class UpdateUser(CustomModel):
    name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    national_id: Optional[str] = Field(min_length=6, max_length=20)


class UpdateAvatar(CustomModel):
    avatar_data: str  # base64-encoded JPEG, no data URL prefix


class JWTData(CustomModel):
    id_user: int = Field(alias="sub")
    id_user_role: Optional[int] = None


class AccessTokenResponse(CustomModel):
    id_user: int
    access_token: str
    refresh_token: str


class UserResponse(CustomModel):
    id: int
    name: str
    last_name: str
    national_id: Optional[str] = None
    email: EmailStr
    auth_method: str
    email_verified: bool
    id_role: int
    created_at: str
    updated_at: str
    avatar_data: Optional[str] = None

    @validator('created_at', 'updated_at', pre=True)
    def format_datetime(cls, value):
        if isinstance(value, datetime):
            return convert_datetime_to_date(value)
        return value

    class Config:
        from_atributtes = True
