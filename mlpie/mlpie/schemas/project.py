"""
Project Schema.

This module defines Pydantic models for Project entity validation.
"""

from typing import Dict, List, Optional, Any, ClassVar
from pydantic import BaseModel, Field, field_validator, model_validator
from enum import Enum

from mlpie.schemas.base import EntityBase, EntityKind, Metadata, ApiVersion


class ProjectStatus(str, Enum):
    """Status of a project."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    ERROR = "error"
    # Add other valid statuses if needed


class ProjectSpecSchema(BaseModel):
    """Schema for the project spec section."""
    status: ProjectStatus # Use the Enum for validation

    class Config:
        extra = "allow" # Allow other fields if they might appear, or set to "forbid"


class ProjectSpec(EntityBase):
    """Project specification schema (top-level)."""
    
    EXPECTED_KIND: ClassVar[str] = EntityKind.PROJECT
    # EXPECTED_API_VERSIONS is inherited from EntityBase
    
    metadata: Metadata
    spec: ProjectSpecSchema # Use the detailed ProjectSpecSchema
    
    class Config:
        extra = "allow"
    
    @model_validator(mode='after')
    def validate_entity_spec(self) -> 'ProjectSpec':
        """Validate project-specific fields based on ProjectSpecSchema."""
        # The presence and type of 'status' are already validated by ProjectSpecSchema
        # and ProjectStatus Enum. No further validation needed here for this simple spec.
        # If other complex rules were needed, they would go here.
        return self
    
    def to_db_dict(self) -> Dict[str, Any]:
        """Convert to dict format for database model."""
        db_dict = {
            "name": self.metadata.name,
            "description": self.metadata.description,
            "status": self.spec.status.value, # Get the string value from Enum
            "spec": self.model_dump() # Store the full original spec
        }
        # Removed owner, team, and repository details from here as they are not in the current spec example
        return db_dict 