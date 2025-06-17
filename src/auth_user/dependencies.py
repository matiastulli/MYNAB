from datetime import datetime
from typing import Any, List

from fastapi import Cookie, Depends

from src.auth_user.exceptions import EmailTaken, RefreshTokenNotValid, RoleRequired
from src.auth_user.schemas import RegisterUser, JWTData
from src.auth_user import service

from src.auth_user.jwt import parse_jwt_user_data
from src.constants import ROLES


async def valid_user_create(user: RegisterUser) -> RegisterUser:
    if await service.get_user_by_email(user.email):
        raise EmailTaken()

    return user


async def valid_refresh_token(
    refresh_token: str = Cookie(..., alias="refreshToken"),
) -> dict[str, Any]:
    db_refresh_token = await service.get_refresh_token(refresh_token)
    if not db_refresh_token:
        raise RefreshTokenNotValid()

    if not _is_valid_refresh_token(db_refresh_token):
        raise RefreshTokenNotValid()

    return db_refresh_token


def _is_valid_refresh_token(db_refresh_token: dict[str, Any]) -> bool:
    return datetime.utcnow() <= db_refresh_token["expires_at"]


def require_role(required_roles: List[ROLES]):
    async def role_checker(jwt_data: JWTData = Depends(parse_jwt_user_data)):
        if not required_roles:
            return jwt_data

        user_role = await service.get_user_roles(jwt_data.id_user)

        if not user_role['role']:
            raise RoleRequired()
        if user_role['role'] not in [role.value for role in required_roles]:
            raise RoleRequired()
        return jwt_data
    return role_checker


def get_current_user():
    async def current_user(jwt_data: JWTData = Depends(parse_jwt_user_data)):
        return jwt_data
    return current_user
