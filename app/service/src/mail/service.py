"""Gmail mail service implementation."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from typing import List, Optional, Union, Dict, Any
from jinja2 import Environment, FileSystemLoader

from .config import MailConfig
from .exceptions import MailSendError, MailTemplateError


logger = logging.getLogger(__name__)


class MailService:
    """Service for sending emails using Gmail SMTP."""

    def __init__(self, config: MailConfig):
        """Initialize mail service with configuration."""
        self.config = config
        self._template_env = None
        self._setup_templates()

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
                logger.info(f"Template environment initialized with path: {template_path}")
            else:
                logger.warning(f"Template directory not found: {template_path}")
                logger.warning(f"Current working directory: {Path.cwd()}")
        else:
            logger.warning("No template directory configured")

    def _get_smtp_connection(self) -> smtplib.SMTP:
        """Create and return authenticated SMTP connection."""
        try:
            # Create SMTP connection
            smtp = smtplib.SMTP(self.config.smtp_server, self.config.smtp_port)

            # Enable TLS if configured
            if self.config.use_tls:
                smtp.starttls()

            # Authenticate
            smtp.login(self.config.smtp_username, self.config.smtp_password)

            return smtp

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            raise MailSendError(f"Authentication failed: {e}")
        except smtplib.SMTPConnectError as e:
            logger.error(f"SMTP connection failed: {e}")
            raise MailSendError(f"Connection failed: {e}")
        except Exception as e:
            logger.error(f"SMTP setup failed: {e}")
            raise MailSendError(f"SMTP setup failed: {e}")

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
        Send an email using Gmail SMTP.

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

            if cc_emails and isinstance(cc_emails, str):
                cc_emails = [cc_emails]

            if bcc_emails and isinstance(bcc_emails, str):
                bcc_emails = [bcc_emails]

            # Use default sender if not provided
            sender_email = from_email or self.config.from_email
            sender_name = from_name or self.config.from_name

            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{sender_name} <{sender_email}>" if sender_name else sender_email
            msg['To'] = ', '.join(to_emails)

            if cc_emails:
                msg['Cc'] = ', '.join(cc_emails)

            # Add text body
            text_part = MIMEText(body, 'plain', 'utf-8')
            msg.attach(text_part)

            # Add HTML body if provided
            if html_body:
                html_part = MIMEText(html_body, 'html', 'utf-8')
                msg.attach(html_part)

            # Add attachments if provided
            if attachments:
                for file_path in attachments:
                    self._add_attachment(msg, file_path)

            # Prepare recipient list
            all_recipients = to_emails[:]
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)

            # Send email
            with self._get_smtp_connection() as smtp:
                smtp.send_message(msg, from_addr=sender_email,
                                  to_addrs=all_recipients)

            logger.info(f"Email sent successfully to {', '.join(to_emails)}")
            return True

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

    def _add_attachment(self, msg: MIMEMultipart, file_path: str) -> None:
        """Add file attachment to email message."""
        try:
            file_path_obj = Path(file_path)
            if not file_path_obj.exists():
                raise MailSendError(f"Attachment file not found: {file_path}")

            with open(file_path, 'rb') as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())

            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {file_path_obj.name}'
            )
            msg.attach(part)

        except Exception as e:
            logger.error(f"Failed to add attachment {file_path}: {e}")
            raise MailSendError(f"Failed to add attachment: {e}")
