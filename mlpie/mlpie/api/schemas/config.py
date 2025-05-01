"""
Configuration API schemas.

This module provides Pydantic models (DTOs) for the configuration API.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ConfigValueResponse(BaseModel):
    """Configuration value response model."""
    key: str
    value: Any
    description: Optional[str] = None


class ConfigValueRequest(BaseModel):
    """Configuration value request model."""
    value: Any
    description: Optional[str] = None


class ConfigListResponse(BaseModel):
    """Configuration list response model."""
    configs: Dict[str, Any] = Field(default_factory=dict)


class StatusResponse(BaseModel):
    """Simple status response model."""
    success: bool
    message: str 