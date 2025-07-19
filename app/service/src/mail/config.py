"""Mail service configuration."""
import os
from typing import Optional
from pydantic import BaseModel, field_validator
from .exceptions import MailConfigurationError


class MailConfig(BaseModel):
    """Configuration for mail service using Gmail SMTP."""

    # Gmail SMTP settings
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    use_tls: bool = True

    # Authentication
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None

    # Default sender
    from_email: Optional[str] = None
    from_name: Optional[str] = None

    # Template settings
    template_dir: Optional[str] = None

    class Config:
        env_prefix = "MAIL_"

    @classmethod
    def from_env(cls) -> "MailConfig":
        """Create configuration from environment variables."""
        return cls(
            smtp_username=os.getenv("ENV_MAIL_SMTP_USERNAME"),
            smtp_password=os.getenv("ENV_MAIL_SMTP_PASSWORD"),
            from_email=os.getenv("ENV_MAIL_FROM_EMAIL"),
            from_name=os.getenv("ENV_MAIL_FROM_NAME", "MYNAB"),
            template_dir=os.getenv("ENV_MAIL_TEMPLATE_DIR", "src/mail/templates")
        )

    @field_validator("smtp_username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v:
            raise MailConfigurationError("SMTP username is required")
        return v

    @field_validator("smtp_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v:
            raise MailConfigurationError("SMTP password is required")
        return v

    @field_validator("from_email")
    @classmethod
    def validate_from_email(cls, v: str) -> str:
        if not v:
            raise MailConfigurationError("From email is required")
        return v
