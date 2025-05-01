"""
Plugin API schemas.

This module provides Pydantic models (DTOs) for the plugin API.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PluginResponse(BaseModel):
    """Plugin response model."""
    id: UUID
    name: str
    version: str
    plugin_type: str
    description: Optional[str] = None
    author: Optional[str] = None
    homepage: Optional[str] = None
    entrypoint: Optional[str] = None
    is_active: bool = True
    config: Optional[Dict[str, Any]] = None
    capabilities: Optional[List[str]] = None


class PluginListResponse(BaseModel):
    """Plugin list response model."""
    plugins: List[PluginResponse] = Field(default_factory=list)


class PluginConfigRequest(BaseModel):
    """Plugin configuration request model."""
    config: Dict[str, Any] = Field(default_factory=dict)


class PluginSyncResponse(BaseModel):
    """Plugin sync response model."""
    added: int = 0
    updated: int = 0
    removed: int = 0 