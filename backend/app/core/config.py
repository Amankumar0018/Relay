import os
from typing import List, Optional
from pydantic import model_validator
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
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    GEMINI_TIMEOUT_SECONDS: int = 30
    GEMINI_MAX_RETRIES: int = 3

    # Switch Human Operator & Two-Phase Approval Security
    # NOTE: Hardcoded default removed per security requirements.
    # Must be supplied via environment variable or .env file.
    SWITCH_OPERATOR_SECRET: Optional[str] = None
    APPROVAL_TOKEN_EXPIRE_MINUTES: int = 10

    # Mattermost Integration for Authenticated Human Identity
    MATTERMOST_URL: str = "http://127.0.0.1:52067"
    MATTERMOST_API_URL: str = "http://127.0.0.1:52067/api/v4"
    MATTERMOST_TIMEOUT_SECONDS: float = 10.0

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        env = (self.ENVIRONMENT or "").lower()
        if env == "production":
            if not self.SWITCH_OPERATOR_SECRET or not self.SWITCH_OPERATOR_SECRET.strip():
                raise RuntimeError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: SWITCH_OPERATOR_SECRET must be configured in production. "
                    "Missing production credentials cause secure startup failure."
                )
        return self


settings = Settings()

