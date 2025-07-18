from typing import Any, Dict, List
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Date,
    Delete,
    ForeignKey,
    Integer,
    LargeBinary,
    MetaData,
    String,
    DECIMAL,
    CursorResult,
    Select,
    Insert,
    Text,
    Update,
    TextClause,
    Table,
    func,
    JSON,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import create_async_engine

from src.config import settings
from src.constants import DB_NAMING_CONVENTION

DATABASE_URL = str(settings.ENV_DATABASE_URL)

engine = create_async_engine(DATABASE_URL)
metadata = MetaData(naming_convention=DB_NAMING_CONVENTION)


auth_user_role = Table(
    "auth_user_role",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String(50), nullable=False),
    schema="mynab",
)

auth_user = Table(
    "auth_user",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String(100), nullable=False),
    Column("last_name", String(100), nullable=False),
    Column("national_id", String(20), nullable=True, unique=True),
    Column("email", String, nullable=False, unique=True),
    Column("password", LargeBinary, nullable=True),
    Column("auth_method", String(20), nullable=False, server_default="password"),
    Column("email_verified", Boolean, nullable=False, server_default="false"),
    Column("id_role", Integer, ForeignKey(
        "mynab.auth_user_role.id")),
    Column("created_at", DateTime, server_default=func.now(), nullable=False),
    Column("updated_at", DateTime, server_default=func.now(), onupdate=func.now()),
    schema="mynab",
)

auth_refresh_token = Table(
    "auth_refresh_token",
    metadata,
    Column("uuid", UUID, primary_key=True),
    Column("id_user", Integer, ForeignKey(
        "mynab.auth_user.id")),
    Column("refresh_token", String, nullable=False),
    Column("expires_at", DateTime, nullable=False),
    Column("created_at", DateTime, server_default=func.now(), nullable=False),
    Column("updated_at", DateTime, server_default=func.now(), onupdate=func.now()),
    schema="mynab",
)

auth_user_activity_log = Table(
    "auth_user_activity_log",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("id_user", Integer, ForeignKey(
        "mynab.auth_user.id")),
    Column("action", String(255)),
    Column("details", JSON),
    Column("timestamp", DateTime, server_default=func.now()),
    schema="mynab",
)

# Email verification codes for passwordless authentication
auth_email_verification = Table(
    "auth_email_verification",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("email", String, nullable=False),
    Column("verification_code", String(10), nullable=False),  # 6-8 digit code
    Column("code_type", String(20), nullable=False),  # 'login', 'registration', 'password_reset'
    Column("attempts", Integer, nullable=False, server_default="0"),  # Track failed attempts
    Column("max_attempts", Integer, nullable=False, server_default="3"),  # Max attempts allowed
    Column("expires_at", DateTime, nullable=False),
    Column("used_at", DateTime, nullable=True),  # When the code was successfully used
    Column("ip_address", String(45), nullable=True),  # Track IP for security
    Column("user_agent", String(255), nullable=True),  # Track user agent for security
    Column("created_at", DateTime, server_default=func.now(), nullable=False),
    schema="mynab",
)

files = Table(
    "files",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("mynab.auth_user.id"), nullable=False),
    Column("file_name", String(255), nullable=True),
    Column("file_base64", Text, nullable=True),
    Column("currency", String(3), nullable=True, default="ARS"),
    Column("created_at", DateTime, server_default=func.now(), nullable=False),
    Column("updated_at", DateTime, server_default=func.now(), onupdate=func.now()),
    schema="mynab",
)

budget_transaction_category = Table(
    "budget_transaction_category",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("category_key", String(50), nullable=False, unique=True),  # Matches the class constant keys
    Column("category_name", String(100), nullable=False),
    Column("description", String(255), nullable=True),
    Column("created_at", DateTime, server_default=func.now(), nullable=False),
    Column("updated_at", DateTime, server_default=func.now(), onupdate=func.now()),
    schema="mynab",
)

# Budget entries: incomes or outcomes
budget_entry = Table(
    "budget_entry",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("mynab.auth_user.id"), nullable=False),
    Column("reference_id", String(50), nullable=True),
    Column("amount", DECIMAL(38, 12), nullable=False),
    Column("currency", String(3), nullable=True, default="ARS"),
    Column("source", String(50), nullable=True),  # e.g., 'icbc', 'mercado_pago', 'manual'
    Column("type", String(10), nullable=False),  # 'income' or 'outcome'
    Column("description", String(255), nullable=True),
    Column("category_id", Integer, ForeignKey("mynab.budget_transaction_category.id"), nullable=True),
    Column("date", Date, nullable=False),
    Column("file_id", Integer, ForeignKey("mynab.files.id"), nullable=True),
    Column("created_at", DateTime, server_default=func.now(), nullable=False),
    Column("updated_at", DateTime, server_default=func.now(), onupdate=func.now()),
    schema="mynab",
)


async def fetch_one(select_query: Select | Insert | Update) -> dict[str, Any] | None:
    async with engine.begin() as conn:
        cursor: CursorResult = await conn.execute(select_query)
        return cursor.first()._asdict() if cursor.rowcount > 0 else None


async def fetch_all(select_query: Select | Insert | Update | TextClause) -> list[dict[str, Any]]:
    async with engine.begin() as conn:
        cursor: CursorResult = await conn.execute(select_query)
        return [r._asdict() for r in cursor.all()]


async def fetch_all_sql(sql_query: str) -> List[Dict[str, Any]]:
    async with engine.begin() as conn:
        result = await conn.execute(text(sql_query))
        rows = result.fetchall()
        columns = result.keys()
        return [dict(zip(columns, row)) for row in rows]


async def execute(select_query: Insert | Update | Delete) -> None:
    async with engine.begin() as conn:
        await conn.execute(select_query)
