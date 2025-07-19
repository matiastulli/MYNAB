"""Mail service dependencies for dependency injection."""
from functools import lru_cache
from .config import MailConfig
from .service import MailService


@lru_cache()
def get_mail_config() -> MailConfig:
    """Get mail configuration instance."""
    return MailConfig.from_env()


@lru_cache()
def get_mail_service() -> MailService:
    """Get mail service instance."""
    config = get_mail_config()
    return MailService(config)
