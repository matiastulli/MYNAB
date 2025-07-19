from typing import Any
from fastapi import APIRouter, Depends, Response, HTTPException, status, Request
from fastapi.responses import JSONResponse

from src.auth_user import jwt, service, utils, schemas, dependencies

# imports to check user role
from src.auth_user.dependencies import require_role
from src.auth_user.schemas import JWTData
from src.constants import ROLES

# Send email with verification code
from src.mail.service import MailService
from src.mail.config import MailConfig

mail_config = MailConfig.from_env()
mail_service = MailService(mail_config)

router = APIRouter()

# region Password


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=schemas.UserResponse)
async def register_user(
    register_data: schemas.RegisterUser = Depends(
        dependencies.valid_user_create)
) -> JSONResponse:
    user_data = await service.create_user(register_data)

    if user_data is None:
        raise HTTPException(status_code=404, detail="User not created")

    user_response = schemas.UserResponse(**user_data)
    return JSONResponse(status_code=status.HTTP_201_CREATED, content=user_response.model_dump())


@router.post("/signin", response_model=schemas.AccessTokenResponse)
async def sign_in_user(
    sign_in_data: schemas.SignInUser,
    response: Response
) -> JSONResponse:
    user = await service.authenticate_user(sign_in_data)

    refresh_token_value = await service.create_refresh_token(user["id"])
    access_token = jwt.create_access_token(user=user)

    response.set_cookie(
        **utils.get_refresh_token_settings(refresh_token_value))

    token_response = schemas.AccessTokenResponse(
        id_user=user["id"],
        access_token=access_token,
        refresh_token=refresh_token_value,
    )
    return JSONResponse(status_code=status.HTTP_200_OK, content=token_response.model_dump())


@router.get("/profile", response_model=schemas.UserResponse)
async def get_profile(
    jwt_data: JWTData = Depends(require_role([]))
) -> JSONResponse:
    user_data = await service.get_user_by_id(jwt_data.id_user)

    if user_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_response = schemas.UserResponse(**user_data)
    return JSONResponse(status_code=status.HTTP_200_OK, content=user_response.model_dump())


@router.put("/profile", response_model=schemas.UserResponse)
async def edit_profile(
    update_data: schemas.UpdateUser,
    jwt_data: JWTData = Depends(require_role(
        [ROLES.USER]))
) -> JSONResponse:
    updated_user_data = await service.update_user(jwt_data.id_user, update_data)

    if updated_user_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found or update failed")

    user_response = schemas.UserResponse(**updated_user_data)
    return JSONResponse(status_code=status.HTTP_200_OK, content=user_response.model_dump())


@router.delete("/logout")
async def logout_user(
    response: Response,
    refresh_token: dict[str, Any] = Depends(dependencies.valid_refresh_token),
) -> JSONResponse:
    if refresh_token["uuid"]:
        await service.expire_refresh_token(refresh_token["uuid"])

    response.delete_cookie(
        **utils.get_refresh_token_settings(refresh_token["refresh_token"], expired=True)
    )
    return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Logout successful"})

# endregion Password

# region Passwordless


@router.post("/passwordless/send-code", response_model=schemas.VerificationCodeResponse)
async def send_verification_code(
    request: schemas.SendVerificationCodeRequest,
    req: Request
) -> JSONResponse:
    """Send a verification code for passwordless authentication."""
    try:
        # Get IP address and user agent for security logging
        ip_address = req.client.host if req.client else None
        user_agent = req.headers.get("user-agent")

        # For registration, check if user already exists
        if request.code_type == "registration":
            existing_user = await service.get_user_by_email(request.email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User already exists"
                )

        # For login, check if user exists and is passwordless
        elif request.code_type == "login":
            try:
                await service.authenticate_passwordless_user(request.email)
            except service.InvalidCredentials:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found or not registered for passwordless authentication"
                )

        # Create verification code
        code_data = await service.create_verification_code(
            email=request.email,
            code_type=request.code_type,
            ip_address=ip_address,
            user_agent=user_agent,
            expiry_minutes=5  # 5 minutes expiry
        )

        template_name = "login_verification" if request.code_type == "login" else "registration_verification"
        subject = "Your MYNAB Login Code" if request.code_type == "login" else "Complete Your MYNAB Registration"

        context = {
            "verification_code": code_data["verification_code"],
            "expiry_minutes": code_data["expires_in"],
            "user_email": request.email,
            "ip_address": ip_address,
        }

        if request.code_type == "login":
            context["login_url"] = "https://mynab.up.railway.app/login"
        else:
            context["registration_url"] = "https://mynab.up.railway.app/verify"
            # For registration, we might need the user's name - for now use email
            context["user_name"] = request.email.split("@")[0].title()

        success = mail_service.send_template_email(
            to_emails=[request.email],
            subject=subject,
            template_name=template_name,
            context=context
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification code"
            )

        response = schemas.VerificationCodeResponse(
            success=True,
            message="Verification code sent successfully",
            expires_in=code_data["expires_in"]
        )

        return JSONResponse(status_code=status.HTTP_200_OK, content=response.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/passwordless/verify-code", response_model=schemas.VerificationCodeResponse)
async def verify_verification_code(
    request: schemas.VerifyCodeRequest
) -> JSONResponse:
    """Verify a verification code."""
    try:
        verification_record = await service.verify_code(
            email=request.email,
            code=request.verification_code,
            code_type=request.code_type
        )

        if not verification_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code"
            )

        response = schemas.VerificationCodeResponse(
            success=True,
            message="Verification code verified successfully"
        )

        return JSONResponse(status_code=status.HTTP_200_OK, content=response.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/passwordless/register", status_code=status.HTTP_201_CREATED, response_model=schemas.AccessTokenResponse)
async def passwordless_register(
    register_data: schemas.PasswordlessRegisterUser,
    verification_code: str,
    email: str,
    response: Response
) -> JSONResponse:
    """Register a new user with passwordless authentication and return tokens."""
    try:
        # First verify the code
        verification_record = await service.verify_code(
            email=email,
            code=verification_code,
            code_type="registration"
        )

        if not verification_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code"
            )

        # Ensure emails match
        if register_data.email != email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email mismatch"
            )

        # Create the user
        user_data = await service.create_passwordless_user(register_data)

        if user_data is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User not created"
            )

        # Create authentication tokens immediately
        refresh_token_value = await service.create_refresh_token(id_user=user_data["id"])
        access_token = jwt.create_access_token(user=user_data)

        response.set_cookie(
            **utils.get_refresh_token_settings(refresh_token_value)
        )

        token_response = schemas.AccessTokenResponse(
            id_user=user_data["id"],
            access_token=access_token,
            refresh_token=refresh_token_value,
        )

        return JSONResponse(status_code=status.HTTP_201_CREATED, content=token_response.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/passwordless/login", response_model=schemas.AccessTokenResponse)
async def passwordless_login(
    email: str,
    verification_code: str,
    response: Response
) -> JSONResponse:
    """Login with passwordless authentication."""
    try:
        # First verify the code
        verification_record = await service.verify_code(
            email=email,
            code=verification_code,
            code_type="login"
        )

        if not verification_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code"
            )

        # Authenticate the user
        user = await service.authenticate_passwordless_user(email)

        # Create tokens
        refresh_token_value = await service.create_refresh_token(id_user=user["id"])
        access_token = jwt.create_access_token(user=user)

        response.set_cookie(
            **utils.get_refresh_token_settings(refresh_token_value)
        )

        token_response = schemas.AccessTokenResponse(
            id_user=user["id"],
            access_token=access_token,
            refresh_token=refresh_token_value,
        )

        return JSONResponse(status_code=status.HTTP_200_OK, content=token_response.model_dump())

    except service.InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# endregion Passwordless
