from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Relay API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./relay.db"
    UPLOAD_DIR: str = "data/uploads"
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt"]
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Gemini LLM Provider Settings
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash"
    GEMINI_TIMEOUT_SECONDS: int = 30
    GEMINI_MAX_RETRIES: int = 3

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

