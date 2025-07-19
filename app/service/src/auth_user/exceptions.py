from src.auth_user.constants import ERRORCODE
from src.exceptions import BadRequest, NotAuthenticated, PermissionDenied


class AuthRequired(NotAuthenticated):
    DETAIL = ERRORCODE.AUTHENTICATION_REQUIRED


class AuthorizationFailed(PermissionDenied):
    DETAIL = ERRORCODE.AUTHORIZATION_FAILED
    ERROR_CODE = "AUTHORIZATION_FAILED"

    def __init__(self):
        super().__init__(detail=self.DETAIL)
        self.error_code = self.ERROR_CODE


class InvalidToken(NotAuthenticated):
    DETAIL = ERRORCODE.INVALID_TOKEN


class InvalidCredentials(NotAuthenticated):
    DETAIL = ERRORCODE.INVALID_CREDENTIALS


class EmailTaken(BadRequest):
    DETAIL = ERRORCODE.EMAIL_TAKEN
    ERROR_CODE = "EMAIL_TAKEN"

    def __init__(self):
        super().__init__(detail=self.DETAIL)
        self.error_code = self.ERROR_CODE


class RefreshTokenNotValid(NotAuthenticated):
    DETAIL = ERRORCODE.REFRESH_TOKEN_NOT_VALID


class RoleRequired(PermissionDenied):
    DETAIL = ERRORCODE.ROLE_REQUIRED
    ERROR_CODE = "ROLE_REQUIRED"

    def __init__(self):
        super().__init__(detail=self.DETAIL)
        self.error_code = self.ERROR_CODE
