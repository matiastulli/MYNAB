"""Mail service exceptions."""


class MailServiceError(Exception):
    """Base exception for mail service errors."""
    pass


class MailConfigurationError(MailServiceError):
    """Raised when mail service configuration is invalid."""
    pass


class MailSendError(MailServiceError):
    """Raised when email sending fails."""
    pass


class MailTemplateError(MailServiceError):
    """Raised when email template processing fails."""
    pass
