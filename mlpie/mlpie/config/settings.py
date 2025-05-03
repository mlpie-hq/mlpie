"""
MLPie Platform Settings.

This module defines configuration settings for the MLPie platform.
"""

import os
from pathlib import Path
from functools import lru_cache
from typing import Dict, List, Optional, Any

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator, model_validator

import logging

logger = logging.getLogger(__name__)

class RootGitRepositorySettings(BaseSettings):
    """Git repository settings."""

    model_config = SettingsConfigDict(
        env_prefix = "GIT__", # Prefix for env vars specific to Git settings
        case_sensitive=False,
    )
    
    REPO_URL: str = Field(
        default="https://github.com/mlpie/mlpie",
        description="URL of the Git repository"
    )
    
    REPO_USERNAME: str = Field(
        default="mlpie",
        description="Git username for operations"
    )
    
    REPO_EMAIL: str = Field(
        default="mlpie@example.com",
        description="Git email for operations"
    )

    AUTH_TYPE: str = Field(
        default="token",
        description="Authentication type for the Git repository. Valid values are: token, password, ssh_key"
    )
    
    # One of the following must be set: personal access token, password, or SSH key
    REPO_TOKEN: Optional[str] = Field(
        default=None,
        description="Git token for operations"
    )
    
    REPO_PASSWORD: Optional[str] = Field(
        default=None,
        description="Git password for operations"
    )
    
    REPO_SSH_KEY: Optional[str] = Field(
        default=None,
        description="Git SSH key for operations"
    )
    
    # Validator (one of the following must be set)
    @model_validator(mode='after')
    def validate_repo_credentials(self) -> 'RootGitRepositorySettings':
        """Validate that at least one repository credential (token, password, or ssh key) is set."""
        if self.REPO_TOKEN is None and self.REPO_PASSWORD is None and self.REPO_SSH_KEY is None:
            raise ValueError("One of REPO_TOKEN, REPO_PASSWORD, or REPO_SSH_KEY must be set")
        return self
    


class DatabaseSettings(BaseSettings):
    """Database connection settings."""
    
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///data/mlpie.db",
        description="Database connection URL"
    )
    
    DATABASE_ECHO: bool = Field(
        default=False,
        description="Echo SQL statements to standard output"
    )
    
    @field_validator("DATABASE_URL", mode='before')
    @classmethod
    def validate_sqlite_path(cls, v: str) -> str:
        """Convert relative SQLite paths to absolute paths."""
        if v.startswith("sqlite") and "///" in v and not v.startswith("sqlite:///:memory:"):
            # Extract the path part
            prefix, path = v.split("///", 1)
            
            # Check if it's a relative path
            if not Path(path).is_absolute():
                # Get the project root directory (parent of the mlpie package)
                root_dir = Path(__file__).parent.parent.parent.parent
                return f"{prefix}///{root_dir / path}"
                
        return v


class APISettings(BaseSettings):
    """API server settings."""
    
    model_config = SettingsConfigDict(
        env_prefix = "API__", # Prefix for env vars specific to API settings
        case_sensitive=False,
    )
    
    HOST: str = Field(
        default="0.0.0.0",
        description="Host to bind the API server to"
    )
    
    PORT: int = Field(
        default=8000,
        description="Port for the API server"
    )
    
    DEBUG: bool = Field(
        default=False,
        description="Enable debug mode for the API server"
    )
    
    RELOAD: bool = Field(
        default=True,
        description="Enable auto-reload for the API server (development)"
    )
    
    # Read CORS origins as a simple string from the env var
    CORS_ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3002,http://127.0.0.1:3002",
        description='Comma-separated string of allowed CORS origins. Use in .env: API__CORS_ALLOWED_ORIGINS="http://localhost:3002,http://127.0.0.1:3002"'
    )



class RootSettings(BaseSettings):
    """
    Root settings: 
    The fundamental settings for the application. All of these settings are required,
    and must be set via environment variables before the application can start.
    """
    
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"), 
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        case_sensitive=False,
    )

    # Nested settings
    git: RootGitRepositorySettings = Field(default_factory=RootGitRepositorySettings)
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    api: APISettings = Field(default_factory=APISettings)

    
    # Application info
    APP_NAME: str = Field(
        default="MLPie Platform",
        description="Application name"
    )
    
    APP_VERSION: str = Field(
        default="0.1.0",
        description="Application version"
    )
    
    # Environment
    ENV: str = Field(
        default="development",
        description="Environment (development, production, staging, testing)"
    )

    # Repository path
    REPOSITORY_PATH: str = Field(
        default="./repository",
        description="Path to the git repository that will be scanned"  
    )

    # Cronjob settings
    REPO_SCAN_INTERVAL_SECONDS: int = Field(
        default=30,
        description="Interval in seconds for scanning the root repository.",
        ge=5 # Ensure interval is at least 5 seconds
    )

    # Custom validation
    @field_validator("ENV")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate the environment setting."""
        allowed_envs = ["development", "production", "staging", "testing"]
        if v.lower() not in allowed_envs:
            raise ValueError(f"Environment must be one of: {', '.join(allowed_envs)}")
        return v.lower()
    
    # Helper methods
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENV == "development"
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENV == "production"
    
    def is_testing(self) -> bool:
        """Check if running in testing environment."""
        return self.ENV == "testing"
    
    def is_staging(self) -> bool:
        """Check if running in staging environment."""
        return self.ENV == "staging"
    



@lru_cache
def get_root_settings() -> RootSettings:
    """Get root settings (cached)."""
    return RootSettings() 
