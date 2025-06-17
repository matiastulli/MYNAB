from typing import Any
from fastapi import APIRouter, Depends, Response, HTTPException, status
from fastapi.responses import JSONResponse

from src.auth_user import jwt, service, utils, schemas, dependencies

# imports to check user role
from src.auth_user.dependencies import require_role
from src.auth_user.schemas import JWTData
from src.constants import ROLES

router = APIRouter()


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

    refresh_token_value = await service.create_refresh_token_temp()
    access_token = jwt.create_temp_access_token(user=user)

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
