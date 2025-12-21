from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pyapp.api.routes import generate, export, health
from pyapp.core.config import settings, logger
from pyapp.core.exceptions import AppError, app_exception_handler
from pyapp.services.image.renderer import renderer


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager"""
    logger.info("Starting up application...")
    # Initialize resources if needed
    yield
    logger.info("Shutting down application...")
    await renderer.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        lifespan=lifespan
    )

    # Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception Handlers
    app.add_exception_handler(AppError, app_exception_handler)

    # Routes
    app.include_router(health.router, prefix="/health", tags=["Health"])
    app.include_router(generate.router, prefix=f"{settings.API_PREFIX}/generate", tags=["Generate"])
    app.include_router(export.router, prefix=f"{settings.API_PREFIX}/export", tags=["Export"])

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("pyapp.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
