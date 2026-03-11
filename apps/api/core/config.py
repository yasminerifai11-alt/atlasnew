"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/atlas_command"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Anthropic AI
    ANTHROPIC_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://atlascommand.ai"]

    # Twilio (WhatsApp notifications)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = ""

    # App
    ENV: str = "development"
    LOG_LEVEL: str = "info"

    class Config:
        env_file = ".env"


settings = Settings()
