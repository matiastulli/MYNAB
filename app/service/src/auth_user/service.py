import uuid
from datetime import datetime, timedelta
from typing import Any

from pydantic import UUID4
from sqlalchemy import insert, select, join, update

from src import utils
from src.auth_user.config import auth_config
from src.auth_user.exceptions import InvalidCredentials
from src.auth_user.schemas import RegisterUser, SignInUser, UpdateUser
from src.auth_user.security import check_password, hash_password
from src.database import auth_user, auth_user_role, auth_refresh_token, execute, fetch_one, fetch_all


async def create_user(user: RegisterUser) -> dict[str, Any] | None:
    insert_query = (
        insert(auth_user)
        .values(
            {
                "name": user.name,
                "last_name": user.last_name,
                "email": user.email,
                "password": hash_password(user.password),
                "id_role": user.id_role,
            }
        )
        .returning(auth_user)
    )

    inserted_user = await fetch_one(insert_query)

    if inserted_user is None:
        return None

    select_query = select(
        auth_user.c.id,
        auth_user.c.name.label('name'),
        auth_user.c.last_name,
        auth_user.c.email,
        auth_user.c.id_role,
        auth_user.c.created_at,
        auth_user.c.updated_at
    ).where(
        auth_user.c.id == inserted_user['id']
    )

    return await fetch_one(select_query)


async def update_user(id_user: int, user: UpdateUser) -> dict[str, Any] | None:

    update_query = (
        update(auth_user)
        .where(auth_user.c.id == id_user)
        .values(
            {
                "name": user.name,
                "last_name": user.last_name,
                "national_id": user.national_id,
            }
        )
        .returning(auth_user)
    )

    return await fetch_one(update_query)


async def get_user_by_id(id_user: int) -> dict[str, Any] | None:
    select_query = select(
        auth_user.c.id,
        auth_user.c.name,
        auth_user.c.last_name,
        auth_user.c.national_id,
        auth_user.c.email,
        auth_user.c.id_role,
        auth_user.c.created_at,
        auth_user.c.updated_at
    ).where(auth_user.c.id == id_user)

    return await fetch_one(select_query)


async def get_user_by_email(email: str) -> dict[str, Any] | None:
    select_query = select(
        auth_user.c.id,
        auth_user.c.name,
        auth_user.c.last_name,
        auth_user.c.email,
        auth_user.c.password,
        auth_user.c.id_role,
        auth_user.c.created_at,
        auth_user.c.updated_at
    ).where(auth_user.c.email == email)

    return await fetch_one(select_query)


async def create_refresh_token_temp(
    *, refresh_token: str | None = None
) -> str:
    if not refresh_token:
        refresh_token = utils.generate_random_alphanum(64)

    return refresh_token


async def create_refresh_token(
    *, id_user: int, refresh_token: str | None = None
) -> str:
    if not refresh_token:
        refresh_token = utils.generate_random_alphanum(64)

    insert_query = auth_refresh_token.insert().values(
        uuid=uuid.uuid4(),
        id_user=id_user,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(seconds=auth_config.REFRESH_TOKEN_EXP),
    )
    await execute(insert_query)

    return refresh_token


async def get_refresh_token(refresh_token: str) -> dict[str, Any] | None:
    select_query = auth_refresh_token.select().where(
        auth_refresh_token.c.refresh_token == refresh_token
    )

    return await fetch_one(select_query)


async def expire_refresh_token(refresh_token_uuid: UUID4) -> None:
    update_query = (
        auth_refresh_token.update()
        .values(expires_at=datetime.utcnow() - timedelta(days=1))
        .where(auth_refresh_token.c.uuid == refresh_token_uuid)
    )

    await execute(update_query)


async def authenticate_user(auth_data: SignInUser) -> dict[str, Any]:
    user = await get_user_by_email(auth_data.email)
    if not user:
        raise InvalidCredentials()

    if not check_password(auth_data.password, user["password"]):
        raise InvalidCredentials()

    return user


async def get_user_roles(user_id: int) -> dict[str, Any]:
    join_1 = join(
        auth_user,
        auth_user_role,
        auth_user.c.id_role == auth_user_role.c.id
    )

    select_query = select(
        auth_user_role.c.name.label('role')
    ).select_from(join_1).where(
        (auth_user.c.id == user_id)
    )

    result: dict[str, Any] = await fetch_one(select_query)

    return result
