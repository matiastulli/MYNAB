"""Mail service API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

from .service import MailService
from .dependencies import get_mail_service
from .exceptions import MailSendError, MailTemplateError
from .schema import (SendEmailRequest, SendTemplateEmailRequest, EmailResponse)

router = APIRouter()


@router.post("/send", response_model=EmailResponse)
async def send_email(
    request: SendEmailRequest,
    mail_service: MailService = Depends(get_mail_service)
) -> EmailResponse:
    """Send a plain email."""
    try:
        success = mail_service.send_email(
            to_emails=request.to_emails,
            subject=request.subject,
            body=request.body,
            html_body=request.html_body,
            from_email=request.from_email,
            from_name=request.from_name,
            cc_emails=request.cc_emails,
            bcc_emails=request.bcc_emails
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Email sending failed"
            )

        return EmailResponse(
            success=True,
            message=f"Email sent successfully to {len(request.to_emails)} recipient(s)"
        )

    except MailSendError as e:
        logger.error(f"Mail send error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error sending email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/send-template", response_model=EmailResponse)
async def send_template_email(
    request: SendTemplateEmailRequest,
    mail_service: MailService = Depends(get_mail_service)
) -> EmailResponse:
    """Send an email using a template."""
    try:
        success = mail_service.send_template_email(
            to_emails=request.to_emails,
            subject=request.subject,
            template_name=request.template_name,
            context=request.context,
            from_email=request.from_email,
            from_name=request.from_name,
            cc_emails=request.cc_emails,
            bcc_emails=request.bcc_emails
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Template email sending failed"
            )

        return EmailResponse(
            success=True,
            message=f"Template email sent successfully to {len(request.to_emails)} recipient(s)"
        )

    except MailTemplateError as e:
        logger.error(f"Mail template error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template error: {e}"
        )
    except MailSendError as e:
        logger.error(f"Mail send error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error sending template email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
