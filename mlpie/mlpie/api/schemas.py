"""
API Schema Definitions.

This module contains Pydantic models for API request and response schemas.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ConfigValueResponse(BaseModel):
    """Response model for configuration values."""
    key: str
    value: Any
    description: Optional[str] = None


class ConfigValueRequest(BaseModel):
    """Request model for setting configuration values."""
    key: str
    value: Any
    description: Optional[str] = None


class ConfigListResponse(BaseModel):
    """Response model for listing configuration values."""
    configs: List[ConfigValueResponse]


class StatusResponse(BaseModel):
    """Generic status response model."""
    success: bool
    message: str


class PluginResponse(BaseModel):
    """Response model for plugin information."""
    name: str
    version: str
    description: str
    type: str
    author: str
    homepage: Optional[str] = None
    capabilities: List[str]


class PluginListResponse(BaseModel):
    """Response model for listing plugins."""
    plugins: List[PluginResponse]


class PluginConfigRequest(BaseModel):
    """Request model for plugin configuration."""
    config: Dict[str, Any]


class PluginSyncResponse(BaseModel):
    """Response model for plugin synchronization."""
    success: bool
    message: str
    plugins: List[str]


class RootSettingsResponse(BaseModel):
    """Response model for root settings."""
    settings: Dict[str, Any]


class CurrentSecretConfigResponse(BaseModel):
    """Response model for current secrets configuration."""
    provider: str = Field(..., description="Current secret provider type")
    config: Dict[str, Any] = Field(default_factory=dict, description="Provider-specific configuration")
    available_providers: List[str] = Field(..., description="List of available providers") 