from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from src.auth_user import jwt, service, utils, schemas, dependencies
from src.auth_user.dependencies import require_role
from src.auth_user.schemas import JWTData, GoogleSignInRequest
from src.constants import ROLES

router = APIRouter()


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
    refresh_token: dict[str, Any] = Depends(dependencies.valid_refresh_token),
) -> JSONResponse:
    if refresh_token["uuid"]:
        await service.expire_refresh_token(refresh_token["uuid"])

    # Headers set on an injected Response are dropped when the handler returns its own Response
    response = JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Logout successful"})
    response.delete_cookie(
        **utils.get_refresh_token_settings(refresh_token["refresh_token"], expired=True)
    )
    return response


@router.post("/refresh")
async def refresh_tokens(
    refresh_token: dict[str, Any] = Depends(dependencies.valid_refresh_token),
) -> JSONResponse:
    new_access_token, new_refresh_token = await service.refresh_access_token(refresh_token)
    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"access_token": new_access_token},
    )
    response.set_cookie(**utils.get_refresh_token_settings(new_refresh_token))
    return response


@router.post("/google", response_model=schemas.AccessTokenResponse)
async def google_sign_in_route(
    request: GoogleSignInRequest,
) -> JSONResponse:
    user = await service.google_sign_in(request.access_token)
    refresh_token_value = await service.create_refresh_token(id_user=user["id"])
    access_token = jwt.create_access_token(user=user)
    token_response = schemas.AccessTokenResponse(
        id_user=user["id"],
        access_token=access_token,
        refresh_token=refresh_token_value,
    )
    response = JSONResponse(status_code=status.HTTP_200_OK, content=token_response.model_dump())
    response.set_cookie(**utils.get_refresh_token_settings(refresh_token_value))
    return response
