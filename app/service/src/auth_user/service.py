import uuid
import secrets
import string
from datetime import datetime, timedelta
from typing import Any, Optional

from pydantic import UUID4
from sqlalchemy import insert, select, join, update, delete, and_

from src import utils
from src.auth_user.config import auth_config
from src.auth_user.exceptions import InvalidCredentials
from src.auth_user.schemas import RegisterUser, SignInUser, UpdateUser, PasswordlessRegisterUser
from src.auth_user.security import check_password, hash_password
from src.database import auth_user, auth_user_role, auth_refresh_token, auth_email_verification, execute, fetch_one


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
        auth_user.c.auth_method,
        auth_user.c.email_verified,
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
        auth_user.c.auth_method,
        auth_user.c.email_verified,
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
        auth_user.c.auth_method,
        auth_user.c.email_verified,
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
        expires_at=datetime.now() + timedelta(seconds=auth_config.REFRESH_TOKEN_EXP),
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


# Passwordless Authentication Functions

def generate_verification_code(length: int = 6) -> str:
    """Generate a secure random verification code."""
    return ''.join(secrets.choice(string.digits) for _ in range(length))


async def create_verification_code(
    email: str,
    code_type: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    expiry_minutes: int = 5
) -> dict[str, Any]:
    """
    Create a new verification code for email verification.

    Args:
        email: User's email address
        code_type: Type of code ('login', 'registration')
        ip_address: IP address of the request
        user_agent: User agent string
        expiry_minutes: How many minutes until the code expires

    Returns:
        Dict containing the verification code and expiry information
    """
    # Clean up any existing codes for this email and type
    delete_query = delete(auth_email_verification).where(
        and_(
            auth_email_verification.c.email == email,
            auth_email_verification.c.code_type == code_type
        )
    )
    await execute(delete_query)

    # Generate new code
    verification_code = generate_verification_code()
    expires_at = datetime.now() + timedelta(minutes=15)  # 15 minutes expiry
    
    insert_query = insert(auth_email_verification).values(
        email=email,
        verification_code=verification_code,
        code_type=code_type,
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent
    ).returning(auth_email_verification)

    await fetch_one(insert_query)

    return {
        "verification_code": verification_code,
        "expires_at": expires_at,
        "expires_in": expiry_minutes
    }


async def verify_code(email: str, code: str, code_type: str) -> dict[str, Any] | None:
    """
    Verify a verification code.

    Args:
        email: User's email address
        code: The verification code to check
        code_type: Type of code ('login', 'registration')

    Returns:
        Dict with verification result or None if invalid
    """
    # Find the verification code
    select_query = select(auth_email_verification).where(
        and_(
            auth_email_verification.c.email == email,
            auth_email_verification.c.verification_code == code,
            auth_email_verification.c.code_type == code_type,
            auth_email_verification.c.used_at.is_(None),
            auth_email_verification.c.expires_at > datetime.now()
        )
    )

    verification_record = await fetch_one(select_query)

    if not verification_record:
        # Increment failed attempts
        update_query = update(auth_email_verification).where(
            and_(
                auth_email_verification.c.email == email,
                auth_email_verification.c.code_type == code_type,
                auth_email_verification.c.used_at.is_(None)
            )
        ).values(
            attempts=auth_email_verification.c.attempts + 1
        )
        await execute(update_query)
        return None

    # Check if max attempts exceeded
    if verification_record['attempts'] >= verification_record['max_attempts']:
        return None

    # Mark code as used
    update_query = update(auth_email_verification).where(
        auth_email_verification.c.id == verification_record['id']
    ).values(
        used_at=datetime.now()
    )
    await execute(update_query)

    return verification_record


async def create_passwordless_user(user: PasswordlessRegisterUser) -> dict[str, Any] | None:
    """Create a new user with passwordless authentication."""
    insert_query = (
        insert(auth_user)
        .values(
            {
                "name": user.name,
                "last_name": user.last_name,
                "email": user.email,
                "password": None,  # No password for passwordless users
                "auth_method": "passwordless",
                "email_verified": True,  # Email is verified through the registration process
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
        auth_user.c.auth_method,
        auth_user.c.email_verified,
        auth_user.c.created_at,
        auth_user.c.updated_at
    ).where(
        auth_user.c.id == inserted_user['id']
    )

    return await fetch_one(select_query)


async def authenticate_passwordless_user(email: str) -> dict[str, Any]:
    """
    Authenticate a passwordless user by email.
    Raises InvalidCredentials if user not found or not passwordless.
    """
    user = await get_user_by_email(email)

    if user is None:
        raise InvalidCredentials()

    if user['auth_method'] != 'passwordless':
        raise InvalidCredentials()

    if not user['email_verified']:
        raise InvalidCredentials()

    return user
