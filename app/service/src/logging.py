import json
from typing import Callable, Awaitable, Any, Optional
from fastapi import Request, Response

from starlette.types import Message
from src.auth_user.exceptions import InvalidToken
from src.database import execute, auth_user_activity_log
from src.auth_user.jwt import parse_jwt_user_data_optional
from src.auth_user.schemas import JWTData


async def log_user_activity(request: Request, id_user: Optional[int], action: str, details: dict[str, Any]):
    insert_query = auth_user_activity_log.insert().values(
        id_user=id_user,
        action=action,
        details=details
    )
    await execute(insert_query)


async def set_body(request: Request):
    if not hasattr(request, '_body'):
        body = await request.body()
        request._body = body

        async def receive() -> Message:
            return {'type': 'http.request', 'body': body}

        request._receive = receive


async def log_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]):
    jwt_data: Optional[JWTData] = None

    await set_body(request)

    body = await request.body()
    request._body = body

    response = await call_next(request)

    token = request.headers.get("Authorization")
    if token:
        token = token.split(" ")[1]
        try:
            jwt_data = await parse_jwt_user_data_optional(token)
        except InvalidToken:
            # Handle authentication error: skip logging and continue
            response = await call_next(request)
            return response

    id_user = int(
        jwt_data.id_user) if jwt_data and jwt_data.id_user else None

    action = request.url.path

    try:
        body_data = json.loads(request._body.decode()
                               ) if request._body else None
        if body_data and "password" in body_data:
            body_data["password"] = "FILTERED"
    except json.JSONDecodeError:
        body_data = None  # or handle the raw body as needed

    details = {
        "method": request.method,
        "body": body_data
    }

    await log_user_activity(request, id_user, action, details)

    return response
