import os
from typing import Any, ClassVar
from pydantic import PostgresDsn
from pydantic_settings import BaseSettings
from src.constants import Environment
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
env_path = Path(".") / ".env"
load_dotenv(dotenv_path=env_path)

class Config(BaseSettings):
    ENV_DATABASE_URL: ClassVar[PostgresDsn] = PostgresDsn(os.getenv("ENV_DATABASE_URL", None))
    ENV_SITE_DOMAIN: str = "myapp.com"
    ENV_ENVIRONMENT: Environment = Environment(os.getenv("ENV_ENVIRONMENT", "LOCAL"))
    APP_VERSION: str = "1"

    ENV_CORS_ORIGINS: list[str]
    ENV_CORS_HEADERS: list[str]

settings = Config()

app_configs: dict[str, Any] = {"title": "App API"}
if settings.ENV_ENVIRONMENT.is_deployed:
    app_configs["root_path"] = f"/v{settings.APP_VERSION}"

if not settings.ENV_ENVIRONMENT.is_debug:
    app_configs["openapi_url"] = None  # hide docs
