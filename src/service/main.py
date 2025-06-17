from dotenv import load_dotenv
from loguru import logger

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from src.service.logging import log_middleware
from src.service.exceptions import BadRequest, PermissionDenied, NotAuthenticated
from src.service.config import app_configs, settings
from src.service.auth_user.router import router as auth_user_router

load_dotenv()

app = FastAPI(**app_configs)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ENV_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=settings.ENV_CORS_HEADERS,
)
app.middleware("http")(log_middleware)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(
        f"HTTP exception occurred: {exc.detail}, Status code: {exc.status_code}")
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        error_message = error['msg']
        field_path = "->".join(map(str, error['loc']))
        errors.append(f"{field_path}: {error_message}")

    logger.error(f"Validation error: {errors}, Path: {request.url.path}")
    content = {
        "error": "Validation error",
        "details": errors,
        "path": request.url.path
    }
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=content)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Generic error occurred at {request.url}: {exc}")
    return JSONResponse(status_code=500, content={"error": f"Generic error at {request.url.path}: {exc}"})


@app.exception_handler(BadRequest)
async def bad_request_exception_handler(request: Request, exc: BadRequest):
    logger.error(f"Bad request: {exc.detail}, Error code: {exc.error_code}, Path: {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "error_code": exc.error_code}
    )


@app.exception_handler(PermissionDenied)
async def permission_denied_exception_handler(request: Request, exc: PermissionDenied):
    logger.error(f"Permission Denied: {exc.detail}, Error code: {exc.error_code}, Path: {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "error_code": exc.error_code}
    )
    

@app.exception_handler(NotAuthenticated)
async def not_authenticated_exception_handler(request: Request, exc: NotAuthenticated):
    logger.error(f"Authentication error: {exc.detail}, Path: {request.url.path}")
    content = {
        "error": exc.detail,
        "error_code": getattr(exc, 'error_code', None)
    }
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=getattr(exc, 'headers', None)
    )


@app.get("/healthcheck", include_in_schema=False)
async def healthcheck():
    return JSONResponse(status_code=200, content={"status": "ok"})


app.include_router(auth_user_router, prefix="/auth", tags=["Auth"])