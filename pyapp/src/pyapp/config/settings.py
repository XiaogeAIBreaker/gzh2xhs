from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    environment: str = "development"
    max_concurrency: int = 16
    rate_limit_per_minute: int = 120

    class Config:
        env_prefix = "PYAPP_"

settings = Settings()

