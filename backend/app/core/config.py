from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Gym Tracker TMA"
    API_V1_STR: str = "/api"
    TELEGRAM_API_PROXY: str = ""
    
    # Telegram Bot Token (optional in dev mode)
    BOT_TOKEN: Optional[str] = None
    
    # WebApp URL for Bot Menu Button (e.g. https://your-domain.ngrok-free.app)
    WEBAPP_URL: str = "http://localhost:5173"
    
    # SQLite Async Database URL
    DATABASE_URL: str = "sqlite+aiosqlite:///./gym_tracker.db"
    
    # Dev mode bypass for Telegram auth check
    DEV_MODE: bool = True

    # AI Workout Parser (OpenAI / DeepSeek / Local compatible)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow"
    )


settings = Settings()
