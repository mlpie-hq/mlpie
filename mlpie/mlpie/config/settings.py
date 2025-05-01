"""
MLPie Platform Settings.

This module defines configuration settings for the MLPie platform.
"""

import os
from pathlib import Path
from functools import lru_cache
from typing import Dict, List, Optional, Any

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class SecuritySettings(BaseSettings):
    """Security-related settings."""
    
    SECRET_KEY: str = Field(
        default_factory=lambda: os.urandom(32).hex(),
        description="Secret key for signing tokens"
    )
    
    TOKEN_EXPIRY_MINUTES: int = Field(
        default=60 * 24,  # 1 day
        description="Token expiry time in minutes"
    )
    
    ALGORITHM: str = Field(
        default="HS256",
        description="Algorithm for JWT token signing"
    )


class SecretSettings(BaseSettings):
    """Secret management settings."""
    
    SECRETS_PROVIDER: str = Field(
        default="file",
        description="Default secrets provider (file, env, etc.)"
    )
    
    SECRETS_FILE: Path = Field(
        default=Path("data/secrets.dat"),
        description="Path to the encrypted secrets file (for file provider)"
    )
    
    SECRETS_PASSWORD: Optional[str] = Field(
        default=None,
        description="Password for encrypting secrets (for file provider). If not set, a random one will be generated."
    )
    
    ENV_PREFIX: str = Field(
        default="MLPIE_SECRET_",
        description="Prefix for environment variable secrets (for env provider)"
    )
    
    @field_validator("SECRETS_FILE", mode='before')
    @classmethod
    def create_absolute_path(cls, v: Any) -> Path:
        """Convert relative paths to absolute paths."""
        if isinstance(v, str):
            v = Path(v)
        
        if not v.is_absolute():
            # Get the project root directory (parent of the mlpie package)
            root_dir = Path(__file__).parent.parent.parent.parent
            return root_dir / v
            
        return v


class GitSettings(BaseSettings):
    """Git repository settings."""
    
    GIT_DEFAULT_BRANCH: str = Field(
        default="main",
        description="Default branch for Git repositories"
    )
    
    GIT_USERNAME: str = Field(
        default="mlpie",
        description="Git username for operations"
    )
    
    GIT_EMAIL: str = Field(
        default="mlpie@example.com",
        description="Git email for operations"
    )
    
    GIT_USER_TOKEN_KEY: str = Field(
        default="git_user_token",
        description="Key to use for storing Git user token in secrets"
    )
    
    MASTER_REPO_URL_KEY: str = Field(
        default="master_repo_url",
        description="Key to use for storing master repository URL in secrets"
    )
    
    MASTER_REPO_BRANCH_KEY: str = Field(
        default="master_repo_branch",
        description="Key to use for storing master repository branch in secrets"
    )
    
    LOCAL_REPOS_DIR: Path = Field(
        default=Path("data/repositories"),
        description="Directory for storing local Git repositories"
    )
    
    @field_validator("LOCAL_REPOS_DIR", mode='before')
    @classmethod
    def create_absolute_repo_path(cls, v: Any) -> Path:
        """Convert relative paths to absolute paths."""
        if isinstance(v, str):
            v = Path(v)
        
        if not v.is_absolute():
            # Get the project root directory (parent of the mlpie package)
            root_dir = Path(__file__).parent.parent.parent.parent
            return root_dir / v
            
        return v


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
    
    API_HOST: str = Field(
        default="0.0.0.0",
        description="Host to bind the API server to"
    )
    
    API_PORT: int = Field(
        default=8000,
        description="Port for the API server"
    )
    
    API_DEBUG: bool = Field(
        default=False,
        description="Enable debug mode for the API server"
    )
    
    API_RELOAD: bool = Field(
        default=True,
        description="Enable auto-reload for the API server (development)"
    )
    
    CORS_ORIGINS: List[str] = Field(
        default=["*"],
        description="Allowed CORS origins"
    )


class Settings(BaseSettings):
    """Main application settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        case_sensitive=False,
    )
    
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
    
    # Nested settings
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    secrets: SecretSettings = Field(default_factory=SecretSettings)
    git: GitSettings = Field(default_factory=GitSettings)
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    api: APISettings = Field(default_factory=APISettings)
    
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
def get_settings() -> Settings:
    """Get application settings (cached)."""
    return Settings() 