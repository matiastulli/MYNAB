"""Resend mail service implementation."""
import logging
import base64
from pathlib import Path
from typing import List, Optional, Union, Dict, Any, TypedDict
from jinja2 import Environment, FileSystemLoader
import resend

from .config import MailConfig
from .exceptions import MailSendError, MailTemplateError


class EmailParams(TypedDict, total=False):
    """Type definition for email parameters."""
    from_: str
    to: Union[str, List[str]]
    subject: str
    html: Optional[str]
    text: Optional[str]
    cc: Optional[Union[str, List[str]]]
    bcc: Optional[Union[str, List[str]]]
    attachments: Optional[List[Dict[str, str]]]


logger = logging.getLogger(__name__)


class MailService:
    """Service for sending emails using Resend."""

    def __init__(self, config: MailConfig):
        """Initialize mail service with configuration."""
        self.config = config
        self._template_env = None
        self._setup_templates()
        resend.api_key = config.api_key

    def _setup_templates(self) -> None:
        """Setup Jinja2 template environment."""
        if self.config.template_dir:
            template_path = Path(self.config.template_dir)

            # Try relative path first, then absolute
            if not template_path.exists() and not template_path.is_absolute():
                # Try resolving relative to the current working directory
                template_path = Path.cwd() / self.config.template_dir

            if template_path.exists():
                self._template_env = Environment(
                    loader=FileSystemLoader(str(template_path)),
                    autoescape=True
                )
                logger.info(
                    f"Template environment initialized with path: {template_path}")
            else:
                logger.warning(
                    f"Template directory not found: {template_path}")
                logger.warning(f"Current working directory: {Path.cwd()}")
        else:
            logger.warning("No template directory configured")

    def _render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """Render email template with context."""
        if not self._template_env:
            raise MailTemplateError("Template environment not configured")

        try:
            template = self._template_env.get_template(template_name)
            return template.render(context)
        except Exception as e:
            logger.error(f"Template rendering failed: {e}")
            raise MailTemplateError(f"Template rendering failed: {e}")

    def _encode_attachment(self, file_path: str) -> Dict[str, str]:
        """Encode file for attachment."""
        try:
            file_path_obj = Path(file_path)
            if not file_path_obj.exists():
                raise MailSendError(f"Attachment file not found: {file_path}")

            with open(file_path, 'rb') as file:
                content = file.read()
                encoded = base64.b64encode(content).decode('utf-8')
                return {
                    'content': encoded,
                    'filename': file_path_obj.name
                }

        except Exception as e:
            logger.error(f"Failed to encode attachment {file_path}: {e}")
            raise MailSendError(f"Failed to encode attachment: {e}")

    def send_email(
        self,
        to_emails: Union[str, List[str]],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        cc_emails: Optional[Union[str, List[str]]] = None,
        bcc_emails: Optional[Union[str, List[str]]] = None,
        attachments: Optional[List[str]] = None
    ) -> bool:
        """
        Send an email using Resend.

        Args:
            to_emails: Recipient email(s)
            subject: Email subject
            body: Plain text body
            html_body: HTML body (optional)
            from_email: Sender email (defaults to config)
            from_name: Sender name (defaults to config)
            cc_emails: CC recipients (optional)
            bcc_emails: BCC recipients (optional)
            attachments: List of file paths to attach (optional)

        Returns:
            bool: True if email sent successfully

        Raises:
            MailSendError: If email sending fails
        """
        try:
            # Prepare email addresses
            if isinstance(to_emails, str):
                to_emails = [to_emails]

            # Use default sender if not provided
            sender_email = from_email or self.config.from_email
            sender_name = from_name or self.config.from_name

            # Prepare CC and BCC
            if cc_emails and isinstance(cc_emails, str):
                cc_emails = [cc_emails]
            if bcc_emails and isinstance(bcc_emails, str):
                bcc_emails = [bcc_emails]

            # Prepare attachments if any
            attachment_data = []
            if attachments:
                for file_path in attachments:
                    attachment_data.append(self._encode_attachment(file_path))

            # Prepare email data for Resend
            send_params = {
                "from": f"{sender_name} <{sender_email}>" if sender_name else sender_email,
                "to": to_emails,
                "subject": subject,
                "text": body
            }

            if html_body:
                send_params["html"] = html_body

            if cc_emails:
                send_params["cc"] = cc_emails

            if bcc_emails:
                send_params["bcc"] = bcc_emails

            if attachment_data:
                send_params["attachments"] = attachment_data

            # Send email using Resend
            response = resend.Emails.send(send_params)

            if response and response.get("id"):
                logger.info(
                    f"Email sent successfully to {', '.join(to_emails)} with ID: {response['id']}")
                return True
            else:
                raise MailSendError("No email ID returned from Resend")

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise MailSendError(f"Failed to send email: {e}")

    def send_template_email(
        self,
        to_emails: Union[str, List[str]],
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        cc_emails: Optional[Union[str, List[str]]] = None,
        bcc_emails: Optional[Union[str, List[str]]] = None,
        attachments: Optional[List[str]] = None
    ) -> bool:
        """
        Send an email using a template.

        Args:
            to_emails: Recipient email(s)
            subject: Email subject
            template_name: Name of the template file (without extension)
            context: Template context variables
            from_email: Sender email (defaults to config)
            from_name: Sender name (defaults to config)
            cc_emails: CC recipients (optional)
            bcc_emails: BCC recipients (optional)
            attachments: List of file paths to attach (optional)

        Returns:
            bool: True if email sent successfully
        """
        # Render HTML template
        html_body = self._render_template(f"{template_name}.html", context)

        import re
        text_body = re.sub(r'<[^>]+>', '', html_body)

        return self.send_email(
            to_emails=to_emails,
            subject=subject,
            body=text_body,
            html_body=html_body,
            from_email=from_email,
            from_name=from_name,
            cc_emails=cc_emails,
            bcc_emails=bcc_emails,
            attachments=attachments
        )
