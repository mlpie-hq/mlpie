"""
Configuration API schemas.

This module provides Pydantic models (DTOs) for the configuration API.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ConfigValueResponse(BaseModel):
    """Response model for a single configuration value."""
    key: str
    value: Any
    description: Optional[str] = None


class ConfigValueRequest(BaseModel):
    """Request model for setting a configuration value."""
    value: Any
    description: Optional[str] = None


class ConfigListResponse(BaseModel):
    """Response model for a list of configuration values."""
    configs: Dict[str, Any]


class StatusResponse(BaseModel):
    """Generic status response."""
    success: bool
    message: Optional[str] = None


# --- Root Settings Response Schemas (Read-only, non-sensitive) ---

class RootGitRepositorySettingsResponse(BaseModel):
    """Read-only Git repository settings (excluding secrets)."""
    REPO_URL: str
    REPO_USERNAME: Optional[str] = None
    REPO_EMAIL: Optional[str] = None
    AUTH_TYPE: str
    # Sensitive fields (TOKEN, PASSWORD, SSH_KEY) are excluded


class DatabaseSettingsResponse(BaseModel):
    """Read-only database settings (excluding URL if it contains secrets)."""
    # DATABASE_URL is excluded to avoid leaking potential credentials
    DATABASE_ECHO: bool


class APISettingsResponse(BaseModel):
    """Read-only API settings."""
    HOST: str
    PORT: int
    DEBUG: bool
    RELOAD: bool
    CORS_ALLOWED_ORIGINS: str # This is a string, assumed safe


class RootSettingsResponse(BaseModel):
    """Read-only root application settings (excluding sensitive info)."""
    git: RootGitRepositorySettingsResponse
    database: DatabaseSettingsResponse
    api: APISettingsResponse
    APP_NAME: str
    APP_VERSION: str
    ENV: str 