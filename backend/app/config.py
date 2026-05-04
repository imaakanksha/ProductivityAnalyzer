"""
JiraPulse Configuration – loads from .env or environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Jira Configuration
    jira_base_url: str = ""
    jira_email: str = ""
    jira_api_token: str = ""
    jira_project_keys: str = "PROJ"  # comma-separated

    # Database
    database_url: str = "sqlite+aiosqlite:///./jirapulse.db"

    # Sync
    sync_interval_minutes: int = 30

    # App
    app_title: str = "JiraPulse API"
    app_version: str = "2.0.0"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def project_keys(self) -> list[str]:
        return [k.strip() for k in self.jira_project_keys.split(",") if k.strip()]

    @property
    def jira_configured(self) -> bool:
        return bool(self.jira_base_url and self.jira_email and self.jira_api_token)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
