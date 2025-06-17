from pydantic_settings import BaseSettings


class AuthConfig(BaseSettings):
    ENV_JWT_ALG: str
    ENV_JWT_SECRET: str
    ENV_JWT_EXP: int = 5  # minutes

    REFRESH_TOKEN_KEY: str = "refreshToken"
    REFRESH_TOKEN_EXP: int = 60 * 60 * 24 * 21  # 21 days

    SECURE_COOKIES: bool = True


auth_config = AuthConfig()
