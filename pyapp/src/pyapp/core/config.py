import logging
import sys
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application Settings"""
    
    # App Info
    APP_NAME: str = "GZH2XHS Backend"
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_PREFIX: str = "/api"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str = "changeme"
    ALLOWED_ORIGINS: list[str] = ["*"]
    
    # AI Providers
    DEEPSEEK_API_KEY: str
    DEEPSEEK_API_URL: str = "https://api.deepseek.com/chat/completions"
    
    APICORE_AI_KEY: str | None = None  # NanoBanana
    NANOBANANA_API_URL: str = "https://kg-api.cloud/v1/chat/completions"
    
    # Image Generation
    IMG_MAX_CONCURRENCY: int = 2
    PLAYWRIGHT_TIMEOUT: int = 30000
    
    # Database (Optional, for future use)
    TURSO_DATABASE_URL: str | None = None
    TURSO_AUTH_TOKEN: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()


class InterceptHandler(logging.Handler):
    """Intercept standard logging messages to loguru or custom formatter"""
    
    def emit(self, record: logging.LogRecord) -> None:
        # Get corresponding Loguru level if it exists
        try:
            level: str | int = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back  # type: ignore
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def setup_logging() -> None:
    """Configure logging"""
    # Simple console configuration for now using standard logging
    # In a real production app, we might use structlog or loguru
    # Here we stick to standard logging with JSON formatter or simple formatter
    
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    root.addHandler(handler)
    
    # Set level for libraries
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger("pyapp")
