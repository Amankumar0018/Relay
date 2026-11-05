import logging
from typing import Union
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import check_db_connection
from app.schemas.health import RootResponse, HealthResponse
from app.api.documents import router as documents_router
from app.api.intelligence import router as intelligence_router
from app.api.continuity_api import router as continuity_router

logger = logging.getLogger(__name__)

router = APIRouter()
router.include_router(documents_router)
router.include_router(intelligence_router)
router.include_router(continuity_router)


@router.get("/", response_model=RootResponse, summary="Root status")
def read_root() -> RootResponse:
    """Returns basic service status and documentation link."""
    return RootResponse(
        message=f"Welcome to {settings.PROJECT_NAME}",
        version=settings.VERSION,
        docs_url="/docs",
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    responses={
        200: {
            "description": "Service and database are healthy",
            "model": HealthResponse,
        },
        503: {
            "description": "Service or database is unhealthy",
            "model": HealthResponse,
        },
    },
)
def read_health() -> Union[HealthResponse, JSONResponse]:
    """Verifies service health and database connectivity."""
    db_connected = False
    try:
        db_connected = check_db_connection()
    except Exception as exc:
        logger.error("Database health check failed: %s", exc)

    if not db_connected:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=HealthResponse(
                status="unhealthy",
                database="disconnected",
                environment=settings.ENVIRONMENT,
                version=settings.VERSION,
            ).model_dump(),
        )

    return HealthResponse(
        status="ok",
        database="connected",
        environment=settings.ENVIRONMENT,
        version=settings.VERSION,
    )

