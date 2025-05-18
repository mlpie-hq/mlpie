"""
Environment Schema.

This module defines Pydantic models for Environment entity validation.
"""

from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, field_validator, model_validator

from mlpie.schemas.base import EntityBase, EntityKind, Metadata


class AuthSpec(BaseModel):
    """Authentication specification for a repository."""
    type: str  # e.g., "token", "password", "ssh"
    secret_ref: Optional[str] = None
    token_secret_key: Optional[str] = None
    # Potentially add other fields like username_secret_key, password_secret_key if needed for other auth types

    class Config:
        extra = "allow"


class RepositorySpec(BaseModel):
    """Repository specification schema."""
    name: str  # Name for this repository entry
    url: str   # URL is required for a repository
    auth: Optional[AuthSpec] = None
    ref: Optional[str] = Field(default="main")
    path_in_repo: Optional[str] = None
    resource_types: Union[str, List[str]] # Can be "*" or a list like ["dataset", "pipeline"]
    scan_interval_seconds: Optional[int] = None

    @field_validator('url')
    def url_must_be_valid(cls, v):
        if not v or not v.strip():
            raise ValueError('Repository URL cannot be empty')
        # Add more sophisticated URL validation if needed
        return v

    class Config:
        extra = "allow"


class EnvironmentSpecSchema(BaseModel):
    """Schema for the environment spec section."""
    project: str # Project name is required
    repositories: Optional[List[RepositorySpec]] = None
    # Additional spec fields can be added here
    
    class Config:
        extra = "allow"  # Allow extra fields in the spec


class EnvironmentSpec(EntityBase):
    """Environment specification schema."""
    
    EXPECTED_KIND: str = EntityKind.ENVIRONMENT
    
    # Required fields from EntityBase
    # kind: str
    # apiVersion: str
    metadata: Metadata
    spec: EnvironmentSpecSchema # Use the detailed EnvironmentSpecSchema
    
    class Config:
        extra = "allow"
    
    @model_validator(mode='after')
    def validate_entity_spec(self) -> 'EnvironmentSpec':
        """Validate environment-specific fields based on EnvironmentSpecSchema."""
        # Basic validation for project presence is handled by EnvironmentSpecSchema
        if not self.spec.project or not self.spec.project.strip():
            raise ValueError("Environment spec must include a non-empty 'project' name.")

        # Further validation for individual repositories is handled by RepositorySpec
        return self
    
    def to_db_dict(self) -> Dict[str, Any]:
        """Convert to dict format for database model.
        This will primarily populate the Environment table fields.
        Repository details will be handled separately to create/update Repository DB entries.
        """
        db_dict = {
            "name": self.metadata.name,
            "description": self.metadata.description,
            "project_name": self.spec.project,
            "spec": self.model_dump() # Store the full original spec
        }
        return db_dict 