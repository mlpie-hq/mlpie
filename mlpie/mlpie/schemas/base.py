"""
Base Schema Classes.

This module defines base Pydantic models for entity validation.
"""

from typing import Dict, List, Optional, Any, ClassVar, Type
from pydantic import BaseModel, Field, model_validator

class EntityKind:
    """Entity kind constants."""
    PROJECT = "Project"
    ENVIRONMENT = "Environment"
    DATASET = "Dataset"
    PIPELINE = "Pipeline"

class ApiVersion:
    """API version constants."""
    V1 = "mlpie/v1"
    V1ALPHA1 = "mlpie/v1alpha1"

class Metadata(BaseModel):
    """Metadata model for all entities."""
    name: str
    description: Optional[str] = None
    version: Optional[str] = None
    labels: Optional[List[str]] = Field(default_factory=list)
    
    class Config:
        extra = "allow"  # Allow extra fields in metadata

class EntityBase(BaseModel):
    """Base model for all entities."""
    
    kind: str
    apiVersion: str
    metadata: Metadata
    spec: Dict[str, Any] = Field(default_factory=dict)
    
    # Class variables to be overridden by subclasses
    EXPECTED_KIND: ClassVar[str] = ""
    EXPECTED_API_VERSIONS: ClassVar[List[str]] = [ApiVersion.V1, ApiVersion.V1ALPHA1]
    
    class Config:
        extra = "allow"  # Allow extra fields
    
    @model_validator(mode='after')
    def validate_kind_and_version(self) -> 'EntityBase':
        """Validate that kind and apiVersion match expected values."""
        if self.EXPECTED_KIND and self.kind != self.EXPECTED_KIND:
            raise ValueError(f"Expected kind {self.EXPECTED_KIND}, got {self.kind}")
        
        if self.EXPECTED_API_VERSIONS and self.apiVersion not in self.EXPECTED_API_VERSIONS:
            raise ValueError(f"Expected apiVersion to be one of {self.EXPECTED_API_VERSIONS}, got {self.apiVersion}")
        
        return self
    
    def to_db_dict(self) -> Dict[str, Any]:
        """Convert to dict format for database model."""
        # Default implementation - subclasses should override
        return {
            "name": self.metadata.name,
            "description": self.metadata.description,
            "spec": self.model_dump()
        } 