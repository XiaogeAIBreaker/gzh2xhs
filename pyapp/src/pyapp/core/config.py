import logging
import sys
import json
from typing import Any, List, Optional, Union

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, RedisDsn, field_validator


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
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # Auth
    JWT_SECRET_KEY: str = "changeme_super_secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./sql_app.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI Providers
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_API_URL: str = "https://api.deepseek.com/chat/completions"
    
    APICORE_AI_KEY: Optional[str] = None
    NANOBANANA_API_URL: str = "https://kg-api.cloud/v1/chat/completions"
    
    # Image Generation
    IMG_MAX_CONCURRENCY: int = 2
    PLAYWRIGHT_TIMEOUT: int = 30000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "line": record.lineno,
        }
        
        if hasattr(record, "request_id"):
            log_record["request_id"] = getattr(record, "request_id")
            
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_record)


def setup_logging() -> None:
    """Configure structured logging"""
    root = logging.getLogger()
    root.setLevel(logging.INFO if not settings.DEBUG else logging.DEBUG)
    
    # Remove existing handlers
    for handler in root.handlers[:]:
        root.removeHandler(handler)
    
    handler = logging.StreamHandler(sys.stdout)
    formatter = JSONFormatter()
    handler.setFormatter(formatter)
    root.addHandler(handler)
    
    # Set level for libraries
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger("pyapp")
