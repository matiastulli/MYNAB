from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr


class SendTemplateEmailRequest(BaseModel):
    """Request model for sending template emails."""
    to_emails: List[EmailStr]
    subject: str
    template_name: str
    context: Dict[str, Any]
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None
    cc_emails: Optional[List[EmailStr]] = None
    bcc_emails: Optional[List[EmailStr]] = None


class EmailResponse(BaseModel):
    """Response model for email operations."""
    success: bool
    message: str