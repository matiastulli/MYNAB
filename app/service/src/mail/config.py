"""Mail service configuration."""
import os
from typing import Optional
from pydantic import BaseModel, field_validator
from .exceptions import MailConfigurationError


class MailConfig(BaseModel):
    """Configuration for mail service using Resend."""

    # Resend API key
    api_key: Optional[str] = None

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
        # Default template directory relative to this file's location
        default_template_dir = os.path.join(
            os.path.dirname(__file__), "templates")

        return cls(
            api_key=os.getenv("ENV_RESEND_API_KEY"),
            from_email=os.getenv("ENV_MAIL_FROM_EMAIL"),
            from_name=os.getenv("ENV_MAIL_FROM_NAME", "MYNAB"),
            template_dir=os.getenv(
                "ENV_MAIL_TEMPLATE_DIR", default_template_dir)
        )

    @field_validator("api_key")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        if not v:
            raise MailConfigurationError("Resend API key is required")
        return v

    @field_validator("from_email")
    @classmethod
    def validate_from_email(cls, v: str) -> str:
        if not v:
            raise MailConfigurationError("From email is required")
        return v
