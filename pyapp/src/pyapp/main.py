from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pyapp.core.config import settings, logger, setup_logging
from pyapp.core.exceptions import AppError, app_exception_handler
from pyapp.core.database import engine, Base
from pyapp.modules.generate.lib.renderer import renderer

# Import Routers
from pyapp.modules.auth.controller import router as auth_router
from pyapp.modules.finance.controller import router as finance_router
from pyapp.modules.generate.controller import router as generate_router
from pyapp.modules.health.controller import router as health_router
from pyapp.modules.export.controller import router as export_router
from pyapp.modules.data.controller import router as data_router
from pyapp.modules.kpi.controller import router as kpi_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager"""
    setup_logging()
    logger.info("Starting up application...")

    # Initialize Database (Create tables for dev)
    async with engine.begin() as conn:
        # In production, use Alembic!
        await conn.run_sync(Base.metadata.create_all)

    # Initialize Renderer
    await renderer.get_browser()

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
    app.include_router(health_router, prefix="/health", tags=["Health"])
    app.include_router(auth_router, prefix=f"{settings.API_PREFIX}/auth", tags=["Auth"])
    app.include_router(finance_router, prefix=f"{settings.API_PREFIX}/finance", tags=["Finance"])
    app.include_router(generate_router, prefix=f"{settings.API_PREFIX}/generate", tags=["Generate"])
    app.include_router(export_router, prefix=f"{settings.API_PREFIX}/export", tags=["Export"])
    app.include_router(data_router, prefix=f"{settings.API_PREFIX}/data", tags=["Data"])
    app.include_router(kpi_router, prefix=f"{settings.API_PREFIX}/kpi", tags=["KPI"])

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("pyapp.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
