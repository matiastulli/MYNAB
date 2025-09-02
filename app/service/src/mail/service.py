import logging
import base64
import re
from pathlib import Path
from typing import List, Optional, Union, Dict, Any
from jinja2 import Environment, FileSystemLoader
import resend

from .config import MailConfig
from .exceptions import MailSendError, MailTemplateError

logger = logging.getLogger(__name__)


class MailService:
    def __init__(self, config: MailConfig):
        self.config = config
        self._template_env = None
        self._setup_templates()
        resend.api_key = config.api_key

    def _setup_templates(self) -> None:
        if self.config.template_dir:
            template_path = Path(self.config.template_dir)
            if not template_path.exists() and not template_path.is_absolute():
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
        if not self._template_env:
            raise MailTemplateError("Template environment not configured")
        try:
            template = self._template_env.get_template(template_name)
            return template.render(context)
        except Exception as e:
            logger.error(f"Template rendering failed: {e}")
            raise MailTemplateError(f"Template rendering failed: {e}")

    def _encode_attachment(self, file_path: str) -> Dict[str, str]:
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            raise MailSendError(f"Attachment file not found: {file_path}")
        with open(file_path_obj, 'rb') as f:
            content = base64.b64encode(f.read()).decode('utf-8')
        return {
            'content': content,
            'filename': file_path_obj.name
        }

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
        reply_to: Optional[Union[str, List[str]]] = None,
        attachments: Optional[List[str]] = None,
        tags: Optional[List[Dict[str, str]]] = None
    ) -> bool:
        try:
            to_list = [to_emails] if isinstance(to_emails, str) else to_emails
            sender = from_email or self.config.from_email

            send_params: resend.Emails.SendParams = {
                "from": sender,
                "to": to_list,
                "subject": subject,
            }

            if html_body:
                send_params["html"] = html_body
            if cc_emails:
                send_params["cc"] = [cc_emails] if isinstance(
                    cc_emails, str) else cc_emails
            if bcc_emails:
                send_params["bcc"] = [bcc_emails] if isinstance(
                    bcc_emails, str) else bcc_emails
            if reply_to:
                send_params["reply_to"] = [reply_to] if isinstance(
                    reply_to, str) else reply_to
            if tags:
                send_params["tags"] = tags
            if attachments:
                send_params["attachments"] = [
                    self._encode_attachment(p) for p in attachments]

            response = resend.Emails.send(send_params)

            if response and response.get("id"):
                logger.info(
                    f"Email sent successfully to {', '.join(to_list)}, ID: {response['id']}")
                return True
            else:
                raise MailSendError(f"Resend error: {response}")

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
        reply_to: Optional[Union[str, List[str]]] = None,
        attachments: Optional[List[str]] = None,
        tags: Optional[List[Dict[str, str]]] = None
    ) -> bool:
        html = self._render_template(f"{template_name}.html", context)

        text = re.sub(r'<[^>]+>', '', html)
        return self.send_email(
            to_emails=to_emails,
            subject=subject,
            body=text,
            html_body=html,
            from_email=from_email,
            from_name=from_name,
            cc_emails=cc_emails,
            bcc_emails=bcc_emails,
            reply_to=reply_to,
            attachments=attachments,
            tags=tags
        )
