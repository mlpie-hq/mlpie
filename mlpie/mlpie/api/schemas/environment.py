"""
Environment API Schemas.

This module provides Pydantic models (DTOs) for the environment API.
"""

from typing import Optional
from datetime import datetime
import uuid

from pydantic import BaseModel

class EnvironmentBase(BaseModel):
    """Base model for environment operations."""
    name: str
    description: Optional[str] = None

class EnvironmentResponse(EnvironmentBase):
    """Response model for environment operations."""
    id: uuid.UUID
    project_name: str
    status: str
    version: Optional[str] = None
    updated_at: datetime # Represents 'Last Deployed' or 'Last Updated'
    created_at: datetime

    class Config:
        from_attributes = True # Pydantic v1 was orm_mode = True 