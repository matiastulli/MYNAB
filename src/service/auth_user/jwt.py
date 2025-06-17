from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import PyJWTError

from src.service.auth_user.config import auth_config
from src.service.auth_user.exceptions import AuthRequired, InvalidToken
from src.service.auth_user.schemas import JWTData

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/users/tokens", auto_error=False)


def create_temp_access_token(
    *,
    user: dict[str, Any],
    expires_delta: timedelta = timedelta(minutes=auth_config.ENV_JWT_EXP),
) -> str:
    jwt_data = {
        "sub": str(user["id"]),
        "exp": datetime.utcnow() + expires_delta,
        "name": user.get("name"),
        "last_name": user.get("last_name"),
        "temp_access": "false",
    }

    return jwt.encode(jwt_data, auth_config.ENV_JWT_SECRET, algorithm=auth_config.ENV_JWT_ALG)


def create_access_token(
    *,
    user: dict[str, Any],
    expires_delta: timedelta = timedelta(minutes=auth_config.ENV_JWT_EXP),
) -> str:
    jwt_data = {
        "sub": str(user["id"]),
        "exp": datetime.utcnow() + expires_delta,
        "name": user.get("name"),
        "last_name": user.get("last_name"),
        "temp_access": "false",
    }

    return jwt.encode(jwt_data, auth_config.ENV_JWT_SECRET, algorithm=auth_config.ENV_JWT_ALG)


async def parse_jwt_user_data_optional(
    token: str = Depends(oauth2_scheme),
) -> Optional[JWTData]:
    if not token:
        return None

    try:
        payload = jwt.decode(token, auth_config.ENV_JWT_SECRET, algorithms=[
                             auth_config.ENV_JWT_ALG])
    except PyJWTError as exc:
        raise InvalidToken() from exc

    return JWTData(**payload)


async def parse_jwt_user_data(
    token: JWTData | None = Depends(parse_jwt_user_data_optional),
) -> JWTData:
    if not token:
        raise AuthRequired()

    return token
