import re
from typing import Optional
from datetime import datetime

from pydantic import EmailStr, Field, field_validator, validator

from src.models import CustomModel, convert_datetime_to_date

STRONG_PASSWORD_PATTERN = re.compile(
    r"^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,128}$")


class UserBase(CustomModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

    @field_validator("password", mode="after")
    @classmethod
    def valid_password(cls, password: str) -> str:
        if not re.match(STRONG_PASSWORD_PATTERN, password):
            raise ValueError(
                "Password must contain at least "
                "one lower character, "
                "one upper character, "
                "digit or "
                "special symbol"
            )

        return password


class RegisterUser(UserBase):
    name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    id_role: int


class UpdateUser(CustomModel):
    name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    national_id: Optional[str] = Field(min_length=6, max_length=20)


class SignInUser(UserBase):
    pass


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
    id_role: int
    created_at: str
    updated_at: str

    @validator('created_at', 'updated_at', pre=True)
    def format_datetime(cls, value):
        if isinstance(value, datetime):
            return convert_datetime_to_date(value)
        return value

    class Config:
        from_atributtes = True
